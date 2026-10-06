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

Completed checkpoints:

- `2109071`: Expo/TypeScript foundation after inspection.
- `cd874c8`: local import, offline storage, playlists, moods, queue and playback.
- `1ea85b3`: local LRC display and timing editing.
- `8bcbf70`: official Spotify metadata authorization/import boundary and attribution.
- `cab5723`: dedicated Neon development branch, account services, authenticated metadata API, offline outbox, two-device sync/deletion verification, and offline web playback verification.
- Final polish: keyboard-accessible web sliders, missing-file recovery checks, SDK-compatible native theme support, global Spotify expiry, repeatable verification setup, platform documentation and dependency audit. See `docs/VERIFICATION.md` for exact results and native coverage limits.

Spotify live access remains gated by credentials and current API permissions.
The API runs locally against Neon; it has not been publicly deployed. iOS device
checks require macOS/Xcode. Android toolchain/device results are recorded in the
verification report after the attempted native build completes.

Free-account export checkpoint:

- `a30c113`: bounded official account-data playlist JSON parser, private local snapshots, native/web pickers, duplicate detection and parser/storage tests.
- `2877b7d`: preview/select/cancel UI, explicit local matching, editable local-playlist copies, missing-file/removal behavior, offline browser verification and user instructions.
- `cb0bc16`: preserve selected occurrences when repeated exported songs are played or reordered in the queue; final local-player and export browser checks passed together.
- JDK 17 Android release test builds passed; system-picker import, local matching, playlist creation, offline playback and persistence across relaunch/app update were verified on the Pixel 3a emulator. See `docs/VERIFICATION.md` and `docs/SPOTIFY_EXPORT.md` for coverage and instructions.
