import { LocalState } from '../core/model';
let db: Promise<IDBDatabase> | undefined;
export function database(): Promise<IDBDatabase> {
  db ??= new Promise((resolve, reject) => { const req = indexedDB.open('soundtrip', 1); req.onupgradeneeded = () => { req.result.createObjectStore('state'); req.result.createObjectStore('files'); }; req.onsuccess = () => resolve(req.result); req.onerror = () => reject(new Error('Browser storage is unavailable. Allow site storage to keep your library.')); }); return db;
}
export async function read<T>(store: string, key: string): Promise<T | undefined> { const db = await database(); return new Promise((resolve, reject) => { const r = db.transaction(store).objectStore(store).get(key); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); }
export async function write(store: string, key: string, value: unknown): Promise<void> { const db = await database(); return new Promise((resolve, reject) => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).put(value, key); t.oncomplete = () => resolve(); t.onerror = () => reject(new Error('Could not save to browser storage. Check your available space.')); t.onabort = () => reject(t.error); }); }
export async function loadState(): Promise<LocalState | null> { return await read<LocalState>('state', 'library') ?? null; }
export async function saveState(state: LocalState): Promise<void> { return write('state', 'library', state); }
