import { LocalState } from "../core/model";
import {
  LibrarySnapshot,
  PlaybackSnapshot,
  libraryChanged,
  librarySnapshot,
  restoreSnapshot,
} from "../core/snapshot";
let db: Promise<IDBDatabase> | undefined;
let previous: LibrarySnapshot | undefined;
export function database(): Promise<IDBDatabase> {
  db ??= new Promise((resolve, reject) => {
    const req = indexedDB.open("soundtrip", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("state");
      req.result.createObjectStore("files");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(
        new Error(
          "Browser storage is unavailable. Allow site storage to keep your library.",
        ),
      );
  });
  return db;
}
export async function read<T>(
  store: string,
  key: string,
): Promise<T | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const r = db.transaction(store).objectStore(store).get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function write(
  store: string,
  key: string,
  value: unknown,
): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, "readwrite");
    t.objectStore(store).put(value, key);
    t.oncomplete = () => resolve();
    t.onerror = () =>
      reject(
        new Error(
          "Could not save to browser storage. Check your available space.",
        ),
      );
    t.onabort = () => reject(t.error);
  });
}
export async function loadState(): Promise<LocalState | null> {
  const d = await database();
  return new Promise((resolve, reject) => {
    const transaction = d.transaction("state");
    const store = transaction.objectStore("state");
    const library = store.get("library");
    const playback = store.get("playback");
    transaction.oncomplete = () => {
      try {
        resolve(
          library.result
            ? restoreSnapshot(
                library.result,
                playback.result as PlaybackSnapshot | undefined,
              )
            : null,
        );
      } catch (error) {
        reject(error);
      }
    };
    transaction.onerror = () => reject(transaction.error);
  });
}
export async function saveState(state: LocalState): Promise<void> {
  const library = librarySnapshot(state);
  const dirty = libraryChanged(previous, library);
  const d = await database();
  await new Promise<void>((resolve, reject) => {
    const transaction = d.transaction("state", "readwrite");
    const store = transaction.objectStore("state");
    if (dirty) store.put(library, "library");
    store.put({ queue: state.queue, settings: state.settings }, "playback");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(
        new Error("Could not save the library. Check your available storage."),
      );
    transaction.onabort = () => reject(transaction.error);
  });
  previous = library;
}
