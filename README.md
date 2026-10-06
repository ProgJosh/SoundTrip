# SoundTrip

A personal player for music you import, with an original charcoal, olive, and teal interface. Built with Expo SDK 57, React Native, Expo Router, and TypeScript for iOS, Android, and responsive web.

## Run locally

Requires Node 24 LTS and npm. This workspace already has dependencies and an ignored `.env.local`; preserve it. On a fresh checkout:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Local import, playlists, playback, moods, and lyrics work without account or Spotify credentials. For the production web app and its offline shell:

```powershell
npm run build:web
npm run preview
```

Open **http://127.0.0.1:8081** once online before disconnecting. The development server (`npm run web`) does not install the production offline shell. Browser imports are copied into IndexedDB for this origin. A browser can evict storage, and clearing site data or using private browsing can remove the library. Keep your original files. Background playback, codec support, media controls, and persistent storage grants vary by browser and operating system.

For mobile, install an Expo development or production build:

```powershell
npm run android
# On macOS with Xcode:
npm run ios
```

Android requires a current Android SDK and JDK supported by the generated Gradle version. The system Java on this workstation is Java 8; use Android Studio's bundled JDK for builds. Native directories are generated from `app.json` and `app.config.ts` and are ignored. Rebuild after changing plugins, permissions, or verified-link domains. Expo Go is insufficient to verify background services and the final permissions.

## What is implemented

- System file-picker imports, validated headers/extensions and a 100 MB per-file limit. Native imports are copied into app documents; web imports become IndexedDB blobs. SHA-256 fingerprints deduplicate and reconnect identical files across devices.
- Available ID3v2.3/2.4 title, artist, album, embedded artwork and unsynchronized lyrics; WAV duration; FLAC comments and duration. Other tags/codecs fall back to the filename and editable details. Playback supplies duration where supported. Compressed/encrypted ID3 frames are skipped. Not every container's metadata is supported.
- Search, favorite/offline filters, five editable mood tags, playlist create/rename/reorder/remove/delete, relinking, queue reorder/remove/clear, normal and mood shuffle, repeat off/all/one, play/pause/seek/skip, and web volume. Missing files preserve track and playlist metadata.
- Persistent mini-player, now-playing, queue, lyrics, library, search, playlists, settings, Spotify, account, and password-reset screens. Responsive navigation, labeled controls, keyboard-accessible web sliders, restrained transitions, and reduced-motion preferences.
- Local `.lrc` import, multiple timestamps, offsets, highlighted lines, seek by lyric, and manual timing editing. Plain embedded lyrics display without invented timing. External providers remain disabled; `lyrics-provider.ts` defines the licensing-aware extension interface.
- Native background audio/silent-mode audio session, lock-screen play/pause/seek metadata, and OS interruption/headphone handling through Expo Audio. Queue and position persist; reopening restores the selection without autoplay. Native volume uses the device's controls. Device behavior still requires the checks in `docs/VERIFICATION.md`.
- Optional account sign-up/sign-in/session restoration/sign-out, private metadata sync, offline outbox, owner isolation, idempotent retries, and synced-data deletion with a server tombstone preventing another device from re-uploading it.

## Metadata backend and accounts

