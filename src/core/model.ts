export const moods = ['Drift away', 'Find your focus', 'Feel good', 'After hours', 'Let it out'] as const;
export type Mood = typeof moods[number];
export type Track = {
  id: string; fingerprint: string; filename: string; title: string; artist: string; album: string;
  duration: number; artwork?: string; lyrics?: string; tags: Mood[]; favorite: boolean; updatedAt: number;
};
export type Playlist = { id: string; name: string; trackIds: string[]; updatedAt: number; deleted?: boolean };
export type SpotifyEntry = { id: string; title: string; artist: string; album: string; url: string; duration: number; localTrackId?: string };
export type SpotifyPlaylist = { id: string; name: string; url: string; entries: SpotifyEntry[]; importedAt: number };
export type Repeat = 'off' | 'all' | 'one';
export type Queue = { ids: string[]; index: number; position: number; shuffle: boolean; repeat: Repeat };
export type LocalState = {
  version: 1; tracks: Track[]; playlists: Playlist[]; spotify: SpotifyPlaylist[];
  files: Record<string, string>; queue: Queue; settings: { onboarded: boolean; volume: number; reducedMotion: boolean };
  outbox: SyncChange[]; cursor: number; syncOwner?: string;
};
export type SyncEntity = 'track' | 'playlist' | 'settings';
export type SyncChange = { opId: string; entity: SyncEntity; id: string; value: unknown; updatedAt: number };
export const emptyState = (): LocalState => ({ version: 1, tracks: [], playlists: [], spotify: [], files: {}, queue: { ids: [], index: 0, position: 0, shuffle: false, repeat: 'off' }, settings: { onboarded: false, volume: 0.8, reducedMotion: false }, outbox: [], cursor: 0 });
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j]!, copy[i]!]; }
  return copy;
}
export function move<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items];
  const copy = [...items]; const [item] = copy.splice(from, 1); copy.splice(to, 0, item!); return copy;
}
export function nextIndex(queue: Queue, ended = false): number | null {
  if (!queue.ids.length) return null;
  if (ended && queue.repeat === 'one') return queue.index;
  if (queue.index + 1 < queue.ids.length) return queue.index + 1;
  return queue.repeat === 'all' ? 0 : null;
}
export function matchLocal(entry: Pick<SpotifyEntry, 'title' | 'artist' | 'duration'>, tracks: Track[]): Track[] {
  const clean = (v: string) => v.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  return tracks.filter(t => clean(t.title) === clean(entry.title) && clean(t.artist) === clean(entry.artist) && (!t.duration || Math.abs(t.duration - entry.duration) < 3));
}
export function clock(seconds: number): string { const s = Math.max(0, Math.floor(seconds || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
