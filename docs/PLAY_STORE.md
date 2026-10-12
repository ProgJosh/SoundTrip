# Publishing SoundTrip on Google Play

The Android app is the same Expo project as the web app. `npm run android:bundle` builds a signed Android App Bundle (`.aab`) ready for Play Console.

| Setting                | Value                                                                        | Why                                                            |
| ---------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Package                | `app.soundtrip.player`                                                       | Permanent once published                                       |
| minSdk                 | 24 (Android 7.0)                                                             | Expo SDK 57 / React Native 0.86 minimum                        |
| targetSdk / compileSdk | 36 (Android 16)                                                              | Play requires API 36 for new apps and updates from 31 Aug 2026 |
| ABIs in the bundle     | arm64-v8a, armeabi-v7a, x86, x86_64                                          | Play delivers only the one each device needs                   |
| Version                | `expo.version` (shown to users) and `expo.android.versionCode` in `app.json` | Play rejects an upload that reuses a versionCode               |

Play's target-API rule moves every year. Plan an Expo SDK upgrade before each August deadline. See [target API requirements](https://developer.android.com/google/play/requirements/target-sdk).

## 1. Create your upload key (once)

Play App Signing holds the real app-signing key. You sign uploads with your own **upload key**. Keep the file and passwords somewhere safe and backed up, outside this repository. If you lose it, Play support can reset it, but that takes days.

```powershell
$env:JAVA_HOME = Get-Content .local/java-home.txt   # or any JDK 17
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v -storetype PKCS12 `
  -keystore "$HOME\keys\soundtrip-upload.p12" -alias soundtrip-upload `
  -keyalg RSA -keysize 4096 -validity 10000
```

Then add these lines to your user-level `%USERPROFILE%\.gradle\gradle.properties` (not the project's). Environment variables with the same names also work, which suits CI.

```properties
SOUNDTRIP_UPLOAD_STORE_FILE=C:/Users/<you>/keys/soundtrip-upload.p12
SOUNDTRIP_UPLOAD_STORE_PASSWORD=<store password>
SOUNDTRIP_UPLOAD_KEY_ALIAS=soundtrip-upload
SOUNDTRIP_UPLOAD_KEY_PASSWORD=<key password>
```

`plugins/with-android-release-signing.js` wires these into the generated Gradle project. Without them, release builds fall back to the development key, and `android:bundle` refuses to run.

## 2. Build

On Windows, the full bundle compiles React Native code whose object paths exceed 260 characters when the project sits in a long folder like `C:\Personal Project\SoundTrip`. Enable long paths once, as administrator, and install CMake 3.31.6, which `plugins/with-android-cmake.js` selects:

```powershell
# Administrator PowerShell, once per machine:
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force
# Normal shell:
& "$env:LOCALAPPDATA\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat" "cmake;3.31.6"
```

```powershell
# Bump expo.android.versionCode in app.json for every upload, then:
npm run android:bundle
```

The script regenerates `android/` with `expo prebuild --clean`, builds `:app:bundleRelease`, copies the result to `dist-android/soundtrip-<version>-<versionCode>.aab`, and prints the signing certificate. It fails if the bundle is debug-signed.

Like the Cloudflare build, it ignores the development `.env.local`. With no `.env.production`, the store build is **offline-only**: account sync and the Spotify connection show as unavailable, and Spotify export import, local music, playlists and lyrics all work. Read section 5 before enabling either online feature.

## 3. Test on several Android versions

```powershell
npm run android:apk -- --abi x86_64          # release APK for emulators
npm run android:smoke -- --apk dist-android/soundtrip-0.1.0-1-x86_64.apk `
  --avd st_api24 --avd st_api28 --avd st_api30 --avd st_api33 --avd st_api34 --avd st_api35 --avd st_api36
```

Emulators use host GPU rendering by default. Software rendering makes Android 13 and later too slow and their system UI stops responding. On a machine without a usable GPU, add `--gpu swiftshader_indirect`. Each emulator cold-boots with wiped data. The test installs the APK, finishes onboarding, imports a generated WAV through Android's own file picker, plays it, sends the app to the background for 10 seconds, and checks for crashes or ANRs. Screenshots, logcat and `report.json` go to `test-results/android/`. Create the emulators once with Android Studio's Device Manager or `avdmanager` using `google_apis` x86_64 images. The latest results are in [VERIFICATION.md](VERIFICATION.md).

Emulators do not prove audible output, Bluetooth, lock-screen controls on real hardware, or OEM battery-saver behavior. Before production, install from the internal or closed testing track on at least one real phone, ideally a Samsung or Xiaomi device with aggressive background limits.

## 4. Play Console checklist

1. **Create the app.** App name "SoundTrip". Do not put "Spotify" in the title or icon; Play's metadata and impersonation policies treat that as implying endorsement.
2. **Enrol in Play App Signing** and upload the first `.aab` to **Internal testing**.
3. **Closed testing.** Personal developer accounts created after 13 Nov 2023 must run a closed test with at least 12 opted-in testers for 14 continuous days before production access unlocks. See [Google's rule](https://support.google.com/googleplay/android-developer/answer/14151465).
4. **Store listing.** Use `store/play-icon-512.png`, `store/feature-graphic-1024x500.png`, and at least two phone screenshots (the smoke test's `test-results/android/st_api36/*.png` are a starting point).
5. **Privacy policy URL.** `public/privacy.html` deploys with the website as `https://soundtrip.joshua27emmanuel30.workers.dev/privacy.html`. Replace its placeholder contact email first, then redeploy.
6. **App content.**
   - _Data safety:_ for the offline-only build, "No data collected" and "No data shared". Files are chosen through the system picker, and no analytics or ads SDK is included.
   - _Foreground service:_ declare **Media playback**. Describe it as continuing playback of the user's imported music when the screen is off or the app is in the background. Play may ask for a short screen recording that shows this.
   - _Ads:_ none. _App access:_ no login required. _Target audience:_ 13+. Complete the content-rating questionnaire, which is a music player with no user-generated content sharing.
7. **Promote** the tested release from closed testing to production.

## 5. Before enabling accounts or the Spotify connection in a store build

- **Account deletion is a Play requirement.** Any app that lets users create an account must offer in-app and web account deletion that removes the account itself. SoundTrip can delete synced data, but the managed auth `deleteUser` call currently returns 404 (see README). Keep `EXPO_PUBLIC_NEON_AUTH_URL` empty in store builds until identity deletion works end to end.
- The account and sync API must be publicly deployed over HTTPS. The Data safety form and privacy policy must then list email, playlist and track metadata as collected for app functionality.
- The Spotify connection needs a registered HTTPS redirect, a hosted `assetlinks.json` with the **Play app-signing** certificate SHA-256 from Play Console, and Spotify's quota approval for more than five users.
