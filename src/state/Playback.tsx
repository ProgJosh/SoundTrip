import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { Track, nextIndex, shuffle } from "../core/model";
import { resolveFile } from "../services/files";
import { useLibrary } from "./Library";

type Context = {
  track?: Track;
  playing: boolean;
  position: number;
  duration: number;
  loading: boolean;
  play: (ids: string[], start?: number, shuffled?: boolean) => Promise<void>;
  toggle: () => void;
  seek: (n: number) => void;
  skip: (direction: number, ended?: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  volume: (n: number) => void;
};
const PlaybackContext = createContext<Context | null>(null);
export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const { state, update, setError, checkpoint, patchTrack } = useLibrary();
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const trackId = state.queue.ids[state.queue.index];
  const track = state.tracks.find((t) => t.id === trackId);
  const [loading, setLoading] = useState(false);
  const active = useRef<string | null>(null);
  const request = useRef(0);
  const shouldPlay = useRef(false);
  const resumeAt = useRef<number | null>(null);
  const handledEnd = useRef(false);
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch((e) => setError(e.message));
  }, [setError]);
  useEffect(() => {
    const generation = ++request.current;
    if (!track) {
      player.pause();
      active.current = null;
      if (Platform.OS !== "web") player.setActiveForLockScreen(false);
      return;
    }
    (async () => {
      setLoading(true);
      handledEnd.current = false;
      active.current = null;
      try {
        const key = state.files[track.id];
        const uri = key ? await resolveFile(key) : null;
        if (generation !== request.current) return;
        if (!uri) {
          shouldPlay.current = false;
          player.pause();
          update((s) => {
            const files = { ...s.files };
            delete files[track.id];
            return { ...s, files };
          });
          throw new Error(
            "This track is missing on this device. Use Relink to select its original audio file.",
          );
        }
        resumeAt.current = state.queue.position;
        player.replace({ uri });
        active.current = track.id;
        if (Platform.OS !== "web")
          player.setActiveForLockScreen(
            true,
            {
              title: track.title,
              artist: track.artist,
              albumTitle: track.album,
              artworkUrl: track.artwork,
            },
            { showSeekForward: true, showSeekBackward: true },
          );
        if (shouldPlay.current) player.play();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        if (generation === request.current) setLoading(false);
      }
    })();
    return () => {
      /* The next effect increments generation before loading. */
    };
    // Replacing audio is driven only by identity/file changes, not position updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId, state.files[trackId || ""]]);
  useEffect(() => {
    if (!status.isLoaded || active.current !== trackId) return;
    if (resumeAt.current !== null) {
      const n = resumeAt.current;
      resumeAt.current = null;
      if (n > 0)
        player
          .seekTo(Math.min(n, Math.max(0, status.duration - 0.1)))
          .catch((e) => setError(e.message));
    }
    if (
      track &&
      status.duration > 0 &&
      Math.abs(track.duration - status.duration) > 1
    )
      patchTrack(track.id, { duration: status.duration });
    if (status.didJustFinish && !handledEnd.current) {
      handledEnd.current = true;
      skip(1, true);
    }
    if (!status.didJustFinish) handledEnd.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.isLoaded, status.didJustFinish, status.duration, trackId]);
  useEffect(() => {
    player.volume = state.settings.volume;
  }, [player, state.settings.volume]);
  useEffect(() => {
    if (status.error) {
      shouldPlay.current = false;
      player.pause();
      setError(
        "This audio file could not be decoded. It may be corrupt or unsupported on this device. Try another format or relink its original file.",
      );
    }
  }, [status.error, player, setError]);
  useEffect(() => {
    const savePosition = () => {
      if (active.current)
        update((s) => ({
          ...s,
          queue: { ...s.queue, position: statusRef.current.currentTime || 0 },
        }));
    };
    const timer = setInterval(savePosition, 5000);
    const sub = AppState.addEventListener("change", (n) => {
      if (n !== "active") {
        savePosition();
        checkpoint().catch((e) => setError(e.message));
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function play(ids: string[], start = 0, shuffled = false) {
    const available = ids.filter((key) => state.files[key]);
    if (!available.length) {
      setError("Import or relink a local audio file to play this selection.");
      return;
    }
    const ordered = shuffled ? shuffle(available) : available;
    const selected = shuffled ? 0 : Math.max(0, ordered.indexOf(ids[start]!));
    shouldPlay.current = true;
    if (active.current === ordered[selected]) {
      await player.seekTo(0);
      player.play();
    }
    update((s) => ({
      ...s,
      queue: {
        ...s.queue,
        ids: ordered,
        originalIds: available,
        index: selected,
        position: 0,
        shuffle: shuffled,
      },
    }));
  }
  function skip(direction: number, ended = false) {
    const next =
      direction < 0
        ? Math.max(0, state.queue.index - 1)
        : nextIndex(state.queue, ended);
    if (next === null) {
      shouldPlay.current = false;
      player.pause();
      return;
    }
    shouldPlay.current = status.playing || ended;
    if (next === state.queue.index) {
      player
        .seekTo(0)
        .then(() => {
          if (shouldPlay.current) player.play();
        })
        .catch((e) => setError(e.message));
    }
    update((s) => ({ ...s, queue: { ...s.queue, index: next, position: 0 } }));
  }
  function toggle() {
    if (!track) {
      void play(state.tracks.map((t) => t.id));
      return;
    }
    if (!active.current) {
      setError("Relink this track before playing.");
      return;
    }
    if (status.playing) {
      shouldPlay.current = false;
      player.pause();
    } else {
      shouldPlay.current = true;
      if (status.didJustFinish) void player.seekTo(0);
      player.play();
    }
  }
  function seek(n: number) {
    player.seekTo(n).catch((e) => setError(e.message));
    update((s) => ({ ...s, queue: { ...s.queue, position: n } }));
  }
  function toggleShuffle() {
    update((s) => {
      const current = s.queue.ids[s.queue.index];
      const ids = s.queue.shuffle
        ? (s.queue.originalIds || s.queue.ids).filter((id) =>
            s.queue.ids.includes(id),
          )
        : [
            ...s.queue.ids.slice(0, s.queue.index + 1),
            ...shuffle(s.queue.ids.slice(s.queue.index + 1)),
          ];
      return {
        ...s,
        queue: {
          ...s.queue,
          ids,
          originalIds: s.queue.originalIds || s.queue.ids,
          index: current ? ids.indexOf(current) : 0,
          shuffle: !s.queue.shuffle,
        },
      };
    });
  }
  function toggleRepeat() {
    update((s) => ({
      ...s,
      queue: {
        ...s.queue,
        repeat:
          s.queue.repeat === "off"
            ? "all"
            : s.queue.repeat === "all"
              ? "one"
              : "off",
      },
    }));
  }
  return (
    <PlaybackContext.Provider
      value={{
        track,
        playing: status.playing,
        position: status.currentTime || 0,
        duration: status.duration || track?.duration || 0,
        loading: loading || status.isBuffering,
        play,
        toggle,
        seek,
        skip,
        toggleShuffle,
        toggleRepeat,
        volume: (n) =>
          update((s) => ({ ...s, settings: { ...s.settings, volume: n } })),
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
}
export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("PlaybackProvider missing");
  return ctx;
}
