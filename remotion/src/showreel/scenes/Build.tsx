import { AbsoluteFill } from "remotion";
import { Badge, c, Ion, IonName, mono, sans, SITE } from "../brand";
import { Glow, MotionBlur } from "../fx";
import { B, ease, hit, rand, S, tw } from "../motion";
import { Art } from "../ui";

const START = S.build;
const STOP = S.stop;
const icons: IonName[] = [
  "musical-note",
  "heart",
  "shuffle",
  "repeat",
  "albums-outline",
  "text-outline",
  "list-outline",
  "airplane",
  "link-outline",
  "sunny-outline",
  "moon-outline",
  "leaf-outline",
];
const roll = B.roll.filter((r) => r >= START && r < STOP);

/** Everything from the reel spirals into the logo while the roll speeds up. */
export function Build({ f }: { f: number }) {
  const t = f - START;
  const k = tw(f, START, STOP, 0, 1, ease.inQuad);
  const hits = roll.filter((r) => r <= f).length;
  const typed = Math.min(
    SITE.length,
    Math.ceil((hits * SITE.length) / roll.length),
  );
  const flash = hit(roll, f, 2);
  const silent = f >= STOP;
  const items = 26;

  if (silent) {
    // The half-beat of silence before the final hit.
    return (
      <AbsoluteFill
        style={{
          background: "#050606",
          fontFamily: mono,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: c.accent, fontSize: 40, opacity: 0.85 }}>
          {SITE}
          <span style={{ opacity: Math.floor(f / 3) % 2 ? 1 : 0 }}>▍</span>
        </div>
      </AbsoluteFill>
    );
  }

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
        size={1400}
        color={c.accent}
        opacity={0.08 + k * 0.4 + flash * 0.1}
      />
      {Array.from({ length: items }, (_, i) => {
        const base = rand(i) * Math.PI * 2;
        // Angular speed and pull both accelerate with the build.
        const angle = base + t * 0.03 + k * k * 9 * (0.8 + rand(i + 50) * 0.4);
        const r0 = 520 + rand(i + 10) * 380;
        const r = r0 * (1 - k ** 1.6);
        const x = 960 + Math.cos(angle) * r * 1.35;
        const y = 540 + Math.sin(angle) * r * 0.8;
        const kind = i % 3;
        const size = (kind === 1 ? 120 : 70) * (1 - k * 0.7);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              opacity: 1 - tw(f, STOP - 6, STOP),
              transform: `rotate(${angle * 57}deg)`,
            }}
          >
            <MotionBlur amount={k * 14}>
              {kind === 1 ? (
                <Art index={i} size={size} />
              ) : (
                <Ion
                  name={icons[i % icons.length]!}
                  size={size}
                  color={[c.accent, c.teal, c.orange, c.text][i % 4]!}
                />
              )}
            </MotionBlur>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 960 - 90,
          top: 540 - 200,
          transform: `scale(${0.6 + k * 0.6 + flash * 0.08}) rotate(${k * 360}deg)`,
        }}
      >
        <Badge
          size={180}
          style={{ boxShadow: `0 0 ${60 + k * 120}px ${c.accent}` }}
        />
      </div>

      {/* The address types itself out on every hit of the roll */}
      <div
        style={{
          position: "absolute",
          top: 640,
          width: "100%",
          textAlign: "center",
          fontFamily: mono,
          fontSize: 46,
          fontWeight: 500,
          color: c.text,
          transform: `scale(${1 + flash * 0.04})`,
        }}
      >
        <span
          style={{
            padding: "14px 28px",
            borderRadius: 40,
            background: "#ffffff0d",
            border: `1px solid ${c.accent}55`,
          }}
        >
          {SITE.slice(0, typed)}
          <span style={{ color: c.accent }}>▍</span>
        </span>
      </div>
    </AbsoluteFill>
  );
}
