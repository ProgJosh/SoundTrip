import { LocalState, Playlist, SyncChange, Track } from "./model";
export type SyncRow = {
  entity: SyncChange["entity"];
  id: string;
  value: unknown;
  updatedAt: number;
  revision: number;
};
export type SyncResponse = {
  acknowledged: string[];
  rows: SyncRow[];
  cursor: number;
};
export function mergeSync(
  state: LocalState,
  response: SyncResponse,
): LocalState {
  const next = {
    ...state,
    tracks: [...state.tracks],
    playlists: [...state.playlists],
    files: { ...state.files },
    settings: { ...state.settings },
    outbox: state.outbox.filter((c) => !response.acknowledged.includes(c.opId)),
    cursor: Math.max(state.cursor, response.cursor),
  };
  for (const row of response.rows) {
    if (next.outbox.some((c) => c.entity === row.entity && c.id === row.id))
      continue;
    if (row.entity === "track") {
      const remote = row.value as Track;
      const local = next.tracks.find((t) => t.id === row.id);
      const merged = {
        ...remote,
        id: row.id,
        artwork: local?.artwork,
        lyrics: local?.lyrics,
      };
      next.tracks = [...next.tracks.filter((t) => t.id !== row.id), merged];
    } else if (row.entity === "playlist") {
      const p = row.value as Playlist;
      next.playlists = [
        ...next.playlists.filter((p) => p.id !== row.id),
        { ...p, id: row.id },
      ];
    } else
      next.settings.reducedMotion = !!(row.value as { reducedMotion?: boolean })
        .reducedMotion;
  }
  return next;
}