This session created a dedicated [SoundTrip Neon development project](https://console.neon.tech/app/projects/steep-cell-76660633), in Singapore, with an isolated `development` branch. Managed Better Auth and Postgres are enabled there. No existing project was reused. The local TypeScript API is **not publicly deployed**.

Required services are Neon Postgres, Neon Managed Auth, and a Node host for the Hono API. Configure the private database connection, Auth base/JWKS URLs, and exact allowed browser origin in `.env.local`, following `.env.example`:

```powershell
npm run db:migrate
npm run api
```

In another terminal, run the web preview. The current trusted development Auth origin is `http://127.0.0.1:8081`. Register production origins in Neon Auth, use HTTPS for production, and set `EXPO_PUBLIC_API_URL` to your deployed API. An emulator/device cannot reach the computer via its own `127.0.0.1`; use an appropriate host address or `adb reverse tcp:8787 tcp:8787` for Android development. Authentication callbacks use `EXPO_PUBLIC_ACCOUNT_ORIGIN`; configure a trusted reachable origin. Recovery email delivery depends on the managed provider's email configuration and was not tested with a real recipient.

The API verifies EdDSA JWT signatures, issuer, audience, and subject using the branch JWKS. Every library request is authenticated, scoped to its owner, validated, and limited to 100 operations/1 MB. Track metadata, favorites, moods, playlists, and the reduced-motion preference sync. Audio, device paths, artwork, lyrics, Spotify references, playback queues, and volume never go through this API. Conflicts use the latest per-record edit timestamp; playlist ordering resolves as one record. Clock skew can affect conflict resolution; edits over five minutes in the future are rejected.

Native sessions and Spotify tokens use SecureStore. Browser account sessions use the provider's HttpOnly cookies, and Spotify tokens remain in memory. The library is bound to its first account to prevent accidentally uploading one person's metadata to another account. Sign-out preserves local music. Use a separate browser profile or app installation for another account.

“Delete synced account data” removes library and operation records and disables future uploads for that subject, retaining only a minimal deletion marker. It does not delete local files or the managed sign-in identity. The installed Managed Auth deployment returned 404 for client `deleteUser`; identity removal must currently be handled by an authorized administrator through Neon's branch user management. This distinction is stated in the confirmation dialog. Before a public release, provide an account-support/removal process and review provider retention/backups. Android app backup is disabled; operating-system device backups on other platforms are user-controlled.

Audio on one device is **not** automatically available on another. Explicitly transfer original files you have rights to use, then import them on the other device. Identical file fingerprints reconnect the synced metadata. Cloud audio upload/transfer is not enabled.

## Official Spotify metadata connection

SoundTrip uses OAuth authorization code + PKCE and only `playlist-read-private` and `playlist-read-collaborative`. No Spotify password or client secret is requested. No Spotify audio, previews, downloads, offline files, recording, or extraction is supported. Playback buttons labeled “Play your local file” resolve only a confirmed, independently imported local file. Spotify handoffs open official Spotify links and may require the Spotify app, an account, and internet access; no Spotify remote playback SDK is embedded.

To enable the connection, register an app with Spotify and fill the public client ID and **exact** registered redirect URI. Web development can use `http://127.0.0.1:8081/spotify`; `localhost` is not permitted. Native redirects require HTTPS app/universal links. `app.config.ts` generates associated domains/intent filters for HTTPS configuration, but you must host Apple's `apple-app-site-association` and Android's `assetlinks.json` with your team/app/signing identities, register the URI, and rebuild the app. Those domain associations and Spotify credentials are not provided.

Official documentation was checked during implementation. Current development-mode access depends on the app owner's Premium subscription and an allowlist of at most five users; playlist contents can be restricted to owned/collaborative playlists. Access to every playlist or track is not promised. Imports use the current `/playlists/{id}/items` endpoint, accept `item` payloads, safely omit unavailable/non-track entries, validate pagination domains, and honor 429 `Retry-After`. Safety limits are 1,000 playlists and 10,000 entries per import; displayed content is paginated in groups of 20.

Spotify references are separate from the local library, have official wordmark attribution and Spotify links, expire after 24 hours, and are purged on disconnect. They are never sent to the metadata backend. Disconnect also removes tokens and matching links immediately; users can separately revoke access on their Spotify Apps page. Browser reload requires reconnecting because tokens are not persisted there.

References checked: [Web API](https://developer.spotify.com/documentation/web-api), [2026 migration guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), [quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), [redirects](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri), [design and attribution](https://developer.spotify.com/documentation/design), [iOS SDK](https://developer.spotify.com/documentation/ios), [Developer Terms](https://developer.spotify.com/terms), and [Developer Policy](https://developer.spotify.com/policy). Recheck these before publishing; access and terms can change.

## Verification and structure

```powershell
npm run typecheck
npm run lint
npm test
npm run build:web
npm run test:web
npm run build:native
npx expo install --check
```

Browser tests use installed Microsoft Edge. Change the Playwright channel if using another installed browser. Live sync tests require this development `.env.local` and a built web app with matching public configuration; they start the preview/API when needed and create a non-deliverable `@example.invalid` verification identity. The sync test deliberately deletes that identity's metadata. Identity cleanup requires an authorized administrator. With account services absent, only the live sync test is skipped; local browser tests remain independent.

See [verification evidence and native checklist](docs/VERIFICATION.md) and [implementation checkpoints](IMPLEMENTATION.md). `app/` contains routes, `src/state/` library/playback/account providers, `src/core/` testable algorithms, `src/services/` platform adapters, and `server/` the authenticated API and migration. SQLite uses an atomic versioned library snapshot on native; IndexedDB supplies web state/files because Expo's SQLite web support requires experimental WASM/isolation configuration. This foundation favors small personal libraries; very large libraries should migrate the snapshot into indexed per-entity tables and use virtualized lists.

The lockfile pins the tested dependency tree. Safe patches were applied through overrides for `decode-uri-component` and Xcode's `uuid`. Remaining npm audit advisories affect the inherited Expo/React Native toolchain; do not apply the suggested SDK downgrade blindly. Details are recorded in the verification report. Secrets and generated output are ignored; never put secrets in `EXPO_PUBLIC_*`.
