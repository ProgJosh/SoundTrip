import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fade, pop, press, rise } from "../anim";
import { arts, c, fontFamily, VIDEO } from "../theme";
import { Icon, IconName } from "./Icon";

export function Background({ children }: { children?: React.ReactNode }) {
  return (
    <AbsoluteFill
      style={{
        fontFamily,
        color: c.text,
        background: `radial-gradient(1100px 900px at 50% -10%, #223029 0%, ${c.bg} 62%), ${c.bg}`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export type Part = { text: string; color?: string };

/** Centered headline whose words rise in one after another. */
export function Headline({
  parts,
  start = 0,
  top = 150,
  size = 80,
}: {
  parts: Part[];
  start?: number;
  top?: number;
  size?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = parts.flatMap((p) =>
    p.text.split(" ").map((w) => ({ w, color: p.color })),
  );
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 70,
        right: 70,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: size * 0.26,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: -size * 0.035,
        lineHeight: 1.12,
      }}
    >
      {words.map(({ w, color }, i) => {
        const p = rise(frame, fps, start + i * 3, 18);
        return (
          <span
            key={i}
            style={{
              color: color || c.text,
              opacity: p,
              transform: `translateY(${(1 - p) * 34}px)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

export const PHONE = { width: 740, height: 1240 };

export function Phone({
  children,
  top = 480,
  enter = 0,
  offlineAt,
}: {
  children: React.ReactNode;
  top?: number;
  enter?: number;
  offlineAt?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = rise(frame, fps, enter, 26);
  const offline = offlineAt !== undefined && frame >= offlineAt;
  return (
    <div
      style={{
        position: "absolute",
        left: (VIDEO.width - PHONE.width) / 2,
        top,
        width: PHONE.width,
        height: PHONE.height,
        opacity: p,
        transform: `translateY(${(1 - p) * 90}px)`,
        borderRadius: 104,
        background: "#0a0c0c",
        border: "3px solid #3a4240",
        boxShadow:
          "0 50px 140px rgba(0,0,0,0.6), 0 0 0 12px #1a1f1e, 0 0 0 15px #2c3331",
        padding: 18,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 88,
          background: c.bg,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 56,
            right: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
            fontWeight: 600,
          }}
        >
          <span>9:41</span>
          <div
            style={{
              width: 200,
              height: 56,
              borderRadius: 30,
              background: "#000",
            }}
          />
          <div style={{ width: 60, display: "flex", justifyContent: "end" }}>
            {offline ? (
              <div
                style={{
                  transform: `scale(${pop(frame, fps, offlineAt!)})`,
                  display: "flex",
                }}
              >
                <Icon name="plane" size={34} color={c.orange} />
              </div>
            ) : (
              <SignalBars />
            )}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "124px 44px 44px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SignalBars() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
      {[10, 15, 20, 25].map((h) => (
        <div
          key={h}
          style={{ width: 6, height: h, borderRadius: 2, background: c.text }}
        />
      ))}
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: c.muted,
        fontSize: 20,
        fontWeight: 600,
        letterSpacing: 3,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

export function Sub({
  children,
  size = 25,
  color = c.muted,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
}) {
  return (
    <div style={{ color, fontSize: size, lineHeight: 1.45 }}>{children}</div>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: c.panel,
        border: `2px solid ${c.border}`,
        borderRadius: 30,
        padding: 30,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** App-style button. `pressAt` plays a tap on that frame. */
export function Button({
  children,
  primary,
  icon,
  pressAt,
  style,
}: {
  children: React.ReactNode;
  primary?: boolean;
  icon?: IconName;
  pressAt?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const t = press(frame, pressAt);
  const ring =
    pressAt === undefined
      ? 0
      : interpolate(frame, [pressAt, pressAt + 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const fg = primary ? c.ink : c.text;
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        minHeight: 76,
        padding: "0 30px",
        borderRadius: 40,
        fontSize: 26,
        fontWeight: 600,
        color: fg,
        background: primary ? c.accent : c.elevated,
        border: primary ? "none" : `2px solid ${c.border}`,
        transform: `scale(${1 - t * 0.06})`,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={30} color={fg} />}
      {children}
      {ring > 0 && ring < 1 && (
        <div
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: 46,
            border: `4px solid ${c.accent}`,
            opacity: 1 - ring,
            transform: `scale(${1 + ring * 0.12})`,
          }}
        />
      )}
    </div>
  );
}

/** Checkbox that pops when `changedAt` is reached. */
export function Checkbox({
  on,
  changedAt,
}: {
  on: boolean;
  changedAt?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s =
    changedAt !== undefined && frame >= changedAt
      ? 0.7 + 0.3 * pop(frame, fps, changedAt)
      : 1;
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: on ? c.accent : "transparent",
        border: on ? "none" : `3px solid ${c.muted}`,
        transform: `scale(${s})`,
      }}
    >
      {on && <Icon name="check" size={32} color={c.ink} stroke={3} />}
    </div>
  );
}

export function Artwork({
  index,
  size,
  radius = size * 0.2,
}: {
  index: number;
  size: number;
  radius?: number;
}) {
  const [a, b] = arts[index % arts.length]!;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(140deg, ${a}, ${b})`,
      }}
    >
      {[0.9, 0.62, 0.34].map((r) => (
        <div
          key={r}
          style={{
            position: "absolute",
            width: size * r,
            height: size * r,
            right: -size * r * 0.3,
            bottom: -size * r * 0.3,
            borderRadius: "50%",
            border: `${Math.max(2, size * 0.02)}px solid rgba(17,20,20,0.18)`,
          }}
        />
      ))}
    </div>
  );
}

/** Pill shown under the phone to state a key point. */
export function Chips({
  items,
  start,
  top = 1790,
}: {
  items: string[];
  start: number;
  top?: number;
}) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 40,
        right: 40,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      {items.map((item, i) => {
        const p = fade(frame, start + i * 6, 10);
        return (
          <div
            key={item}
            style={{
              opacity: p,
              transform: `translateY(${(1 - p) * 16}px)`,
              padding: "14px 28px",
              borderRadius: 40,
              background: "rgba(215,247,154,0.12)",
              border: `2px solid rgba(215,247,154,0.35)`,
              color: c.accent,
              fontSize: 30,
              fontWeight: 600,
            }}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
}

export function Logo({ size }: { size: number }) {
  return (
    <Img
      src={staticFile("soundtrip-icon.png")}
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
    />
  );
}

export function Row({
  children,
  gap = 18,
  style,
}: {
  children: React.ReactNode;
  gap?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap, ...style }}>
      {children}
    </div>
  );
}
