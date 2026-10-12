import { Easing, interpolate } from "remotion";
import beats from "./beats.json";

export const B = beats;
export const FPB = beats.framesPerBeat; // 15 frames per beat at 120 BPM
export const S = beats.sections;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ease = {
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),
  inExpo: Easing.bezier(0.7, 0, 0.84, 0),
  inOutExpo: Easing.bezier(0.87, 0, 0.13, 1),
  outBack: Easing.bezier(0.34, 1.56, 0.64, 1),
  outQuint: Easing.bezier(0.22, 1, 0.36, 1),
  inOutCubic: Easing.bezier(0.65, 0, 0.35, 1),
  inQuad: Easing.bezier(0.11, 0, 0.5, 0),
};

/** Map frame f from [a, b] to [x, y] with an easing curve, clamped. */
export function tw(
  f: number,
  a: number,
  b: number,
  x = 0,
  y = 1,
  easing: (t: number) => number = ease.outExpo,
) {
  return interpolate(f, [a, b], [x, y], { ...clamp, easing });
}

/** Frames since the latest hit in `list` at or before f (Infinity if none). */
export function since(list: number[], f: number) {
  let s = Infinity;
  for (const h of list) {
    if (h > f) break;
    s = f - h;
  }
  return s;
}

/** Exponential envelope that jumps to 1 on each hit and decays. */
export function hit(list: number[], f: number, decay = 5) {
  const s = since(list, f);
  return s === Infinity ? 0 : Math.exp(-s / decay);
}

/** Index of the latest hit at or before f (-1 if none). */
export function hitIndex(list: number[], f: number) {
  let i = -1;
  for (let k = 0; k < list.length; k++) if (list[k]! <= f) i = k;
  return i;
}

/** Damped spring overshoot: 0 → 1 with a wobble, driven by frames since start. */
export function wobble(f: number, start: number, freq = 0.45, damp = 0.12) {
  const t = f - start;
  if (t <= 0) return 0;
  return 1 - Math.exp(-damp * t) * Math.cos(freq * t);
}

/** Deterministic pseudo-random in [0, 1) for a seed. */
export function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
