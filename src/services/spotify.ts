import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { SpotifyEntry, SpotifyPlaylist } from "../core/model";
import { spotifyEntry, spotifyUrl } from "../core/spotify";
import { getSecret, setSecret, removeSecret } from "./vault";
WebBrowser.maybeCompleteAuthSession();
const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};
const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || "";
const redirect = process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI || "";
export const spotifyConfigured = !!clientId && !!redirect;
type Tokens = { accessToken: string; refreshToken?: string; expiresAt: number };
let generation = 0;
let rateLimitUntil = 0;
export async function connectedSpotify() {
  return !!(await getSecret("spotify.tokens"));
}
export async function connectSpotify() {
  if (!spotifyConfigured)
    throw new Error(
      "Spotify connection needs a registered client ID and exact redirect URI. Local music works without them.",
    );
  const url = new URL(redirect);
  if (
    url.protocol !== "https:" &&
    !(Platform.OS === "web" && ["127.0.0.1", "[::1]"].includes(url.hostname))
  )
    throw new Error(
      "Spotify requires an HTTPS redirect (or a web loopback IP). Native builds need a verified app/universal link.",
    );
  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri: redirect,
    scopes: ["playlist-read-private", "playlist-read-collaborative"],
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
  });
  await request.makeAuthUrlAsync(discovery);
  const result = await request.promptAsync(discovery);
  if (result.type !== "success") {
    if (result.type === "error")
      throw new Error("Spotify authorization was denied or failed.");
    return false;
  }
  if (!request.codeVerifier || !result.params.code)
    throw new Error("Spotify authorization returned no valid code.");
  const token = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: result.params.code,
      redirectUri: redirect,
      extraParams: { code_verifier: request.codeVerifier },
    },
    discovery,
  );
  await setSecret(
    "spotify.tokens",
    JSON.stringify({
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: Date.now() + (token.expiresIn || 3600) * 1000,
    } satisfies Tokens),
  );
  generation++;
  return true;
}
export async function disconnectSpotify() {
  generation++;
  rateLimitUntil = 0;
  await removeSecret("spotify.tokens");
}
async function token(): Promise<string> {
  const raw = await getSecret("spotify.tokens");
  if (!raw) throw new Error("Connect Spotify first.");
  const tokens = JSON.parse(raw) as Tokens;
  if (tokens.expiresAt > Date.now() + 60000) return tokens.accessToken;
  if (!tokens.refreshToken)
    throw new Error("Reconnect Spotify to refresh your session.");
  const epoch = generation;
  const refreshed = await AuthSession.refreshAsync(
    { clientId, refreshToken: tokens.refreshToken },
    discovery,
  );
  if (epoch !== generation) throw new Error("Spotify has been disconnected.");
  await setSecret(
    "spotify.tokens",
    JSON.stringify({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || tokens.refreshToken,
      expiresAt: Date.now() + (refreshed.expiresIn || 3600) * 1000,
    } satisfies Tokens),
  );
  return refreshed.accessToken;
}
export type SpotifySummary = { id: string; name: string; url: string };
type Page<T> = { items: T[]; next: string | null };
async function get<T>(path: string): Promise<T> {
  const u = new URL(path, "https://api.spotify.com/v1/");
  if (u.origin !== "https://api.spotify.com" || !u.pathname.startsWith("/v1/"))
    throw new Error("Invalid Spotify pagination URL.");
  if (Date.now() < rateLimitUntil)
    throw new Error(
      `Spotify is rate limited. Try again in ${Math.ceil((rateLimitUntil - Date.now()) / 1000)} seconds.`,
    );
  const epoch = generation;
  const access = await token();
  const response = await fetch(u.toString(), {
    headers: { Authorization: `Bearer ${access}` },
    signal: AbortSignal.timeout(15000),
  });
  if (epoch !== generation) throw new Error("Spotify has been disconnected.");
  if (response.status === 429) {
    const retry = Number(response.headers.get("Retry-After") || 60);
    const seconds = Number.isFinite(retry) && retry > 0 ? retry : 60;
    rateLimitUntil = Date.now() + seconds * 1000;
    throw new Error(
      `Spotify request limit reached. Wait ${seconds} seconds before refreshing.`,
    );
  }
  if (response.status === 403)
    throw new Error(
      "Spotify denied access. Check your allowlist, app quota, and whether you own or collaborate on this playlist.",
    );
  if (response.status === 401)
    throw new Error("Spotify session expired. Reconnect your account.");
  if (!response.ok)
    throw new Error(
      `Spotify metadata request failed (${response.status}). Retry when online.`,
    );
  return response.json() as Promise<T>;
}
async function pages<T>(path: string, max = 10000): Promise<T[]> {
  const rows: T[] = [];
  let next: string | null = path;
  const seen = new Set<string>();
  while (next) {
    if (seen.has(next))
      throw new Error("Spotify returned a repeated metadata page.");
    seen.add(next);
    const page: Page<T> = await get<Page<T>>(next);
    rows.push(...(page.items || []));
    if (rows.length > max)
      throw new Error(
        `This import exceeds SoundTrip’s ${max} item safety limit.`,
      );
    next = page.next;
  }
  return rows;
}
export async function listSpotifyPlaylists(): Promise<SpotifySummary[]> {
  const rows = await pages<{
    id: string;
    name: string;
    external_urls?: { spotify?: string };
  }>("me/playlists?limit=50", 1000);
  return rows.filter(Boolean).map((p) => ({
    id: p.id,
    name: p.name,
    url: spotifyUrl(p.external_urls?.spotify, "playlist", p.id),
  }));
}
export async function importSpotifyPlaylist(
  p: SpotifySummary,
): Promise<SpotifyPlaylist> {
  const rows = await pages<{
    item?: unknown;
    track?: unknown;
    is_local?: boolean;
  }>(`playlists/${encodeURIComponent(p.id)}/items?limit=50`);
  const entries: SpotifyEntry[] = rows
    .filter((r) => !r.is_local)
    .map((r) => spotifyEntry(r.item ?? r.track))
    .filter((t): t is SpotifyEntry => !!t);
  return { ...p, entries, importedAt: Date.now() };
}
