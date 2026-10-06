import { emptyState, LocalState } from "./model";
export type LibrarySnapshot = Omit<
  LocalState,
  "queue" | "settings" | "version"
> & { version: number };
export type PlaybackSnapshot = Pick<LocalState, "queue" | "settings">;
export function librarySnapshot(state: LocalState): LibrarySnapshot {
  const { queue: _queue, settings: _settings, ...library } = state;
  return { ...library, version: 2 };
}
export function libraryChanged(
  previous: LibrarySnapshot | undefined,
  next: LibrarySnapshot,
) {
  return (
    !previous ||
    (Object.keys(next) as (keyof LibrarySnapshot)[]).some(
      (key) => previous[key] !== next[key],
    )
  );
}
export function restoreSnapshot(
  library: LibrarySnapshot | LocalState,
  playback?: PlaybackSnapshot,
): LocalState {
  if (![1, 2].includes(library.version))
    throw new Error("This saved library requires a newer SoundTrip version.");
  const legacy = library as LocalState;
  const defaults = emptyState();
  return {
    ...defaults,
    ...library,
    version: 1,
    queue: playback?.queue ?? legacy.queue ?? defaults.queue,
    settings: playback?.settings ?? legacy.settings ?? defaults.settings,
  };
}
