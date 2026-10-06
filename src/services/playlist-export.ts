import * as Crypto from "expo-crypto";
import { PlaylistExport } from "../core/model";
import {
  EXPORT_LIMITS,
  exportIdentity,
  mergePlaylistExports,
  parsePlaylistExport,
} from "../core/playlist-export";
import { pickPlaylistExports } from "./files";

export async function loadPlaylistExports(): Promise<PlaylistExport[]> {
  const files = await pickPlaylistExports();
  const playlists: PlaylistExport[] = [];
  let total = 0;
  for (const file of files) {
    for (const playlist of parsePlaylistExport(file.text)) {
      total += playlist.entries.length + playlist.skipped;
      if (
        total > EXPORT_LIMITS.entries ||
        playlists.length >= EXPORT_LIMITS.playlists
      )
        throw new Error(
          "Choose fewer files: import at most 1,000 playlists and 20,000 items at a time.",
        );
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        exportIdentity(playlist),
      );
      playlists.push({
        ...playlist,
        id: `export-${hash}`,
        importedAt: Date.now(),
      });
    }
  }
  return mergePlaylistExports([], playlists).playlists;
}
