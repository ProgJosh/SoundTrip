import { read, write } from './storage.web';
export type PickedFile = { name: string; size: number; bytes: Uint8Array; uri: string; file: File };
function picker(accept: string, multiple = false): Promise<File[]> {
  return new Promise(resolve => { const input = document.createElement('input'); input.type = 'file'; input.accept = accept; input.multiple = multiple; input.onchange = () => resolve(Array.from(input.files || [])); input.oncancel = () => resolve([]); input.click(); });
}
export async function pickAudio(): Promise<PickedFile[]> { const files = await picker('.mp3,.m4a,.aac,.wav,.flac,.ogg,.opus,audio/*', true); const results: PickedFile[] = []; for (const f of files) { if (f.size > 100 * 1024 * 1024) throw new Error(`${f.name}: maximum file size is 100 MB.`); results.push({ name: f.name, size: f.size, bytes: new Uint8Array(await f.arrayBuffer()), uri: '', file: f }); } return results; }
export async function keepFile(id: string, file: PickedFile): Promise<string> { await write('files', id, file.file); if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false); return id; }
const urls = new Map<string, string>();
export async function resolveFile(key: string): Promise<string | null> { if (urls.has(key)) return urls.get(key)!; const blob = await read<Blob>('files', key); if (!blob) return null; const url = URL.createObjectURL(blob); urls.set(key, url); return url; }
export async function pickLyrics(): Promise<string | null> { const [file] = await picker('.lrc'); if (!file) return null; if (file.size > 1024 * 1024) throw new Error('Lyrics must be under 1 MB.'); return file.text(); }
