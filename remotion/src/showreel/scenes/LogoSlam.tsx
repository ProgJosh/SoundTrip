import { AbsoluteFill } from "remotion";
import { Badge, c, sans, serif } from "../brand";
import { Burst, Glow, Shockwave, SplitText } from "../fx";
import { B, ease, hit, S, tw, wobble } from "../motion";

const LETTERS = "soundtrip".split("");

/** Logo slam on the first drop. Also reused for the final hit. */
export function LogoSlam({
  f,
  start = S.drop1,
  tagline = "Your music. Your kind of escape.",
}: {
  f: number;
  start?: number;
  tagline?: string;
}) {
  const t = f - start;
  const kick = hit(B.kicks, f, 4);
  const impact = hit(B.impacts, f, 6);
  const heart = hit(B.heartbeats, f, 4);
  // Squash on contact, then a damped wobble back to round.
  const land = wobble(f, start, 0.55, 0.16);
  const squash = Math.exp(-t * 0.25) * Math.sin(t * 0.55) * 0.28;
  const scale =
    (2.8 - 1.8 * Math.min(1, land)) * (1 + kick * 0.06 + heart * 0.08);
  const slide = tw(f, start + 6, start + 20, 0, 1, ease.outExpo);
  const reveal = tw(f, start + 1, start + 9, 0, 1, ease.outQuint);

  return (
    <AbsoluteFill
      style={{
        background: c.deep,
        color: c.text,
        fontFamily: sans,
        overflow: "hidden",
      }}
    >
      <Glow
        x={960}
        y={540}
        size={1700}
        color={c.accent}
        opacity={0.12 + impact * 0.5}
      />
      <Glow
        x={960}
        y={540}
        size={700}
        color={c.teal}
        opacity={0.18 + kick * 0.15}
      />
      {/* Kick rings keep pulsing behind the logo */}
      {B.kicks
        .filter((k) => k >= start && k <= f)
        .slice(-3)
        .map((k) => (
          <Shockwave
            key={k}
            t={f - k}
            count={1}
            size={260}
            spread={5}
            color="#d7f79a55"
            x={960 - 470 * slide}
          />
        ))}
      <Shockwave t={t} count={3} size={300} spread={8} x={960} />
      <Burst t={t} count={46} power={52} seed={start} />

      <div
        style={{
          position: "absolute",
          top: 540 - 130,
          left: 960 - 130 - 470 * slide,
          width: 260,
          height: 260,
          transform: `scale(${scale * (1 + squash)}, ${scale * (1 - squash)}) rotate(${(1 - Math.min(1, land)) * -16}deg)`,
        }}
      >
        <Badge
          size={260}
          reveal={reveal}
          style={{ boxShadow: `0 0 ${60 + kick * 80}px #d7f79a66` }}
        />
      </div>

      {/* Wordmark letters land on 16ths */}
      <div
        style={{
          position: "absolute",
          top: 540 - 100,
          left: 655,
          height: 200,
          display: "flex",
          alignItems: "center",
          fontSize: 190,
          fontWeight: 800,
          letterSpacing: -9,
          color: c.text,
        }}
      >
        {LETTERS.map((ch, i) => {
          const at = start + 11 + i * 1.9;
          const p = tw(f, at, at + 12, 0, 1, ease.outBack);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: Math.min(1, p * 2),
                transform: `translateY(${(1 - p) * 140}px) rotate(${(1 - p) * 24}deg) scale(${0.6 + 0.4 * p})`,
              }}
            >
              <SplitText split={impact * 10}>{ch}</SplitText>
            </span>
          );
        })}
        {(() => {
          const at = start + 18;
          const p = wobble(f, at, 0.7, 0.2);
          return (
            <span
              style={{
                display: "inline-block",
                color: c.accent,
                transform: `scale(${p})`,
                transformOrigin: "50% 80%",
              }}
            >
              .
            </span>
          );
        })()}
      </div>

      {/* The app's own hero line, in its Georgia serif */}
      <div
        style={{
          position: "absolute",
          top: 790,
          width: "100%",
          textAlign: "center",
          fontFamily: serif,
          fontSize: 54,
          color: "#f5f3df",
          letterSpacing: -1.5,
        }}
      >
        {tagline.split(" ").map((w, i) => {
          const at = start + 24 + i * 3;
          const p = tw(f, at, at + 14, 0, 1, ease.outExpo);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: 16,
                opacity: p,
                filter: `blur(${(1 - p) * 10}px)`,
                transform: `translateY(${(1 - p) * 30}px)`,
                color: i >= 2 ? c.accent : undefined,
                fontStyle: i >= 2 ? "italic" : undefined,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>

      {/* Impact flash */}
      <AbsoluteFill
        style={{ background: c.accent, opacity: Math.max(0, 1 - t / 3) * 0.95 }}
      />
    </AbsoluteFill>
  );
}
