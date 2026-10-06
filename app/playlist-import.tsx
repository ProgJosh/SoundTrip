import React, { useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { PlaylistExportEntry } from "../src/core/model";
import {
  exportMatches,
  matchedExportIds,
  mergePlaylistExports,
} from "../src/core/playlist-export";
import { loadPlaylistExports } from "../src/services/playlist-export";
import { id, useLibrary } from "../src/state/Library";
import { usePlayback } from "../src/state/Playback";
import { Shell } from "../src/ui/Shell";
import { Button, Empty, Icon } from "../src/ui/kit";
import { c, styles } from "../src/ui/theme";
import type { PlaylistExport } from "../src/core/model";

function ExportSong({
  entry,
  link,
}: {
  entry: PlaylistExportEntry;
  link: (trackId?: string) => void;
}) {
  const { state } = useLibrary();
  const playback = usePlayback();
  const [choosing, setChoosing] = useState(false);
  const [query, setQuery] = useState("");
  const local = state.tracks.find((t) => t.id === entry.localTrackId);
  const suggestions = exportMatches(entry, state.tracks);
  const choices = choosing
    ? state.tracks
        .filter((t) =>
          `${t.title} ${t.artist} ${t.filename}`
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase()),
        )
        .slice(0, 10)
    : suggestions.slice(0, 3);
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderColor: c.border,
        paddingTop: 18,
        gap: 10,
      }}
    >
      <Text style={{ color: c.text, fontSize: 17, fontWeight: "600" }}>
        {entry.title}
      </Text>
      <Text style={styles.subtitle}>
        {entry.artist || "Artist not included in export"}
        {entry.album ? ` · ${entry.album}` : ""}
      </Text>
      <Text style={[styles.subtitle, { fontSize: 12 }]}>
        Spotify export reference ·{" "}
        {entry.kind === "local" ? "local-track metadata" : "song metadata"}
      </Text>
      {entry.url && (
        <Button
          icon="open-outline"
          onPress={() => {
            void Linking.openURL(entry.url!);
          }}
        >
          Open in Spotify · online
        </Button>
      )}
      {local ? (
        <>
          <Text style={{ color: c.teal }}>Linked: {local.filename}</Text>
          <View style={styles.wrap}>
            <Button
              primary
              icon="play"
              disabled={!state.files[local.id]}
              onPress={() => {
                void playback.play([local.id]);
              }}
            >
              Play your local file
            </Button>
            <Button onPress={() => link()}>Unlink file</Button>
          </View>
          {!state.files[local.id] && (
            <Text style={styles.subtitle}>
              This file is missing on this device. Relink it from the local
              library; the playlist reference is preserved.
            </Text>
          )}
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            {suggestions.length
              ? "Check the file before confirming a match."
              : "No confirmed local file. Import audio you own, or choose a file from your library."}
          </Text>
          <Button onPress={() => setChoosing(!choosing)}>
            {choosing ? "Hide local file choices" : "Choose a local file"}
          </Button>
          {choosing && (
            <TextInput
              accessibilityLabel={`Find local file for ${entry.title}`}
              value={query}
              onChangeText={setQuery}
              placeholder="Search title, artist or filename"
              placeholderTextColor={c.muted}
              style={styles.input}
            />
          )}
          {choices.map((t) => (
            <View key={t.id} style={{ gap: 6 }}>
              <Text style={styles.subtitle}>
                {t.title} · {t.artist} ·{" "}
                {state.files[t.id] ? "On this device" : "File missing"}
              </Text>
              <Button
                icon="link-outline"
                onPress={() => {
                  link(t.id);
                  setChoosing(false);
                }}
              >{`Confirm file: ${t.filename}`}</Button>
            </View>
          ))}
          {choosing && (
            <Text style={[styles.subtitle, { fontSize: 12 }]}>
              Showing up to 10 files. Refine the search if needed.
            </Text>
          )}
        </>
      )}
    </View>
  );
}

