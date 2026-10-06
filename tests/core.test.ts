import { test } from "node:test";
import assert from "node:assert/strict";
import { matchLocal, move, nextIndex, shuffle, Track } from "../src/core/model";
import { readMetadata, validateAudio } from "../src/core/metadata";
test("shuffle preserves every queue entry and never mutates its input", () => {
  const input = ["a", "b", "c", "d"];
  const output = shuffle(input, () => 0);
  assert.deepEqual([...output].sort(), [...input].sort());
  assert.notDeepEqual(output, input);
  assert.deepEqual(input, ["a", "b", "c", "d"]);
});
test("repeat transitions, end of queue and reordering are explicit", () => {
  const queue = {
    ids: ["a", "b"],
    index: 1,
    position: 0,
    repeat: "off" as const,
    shuffle: false,
  };
  assert.equal(nextIndex(queue, true), null);
  assert.equal(nextIndex({ ...queue, repeat: "one" }, true), 1);
  assert.equal(nextIndex({ ...queue, repeat: "all" }, true), 0);
  assert.equal(nextIndex({ ...queue, repeat: "one" }, false), null);
  assert.deepEqual(move(queue.ids, 1, 0), ["b", "a"]);
});
test("matching requires artist and title, and rejects a different duration", () => {
  const track = { title: "Héllo!", artist: "Artist", duration: 120 } as Track;
  assert.equal(
    matchLocal({ title: "Héllo", artist: "artist", duration: 121 }, [track])
      .length,
    1,
  );
  assert.equal(
    matchLocal({ title: "Héllo", artist: "Another artist", duration: 121 }, [
      track,
    ]).length,
    0,
  );
  assert.equal(
    matchLocal({ title: "Héllo", artist: "artist", duration: 200 }, [track])
      .length,
    0,
  );
});
test("rejects disguised and oversized audio before it is saved", () => {
  assert.throws(
    () =>
      validateAudio(
        new TextEncoder().encode("<html>fake mp3</html>"),
        "fake.mp3",
        30,
      ),
    /header/,
  );
  assert.throws(
    () => validateAudio(new Uint8Array(20), "song.exe", 20),
    /supported/,
  );
  assert.throws(
    () => validateAudio(new Uint8Array(20), "song.wav", 101 * 1024 * 1024),
    /100 MB/,
  );
});
test("reads PCM WAV duration without decoding audio", () => {
  const bytes = new Uint8Array(44);
  const view = new DataView(bytes.buffer);
  for (const [offset, text] of [
    [0, "RIFF"],
    [8, "WAVE"],
    [12, "fmt "],
    [36, "data"],
  ] as const)
    bytes.set(new TextEncoder().encode(text), offset);
  view.setUint32(16, 16, true);
  view.setUint32(28, 16000, true);
  view.setUint32(40, 32000, true);
  assert.equal(readMetadata(bytes).duration, 2);
});
