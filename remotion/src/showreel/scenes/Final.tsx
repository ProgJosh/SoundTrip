import { evolvePath } from "@remotion/paths";
import { AbsoluteFill } from "remotion";
import { c, Ion, sans, SITE } from "../brand";
import { B, ease, hit, S, tw, wobble } from "../motion";
import { LogoSlam } from "./LogoSlam";

const START = S.final;
const HEART = B.heartbeats.filter((h) => h > START)[0]!;

export function Final({ f }: { f: number }) {
  const url = wobble(f, START + 22, 0.6, 0.17);
  const beat = hit([HEART, HEART + 5], f, 4);
  const line = tw(f, HEART - 2, HEART + 14, 0, 1, ease.inOutCubic);
  const d = "M 0 0 L 300 0 L 330 -46 L 365 38 L 395 -18 L 410 0 L 700 0";
  const ev = evolvePath(line, d);
  const out = tw(f, 892, 900, 0, 1, ease.inQuad);

  return (
    <AbsoluteFill style={{ fontFamily: sans }}>
      <LogoSlam f={f} start={START} tagline="Take your music with you." />

      {/* One last heartbeat under the logo */}
      <svg
        width={700}
        height={140}
        style={{
          position: "absolute",
          left: 960 - 350,
          top: 640,
          overflow: "visible",
          opacity: 0.9 - out,
        }}
      >
        <g transform="translate(0 70)">
          <path
            d={d}
            fill="none"
            stroke={c.accent}
            strokeWidth={4 + beat * 3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={ev.strokeDasharray}
            strokeDashoffset={ev.strokeDashoffset}
            style={{
              filter: `drop-shadow(0 0 ${8 + beat * 18}px ${c.accent})`,
            }}
          />
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          top: 905,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            transform: `scale(${url})`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "18px 34px",
            borderRadius: 50,
            background: c.accent,
            color: c.bg,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: -0.5,
            boxShadow: `0 0 ${40 + beat * 60}px #d7f79a66`,
          }}
        >
          <Ion name="globe-outline" size={34} color={c.bg} />
          {SITE}
        </div>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: out }} />
    </AbsoluteFill>
  );
}
