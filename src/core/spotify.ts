import { SpotifyEntry } from "./model";
export function spotifyUrl(
  value: unknown,
  type: "track" | "playlist",
  id: string,
): string {
  if (typeof value === "string") {
    try {
      const u = new URL(value);
      if (
        u.protocol === "https:" &&
        u.hostname === "open.spotify.com" &&
        u.pathname.startsWith(`/${type}/`)
      )
        return u.toString();
    } catch {}
  }
  return `https://open.spotify.com/${type}/${encodeURIComponent(id)}`;
}
export function spotifyEntry(raw: unknown): SpotifyEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as {
    type?: string;
    id?: string;
    name?: string;
    is_local?: boolean;
    duration_ms?: number;
    artists?: { name: string }[];
    album?: { name: string };
    external_urls?: { spotify?: string };
  };
  if (t.type !== "track" || !t.id || t.is_local || !t.name) return null;
  return {
    id: t.id,
    title: t.name,
    artist: t.artists?.map((a) => a.name).join(", ") || "Unknown artist",
    album: t.album?.name || "",
    duration: (t.duration_ms || 0) / 1000,
    url: spotifyUrl(t.external_urls?.spotify, "track", t.id),
  };
}
export const SPOTIFY_METADATA_TTL = 24 * 60 * 60 * 1000;
