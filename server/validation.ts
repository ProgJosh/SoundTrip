import { SyncChange } from "../src/core/model";
const bounded = (v: unknown, max: number) =>
  typeof v === "string" && v.length > 0 && v.length <= max;
export function validateChanges(input: unknown): SyncChange[] {
  if (!Array.isArray(input) || input.length > 100)
    throw new Error("A sync batch must contain at most 100 changes.");
  return input.map((raw) => {
    if (!raw || typeof raw !== "object") throw new Error("Invalid change.");
    const c = raw as SyncChange;
    if (
      !bounded(c.opId, 80) ||
      !bounded(c.id, 80) ||
      !["track", "playlist", "settings"].includes(c.entity) ||
      !Number.isSafeInteger(c.updatedAt) ||
      c.updatedAt < 0 ||
      c.updatedAt > Date.now() + 300000
    )
      throw new Error("Invalid change identity or timestamp.");
    if (!c.value || typeof c.value !== "object")
      throw new Error("Invalid metadata.");
    const v = c.value as Record<string, unknown>;
    let value: Record<string, unknown>;
    if (c.entity === "track") {
      if (
        !bounded(v.title, 500) ||
        !bounded(v.artist, 500) ||
        typeof v.album !== "string" ||
        v.album.length > 500 ||
        !bounded(v.filename, 500) ||
        typeof v.fingerprint !== "string" ||
        !/^[a-f0-9]{64}$/.test(v.fingerprint) ||
        !Array.isArray(v.tags) ||
        v.tags.length > 5 ||
        v.tags.some(
          (t) =>
            ![
              "Drift away",
              "Find your focus",
              "Feel good",
              "After hours",
              "Let it out",
            ].includes(t),
        ) ||
        typeof v.duration !== "number" ||
        !Number.isFinite(v.duration) ||
        v.duration < 0 ||
        v.duration > 86400 ||
        typeof v.favorite !== "boolean"
      )
        throw new Error("Invalid track metadata.");
      value = {
        id: c.id,
        title: v.title,
        artist: v.artist,
        album: v.album,
        filename: v.filename,
        fingerprint: v.fingerprint,
        tags: v.tags,
        duration: v.duration,
        favorite: v.favorite,
        updatedAt: c.updatedAt,
      };
    } else if (c.entity === "playlist") {
      if (
        !bounded(v.name, 120) ||
        !Array.isArray(v.trackIds) ||
        v.trackIds.length > 10000 ||
        v.trackIds.some((t) => !bounded(t, 80))
      )
        throw new Error("Invalid playlist.");
      value = {
        id: c.id,
        name: v.name,
        trackIds: v.trackIds,
        deleted: !!v.deleted,
        updatedAt: c.updatedAt,
      };
    } else {
      if (c.id !== "preferences" || typeof v.reducedMotion !== "boolean")
        throw new Error("Invalid settings.");
      value = { reducedMotion: v.reducedMotion };
    }
    return {
      opId: c.opId,
      entity: c.entity,
      id: c.id,
      value,
      updatedAt: c.updatedAt,
    };
  });
}
