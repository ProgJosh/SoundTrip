import { AbsoluteFill } from "remotion";
import { c, Ion, sans, SITE } from "../brand";
import { Glow } from "../fx";
import { B, ease, hit, lerp, tw } from "../motion";
import {
  Art,
  Hero,
  Label,
  MiniPlayer,
  MoodTile,
  Sidebar,
  TrackRow,
  Button,
} from "../ui";

const START = 180;
const W = 1560;
const H = 900;
const CHROME = 46;
const MAIN_X = 222;
const MAIN_W = 1028;
const RIGHT_X = MAIN_X + MAIN_W;
const PLAY = 285; // clap: playback starts

/** One piece of the interface that flies in from the camera and lands in depth. */
function Layer({
  f,
  at,
  z,
  collapse,
  x,
  y,
  w,
  h,
  children,
}: {
  f: number;
  at: number;
  z: number;
  collapse: number;
  x: number;
  y: number;
  w: number;
  h?: number;
  children: React.ReactNode;
}) {
  const p = tw(f, at, at + 14, 0, 1, ease.outExpo);
  if (p <= 0) return null;
  const depth = lerp(1100, z, p) * (1 - collapse);
  const ring = Math.max(0, 1 - (f - at) / 10);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: Math.min(1, p * 1.6),
        transform: `translateZ(${depth}px)`,
        transformStyle: "preserve-3d",
        boxShadow: `0 ${depth * 0.12}px ${depth * 0.3}px rgba(0,0,0,${0.45 * (1 - collapse)}), 0 0 0 ${ring * 3}px ${c.accent}`,
        borderRadius: 14,
      }}
    >
      {children}
    </div>
  );
}

