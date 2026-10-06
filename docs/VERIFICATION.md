# SoundTrip verification

Verified in the Windows workspace on 2026-10-06. This report distinguishes JavaScript exports from installed native-app tests.

## Automated evidence

| Command/check               | Result                                                                                                                                                                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`         | Passed, strict TypeScript including the app, API, tests, and configuration                                                                                                                                                                                                  |
| `npm run lint`              | Passed                                                                                                                                                                                                                                                                      |
| `npm test`                  | 16 tests passed: shuffle/repeat, matching, input validation, WAV metadata, LRC parsing/timing, Spotify metadata sanitization, authentication/owner isolation, retry/conflict recovery, deletion protection, and no file transfer                                            |
| `npm run build:web`         | Passed; production Expo export plus asset-only offline service worker                                                                                                                                                                                                       |
| Local Edge browser test     | Passed: two original generated WAV imports; mood edit; playlist create/add/reorder/rename; shuffle; now-playing; LRC import, seek, and timing shift; network disabled, page reloaded, playback clock advances; 390 px layout without horizontal overflow                    |
| Live sync Edge browser test | Passed against the dedicated Neon development branch: two browser profiles sign in, an offline playlist edit is queued and recovered, the second profile receives it, session restores on reload, synced-data deletion signs out the second device and prevents restoration |
| Managed Auth smoke          | Passed: test signup/sign-in, session/JWT issuance, EdDSA signature/issuer/audience verification, authenticated API 200, sign-out                                                                                                                                            |
| `npm run build:native`      | iOS and Android Metro production exports passed; these are not APK/IPA builds                                                                                                                                                                                               |
| `npx expo install --check`  | Passed: SDK-compatible dependencies                                                                                                                                                                                                                                         |
| Expo native config/prebuild | Passed: iOS audio background mode, Android media-playback foreground service, no microphone recording permission, broad storage permissions blocked, Android backup disabled                                                                                                |

Screenshots are generated under ignored `test-results/`: desktop empty/library playing, mobile library, and lyrics while offline. They were visually inspected. Browser playback uses actual generated PCM audio, IndexedDB blobs, Expo Audio, and a real browser audio decoder; the player is not mocked. Offline mode disables network access in the browser context while leaving build tools and the user's computer connectivity intact.

The local test also exercises recovery after deleting test audio blobs, keeping playlist records and relinking the original WAV. Final combined test and native compilation results will be recorded after completion.

## Platform coverage

**Web:** tested in Microsoft Edge on this workstation, at 1440 x 1000 and 390 x 844. Production offline reload/playback is verified. Safari, Firefox, mobile browsers, browser storage eviction under OS pressure, and background playback across OS sleep were not tested. Browser codecs, autoplay restrictions, IndexedDB storage retention, and media-session support vary. The app and README state these limits.

**Android:** an installed SDK and headless Pixel 3a emulator were found and booted successfully. A real Gradle release compilation was attempted with Android Studio's JDK, API 36, and NDK 27.1. Its final result and device-test coverage are pending below; do not infer playback success from Metro export or prebuild.

**iOS:** no Xcode/iOS simulator is available on Windows. The bundle and generated configuration were verified; installation, background audio, interruption handling, file picking, lock-screen controls, and secure session persistence require macOS/Xcode and an iOS device or simulator.

Native release testing still needs:

1. Import original MP3/WAV files through the system picker, cancel the picker, reject disguised/corrupt files, verify metadata/artwork, and check missing-file relinking preserves playlists.
2. Disable Wi-Fi/cellular; play, seek, skip, shuffle moods/playlists, repeat one/all, and reopen the app to restore the queue and position without autoplay.
3. Play in the background and with the screen locked for more than three minutes. Exercise play/pause/seek controls, phone/audio-focus interruptions, headphone disconnection/reconnection, and Bluetooth controls. Use device volume buttons.
4. Import LRC and embedded lyrics, seek to a timestamp, edit timing, restart, and verify persistence and unavailable-lyrics state.
5. Sign in on two physical devices with a reachable HTTPS API/Auth origin; verify private metadata sync, offline retries, session persistence, sign-out, and deletion. A remote track must show unavailable until the original file is transferred explicitly and imported.
6. Test VoiceOver/TalkBack, large text, reduced motion, keyboard/focus behavior, safe areas, permission denial, low storage, process termination, and codec failures.

## External integration limits

Spotify credentials, dashboard registration, allowlist access, and verified native HTTPS callback domains were not available. PKCE/API wiring and safe metadata handling are implemented; live Spotify login, imports, 429 recovery, and native handoff remain untested. Current API restrictions and attribution are linked in the README. Spotify audio and offline downloads are never used.

No licensed external lyric provider, cloud audio storage, or public metadata API deployment was configured. Password-reset email delivery was not tested with a real address. Managed client `deleteUser` returned 404, so the app deletes synced metadata and explicitly preserves the provider identity. The user authorized removal of the temporary verification identity through Neon branch administration; that cleanup succeeded.

## Dependency audit

Safe overrides patch `decode-uri-component` and Xcode's `uuid`. The remaining audit tree includes inherited Expo/React Native tooling findings originating from `braces` ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) and `node-forge` ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)). The latest published versions checked during this session were still inside their reported vulnerable ranges. npm's forced remediation proposed a breaking SDK downgrade; it was not applied. Review the current `npm audit` report before release. The final count is recorded when the concluding audit completes.

No database credentials, OAuth tokens, passwords, or imported audio are committed. `.env.local`, `.local` fixtures, generated native projects, exports, audit output, and screenshots are ignored.
