import { useId } from "react";
import { AbsoluteFill } from "remotion";
import { c, Ion, IonName } from "./brand";
import { rand } from "./motion";

/** Animated film grain: an SVG turbulence whose seed changes every frame. */
export function Grain({ f, opacity = 0.07 }: { f: number; opacity?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <AbsoluteFill
      style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity }}
    >
      <svg width="100%" height="100%">
        <filter id={id}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed={f % 97}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
}

export function Vignette({ strength = 0.65 }: { strength?: number }) {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,${strength}) 100%)`,
      }}
    />
  );
}

/** Expanding rings from a point; `t` is frames since the hit. */
export function Shockwave({
  t,
  x = 960,
  y = 540,
  color = c.accent,
  count = 3,
  size = 220,
  spread = 9,
}: {
  t: number;
  x?: number;
  y?: number;
  color?: string;
  count?: number;
  size?: number;
  spread?: number;
}) {
  if (t < 0 || t > 60) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const k = Math.max(0, t - i * 3) / 34;
        if (k <= 0 || k >= 1) return null;
        const e = 1 - (1 - k) ** 3;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              border: `${Math.max(1, 14 * (1 - e))}px solid ${color}`,
              opacity: (1 - k) * (1 - i * 0.25),
              transform: `scale(${0.2 + e * spread})`,
            }}
          />
        );
      })}
    </>
  );
}

const shapes: (IonName | "dot" | "square")[] = [
  "dot",
  "square",
  "dot",
  "musical-note",
  "dot",
  "square",
];
const palette = [c.accent, c.teal, c.orange, c.text, c.accent];

/** Radial particle burst with drag and gravity; `t` is frames since the hit. */
export function Burst({
  t,
  x = 960,
  y = 540,
  count = 40,
  power = 46,
  seed = 1,
}: {
  t: number;
  x?: number;
  y?: number;
  count?: number;
  power?: number;
  seed?: number;
}) {
  if (t < 0 || t > 70) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = rand(seed * 100 + i) * Math.PI * 2;
        const v = power * (0.35 + rand(seed * 200 + i) * 0.9);
        // Velocity decays with drag; distance is the integral.
        const drag = 0.9;
        const dist = (v * (1 - drag ** t)) / (1 - drag);
        const px = x + Math.cos(a) * dist;
        const py = y + Math.sin(a) * dist + 0.09 * t * t;
        const life = 1 - t / (40 + rand(seed + i) * 30);
        if (life <= 0) return null;
        const kind = shapes[i % shapes.length]!;
        const size = 6 + rand(seed * 300 + i) * 16;
        const col = palette[i % palette.length]!;
        const spin = (rand(i) - 0.5) * 40 * t;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              opacity: life,
              transform: `translate(-50%, -50%) rotate(${spin}deg) scale(${0.4 + life * 0.8})`,
            }}
          >
            {kind === "dot" || kind === "square" ? (
              <div
                style={{
                  width: size,
                  height: size,
                  background: col,
                  borderRadius: kind === "dot" ? "50%" : 3,
                }}
              />
            ) : (
              <Ion name={kind} size={size * 2.2} color={col} />
            )}
          </div>
        );
      })}
    </>
  );
}

/** Horizontal (or vertical) motion blur via an SVG filter; amount in px. */
export function MotionBlur({
  amount,
  vertical = false,
  children,
}: {
  amount: number;
  vertical?: boolean;
  children: React.ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  const a = Math.abs(amount);
  if (a < 0.5) return <>{children}</>;
  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={vertical ? `0 ${a}` : `${a} 0`} />
        </filter>
      </svg>
      <div style={{ filter: `url(#${id})`, width: "100%", height: "100%" }}>
        {children}
      </div>
    </>
  );
}

/** Text with an RGB split that opens on impacts; `split` in px. */
export function SplitText({
  children,
  split,
  style,
}: {
  children: React.ReactNode;
  split: number;
  style?: React.CSSProperties;
}) {
  if (split < 0.4) return <span style={style}>{children}</span>;
  return (
    <span style={{ position: "relative", display: "inline-block", ...style }}>
      <span
        style={{
          position: "absolute",
          inset: 0,
          color: "#ff5a6a",
          transform: `translateX(${-split}px)`,
          mixBlendMode: "screen",
          opacity: 0.8,
        }}
      >
        {children}
      </span>
      <span
        style={{
          position: "absolute",
          inset: 0,
          color: "#4fd8ff",
          transform: `translateX(${split}px)`,
          mixBlendMode: "screen",
          opacity: 0.8,
        }}
      >
        {children}
      </span>
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
}

/** Soft colored light blob for depth. */
export function Glow({
  x,
  y,
  size,
  color,
  opacity = 0.5,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
}
