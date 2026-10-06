import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyState } from "../src/core/model";
import {
  libraryChanged,
  librarySnapshot,
  restoreSnapshot,
} from "../src/core/snapshot";
test("playback position and volume writes avoid resaving embedded media", () => {
  const state = emptyState();
  const previous = librarySnapshot(state);
  const next = {
    ...state,
    queue: { ...state.queue, position: 8 },
    settings: { ...state.settings, volume: 0.3 },
  };
  assert.equal(libraryChanged(previous, librarySnapshot(next)), false);
  assert.equal(
    libraryChanged(
      previous,
      librarySnapshot({ ...next, playlists: [...state.playlists] }),
    ),
    true,
  );
  assert.equal(
    restoreSnapshot(previous, { queue: next.queue, settings: next.settings })
      .queue.position,
    8,
  );
});
test("legacy snapshots retain queue/settings and unknown versions fail closed", () => {
  const state = emptyState();
  state.queue = { ...state.queue, ids: ["a", "b"], index: 1, position: 12 };
  state.settings.volume = 0.4;
  assert.deepEqual(restoreSnapshot(state), state);
  assert.deepEqual(
    restoreSnapshot(librarySnapshot(state), {
      queue: state.queue,
      settings: state.settings,
    }),
    state,
  );
  assert.throws(() =>
    restoreSnapshot({ ...librarySnapshot(state), version: 99 }),
  );
});
