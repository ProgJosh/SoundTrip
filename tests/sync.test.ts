import { test } from "node:test";
import assert from "node:assert/strict";
import { AccountDataDeleted, createApi, MemoryRepository } from "../server/api";
import { emptyState, SyncChange } from "../src/core/model";
import { mergeSync } from "../src/core/sync";
import { validateChanges } from "../server/validation";
const edit = (opId = "operation", updatedAt = 100): SyncChange => ({
  opId,
  entity: "playlist",
  id: "playlist",
  value: { name: "Road trip", trackIds: [], updatedAt },
  updatedAt,
});
test("API authenticates every metadata request and isolates owners", async () => {
  const repository = new MemoryRepository();
  const app = createApi(
    repository,
    async (token) => {
      if (!["alice", "bob"].includes(token)) throw new Error();
      return token;
    },
    "http://127.0.0.1:8081",
  );
  const request = (token?: string) => ({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ cursor: 0, changes: [edit()] }),
  });
  assert.equal((await app.request("/sync", request())).status, 401);
  assert.equal((await app.request("/sync", request("invalid"))).status, 401);
  assert.equal((await app.request("/sync", request("alice"))).status, 200);
  const bob = await repository.sync("bob", [], 0);
  assert.equal(bob.rows.length, 0);
  await repository.delete("bob");
  assert.equal((await repository.sync("alice", [], 0)).rows.length, 1);
});
test("sync retry is idempotent and stale offline writes receive the winner", async () => {
  const repository = new MemoryRepository();
  await repository.sync("alice", [edit("new", 200)], 0);
  const revision = repository.revision;
  await repository.sync("alice", [edit("new", 200)], 0);
  assert.equal(repository.revision, revision);
  const stale = await repository.sync("alice", [edit("old", 100)], revision);
  assert.equal(stale.rows[0]?.updatedAt, 200);
  assert.equal(stale.cursor, revision);
});
test("deleted account data cannot be restored by a stale device session", async () => {
  const repository = new MemoryRepository();
  await repository.sync("alice", [edit()], 0);
  await repository.delete("alice");
  assert.equal(repository.rows.size, 0);
  assert.equal(repository.operations.size, 0);
  await assert.rejects(
    repository.sync("alice", [edit("retry", 200)], 0),
    AccountDataDeleted,
  );
  const app = createApi(
    repository,
    async () => "alice",
    "http://127.0.0.1:8081",
  );
  const response = await app.request("/sync", {
    method: "POST",
    headers: {
      Authorization: "Bearer stale-session",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cursor: 0, changes: [edit()] }),
  });
  assert.equal(response.status, 410);
});
test("merge acknowledges only sent operations and preserves edits made in flight", () => {
  const state = emptyState();
  state.outbox = [edit("sent"), edit("newer", 300)];
  const result = mergeSync(state, {
    acknowledged: ["sent"],
    cursor: 2,
    rows: [
      {
        entity: "playlist",
        id: "playlist",
        value: { name: "Remote", trackIds: [] },
        updatedAt: 200,
        revision: 2,
      },
    ],
  });
  assert.deepEqual(
    result.outbox.map((c) => c.opId),
    ["newer"],
  );
  assert.equal(result.playlists.length, 0);
  assert.equal(result.cursor, 2);
});
test("server whitelist strips file paths, artwork, lyrics and provider data", () => {
  const track = {
    id: "track",
    title: "A",
    artist: "B",
    album: "C",
    filename: "A.wav",
    fingerprint: "a".repeat(64),
    tags: [],
    duration: 1,
    favorite: false,
    uri: "file:///private.wav",
    artwork: "private artwork",
    lyrics: "private lyrics",
    spotify: "private provider",
  };
  const value = validateChanges([
    { opId: "op", entity: "track", id: "track", value: track, updatedAt: 1 },
  ])[0]!.value as Record<string, unknown>;
  assert.equal(Object.hasOwn(value, "uri"), false);
  assert.equal(Object.hasOwn(value, "artwork"), false);
  assert.equal(Object.hasOwn(value, "lyrics"), false);
  assert.equal(Object.hasOwn(value, "spotify"), false);
  assert.throws(() =>
    validateChanges([{ ...edit(), updatedAt: Date.now() + 600000 }]),
  );
});
test("another device gets metadata without receiving local availability", () => {
  const state = emptyState();
  const result = mergeSync(state, {
    acknowledged: [],
    cursor: 1,
    rows: [
      {
        entity: "track",
        id: "x",
        value: { title: "Song", fingerprint: "a".repeat(64), tags: [] },
        updatedAt: 1,
        revision: 1,
      },
    ],
  });
  assert.equal(result.tracks.length, 1);
  assert.deepEqual(result.files, {});
});
