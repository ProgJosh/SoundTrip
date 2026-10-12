import { evolvePath } from "@remotion/paths";
import { noise2D } from "@remotion/noise";
import { AbsoluteFill } from "remotion";
import { c, sans } from "../brand";
import { Glow, MotionBlur } from "../fx";
import { B, ease, hit, rand, tw } from "../motion";

// The logo's pulse, stretched into a full-width heartbeat line.
const ECG =
  "M -40 0 L 700 0 L 760 0 L 820 -250 L 905 210 L 975 -95 L 1010 0 L 1960 0";

function Word({
  text,
  f,
  at,
  out,
  color = c.text,
}: {
  text: string;
  f: number;
  at: number;
  out?: number;
  color?: string;
}) {
  const inn = tw(f, at, at + 10, 0, 1, ease.outExpo);
  const gone = out === undefined ? 0 : tw(f, out, out + 7, 0, 1, ease.inExpo);
  if (inn <= 0 || gone >= 1) return null;
  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "bottom",
        padding: "0 0.04em",
      }}
    >
      <span
        style={{
          display: "inline-block",
          color,
          transform: `translateY(${(1 - inn) * 105 - gone * 105}%) rotate(${(1 - inn) * 6}deg)`,
        }}
      >
        {text}
      </span>
    </span>
  );
}

export function Intro({ f }: { f: number }) {
  const beat =
    hit(B.heartbeats, f, 4) +
    hit(
      B.heartbeats.map((h) => h + 5),
      f,
      4,
    ) *
      0.6;
  const tick = hit(B.ticks, f, 3);
  const draw = tw(f, 0, 28, 0, 1, ease.inOutCubic);
  const { strokeDasharray, strokeDashoffset } = evolvePath(draw, ECG);
  // Riser: line squeezes to the logo's size and the type flies at the camera.
  const squeeze = tw(f, 96, 119, 0, 1, ease.inExpo);
  const open = tw(f, 0, 120, 0, 1, ease.inQuad);
  const anywhere = tw(f, 90, 119, 0, 1, ease.inQuad);
  const flash = tw(f, 110, 119, 0, 1, ease.inExpo);
  const roll = hit(
    B.roll.filter((r) => r < 120),
    f,
    2,
  );

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
        x={960 + noise2D("gx", f / 90, 0) * 300}
        y={420 + noise2D("gy", f / 90, 0) * 120}
        size={1500}
        color="#2a4a3c"
        opacity={0.25 + open * 0.55 + beat * 0.15}
      />
      <Glow x={1500} y={900} size={900} color="#20403a" opacity={open * 0.6} />

      {/* Heartbeat line */}
      <svg
        width={1920}
        height={1080}
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${180 * (1 - squeeze)}px) scaleX(${1 - squeeze * 0.86}) scaleY(${1 + beat * 0.35 - squeeze * 0.5})`,
          transformOrigin: "905px 540px",
          filter: `drop-shadow(0 0 ${12 + beat * 26}px ${c.accent})`,
        }}
      >
        <g transform="translate(0 540)">
          <path
            d={ECG}
            fill="none"
            stroke={c.accent}
            strokeWidth={6 + beat * 4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            opacity={0.55 + beat * 0.45}
          />
          {f > 26 && (
            <circle cx={1010} cy={0} r={18 + beat * 10} fill={c.accent} />
          )}
        </g>
      </svg>

      {/* Ripples on each heartbeat */}
      {B.heartbeats
        .filter((h) => h < 120)
        .map((h) => {
          const t = f - h;
          if (t < 0 || t > 30) return null;
          const k = t / 30;
          return (
            <div
              key={h}
              style={{
                position: "absolute",
                left: 905 - 150,
                top: 720 - 150,
                width: 300,
                height: 300,
                borderRadius: "50%",
                border: `3px solid ${c.accent}`,
                opacity: (1 - k) * 0.6 * (1 - squeeze),
                transform: `scale(${0.3 + k * 3}) translateY(${-squeeze * 60}px)`,
              }}
            />
          );
        })}

      {/* Kinetic type */}
      <div
        style={{
          position: "absolute",
          top: 250,
          width: "100%",
          textAlign: "center",
          fontWeight: 800,
          fontSize: 168,
          letterSpacing: -7,
          lineHeight: 1,
          transform: `scale(${1 + tick * 0.015})`,
        }}
      >
        <Word text="Your" f={f} at={B.heartbeats[1]!} out={88} />{" "}
        <Word
          text="music."
          f={f}
          at={B.ticks[1]!}
          out={B.heartbeats[2]! - 4}
          color={c.accent}
        />
        <Word
          text="playlists."
          f={f}
          at={B.heartbeats[2]!}
          out={88}
          color={c.teal}
        />
      </div>
      {f >= 88 && (
        <div
          style={{
            position: "absolute",
            top: 250,
            width: "100%",
            textAlign: "center",
            fontWeight: 900,
            fontSize: 190,
            lineHeight: 1,
            color: c.text,
            letterSpacing: -8 + anywhere * 70,
            opacity: 1 - tw(f, 112, 119),
            transform: `scale(${1 + anywhere ** 2 * 1.4}) translateX(${(rand(f) - 0.5) * roll * 26}px)`,
          }}
        >
          <MotionBlur amount={anywhere * 6 + roll * 10}>
            {"Anywhere.".split("").map((ch, i) => {
              const p = tw(f, 90 + i * 1.2, 100 + i * 1.2, 0, 1, ease.outBack);
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    opacity: p,
                    transform: `translateY(${(1 - p) * 120}px)`,
                    color: i === 8 ? c.accent : undefined,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </MotionBlur>
        </div>
      )}

      {/* Build-up flash into the drop */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 55%, ${c.accent} 0%, transparent ${10 + flash * 80}%)`,
          opacity: flash * 0.9,
        }}
      />
    </AbsoluteFill>
  );
}
