import { test } from "node:test";
import assert from "node:assert/strict";
import { spotifyEntry, spotifyUrl } from "../src/core/spotify";
test("imports only metadata, dropping episodes, local Spotify entries and null items", () => {
  assert.equal(spotifyEntry(null), null);
  assert.equal(spotifyEntry({ type: "episode", id: "x", name: "Talk" }), null);
  assert.equal(
    spotifyEntry({ type: "track", id: "x", name: "Song", is_local: true }),
    null,
  );
  const result = spotifyEntry({
    type: "track",
    id: "x",
    name: "Song",
    artists: [{ name: "Artist" }],
    duration_ms: 123000,
    preview_url: "https://audio.invalid/file.mp3",
    external_urls: { spotify: "https://open.spotify.com/track/x" },
  });
  assert.equal(result?.duration, 123);
  assert.equal(Object.hasOwn(result!, "preview_url"), false);
});
test("Spotify links cannot become arbitrary remote audio or script URLs", () => {
  assert.equal(
    spotifyUrl("javascript:alert(1)", "track", "x"),
    "https://open.spotify.com/track/x",
  );
  assert.equal(
    spotifyUrl("https://evil.example/track/x", "track", "x"),
    "https://open.spotify.com/track/x",
  );
});
