// Bounded, dependency-free metadata reader. Unknown tags/codecs use filename
// fallback; decoder errors are handled by the playback adapter.
export type Metadata = { title?: string; artist?: string; album?: string; duration?: number; artwork?: { mime: string; bytes: Uint8Array }; lyrics?: string };
const ascii = (b: Uint8Array, start: number, end: number) => String.fromCharCode(...b.slice(start, end));
const syncSafe = (b: Uint8Array, p: number) => ((b[p]! & 127) << 21) | ((b[p + 1]! & 127) << 14) | ((b[p + 2]! & 127) << 7) | (b[p + 3]! & 127);
function text(b: Uint8Array, encoding = 3): string {
  try { return new TextDecoder(encoding === 0 ? 'iso-8859-1' : encoding === 1 ? 'utf-16' : encoding === 2 ? 'utf-16be' : 'utf-8').decode(b).replace(/\0/g, '').trim(); } catch { return ascii(b, 0, b.length).replace(/\0/g, '').trim(); }
}
function terminator(b: Uint8Array, start: number, encoding: number): number {
  const width = encoding === 1 || encoding === 2 ? 2 : 1;
  for (let i = start; i < b.length - width + 1; i += width) if (b[i] === 0 && (width === 1 || b[i + 1] === 0)) return i + width;
  return b.length;
}
export function validateAudio(bytes: Uint8Array, filename: string, size: number): void {
  if (!/\.(mp3|m4a|aac|wav|flac|ogg|opus)$/i.test(filename)) throw new Error(`${filename}: supported files are MP3, M4A, AAC, WAV, FLAC, OGG and Opus.`);
  if (size <= 12 || size > 100 * 1024 * 1024) throw new Error(`${filename}: choose a nonempty audio file under 100 MB.`);
  const tag = ascii(bytes, 0, 4);
  const supported = tag.startsWith('ID3') || tag === 'RIFF' || tag === 'fLaC' || tag === 'OggS' || ascii(bytes, 4, 8) === 'ftyp' || (bytes[0] === 255 && (bytes[1]! & 224) === 224);
  if (!supported) throw new Error(`${filename}: this file does not have a recognized audio header.`);
}
export function readMetadata(b: Uint8Array): Metadata {
  const m: Metadata = {}; const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (ascii(b, 0, 3) === 'ID3' && (b[3] === 3 || b[3] === 4)) {
    const version = b[3]; const end = Math.min(b.length, syncSafe(b, 6) + 10, 8 * 1024 * 1024);
    let p = 10;
    if (b[5]! & 64) { if (p + 4 > end) return m; p += version === 4 ? syncSafe(b, p) : view.getUint32(p) + 4; }
    while (p + 10 <= end) {
      const id = ascii(b, p, p + 4); const length = version === 4 ? syncSafe(b, p + 4) : view.getUint32(p + 4); const flags = b[p + 9]!; p += 10;
      if (!length || p + length > end) break;
      const f = b.subarray(p, p + length); p += length;
      // Skip compressed, encrypted or unsynchronized frames.
      if ((version === 3 && flags & 192) || (version === 4 && flags & 15)) continue;
      const key = ({ TIT2: 'title', TPE1: 'artist', TALB: 'album' } as const)[id as 'TIT2'];
      if (key) m[key] = text(f.subarray(1), f[0]);
      if (id === 'TLEN') m.duration = Number(text(f.subarray(1), f[0])) / 1000 || undefined;
      if (id === 'USLT') { const start = terminator(f, 4, f[0]!); m.lyrics = text(f.subarray(start), f[0]); }
      if (id === 'APIC') {
        const mimeEnd = f.indexOf(0, 1); if (mimeEnd < 0) continue;
        const mime = ascii(f, 1, mimeEnd); const start = terminator(f, mimeEnd + 2, f[0]!);
        if (['image/jpeg', 'image/png', 'image/webp'].includes(mime) && f.length - start < 2 * 1024 * 1024) m.artwork = { mime, bytes: f.slice(start) };
      }
    }
  }
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WAVE') {
    let rate = 0, data = 0;
    for (let p = 12; p + 8 <= b.length;) { const id = ascii(b, p, p + 4); const size = view.getUint32(p + 4, true); if (id === 'fmt ' && p + 20 <= b.length) rate = view.getUint32(p + 16, true); if (id === 'data') { data = size; break; } p += 8 + size + (size % 2); }
    if (rate) m.duration = data / rate;
  }
  if (ascii(b, 0, 4) === 'fLaC') {
    for (let p = 4; p + 4 <= b.length;) {
      const type = b[p]! & 127, last = !!(b[p]! & 128); const size = (b[p + 1]! << 16) | (b[p + 2]! << 8) | b[p + 3]!; p += 4;
      if (p + size > b.length || size > 8 * 1024 * 1024) break;
      if (type === 0 && size >= 34) { const rate = (b[p + 10]! << 12) | (b[p + 11]! << 4) | (b[p + 12]! >> 4); const samples = (b[p + 13]! & 15) * 2 ** 32 + view.getUint32(p + 14); if (rate) m.duration = samples / rate; }
      if (type === 4) {
        let q = p + 4 + view.getUint32(p, true); if (q + 4 > p + size) break; const count = Math.min(view.getUint32(q, true), 500); q += 4;
        for (let i = 0; i < count && q + 4 <= p + size; i++) { const n = view.getUint32(q, true); q += 4; if (q + n > p + size) break; const value = text(b.subarray(q, q + n)); q += n; const split = value.indexOf('='); const key = value.slice(0, split).toUpperCase(); const field = ({ TITLE: 'title', ARTIST: 'artist', ALBUM: 'album', LYRICS: 'lyrics' } as const)[key as 'TITLE']; if (field) m[field] = value.slice(split + 1); }
      }
      p += size; if (last) break;
    }
  }
  return m;
}
export function bytesBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; let out = '';
  for (let i = 0; i < bytes.length; i += 3) { const n = (bytes[i]! << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0); out += chars[(n >>> 18) & 63]! + chars[(n >>> 12) & 63]! + (i + 1 < bytes.length ? chars[(n >>> 6) & 63] : '=') + (i + 2 < bytes.length ? chars[n & 63] : '='); }
  return out;
}
