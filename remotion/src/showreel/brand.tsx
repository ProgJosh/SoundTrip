import { loadFont as loadGoogle } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Colors from src/ui/theme.ts and the app's mood tiles and hero gradient.
export const c = {
  bg: "#101313",
  deep: "#0a0d0d",
  panel: "#181c1b",
  elevated: "#222827",
  border: "#303735",
  text: "#f1f2e9",
  muted: "#a3b0a8",
  accent: "#d7f79a",
  teal: "#83c5b6",
  orange: "#e8ae82",
  mini: "#1c2220",
  hero: ["#233b35", "#334a3b", "#535945"],
};

export const moods = [
  { name: "Drift away", icon: "leaf-outline", bg: "#384741", fg: "#bbd5aa" },
  {
    name: "Find your focus",
    icon: "radio-outline",
    bg: "#344545",
    fg: "#a9d1d1",
  },
  { name: "Feel good", icon: "sunny-outline", bg: "#534637", fg: "#f2cc8e" },
  { name: "After hours", icon: "moon-outline", bg: "#423e50", fg: "#c9bae9" },
  { name: "Let it out", icon: "heart-outline", bg: "#4e383a", fg: "#e5afb1" },
] as const;

export const { fontFamily: sans } = loadGoogle("normal", {
  weights: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});
export const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});
// The app's hero headline uses Georgia on the web.
export const serif = "Georgia, 'Times New Roman', serif";

// The app's own icon set (Ionicons, MIT), from @expo/vector-icons.
loadFont({ family: "Ionicons", url: staticFile("Ionicons.ttf") });

const glyphs = {
  pulse: 62710,
  "albums-outline": 61712,
  "search-outline": 62819,
  "grid-outline": 62294,
  "link-outline": 62393,
  "settings-outline": 62828,
  add: 61699,
  shuffle: 62851,
  play: 62662,
  pause: 62611,
  "play-skip-back": 62680,
  "play-skip-forward": 62686,
  repeat: 62767,
  "text-outline": 62924,
  "list-outline": 62399,
  heart: 62314,
  "heart-outline": 62327,
  "leaf-outline": 62387,
  "radio-outline": 62726,
  "sunny-outline": 62894,
  "moon-outline": 62561,
  "musical-notes-outline": 62570,
  "musical-note": 62566,
  "document-text-outline": 62132,
  "cloud-offline-outline": 62043,
  airplane: 61705,
  wifi: 63025,
  "checkmark-circle": 61982,
  checkmark: 61981,
  "phone-portrait-outline": 62645,
  "laptop-outline": 62381,
  "tablet-portrait-outline": 62912,
  "person-outline": 62636,
  "time-outline": 62942,
  "folder-open-outline": 62247,
  "sync-outline": 62906,
  "disc-outline": 62120,
  "headset-outline": 62312,
  "lock-closed-outline": 62408,
  "globe-outline": 62288,
  "logo-android": 62422,
  "logo-apple": 62424,
} as const;

export type IonName = keyof typeof glyphs;

export function Ion({
  name,
  size = 24,
  color = c.text,
  style,
}: {
  name: IonName;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: "Ionicons",
        fontSize: size,
        lineHeight: 1,
        color,
        display: "inline-block",
        width: size,
        height: size,
        textAlign: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      {String.fromCodePoint(glyphs[name])}
    </span>
  );
}

/** The app's logo, built the way Shell.tsx builds it: lime squircle + pulse glyph. */
export function Badge({
  size,
  reveal = 1,
  style,
}: {
  size: number;
  reveal?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.31,
        background: c.accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      <div style={{ clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }}>
        <Ion name="pulse" size={size * 0.62} color={c.bg} />
      </div>
    </div>
  );
}

/** "soundtrip." wordmark as in the app header, split into letters for animation. */
export const WORDMARK = "soundtrip";

export const SITE = "soundtrip.joshua27emmanuel30.workers.dev";
