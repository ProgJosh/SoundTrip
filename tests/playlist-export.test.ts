import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyExportMatches,
  baseTitle,
  EXPORT_LIMITS,
  exportIdentity,
  exportMatches,
  matchedExportIds,
  mergePlaylistExports,
  parsePlaylistExport,
  proposeExportMatches,
  validateExportFiles,
} from "../src/core/playlist-export";
import { emptyState, PlaylistExport, Track } from "../src/core/model";
import { librarySnapshot, restoreSnapshot } from "../src/core/snapshot";
const song = {
  track: {
    trackName: "Morning Drift",
    artistName: "SoundTrip",
    albumName: "Local collection",
    trackUri: "spotify:track:1234567890123456789012",
  },
};
const source = (items: unknown[] = [song]) =>
  JSON.stringify({
    playlists: [
      {
        name: "The long way home",
        lastModifiedDate: "2026-01-01",
        items,
        description: "Private description",
      },
    ],
    user: { email: "private@example.invalid" },
  });
const saved = (): PlaylistExport => ({
  ...parsePlaylistExport(source())[0]!,
  id: "export-one",
  importedAt: 1,
});
test("official playlist JSON retains ordering, repeated songs, empty playlists and local references, excluding unrelated account data", () => {
  const parsed = parsePlaylistExport(
    source([
      song,
      { episode: { episodeName: "A podcast" } },
      song,
      { localTrack: { localTrackName: "own-file.wav" } },
      null,
    ]),
  );
  assert.equal(parsed[0]!.entries.length, 3);
  assert.equal(parsed[0]!.skipped, 2);
  assert.equal(parsed[0]!.entries[1]!.title, "Morning Drift");
  assert.equal(parsed[0]!.entries[2]!.kind, "local");
  assert.equal(
    parsed[0]!.entries[0]!.url,
    "https://open.spotify.com/track/1234567890123456789012",
  );
  assert.equal(JSON.stringify(parsed).includes("private@example"), false);
  assert.equal(JSON.stringify(parsed).includes("Private description"), false);
  assert.equal(parsePlaylistExport(source([]))[0]!.entries.length, 0);
  assert.equal(parsePlaylistExport("\uFEFF" + source()).length, 1);
});
test("malformed, unrelated and oversized exports fail before saving; links cannot become arbitrary requests", () => {
  assert.throws(() => parsePlaylistExport("not JSON"), /valid JSON/);
  assert.throws(
    () => parsePlaylistExport('{"email":"private"}'),
    /No playlist export/,
  );
  assert.throws(
    () => parsePlaylistExport('{"playlists":[{"name":"Broken"}]}'),
    /unsupported format/,
  );
  assert.throws(
    () =>
      parsePlaylistExport(source(Array(EXPORT_LIMITS.entries + 1).fill(song))),
    /20,000/,
  );
  assert.throws(
    () => validateExportFiles([{ name: "data.zip", size: 30 }]),
    /Extract/,
  );
  assert.throws(
    () =>
      validateExportFiles([
        { name: "Playlist.json", size: EXPORT_LIMITS.fileBytes + 1 },
      ]),
    /10 MB/,
  );
  const malicious = {
    track: {
      ...song.track,
      trackUri: "javascript:alert(1)",
      preview_url: "https://audio.invalid",
    },
  };
  assert.equal(
    parsePlaylistExport(source([malicious]))[0]!.entries[0]!.url,
    undefined,
  );
});
test("duplicate snapshots preserve confirmed matching and distinguish different contents and order", () => {
  const existing = saved();
  existing.entries[0]!.localTrackId = "local";
  const incoming = saved();
  incoming.importedAt = 20;
  const merged = mergePlaylistExports(
    [existing],
    [incoming, { ...incoming, id: "second" }, { ...incoming, id: "second" }],
  );
  assert.equal(merged.added, 1);
  assert.equal(merged.playlists[0], existing);
  assert.equal(
    exportIdentity(parsePlaylistExport(source())[0]!),
    exportIdentity(
      parsePlaylistExport(source().replace("2026-01-01", "2026-02-01"))[0]!,
    ),
  );
  const second = { track: { ...song.track, trackName: "Afterglow" } };
  assert.notEqual(
    exportIdentity(parsePlaylistExport(source([song, second]))[0]!),
    exportIdentity(parsePlaylistExport(source([second, song]))[0]!),
  );
});
test("export matching supports unknown duration but never confirms a candidate automatically", () => {
  const playlist = saved();
  const tracks = [
    {
      id: "local",
      title: "Morning Drift",
      artist: "SoundTrip",
      duration: 180,
      filename: "own-file.wav",
    },
  ] as Track[];
  assert.equal(exportMatches(playlist.entries[0]!, tracks).length, 1);
  assert.equal(playlist.entries[0]!.localTrackId, undefined);
  assert.equal(
    exportMatches({ ...playlist.entries[0]!, artist: "Someone else" }, tracks)
      .length,
    0,
  );
  const local = parsePlaylistExport(
    source([{ localTrack: { localTrackName: "own-file.wav" } }]),
  )[0]!.entries[0]!;
  assert.equal(exportMatches(local, tracks).length, 1);
  playlist.entries[0]!.localTrackId = "local";
  playlist.entries.push(
    { ...playlist.entries[0]!, id: "repeat" },
    { ...playlist.entries[0]!, id: "missing", localTrackId: "not-in-library" },
  );
  assert.deepEqual(matchedExportIds(playlist, tracks), ["local", "local"]);
});
test("bulk proposals cover exact, version-suffix, featuring and swapped-filename matches, skip ambiguity, and link only accepted entries", () => {
  const entries = [
    ["Morning Drift", "SoundTrip"],
    ["Hey Jude - Remastered 2015", "The Beatles"],
    ["Blinding Lights (feat. Somebody)", "The Weeknd"],
    ["Clocks", "Coldplay"],
    ["Twin", "Echo"],
    ["Not In Library", "Nobody"],
    ["Already Linked", "Someone"],
  ].map(([title, artist], i) => ({
    id: String(i),
    title: title!,
    artist: artist!,
    album: "",
    kind: "track" as const,
    ...(i === 6 ? { localTrackId: "kept" } : {}),
  }));
  const playlist: PlaylistExport = {
    id: "bulk",
    name: "Bulk",
    entries,
    skipped: 0,
    importedAt: 1,
  };
  const track = (id: string, title: string, artist: string, filename = "") =>
    ({
      id,
      title,
      artist,
      filename: filename || `${id}.mp3`,
      duration: 0,
    }) as Track;
  const tracks = [
    track("drift", "Morning Drift", "SoundTrip"),
    track("jude", "Hey Jude", "The Beatles"),
    track("lights", "Blinding Lights", "The Weeknd, Somebody"),
    // "Clocks - Coldplay.mp3" parses as artist "Clocks", title "Coldplay".
    track("clocks", "Coldplay", "Clocks", "Clocks - Coldplay.mp3"),
    track("twin-a", "Twin", "Echo"),
    track("twin-b", "Twin", "Echo"),
  ];
  const proposals = proposeExportMatches(playlist, tracks);
  assert.deepEqual(
    proposals.map((p) => [p.entryId, p.trackId, p.strength]),
    [
      ["0", "drift", "exact"],
      ["1", "jude", "close"],
      ["2", "lights", "close"],
      ["3", "clocks", "close"],
    ],
  );
  assert.equal(baseTitle("Song [Remastered]"), "song");
  assert.equal(baseTitle("Live Forever - Live"), "liveforeverlive");
  // Proposals change nothing until accepted; rejected and linked entries are untouched.
  assert.equal(playlist.entries[0]!.localTrackId, undefined);
  const applied = applyExportMatches(playlist, [
    proposals[0]!,
    { entryId: "6", trackId: "overwrite" },
  ]);
  assert.equal(applied.entries[0]!.localTrackId, "drift");
  assert.equal(applied.entries[1]!.localTrackId, undefined);
  assert.equal(applied.entries[6]!.localTrackId, "kept");
  assert.equal(applyExportMatches(playlist, []), playlist);
});
test("export snapshots survive reload without API expiry and restore defaults for old libraries", () => {
  const state = emptyState();
  state.playlistExports = [saved()];
  assert.deepEqual(
    restoreSnapshot(librarySnapshot(state)).playlistExports,
    state.playlistExports,
  );
  const { playlistExports: _exports, ...legacy } = emptyState();
  assert.deepEqual(
    restoreSnapshot(legacy as ReturnType<typeof emptyState>).playlistExports,
    [],
  );
  assert.deepEqual(state.outbox, []);
});