export function Library({ f }: { f: number }) {
  const kick = hit(B.kicks, f, 4);
  const collapse = tw(f, 262, 280, 0, 1, ease.inOutCubic);
  const flat = tw(f, START, 280, 0, 1, ease.inOutCubic);
  const push = tw(f, 280, 300, 0, 1, ease.inQuad);
  const typed = Math.floor(
    tw(f, START + 2, START + 22, 0, 1, (x) => x) * SITE.length,
  );
  const playing = f >= PLAY;
  const press = hit([PLAY], f, 4);
  const wipe = tw(f, START, START + 9, 0, 1, ease.outExpo);

  return (
    <AbsoluteFill
      style={{
        background: c.deep,
        color: c.text,
        fontFamily: sans,
        overflow: "hidden",
      }}
    >
      <Glow x={960} y={300} size={1800} color="#24423a" opacity={0.7} />
      <Glow
        x={1500}
        y={950}
        size={1000}
        color={c.accent}
        opacity={0.08 + kick * 0.06}
      />

      <AbsoluteFill style={{ perspective: 2400, perspectiveOrigin: "50% 40%" }}>
        <div
          style={{
            position: "absolute",
            left: 960 - W / 2,
            top: 540 - H / 2 + 20,
            width: W,
            height: H,
            transformStyle: "preserve-3d",
            transform: `translateY(${lerp(60, 0, flat)}px) scale(${lerp(0.9, 0.96, flat) + push * 0.12 + kick * 0.004}) rotateX(${lerp(42, 0, flat)}deg) rotateZ(${lerp(-18, 0, flat)}deg)`,
          }}
        >
          {/* Base plate of the browser window */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 18,
              background: "#141918",
              border: "1px solid #d7f79a55",
              boxShadow: `0 80px 160px rgba(0,0,0,0.6), 0 0 0 1px #d7f79a33, 0 0 ${90 + kick * 60}px #d7f79a26`,
            }}
          />
          <Layer
            f={f}
            at={START}
            z={30}
            collapse={collapse}
            x={0}
            y={0}
            w={W}
            h={CHROME}
          >
            <div
              style={{
                height: CHROME,
                borderRadius: "18px 18px 0 0",
                background: "#151918",
                borderBottom: `1px solid ${c.border}`,
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 18px",
              }}
            >
              {["#e8ae82", "#d7f79a", "#83c5b6"].map((col) => (
                <div
                  key={col}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    background: col,
                    opacity: 0.8,
                  }}
                />
              ))}
              <div
                style={{
                  marginLeft: 18,
                  width: 520,
                  height: 28,
                  borderRadius: 14,
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 14px",
                  color: c.text,
                  fontSize: 13,
                }}
              >
                <Ion name="lock-closed-outline" size={13} color={c.muted} />
                {SITE.slice(0, typed)}
                {typed < SITE.length && (
                  <span
                    style={{ width: 2, height: 16, background: c.accent }}
                  />
                )}
              </div>
            </div>
          </Layer>

          <Layer
            f={f}
            at={START + 3}
            z={90}
            collapse={collapse}
            x={0}
            y={CHROME}
            w={MAIN_X}
            h={H - CHROME - 76}
          >
            <Sidebar />
          </Layer>

          <Layer
            f={f}
            at={START + 6}
            z={60}
            collapse={collapse}
            x={MAIN_X}
            y={CHROME}
            w={MAIN_W}
            h={78}
          >
            <div
              style={{
                height: 78,
                padding: "0 36px",
                borderBottom: `1px solid ${c.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: c.bg,
              }}
            >
              <Label>A little space for your soundtrack</Label>
              <div style={{ display: "flex", gap: 12 }}>
                <Button icon="add">Import music</Button>
                <Button compact icon="person-outline" />
              </div>
            </div>
          </Layer>

          <Layer
            f={f}
            at={B.kicks[6]!}
            z={190}
            collapse={collapse}
            x={MAIN_X + 36}
            y={CHROME + 78 + 30}
            w={956}
          >
            <Hero width={956} />
          </Layer>

          {[0, 1, 2, 3, 4].map((i) => (
            <Layer
              key={i}
              f={f}
              at={B.kicks[7]! + i * 2}
              z={270 + i * 14}
              collapse={collapse}
              x={MAIN_X + 36 + i * 194}
              y={CHROME + 78 + 30 + 268 + 60}
              w={180}
            >
              <MoodTile index={i} width={180} active={playing && i === 3} />
            </Layer>
          ))}

          <Layer
            f={f}
            at={B.kicks[8]!}
            z={150}
            collapse={collapse}
            x={MAIN_X + 36}
            y={CHROME + 78 + 30 + 268 + 60 + 140}
            w={956}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                background: c.bg,
              }}
            >
              <div
                style={{
                  color: c.text,
                  fontSize: 26,
                  fontWeight: 600,
                  letterSpacing: -0.8,
                }}
              >
                Your library
              </div>
              <TrackRow index={0} width={956} playing={playing} />
            </div>
          </Layer>

          <Layer
            f={f}
            at={B.kicks[8]! + 3}
            z={120}
            collapse={collapse}
            x={RIGHT_X}
            y={CHROME}
            w={W - RIGHT_X}
            h={H - CHROME - 76}
          >
            <div
              style={{
                height: "100%",
                borderLeft: `1px solid ${c.border}`,
                padding: 26,
                display: "flex",
                flexDirection: "column",
                gap: 22,
                background: c.bg,
              }}
            >
              <Label>On your turntable</Label>
              <Art index={0} size={258} spin={playing ? (f - PLAY) * 3 : 0} />
              <div style={{ color: c.text, fontSize: 22, fontWeight: 600 }}>
                {playing ? "Neon Harbor" : "Room for a new favorite"}
              </div>
              <div style={{ color: c.muted, fontSize: 14 }}>
                {playing
                  ? "The Tidelines"
                  : "Import your music and make this space your own."}
              </div>
            </div>
          </Layer>

          <Layer
            f={f}
            at={B.kicks[9]!}
            z={340}
            collapse={collapse}
            x={0}
            y={H - 76}
            w={W}
            h={76}
          >
            <div
              style={{
                borderRadius: "0 0 18px 18px",
                overflow: "hidden",
                transform: `scale(${1 + press * 0.02})`,
              }}
            >
              <MiniPlayer
                progress={playing ? 0.05 + (f - PLAY) * 0.004 : 0}
                playing={playing}
              />
            </div>
          </Layer>
        </div>
      </AbsoluteFill>

      {/* Lime curtain left over from the logo slam, wiping up */}
      <AbsoluteFill
        style={{
          background: c.accent,
          transform: `translateY(${-wipe * 105}%)`,
          borderRadius: `0 0 ${wipe * 60}% ${wipe * 60}%`,
        }}
      />
    </AbsoluteFill>
  );
}
