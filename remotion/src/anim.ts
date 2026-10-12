import { interpolate, spring } from "remotion";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** 0 → 1 settle with no overshoot, starting at `start`. */
export function rise(frame: number, fps: number, start: number, frames = 22) {
  return spring({
    frame: frame - start,
    fps,
    config: { damping: 200 },
    durationInFrames: frames,
  });
}

/** 0 → 1 with a little bounce, for badges and checkmarks. */
export function pop(frame: number, fps: number, start: number) {
  return spring({
    frame: frame - start,
    fps,
    config: { damping: 12, stiffness: 180 },
  });
}

export function fade(frame: number, start: number, frames = 12) {
  return interpolate(frame, [start, start + frames], [0, 1], clamp);
}

/** Counts from `from` to `to` between two frames, as a whole number. */
export function count(
  frame: number,
  start: number,
  frames: number,
  from: number,
  to: number,
) {
  return Math.round(
    interpolate(frame, [start, start + frames], [from, to], clamp),
  );
}

/** A quick 0 → 1 → 0 pulse used for button presses. */
export function press(frame: number, at?: number) {
  if (at === undefined) return 0;
  return interpolate(frame, [at, at + 4, at + 12], [0, 1, 0], clamp);
}

export { clamp };
