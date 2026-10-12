# SoundTrip videos (Remotion)

Two videos and a cover image, in a separate npm package so they don't affect the Expo app's dependencies.

| Composition | Output | What it is |
| --- | --- | --- |
| `Showreel` | `out/soundtrip-showreel.mp4` | 30-second 1920×1080 motion-graphics introduction to the web app, cut to an original soundtrack |
| `PlaylistImport` | `out/soundtrip-playlist-import.mp4` | 29-second vertical (1080×1920) walkthrough of importing a Spotify playlist export |
| `Cover` | `out/soundtrip-playlist-import-cover.png` | Vertical cover image for the playlist-import video |

```powershell
cd remotion
npm install
npm run studio     # preview and edit in the browser
npm run build      # regenerates the music, then renders everything into out/
```

`npm run showreel`, `npm run render`, and `npm run cover` render one output each. The first render downloads a headless Chrome, and Inter and JetBrains Mono load from Google Fonts, so rendering needs internet access.

## Soundtrack

`scripts/make-music.mjs` synthesizes the music from scratch: kick, clap, hats, bass, pads, an arpeggio with ping-pong delay, risers, impacts, and a small reverb. No samples or third-party audio are used. It's 120 BPM in F minor, so one beat is exactly 15 frames at 30 fps.

Running `npm run music` writes:

- `public/showreel-music.wav`, the 30-second track.
- `src/showreel/beats.json`, the frame of every kick, clap, heartbeat, impact, stab, and drum-roll hit, plus the section boundaries.

The showreel reads `beats.json` (through `src/showreel/motion.ts`) for every beat-synced motion: camera shake, kick pulses, cuts, and landings. If you change the arrangement in the script, the visuals follow. The vertical video uses the same track, faded out at its end.

| Section | Frames | Music | Picture |
| --- | --- | --- | --- |
| Intro | 0–120 | Heartbeat, filtered pad, riser | ECG line from the logo, kinetic type |
| Drop 1 | 120–360 | Full beat | Logo slam, 3D exploded web app, file import |
| Breakdown | 360–480 | Half-time clap, riser | Spotify export → matching local files |
| Drop 2 | 480–780 | Full beat with stabs | Now playing (audio-reactive), offline, devices, montage |
| Build | 780–833 | Accelerating roll | Everything spirals into the logo while the URL types itself |
| Stop / final | 833–900 | Silence, then the final hit | End card with the web app link |

## Assets and content

- The logo is rebuilt as in `src/ui/Shell.tsx`: a lime squircle with the Ionicons `pulse` glyph. All icons come from the app's own Ionicons font (`public/Ionicons.ttf`, MIT, copied from `@expo/vector-icons`).
- Colors, copy ("Your music. Your kind of escape.", "Take the long way home.", mood names), and layouts mirror the app's source. The interface is rebuilt as components in `src/showreel/ui.tsx` rather than screenshots, so each piece can animate.
- Song, artist, album, and file names are invented for the demo, and so are the lyric lines, except "take the long way home", which is from the app's sidebar.
- The Spotify name appears only to describe the account-data export. The showreel states that SoundTrip is independent and not endorsed by Spotify, and no Spotify logo is used.

Remotion requires a paid company license for some organizations. Check https://www.remotion.dev/license before commercial use.
