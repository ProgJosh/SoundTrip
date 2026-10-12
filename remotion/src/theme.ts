import { loadFont } from "@remotion/google-fonts/Inter";

// Mirrors src/ui/theme.ts so the video matches the app.
export const c = {
  bg: "#101313",
  panel: "#181c1b",
  elevated: "#222827",
  border: "#303735",
  text: "#f1f2e9",
  muted: "#a3b0a8",
  accent: "#d7f79a",
  teal: "#83c5b6",
  orange: "#e8ae82",
  ink: "#111414",
};

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const VIDEO = { width: 1080, height: 1920, fps: 30 };

// Artwork gradients for the fictional demo playlists and songs.
export const arts: [string, string][] = [
  [c.accent, c.teal],
  [c.orange, "#7a4d3c"],
  [c.teal, "#1f3d37"],
  ["#b9d97a", "#3c4a2a"],
  [c.orange, c.teal],
];
