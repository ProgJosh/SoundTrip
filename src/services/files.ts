import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { validateExportFiles } from "../core/playlist-export";
export type PickedFile = {
  name: string;
  size: number;
  bytes: Uint8Array;
  uri: string;
};
export async function pickAudio(): Promise<PickedFile[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["audio/*", "application/ogg"],
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  const files: PickedFile[] = [];
  for (const a of result.assets) {
    const f = new File(a.uri);
    if (f.size > 100 * 1024 * 1024)
      throw new Error(`${a.name}: maximum file size is 100 MB.`);
    files.push({
      name: a.name,
      size: f.size,
      bytes: await f.bytes(),
      uri: a.uri,
    });
  }
  return files;
}
export async function keepFile(id: string, file: PickedFile): Promise<string> {
  const dir = new Directory(Paths.document, "music");
  dir.create({ intermediates: true, idempotent: true });
  const dest = new File(
    dir,
    `${id}.${file.name.split(".").pop()!.toLowerCase()}`,
  );
  new File(file.uri).copy(dest);
  return dest.uri;
}
export async function resolveFile(key: string): Promise<string | null> {
  return new File(key).exists ? key : null;
}
export async function pickLyrics(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const a = result.assets[0]!;
  if (!a.name.toLowerCase().endsWith(".lrc"))
    throw new Error("Choose a .lrc lyric file.");
  const f = new File(a.uri);
  if (f.size > 1024 * 1024) throw new Error("Lyrics must be under 1 MB.");
  return f.text();
}
export async function pickPlaylistExports(): Promise<
  { name: string; text: string }[]
> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  const files = result.assets.map((a) => ({
    name: a.name,
    file: new File(a.uri),
  }));
  try {
    validateExportFiles(
      files.map((f) => ({ name: f.name, size: f.file.size })),
    );
    const values = [];
    for (const f of files)
      values.push({ name: f.name, text: await f.file.text() });
    return values;
  } finally {
    for (const f of files) {
      // Remove only temporary picker copies inside the app's cache, never originals.
      if (f.file.uri.startsWith(Paths.cache.uri) && f.file.exists) {
        try {
          f.file.delete();
        } catch {}
      }
    }
  }
}