export default function PlaylistImport() {
  const router = useRouter();
  const {
    state,
    ready,
    busy,
    update,
    checkpoint,
    setError,
    importAudio,
    savePlaylist,
  } = useLibrary();
  const playback = usePlayback();
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<PlaylistExport[] | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [previewPage, setPreviewPage] = useState(0);
  const [listPage, setListPage] = useState(0);
  const [trackPage, setTrackPage] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [message, setMessage] = useState("");
  const [remove, setRemove] = useState(false);
  const imports = state.playlistExports;
  const playlist = imports.find((p) => p.id === selected) || imports[0];
  const confirmed = playlist ? matchedExportIds(playlist, state.tracks) : [];
  const available = confirmed.filter((key) => !!state.files[key]);
  const localPlaylist = state.playlists.find(
    (p) => p.id === playlist?.localPlaylistId && !p.deleted,
  );
  const existing = new Set(imports.map((p) => p.id));
  const selectedDraft =
    draft?.filter((p) => checked[p.id] && !existing.has(p.id)) || [];
  async function choose() {
    setPending(true);
    setError(null);
    setMessage("");
    try {
      const values = await loadPlaylistExports();
      if (values === null) return;
      if (!values.length) {
        setDraft(null);
        setMessage("The selected JSON files contain no playlists.");
        return;
      }
      setDraft(values);
      setPreviewPage(0);
      setChecked(
        Object.fromEntries(values.map((p) => [p.id, !existing.has(p.id)])),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function save() {
    if (!selectedDraft.length) return;
    setPending(true);
    setError(null);
    try {
      let added = 0;
      update((s) => {
        const result = mergePlaylistExports(s.playlistExports, selectedDraft);
        added = result.added;
        return { ...s, playlistExports: result.playlists };
      });
      await checkpoint();
      setSelected(selectedDraft[0]?.id);
      setTrackPage(0);
      setDraft(null);
      setMessage(
        `Imported ${added} playlist${added === 1 ? "" : "s"}. Confirm local files to make them playable.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  function link(entryId: string, trackId?: string) {
    if (!playlist) return;
    update((s) => ({
      ...s,
      playlistExports: s.playlistExports.map((p) =>
        p.id === playlist.id
          ? {
              ...p,
              entries: p.entries.map((e) =>
                e.id === entryId ? { ...e, localTrackId: trackId } : e,
              ),
            }
          : p,
      ),
    }));
  }
  async function createPlaylist() {
    if (!playlist || !confirmed.length) return;
    if (confirmed.length > 10000) {
      setError(
        "A local playlist can contain up to 10,000 tracks. Keep fewer confirmed matches before creating this copy.",
      );
      return;
    }
    const key = id();
    savePlaylist({
      id: key,
      name: playlist.name.slice(0, 120),
      trackIds: confirmed,
      updatedAt: Date.now(),
    });
    update((s) => ({
      ...s,
      playlistExports: s.playlistExports.map((p) =>
        p.id === playlist.id ? { ...p, localPlaylistId: key } : p,
      ),
    }));
    try {
      await checkpoint();
      setMessage(
        "Local playlist created from confirmed files. Unmatched references remain in this export." +
          (playlist.name.length > 120
            ? " The local playlist name was shortened; you can rename it in Playlists."
            : ""),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function removeImport() {
    if (!playlist) return;
    update((s) => ({
      ...s,
      playlistExports: s.playlistExports.filter((p) => p.id !== playlist.id),
    }));
    setSelected(undefined);
    setTrackPage(0);
    setListPage(0);
    setRemove(false);
    try {
      await checkpoint();
      setMessage(
        "Export metadata removed. Local files and created playlists are preserved.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Shell>
      <View style={styles.section}>
        <Text style={styles.label}>YOUR PLAYLISTS, ON YOUR TERMS</Text>
        <Text style={styles.title}>Bring your playlist memories.</Text>
        <Text style={styles.subtitle}>
          Import Spotify’s official playlist export. No Premium, Spotify login
          or internet connection is needed to import a downloaded file.
        </Text>
        <View style={styles.card}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "600" }}>
            Start with your Spotify account data
          </Text>
          <Text style={styles.subtitle}>
            In Spotify’s privacy settings, request Account data. When it
            arrives, extract the ZIP and choose the Playlist*.json files. You
            can select several parts together.
          </Text>
          <Text style={styles.subtitle}>
            Only playlist names and song metadata are kept. The import stays on
            this device until you remove it. It contains no audio and does not
            update automatically from Spotify.
          </Text>
          <View style={styles.wrap}>
            <Button
              primary
              icon="document-text-outline"
              disabled={!ready || pending || busy}
              onPress={() => {
                void choose();
              }}
            >
              {pending ? "Reading export…" : "Choose playlist JSON"}
            </Button>
            <Button
              icon="open-outline"
              onPress={() => {
                void Linking.openURL(
                  "https://www.spotify.com/account/privacy/",
                );
              }}
            >
              Get Spotify account data · online
            </Button>
          </View>
          <Text style={[styles.subtitle, { fontSize: 12 }]}>
            Extracted JSON only · up to 10 MB per file · other account details
            and streaming history are not imported.
          </Text>
        </View>
        {!!message && (
          <Text
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
            style={{ color: c.teal }}
          >
            {message}
          </Text>
        )}
        {draft && (
          <View style={styles.card}>
            <Text style={{ color: c.text, fontSize: 22 }}>
              Review before importing
            </Text>
            <Text style={styles.subtitle}>
              {draft.length} playlists ·{" "}
              {draft.reduce((n, p) => n + p.entries.length, 0)} songs ·{" "}
              {draft.reduce((n, p) => n + p.skipped, 0)} podcast or unreadable
              items skipped
            </Text>
            <Text style={styles.subtitle}>
              Identical snapshots are already imported. Changed playlist
              contents are kept as a separate snapshot so existing file matches
              stay intact.
            </Text>
            {draft.slice(previewPage * 20, (previewPage + 1) * 20).map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="checkbox"
                aria-checked={!!checked[p.id]}
                accessibilityLabel={`Include ${p.name}`}
                accessibilityState={{
                  checked: !!checked[p.id],
                  disabled: existing.has(p.id) || pending,
                }}
                disabled={existing.has(p.id) || pending}
                onPress={() => setChecked((v) => ({ ...v, [p.id]: !v[p.id] }))}
                style={[styles.row, { minHeight: 54, paddingVertical: 8 }]}
              >
                <Icon
                  name={checked[p.id] ? "checkbox" : "square-outline"}
                  color={checked[p.id] ? c.accent : c.muted}
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: c.text }}>{p.name}</Text>
                  <Text style={styles.subtitle}>
                    {p.entries.length} songs
                    {existing.has(p.id) ? " · Already imported" : ""}
                  </Text>
                </View>
              </Pressable>
            ))}
            {draft.length > 20 && (
              <View style={styles.wrap}>
                <Button
                  disabled={!previewPage}
                  onPress={() => setPreviewPage((n) => n - 1)}
                >
                  Previous preview playlists
                </Button>
                <Button
                  disabled={(previewPage + 1) * 20 >= draft.length}
                  onPress={() => setPreviewPage((n) => n + 1)}
                >
                  Next preview playlists
                </Button>
              </View>
            )}
            <View style={styles.wrap}>
              <Button
                primary
                disabled={!selectedDraft.length || pending}
                onPress={() => {
                  void save();
                }}
              >{`Import selected playlists (${selectedDraft.length})`}</Button>
              <Button disabled={pending} onPress={() => setDraft(null)}>
                Cancel import
              </Button>
            </View>
          </View>
        )}
        {!imports.length && !draft && (
          <Empty
            title="Your next trip starts here"
            description="Choose your downloaded playlist JSON to preview its songs. Then import your own audio and confirm the matching files."
          />
        )}
        {!!imports.length && (
          <View style={styles.card}>
            <Text style={styles.label}>Imported playlist snapshots</Text>
            {imports.slice(listPage * 20, (listPage + 1) * 20).map((p) => (
              <Button
                key={p.id}
                primary={p.id === playlist?.id}
                label={`Open imported playlist ${p.name}`}
                onPress={() => {
                  setSelected(p.id);
                  setTrackPage(0);
                }}
              >{`${p.name} · ${p.entries.length} songs`}</Button>
            ))}
            {imports.length > 20 && (
              <View style={styles.wrap}>
                <Button
                  disabled={!listPage}
                  onPress={() => setListPage((n) => n - 1)}
                >
                  Previous imported playlists
                </Button>
                <Button
                  disabled={(listPage + 1) * 20 >= imports.length}
                  onPress={() => setListPage((n) => n + 1)}
                >
                  Next imported playlists
                </Button>
              </View>
            )}
          </View>
        )}
        {playlist && (
          <View style={[styles.card, { gap: 18 }]}>
            <Text style={{ color: c.text, fontSize: 26 }}>{playlist.name}</Text>
            <View style={styles.row}>
              <Image
                source={require("../assets/spotify-logo.png")}
                accessibilityLabel="Spotify"
                style={{ width: 96, height: 29, resizeMode: "contain" }}
              />
              <Text style={styles.subtitle}>Account-data export</Text>
            </View>
            <Text style={styles.subtitle}>
              {playlist.entries.length} songs · {confirmed.length} confirmed
              files · {available.length} available offline
            </Text>
            {!!playlist.skipped && (
              <Text style={styles.subtitle}>
                {playlist.skipped} podcast or unreadable items were skipped.
              </Text>
            )}
            <Text style={[styles.subtitle, { fontSize: 12 }]}>
              Imported {new Date(playlist.importedAt).toLocaleDateString()} ·
              device-only snapshot. A local playlist contains confirmed files in
              export order; other references stay here.
            </Text>
            <View style={styles.wrap}>
              <Button
                icon="add"
                disabled={busy || pending}
                onPress={() => {
                  void importAudio();
                }}
              >
                Import local music
              </Button>
              <Button
                icon="shuffle"
                disabled={!available.length}
                onPress={() => {
                  void playback.play(available, 0, true);
                }}
              >
                Shuffle confirmed files
              </Button>
              {!localPlaylist ? (
                <Button
                  primary
                  disabled={!confirmed.length}
                  onPress={() => {
                    void createPlaylist();
                  }}
                >
                  Create local playlist
                </Button>
              ) : (
                <Button
                  icon="list-outline"
                  onPress={() =>
                    router.push({
                      pathname: "/playlists",
                      params: { id: localPlaylist.id },
                    })
                  }
                >
                  Open local playlist
                </Button>
              )}
              <Button icon="trash-outline" onPress={() => setRemove(true)}>
                Remove export metadata
              </Button>
            </View>
            {localPlaylist && (
              <Text style={styles.subtitle}>
                The created local playlist is an editable copy. Later matching
                changes do not overwrite it; add more tracks in Playlists.
              </Text>
            )}
            {playlist.entries
              .slice(trackPage * 20, (trackPage + 1) * 20)
              .map((entry) => (
                <ExportSong
                  key={`${playlist.id}-${entry.id}`}
                  entry={entry}
                  link={(key) => link(entry.id, key)}
                />
              ))}
            {!playlist.entries.length && (
              <Text style={styles.subtitle}>
                This exported playlist has no readable songs. Its name is
                preserved.
              </Text>
            )}
            {playlist.entries.length > 20 && (
              <View style={styles.wrap}>
                <Button
                  disabled={!trackPage}
                  onPress={() => setTrackPage((n) => n - 1)}
                >
                  Previous exported songs
                </Button>
                <Text style={styles.subtitle}>
                  Page {trackPage + 1} of{" "}
                  {Math.ceil(playlist.entries.length / 20)}
                </Text>
                <Button
                  disabled={(trackPage + 1) * 20 >= playlist.entries.length}
                  onPress={() => setTrackPage((n) => n + 1)}
                >
                  Next exported songs
                </Button>
              </View>
            )}
          </View>
        )}
      </View>
      <Modal
        visible={remove}
        transparent
        animationType="fade"
        onRequestClose={() => setRemove(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#000b",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={[
              styles.card,
              { maxWidth: 480, width: "100%", alignSelf: "center" },
            ]}
          >
            <Text style={{ color: c.text, fontSize: 22 }}>
              Remove this imported snapshot?
            </Text>
            <Text style={styles.subtitle}>
              This removes its export metadata and matching links. Your audio
              files and any local playlist you created remain.
            </Text>
            <Button
              primary
              onPress={() => {
                void removeImport();
              }}
            >
              Remove imported snapshot
            </Button>
            <Button onPress={() => setRemove(false)}>Keep snapshot</Button>
          </View>
        </View>
      </Modal>
    </Shell>
  );
}
