import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import * as Crypto from "expo-crypto";
import {
  emptyState,
  LocalState,
  Mood,
  Playlist,
  Track,
  SyncChange,
} from "../core/model";
import { localMedia, readMetadata, validateAudio } from "../core/metadata";
import { loadState, saveState } from "../services/storage";
import { keepFile, pickAudio, resolveFile } from "../services/files";
import { SPOTIFY_METADATA_TTL } from "../core/spotify";

type Context = {
  state: LocalState;
  ready: boolean;
  busy: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  update: (change: (s: LocalState) => LocalState) => void;
  importAudio: (relinkId?: string) => Promise<void>;
  patchTrack: (id: string, patch: Partial<Track>) => void;
  savePlaylist: (playlist: Playlist) => void;
  checkpoint: () => Promise<void>;
};
const LibraryContext = createContext<Context | null>(null);
export const id = () => Crypto.randomUUID();
export function change(
  entity: SyncChange["entity"],
  key: string,
  value: unknown,
  updatedAt = Date.now(),
): SyncChange {
  return { opId: id(), entity, id: key, value, updatedAt };
}
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocalState>(emptyState);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(state);
  const writable = useRef(true);
  const writes = useRef(Promise.resolve());
  const persist = (s: LocalState) => {
    if (!writable.current)
      return Promise.reject(
        new Error(
          "The saved library could not be opened. Restart after resolving the storage error; the existing library has been preserved.",
        ),
      );
    writes.current = writes.current.catch(() => {}).then(() => saveState(s));
    return writes.current;
  };
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const saved = await loadState();
        if (saved && saved.version !== 1)
          throw new Error(
            "This library was created by a newer SoundTrip version.",
          );
        if (saved && alive) {
          const files = { ...saved.files };
          for (const [key, value] of Object.entries(files))
            if (!(await resolveFile(value))) delete files[key];
          const loaded = {
            ...emptyState(),
            ...saved,
            files,
            spotify: saved.spotify.filter(
              (p) => Date.now() - p.importedAt < SPOTIFY_METADATA_TTL,
            ),
          };
          latest.current = loaded;
          setState(loaded);
        }
      } catch (e) {
        writable.current = false;
        if (alive) setError((e as Error).message);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!ready || !writable.current) return;
    const timer = setTimeout(() => {
      persist(state).catch((e) => setError(e.message));
    }, 120);
    return () => clearTimeout(timer);
  }, [state, ready]);
  const update = (fn: (s: LocalState) => LocalState) => {
    const next = fn(latest.current);
    latest.current = next;
    setState(next);
  };
  useEffect(() => {
    if (!ready) return;
    const expire = () =>
      update((s) => {
        const spotify = s.spotify.filter(
          (p) => Date.now() - p.importedAt < SPOTIFY_METADATA_TTL,
        );
        return spotify.length === s.spotify.length ? s : { ...s, spotify };
      });
    const timer = setInterval(expire, 60000);
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") expire();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [ready]);
  const patchTrack = (key: string, patch: Partial<Track>) =>
    update((s) => {
      const track = s.tracks.find((t) => t.id === key);
      if (!track) return s;
      const value = { ...track, ...patch, id: key, updatedAt: Date.now() };
      return {
        ...s,
        tracks: s.tracks.map((t) => (t.id === key ? value : t)),
        outbox: [
          ...s.outbox,
          change("track", key, syncTrack(value), value.updatedAt),
        ],
      };
    });
  const savePlaylist = (playlist: Playlist) =>
    update((s) => {
      const value = { ...playlist, updatedAt: Date.now() };
      return {
        ...s,
        playlists: [...s.playlists.filter((p) => p.id !== value.id), value],
        outbox: [
          ...s.outbox,
          change("playlist", value.id, value, value.updatedAt),
        ],
      };
    });
  async function importAudio(relinkId?: string) {
    if (!writable.current) {
      setError("Resolve the storage error before importing music.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const selected = await pickAudio();
      if (relinkId && selected.length > 1)
        throw new Error("Choose one file to relink this track.");
      const failures: string[] = [];
      for (const file of selected) {
        try {
          validateAudio(file.bytes, file.name, file.size);
          const hash = await Crypto.digest(
            Crypto.CryptoDigestAlgorithm.SHA256,
            new Uint8Array(file.bytes).buffer,
          );
          const fingerprint = Array.from(new Uint8Array(hash))
            .map((v) => v.toString(16).padStart(2, "0"))
            .join("");
          const old = relinkId
            ? latest.current.tracks.find((t) => t.id === relinkId)
            : latest.current.tracks.find((t) => t.fingerprint === fingerprint);
          if (relinkId && old?.fingerprint && old.fingerprint !== fingerprint)
            throw new Error(
              "This is a different recording. Choose the original file to preserve this track.",
            );
          if (old && latest.current.files[old.id]) continue;
          const key = old?.id || fingerprint;
          const uri = await keepFile(key, file);
          const metadata = readMetadata(file.bytes);
          const titleParts = file.name.replace(/\.[^.]+$/, "").split(" - ");
          const track: Track = old
            ? { ...old, ...localMedia(metadata, old) }
            : {
                id: key,
                fingerprint,
                filename: file.name,
                title:
                  metadata.title ||
                  titleParts.slice(titleParts.length > 1 ? 1 : 0).join(" - "),
                artist:
                  metadata.artist ||
                  (titleParts.length > 1 ? titleParts[0]! : "Unknown artist"),
                album: metadata.album || "Local collection",
                duration: metadata.duration || 0,
                ...localMedia(metadata),
                tags: [] as Mood[],
                favorite: false,
                updatedAt: Date.now(),
              };
          update((s) => ({
            ...s,
            tracks: [...s.tracks.filter((t) => t.id !== key), track],
            files: { ...s.files, [key]: uri },
            outbox: old
              ? s.outbox
              : [...s.outbox, change("track", key, syncTrack(track))],
          }));
        } catch (e) {
          failures.push(`${file.name}: ${(e as Error).message}`);
        }
      }
      if (failures.length) setError(failures.join("\n"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <LibraryContext.Provider
      value={{
        state,
        ready,
        busy,
        error,
        setError,
        update,
        importAudio,
        patchTrack,
        savePlaylist,
        checkpoint: () => persist(latest.current),
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}
// Audio paths, artwork and lyrics never leave the device. Only user-owned metadata.
export function syncTrack(t: Track) {
  const { artwork: _artwork, lyrics: _lyrics, ...metadata } = t;
  return metadata;
}
export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("LibraryProvider missing");
  return context;
}
