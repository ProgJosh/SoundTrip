import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeLyric,
  parseLrc,
  serializeLrc,
  timestamp,
} from "../src/core/lyrics";
test("LRC handles fractional timestamps, repeated tags, CRLF and offset", () => {
  const lines = parseLrc(
    "\uFEFF[ar:Someone]\r\n[offset:+500]\r\n[00:01.5][00:03.050]Hello\r\n[00:02.12]World",
  );
  assert.deepEqual(lines, [
    { time: 2, text: "Hello" },
    { time: 2.62, text: "World" },
    { time: 3.55, text: "Hello" },
  ]);
});
test("lyrics highlight the correct line on seek and before lyrics start", () => {
  const lines = parseLrc("[00:01.00]One\n[00:02.00]Two");
  assert.equal(activeLyric(lines, 0.9), -1);
  assert.equal(activeLyric(lines, 1), 0);
  assert.equal(activeLyric(lines, 3), 1);
  assert.equal(activeLyric(lines, 1.5), 0);
  assert.equal(activeLyric([], 10), -1);
});
test("edited timing is sorted, clamped and round trips at centisecond precision", () => {
  assert.equal(timestamp(59.999), "[01:00.00]");
  assert.equal(timestamp(-1), "[00:00.00]");
  const lines = [
    { time: 3, text: "Later" },
    { time: 1.25, text: "First" },
  ];
  assert.deepEqual(parseLrc(serializeLrc(lines)), [...lines].reverse());
  assert.deepEqual(parseLrc("not timed\n[00:99]bad"), []);
});
