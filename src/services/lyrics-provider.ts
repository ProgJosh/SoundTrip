// A provider may be registered only after its license permits the intended
// display, territory, attribution, and caching. None is enabled in the MVP.
export interface LyricsProvider {
  name: string;
  licenseUrl: string;
  cacheSeconds: number; // 0 means do not persist the response
  attribution: string;
  fetch(input: { title: string; artist: string; duration: number }): Promise<{ lrc?: string; text?: string } | null>;
}
export const lyricsProviders: readonly LyricsProvider[] = [];
