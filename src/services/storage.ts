import * as SQLite from "expo-sqlite";
import { LocalState } from "../core/model";
import {
  LibrarySnapshot,
  PlaybackSnapshot,
  libraryChanged,
  librarySnapshot,
  restoreSnapshot,
} from "../core/snapshot";
let db: Promise<SQLite.SQLiteDatabase> | undefined;
let previous: LibrarySnapshot | undefined;
async function database() {
  db ??= (async () => {
    const d = await SQLite.openDatabaseAsync("soundtrip.db");
    await d.execAsync(
      "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, json TEXT NOT NULL);",
    );
    return d;
  })();
  return db;
}
export async function loadState(): Promise<LocalState | null> {
  const rows = await (
    await database()
  ).getAllAsync<{ id: number; json: string }>(
    "SELECT id,json FROM state WHERE id IN (1,2)",
  );
  const library = rows.find((row) => row.id === 1);
  const playback = rows.find((row) => row.id === 2);
  return library
    ? restoreSnapshot(
        JSON.parse(library.json),
        playback ? (JSON.parse(playback.json) as PlaybackSnapshot) : undefined,
      )
    : null;
}
export async function saveState(state: LocalState): Promise<void> {
  const library = librarySnapshot(state);
  const dirty = libraryChanged(previous, library);
  const d = await database();
  await d.withExclusiveTransactionAsync(async (transaction) => {
    if (dirty)
      await transaction.runAsync(
        "INSERT INTO state(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json",
        JSON.stringify(library),
      );
    await transaction.runAsync(
      "INSERT INTO state(id,json) VALUES(2,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json",
      JSON.stringify({ queue: state.queue, settings: state.settings }),
    );
  });
  previous = library;
}
