import { AbsoluteFill } from "remotion";
import { c, Ion, mono, sans } from "../brand";
import { Glow, MotionBlur, Shockwave } from "../fx";
import { B, ease, hit, lerp, tw, wobble } from "../motion";
import { TrackRow } from "../ui";

const START = 300;
const END = 360;
const files = [
  { name: "Neon Harbor.flac", kind: "FLAC" },
  { name: "Slow Static.mp3", kind: "MP3" },
  { name: "Afterglow.wav", kind: "WAV" },
  { name: "Paper Planes Home.mp3", kind: "MP3" },
  { name: "Low Tide Lights.flac", kind: "FLAC" },
];
// Each file lands on a hit: two kicks, then the fill.
const lands = [315, 330, 345, 349, 353];
const PANEL = { x: 1000, y: 190, w: 800 };
const ROW0 = PANEL.y + 150;
const ROW_H = 74;
const tags = ["Title", "Artist", "Album", "Artwork", "Lyrics"];

function bezier(p0: number, p1: number, p2: number, t: number) {
  return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

export function Import({ f }: { f: number }) {
  const kick = hit(B.kicks, f, 4);
  const exit = tw(f, END - 5, END, 0, 1, ease.inExpo);
  const landed = lands.filter((l) => f >= l).length;
  const lines = [
    { text: "Import", at: 297 },
    { text: "your own", at: 308 },
    { text: "music.", at: 315, accent: true },
  ];

  return (
    <AbsoluteFill
      style={{
        background: c.deep,
        color: c.text,
        fontFamily: sans,
        overflow: "hidden",
      }}
    >
      <MotionBlur amount={exit * 40}>
        <AbsoluteFill style={{ transform: `translateX(${-exit * 700}px)` }}>
          <Glow x={1400} y={540} size={1400} color="#24423a" opacity={0.8} />
          <Glow
            x={400}
            y={800}
            size={900}
            color={c.accent}
            opacity={0.06 + kick * 0.08}
          />

          {/* Outline word drifting behind */}
          <div
            style={{
              position: "absolute",
              top: 690,
              left: -200 + (f - START) * 4,
              fontSize: 420,
              fontWeight: 900,
              letterSpacing: -20,
              color: "transparent",
              WebkitTextStroke: "2px #d7f79a22",
              whiteSpace: "nowrap",
            }}
          >
            IMPORT IMPORT
          </div>

          {/* Headline */}
          <div style={{ position: "absolute", left: 130, top: 250 }}>
            {lines.map((l, i) => {
              const p = tw(f, l.at, l.at + 9, 0, 1, ease.outExpo);
              const punch = hit([l.at], f, 5);
              return (
                <div key={i} style={{ overflow: "hidden", height: 158 }}>
                  <div
                    style={{
                      fontSize: 150,
                      fontWeight: 900,
                      letterSpacing: -7,
                      lineHeight: "158px",
                      color: l.accent ? c.accent : c.text,
                      transform: `translateY(${(1 - p) * 110}%) scale(${1 + punch * 0.06}) skewX(${(1 - p) * -12}deg)`,
                      transformOrigin: "0% 100%",
                    }}
                  >
                    {l.text}
                  </div>
                </div>
              );
            })}
            <div
              style={{
                marginTop: 34,
                fontFamily: mono,
                fontSize: 24,
                color: c.muted,
                opacity: tw(f, 322, 332),
                display: "flex",
                gap: 18,
              }}
            >
              {["MP3", "FLAC", "WAV", ".LRC"].map((k) => (
                <span
                  key={k}
                  style={{
                    border: `1px solid ${c.border}`,
                    borderRadius: 8,
                    padding: "6px 12px",
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </div>

          {/* Library panel */}
          <div
            style={{
              position: "absolute",
              left: PANEL.x,
              top: PANEL.y,
              width: PANEL.w,
              height: 700,
              borderRadius: 26,
              background: c.panel,
              border: `1px solid ${c.border}`,
              boxShadow: `0 50px 120px rgba(0,0,0,0.5), 0 0 ${40 + kick * 40}px #d7f79a14`,
              padding: 30,
              transform: `translateY(${(1 - tw(f, START - 3, START + 8)) * 60}px)`,
            }}
          >
            <div
              style={{
                color: c.text,
                fontSize: 34,
                fontWeight: 600,
                letterSpacing: -1,
              }}
            >
              Your library
            </div>
            <div style={{ color: c.muted, fontSize: 18, marginTop: 8 }}>
              {landed} tracks · {landed} on this device
            </div>
          </div>

          {/* Rows that the files turn into */}
          {files.map((file, i) => {
            const land = lands[i]!;
            const y = ROW0 + i * ROW_H;
            const morph = tw(f, land + 2, land + 9, 0, 1, ease.outExpo);
            if (f < land) return null;
            const s = wobble(f, land, 0.9, 0.25);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: PANEL.x + 16,
                  top: y,
                  opacity: morph,
                  transform: `scale(${0.9 + 0.1 * s})`,
                  transformOrigin: "0% 50%",
                }}
              >
                <TrackRow
                  index={i}
                  width={PANEL.w - 32}
                  playing={i === 0 && f >= 356}
                />
              </div>
            );
          })}

          {/* Files in flight */}
          {files.map((file, i) => {
            const land = lands[i]!;
            const t0 = land - 13;
            if (f < t0 || f > land + 9) return null;
            const p = tw(f, t0, land, 0, 1, ease.inQuad);
            const tx = PANEL.x + 60;
            const ty = ROW0 + i * ROW_H + 8;
            const x = bezier(1950 + i * 30, 1500, tx, p);
            const y = bezier(-120, -260 + i * 60, ty, p);
            const prev = tw(f - 1, t0, land, 0, 1, ease.inQuad);
            const vx = x - bezier(1950 + i * 30, 1500, tx, prev);
            const after = f - land;
            const squash =
              after >= 0
                ? Math.exp(-after * 0.35) * Math.cos(after * 0.9) * 0.3
                : 0;
            const fade = after >= 0 ? 1 - tw(f, land + 2, land + 8) : 1;
            return (
              <div key={`f${i}`}>
                {after >= 0 && (
                  <Shockwave
                    t={after}
                    x={tx + 120}
                    y={ty + 22}
                    size={90}
                    spread={4}
                    count={2}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    opacity: fade,
                    transform: `rotate(${(1 - p) * -40}deg) scale(${1 + squash}, ${1 - squash})`,
                    transformOrigin: "50% 100%",
                  }}
                >
                  <MotionBlur
                    amount={after < 0 ? Math.min(30, Math.abs(vx) * 0.35) : 0}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 18px",
                        borderRadius: 14,
                        background: c.elevated,
                        border: `1px solid ${c.accent}66`,
                        fontFamily: mono,
                        fontSize: 20,
                        color: c.text,
                        whiteSpace: "nowrap",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                      }}
                    >
                      <Ion name="musical-note" size={22} color={c.accent} />
                      {file.name}
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: c.bg,
                          background: c.accent,
                          borderRadius: 6,
                          padding: "2px 7px",
                        }}
                      >
                        {file.kind}
                      </span>
                    </div>
                  </MotionBlur>
                </div>
              </div>
            );
          })}

          {/* Tags read from the first file pop out and settle */}
          {tags.map((tag, i) => {
            const at = lands[0]! + 3 + i * 2;
            if (f < at) return null;
            const s = wobble(f, at, 0.7, 0.18);
            const a = (130 + i * 25) * (Math.PI / 180);
            const r = lerp(0, 1, tw(f, at, at + 10));
            const leave = tw(f, 340, 347, 0, 1, ease.inExpo);
            const cx = PANEL.x + 60 + Math.cos(a) * 170 * r;
            const cy = ROW0 + 30 + Math.sin(a) * 230 * r;
            return (
              <div
                key={tag}
                style={{
                  position: "absolute",
                  left: cx,
                  top: cy,
                  transform: `translate(-50%, -50%) scale(${s * (1 - leave)})`,
                  padding: "8px 16px",
                  borderRadius: 20,
                  background: i % 2 ? c.teal : c.accent,
                  color: c.bg,
                  fontWeight: 700,
                  fontSize: 19,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                }}
              >
                {tag}
              </div>
            );
          })}
        </AbsoluteFill>
      </MotionBlur>
    </AbsoluteFill>
  );
}
