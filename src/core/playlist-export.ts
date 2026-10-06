import {
  matchLocal,
  PlaylistExport,
  PlaylistExportEntry,
  Track,
} from "./model";

export const EXPORT_LIMITS = {
  fileBytes: 10 * 1024 * 1024,
  totalBytes: 20 * 1024 * 1024,
  files: 20,
  playlists: 1000,
  entries: 20000,
};
export type ParsedPlaylistExport = Pick<
  PlaylistExport,
  "name" | "entries" | "skipped"
>;
type RecordValue = Record<string, unknown>;
function object(value: unknown): RecordValue | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : undefined;
}
function field(value: unknown, max = 512): string {
  return typeof value === "string"
    ? value
        .trim()
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
        .slice(0, max)
    : "";
}
export function validateExportFiles(files: { name: string; size: number }[]) {
  if (files.length > EXPORT_LIMITS.files)
    throw new Error("Choose at most 20 playlist JSON files at a time.");
  let total = 0;
  for (const file of files) {
    if (/\.zip$/i.test(file.name))
      throw new Error(
        "Extract Spotify’s ZIP first, then choose its Playlist*.json files.",
      );
    if (!/\.json$/i.test(file.name))
      throw new Error(
        "Choose the playlist .json files from Spotify’s account-data export.",
      );
    if (
      !Number.isFinite(file.size) ||
      file.size <= 0 ||
      file.size > EXPORT_LIMITS.fileBytes
    )
      throw new Error(`${file.name}: choose a nonempty JSON file under 10 MB.`);
    total += file.size;
  }
  if (total > EXPORT_LIMITS.totalBytes)
    throw new Error("Choose fewer files: the combined JSON limit is 20 MB.");
}
function entry(raw: unknown, index: number): PlaylistExportEntry | null {
  const item = object(raw);
  if (!item) return null;
  const track = object(item.track);
  const local = object(item.localTrack);
  const value = track || local;
  if (!value) return null; // Episodes and unrelated data are not imported.
  const localFilename = local ? field(local.localTrackName || local.name) : "";
  const title = field(value.trackName) || localFilename;
  if (!title) return null;
  const uri = field(value.trackUri || value.uri, 160);
  const spotifyId = /^spotify:track:([A-Za-z0-9]{22})$/.exec(uri)?.[1];
  return {
    id: String(index),
    title,
    artist: field(value.artistName),
    album: field(value.albumName),
    kind: track ? "track" : "local",
    ...(localFilename ? { localFilename } : {}),
    ...(spotifyId
      ? { url: `https://open.spotify.com/track/${spotifyId}` }
      : {}),
  };
}
export function parsePlaylistExport(text: string): ParsedPlaylistExport[] {
  if (
    text.length > EXPORT_LIMITS.fileBytes ||
    new TextEncoder().encode(text).length > EXPORT_LIMITS.fileBytes
  )
    throw new Error("Playlist export JSON must be under 10 MB.");
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error(
      "This file is not valid JSON. Extract and choose Spotify’s Playlist*.json files.",
    );
  }
  const playlists = object(data)?.playlists;
  if (!Array.isArray(playlists))
    throw new Error(
      "No playlist export found. Choose Playlist*.json, not account details or streaming history.",
    );
  if (playlists.length > EXPORT_LIMITS.playlists)
    throw new Error("This export exceeds the 1,000 playlist limit.");
  let total = 0;
  return playlists.map((raw, i) => {
    const playlist = object(raw);
    const name = field(playlist?.name, 256);
    if (!name || !Array.isArray(playlist?.items))
      throw new Error(
        `Playlist ${i + 1} has an unsupported format. Nothing has been saved.`,
      );
    total += playlist.items.length;
    if (total > EXPORT_LIMITS.entries)
      throw new Error("This export exceeds the 20,000 playlist-item limit.");
    const entries = playlist.items
      .map(entry)
      .filter((e): e is PlaylistExportEntry => !!e);
    return { name, entries, skipped: playlist.items.length - entries.length };
  });
}
export function exportIdentity(playlist: ParsedPlaylistExport): string {
  // Dates and unrelated account fields are excluded. Track order and duplicates matter.
  return JSON.stringify([
    playlist.name,
    playlist.entries.map((e) => [
      e.title,
      e.artist,
      e.album,
      e.kind,
      e.localFilename || "",
      e.url || "",
    ]),
  ]);
}
export function mergePlaylistExports(
  existing: PlaylistExport[],
  incoming: PlaylistExport[],
) {
  const ids = new Set(existing.map((p) => p.id));
  const added: PlaylistExport[] = [];
  for (const playlist of incoming) {
    if (ids.has(playlist.id)) continue;
    ids.add(playlist.id);
    added.push(playlist);
  }
  return { playlists: [...existing, ...added], added: added.length };
}
export function exportMatches(
  entry: PlaylistExportEntry,
  tracks: Track[],
): Track[] {
  if (entry.artist) return matchLocal({ ...entry, duration: 0 }, tracks);
  if (!entry.localFilename) return [];
  const clean = (v: string) => v.normalize("NFKC").trim().toLocaleLowerCase();
  return tracks.filter(
    (t) => clean(t.filename) === clean(entry.localFilename!),
  );
}
export function matchedExportIds(
  playlist: PlaylistExport,
  tracks: Track[],
): string[] {
  const ids = new Set(tracks.map((t) => t.id));
  return playlist.entries.flatMap((e) =>
    e.localTrackId && ids.has(e.localTrackId) ? [e.localTrackId] : [],
  );
}
