import * as SQLite from "expo-sqlite";
import { LocalState } from "../core/model";
let db: Promise<SQLite.SQLiteDatabase> | undefined;
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
  const row = await (
    await database()
  ).getFirstAsync<{ json: string }>("SELECT json FROM state WHERE id=1");
  return row ? JSON.parse(row.json) : null;
}
export async function saveState(state: LocalState): Promise<void> {
  await (
    await database()
  ).runAsync(
    "INSERT INTO state(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json",
    JSON.stringify(state),
  );
}
