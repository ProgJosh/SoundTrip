# SoundTrip implementation checkpoints

Inspection: `C:\\Personal Project\\SoundTrip` was empty, with no Git repository,
dependencies, or repository instructions. The shell sandbox failed to start;
read-only inspection succeeded through the approved host shell.

1. Create a minimal Expo Router + TypeScript foundation. Use supported Expo audio,
   native SQLite, app-owned native files, and IndexedDB for browser files.
2. Implement local import, metadata extraction, library search, playlists, moods,
   queue, shuffle, repeat, seek, persistent playback state and now playing.
3. Add local LRC import, synchronized display and a timing editor. No lyric scraper.
4. Add official Spotify PKCE and permitted paginated playlist metadata, explicit
   local matching, attribution, rate-limit handling and immediate disconnect purge.
5. Add a small TypeScript metadata API with managed account identity, offline
   outbox and deterministic conflict recovery. Never sync local URIs or audio.
6. Verify web interactions and production export; document native device checks,
   permission, codec, browser storage and credential limitations honestly.

Save each working checkpoint in Git. Cloud identity and Spotify live tests depend
on registered credentials; finish local playback before those integrations.
