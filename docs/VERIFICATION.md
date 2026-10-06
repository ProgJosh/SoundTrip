# SoundTrip verification

Verified in the Windows workspace on 2026-10-06. This report distinguishes JavaScript exports from installed native-app tests.

## Automated evidence

| Command/check               | Result                                                                                                                                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck`         | Passed, strict TypeScript including the app, API, tests, and configuration                                                                                                                                                                                                                       |
| `npm run lint`              | Passed                                                                                                                                                                                                                                                                                           |
| `npm test`                  | 24 tests passed: shuffle/repeat, matching, input validation, WAV metadata, local media restoration, LRC parsing/timing, Spotify metadata sanitization, snapshot migration/write optimization, authentication/owner isolation, retry/conflict recovery, deletion protection, and no file transfer |
| `npm run build:web`         | Passed; production Expo export plus asset-only offline service worker                                                                                                                                                                                                                            |
| Local Edge browser test     | Passed: two original generated WAV imports; mood edit; playlist create/add/reorder/rename; shuffle; now-playing; LRC import, seek, and timing shift; network disabled, page reloaded, playback clock advances; 390 px layout without horizontal overflow                                         |
| Live sync Edge browser test | Passed against the dedicated Neon development branch: two browser profiles sign in, an offline playlist edit is queued and recovered, the second profile receives it, session restores on reload, synced-data deletion signs out the second device and prevents restoration                      |
| Managed Auth smoke          | Passed: test signup/sign-in, session/JWT issuance, EdDSA signature/issuer/audience verification, authenticated API 200, sign-out                                                                                                                                                                 |
| `npm run build:native`      | iOS and Android Metro production exports passed; these are not APK/IPA builds                                                                                                                                                                                                                    |
| `npx expo install --check`  | Passed: SDK-compatible dependencies                                                                                                                                                                                                                                                              |
| Expo native config/prebuild | Passed: iOS audio background mode, Android media-playback foreground service, no microphone recording permission, broad storage permissions blocked, Android backup disabled                                                                                                                     |

Screenshots are generated under ignored `test-results/`: desktop empty/library playing, mobile library, and lyrics while offline. They were visually inspected. Browser playback uses actual generated PCM audio, IndexedDB blobs, Expo Audio, and a real browser audio decoder; the player is not mocked. Offline mode disables network access in the browser context while leaving build tools and the user's computer connectivity intact.

The local test also exercises recovery after deleting test audio blobs, keeping playlist records and relinking the original WAV. Both browser tests passed together against the production web export.

## Platform coverage

**Web:** tested in Microsoft Edge on this workstation, at 1440 x 1000 and 390 x 844. Production offline reload/playback is verified. Safari, Firefox, mobile browsers, browser storage eviction under OS pressure, and background playback across OS sleep were not tested. Browser codecs, autoplay restrictions, IndexedDB storage retention, and media-session support vary. The app and README state these limits.

**Android:** Gradle release builds with JDK 17, API 36 and NDK 27.1 passed and were installed on the headless Pixel 3a Android 11 emulator. Earlier checks verified WAV import/cancel, offline playback with the screen asleep for over three minutes (player position 3:56 on return), playlist creation/add/rename/shuffle, local LRC import/timing edits/seek and persistence, and queue/position restoration without autoplay. A system media card appeared, but System UI became unresponsive during panel interaction, so its playback buttons are not considered verified. No audible-output, headphone, Bluetooth, phone-interruption or physical-device claim is made. The export-import checkpoint below adds native picker and persistence coverage.

**iOS:** no Xcode/iOS simulator is available on Windows. The bundle and generated configuration were verified; installation, background audio, interruption handling, file picking, lock-screen controls, and secure session persistence require macOS/Xcode and an iOS device or simulator.

Native release testing still needs:

1. Import original MP3/WAV files through the system picker, cancel the picker, reject disguised/corrupt files, verify metadata/artwork, and check missing-file relinking preserves playlists.
2. Disable Wi-Fi/cellular; play, seek, skip, shuffle moods/playlists, repeat one/all, and reopen the app to restore the queue and position without autoplay.
3. Play in the background and with the screen locked for more than three minutes. Exercise play/pause/seek controls, phone/audio-focus interruptions, headphone disconnection/reconnection, and Bluetooth controls. Use device volume buttons.
4. Import LRC and embedded lyrics, seek to a timestamp, edit timing, restart, and verify persistence and unavailable-lyrics state.
5. Sign in on two physical devices with a reachable HTTPS API/Auth origin; verify private metadata sync, offline retries, session persistence, sign-out, and deletion. A remote track must show unavailable until the original file is transferred explicitly and imported.
6. Test VoiceOver/TalkBack, large text, reduced motion, keyboard/focus behavior, safe areas, permission denial, low storage, process termination, and codec failures.

## Spotify account-data export checkpoint

The Free-account alternative is implemented independently of Spotify OAuth. `npm run typecheck` and `npm run lint` passed. `npm test` passed 24 tests, including five additional export/parser/storage/matching cases. `npm run build:web` and `npm run build:native` passed; the latter exports both iOS and Android bundles.

`npx playwright test tests/browser/export.spec.ts tests/browser/local.spec.ts` passed both tests together against the final production web build. The export test exercised multi-file preview, selection/cancel, explicit matching with unknown source duration, duplicate snapshot handling, empty playlists, skipped episodes, unrelated-file rejection, private-field exclusion from IndexedDB, persistence after three days, offline audio playback, missing-file preservation, removal without deleting created local playlists, and a 390 px layout without horizontal overflow. It also checked selecting/reordering repeated songs preserves the correct queue position. No Spotify authorization or Web API request was made by this test.

The final Android x86_64 test package was rebuilt using `:app:assembleRelease -x lintVitalRelease -PreactNativeArchitectures=x86_64 --no-daemon --max-workers=2` with explicit JDK 17 and `ANDROID_HOME` paths. It is signed with the existing development key; it is not a production distribution build. Release lint was excluded from this JavaScript-only checkpoint; the earlier full native release build passed release lint. An initial shell attempt lacked the SDK location and failed configuration; the corrected build and final incremental build passed.

On the emulator, with `Active default network: none`, a representative `Playlist1.json` was selected through Android's system document picker. Native preview displayed two songs and one skipped podcast. Saving, confirming the existing Native Drift WAV, and creating a local playlist succeeded. Shuffle from the confirmed export match produced an active media session and advanced the on-screen playback position to 1:10 while offline. The snapshot, confirmed match, offline availability and created playlist survived force-stop/relaunch and updating to the final package. Playback was left paused and the original airplane/Wi-Fi/mobile-data settings were restored.

Tests use generated representative exports, not the user's eventual Spotify download. The accepted `playlists` / `items` / `track` / `localTrack` structure and file/size/item limits are documented in `docs/SPOTIFY_EXPORT.md`. Unsupported schemas fail before saving. iOS installation and its native file picker remain untested on Windows. Current local backend credentials are not configured; prior live sync/Auth evidence above is from the earlier checkpoint and was not repeated for this device-only importer. No new account identity was created.

## External integration limits

Spotify credentials, dashboard registration, allowlist access, and verified native HTTPS callback domains were not available. PKCE/API wiring and safe metadata handling are implemented; live Spotify login, imports, 429 recovery, and native handoff remain untested. Current API restrictions and attribution are linked in the README. Spotify audio and offline downloads are never used.

No licensed external lyric provider, cloud audio storage, or public metadata API deployment was configured. Password-reset email delivery was not tested with a real address. Managed client `deleteUser` returned 404, so the app deletes synced metadata and explicitly preserves the provider identity. The user authorized removal of the temporary verification identity through Neon branch administration; that cleanup succeeded.

## Dependency audit

Safe overrides patch `decode-uri-component` and Xcode's `uuid`. The concluding audit reported 19 high-severity findings, with zero critical, moderate, or low findings. The inherited Expo/React Native tooling findings originate from `braces` ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) and `node-forge` ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)). The latest published versions checked during this session were still inside their reported vulnerable ranges. npm's forced remediation proposed a breaking SDK downgrade; it was not applied. Review the current `npm audit` report before release.

No database credentials, OAuth tokens, passwords, or imported audio are committed. `.env.local`, `.local` fixtures, generated native projects, exports, audit output, and screenshots are ignored.
