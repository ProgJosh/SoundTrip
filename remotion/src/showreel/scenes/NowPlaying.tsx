import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { noise2D } from "@remotion/noise";
import { AbsoluteFill, staticFile } from "remotion";
import { Badge, c, Ion, IonName, moods, sans, serif } from "../brand";
import { Burst, Glow, Shockwave } from "../fx";
import { B, ease, hit, tw, wobble } from "../motion";
import { Art, Label } from "../ui";

const START = 480;
const END = 600;
const music = staticFile("showreel-music.wav");
// Original lines, one per bar; the second is the app's own sidebar line.
const lyrics = [
  { text: "Headlights on the harbor,", at: 480 },
  { text: "take the long way home.", at: 540 },
];
const controls: { icon: IonName; big?: boolean }[] = [
  { icon: "shuffle" },
  { icon: "play-skip-back" },
  { icon: "pause", big: true },
  { icon: "play-skip-forward" },
  { icon: "repeat" },
];

function Vinyl({ size, spin }: { size: number; spin: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `repeating-radial-gradient(circle, #121514 0px, #121514 3px, #1b201f 4px, #121514 6px)`,
        boxShadow: "0 40px 90px rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `rotate(${spin}deg)`,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "conic-gradient(from 20deg, transparent 0deg, #ffffff14 30deg, transparent 60deg, transparent 180deg, #ffffff10 210deg, transparent 240deg)",
        }}
      />
      <Badge size={size * 0.3} style={{ borderRadius: "50%" }} />
    </div>
  );
}

export function NowPlaying({ f }: { f: number }) {
  const audio = useAudioData(music);
  const kick = hit(B.kicks, f, 4);
  const stab = hit(B.stabs, f, 5);
  const t = f - START;
  const slam = wobble(f, START, 0.42, 0.14);
  const disc = tw(f, START + 4, START + 18, 0, 1, ease.outBack);
  const spin = t * 5 + kick * 6;
  const exit = tw(f, END - 9, END, 0, 1, ease.inExpo);

  const bars = audio
    ? visualizeAudio({
        fps: 30,
        frame: f,
        audioData: audio,
        numberOfSamples: 64,
        optimizeFor: "speed",
      })
    : new Array(64).fill(0);
  const bass = (bars[0]! + bars[1]! + bars[2]!) / 3;

  return (
    <AbsoluteFill
      style={{
        background: c.deep,
        color: c.text,
        fontFamily: sans,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          transform: `scale(${1 + exit * 0.5})`,
          opacity: 1 - exit,
          filter: `blur(${exit * 14}px)`,
        }}
      >
        <Glow
          x={560}
          y={540}
          size={1300}
          color="#2f6157"
          opacity={0.45 + bass * 0.6}
        />
        <Glow
          x={1400}
          y={300}
          size={1000}
          color={c.accent}
          opacity={0.05 + stab * 0.12}
        />

        {/* Spectrum from the soundtrack itself */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 260,
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            padding: "0 40px",
            opacity: 0.55,
          }}
        >
          {bars.map((v, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: Math.max(
                  4,
                  Math.min(1, Math.sqrt(v) * (1.1 + i / 40)) * 240,
                ),
                borderRadius: "6px 6px 0 0",
                background: `linear-gradient(to top, ${c.teal}, ${i % 4 === 0 ? c.accent : c.teal}44)`,
              }}
            />
          ))}
        </div>

        {/* Vinyl slides out from behind the artwork */}
        <div
          style={{
            position: "absolute",
            left: 250 + disc * 250,
            top: 290,
            opacity: Math.min(1, disc * 2),
          }}
        >
          <Vinyl size={500} spin={spin} />
        </div>
        <Shockwave
          t={t}
          x={520}
          y={540}
          size={300}
          spread={6}
          count={3}
          color={c.teal}
        />
        <div
          style={{
            position: "absolute",
            left: 230,
            top: 250,
            transform: `scale(${(1.7 - 0.7 * slam) * (1 + bass * 0.05)}) rotate(${(1 - Math.min(1, slam)) * -10}deg)`,
          }}
        >
          <Art
            index={0}
            size={580}
            spin={t * 0.8}
            style={{
              boxShadow: `0 50px 120px rgba(0,0,0,0.6), 0 0 ${40 + kick * 70}px #83c5b655`,
            }}
          />
        </div>

        {/* Mood tags land on the claps */}
        {[3, 0, 2].map((m, i) => {
          const at = B.claps.filter((x) => x > START)[i]!;
          if (f < at) return null;
          const s = wobble(f, at, 0.8, 0.2);
          const pos = [
            [180, 210],
            [660, 860],
            [140, 760],
          ][i]!;
          const mood = moods[m]!;
          return (
            <div
              key={m}
              style={{
                position: "absolute",
                left: pos[0]! + noise2D("mx" + i, f / 40, 0) * 12,
                top: pos[1]! + noise2D("my" + i, 0, f / 40) * 12,
                transform: `scale(${s}) rotate(${(i - 1) * 6}deg)`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 20px",
                borderRadius: 16,
                background: mood.bg,
                border: `1px solid ${mood.fg}55`,
                color: c.text,
                fontSize: 22,
                fontWeight: 600,
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              <Ion name={mood.icon} size={26} color={mood.fg} />
              {mood.name}
            </div>
          );
        })}

        {/* Right column: the now-playing screen, piece by piece */}
        <div style={{ position: "absolute", left: 1010, top: 170, width: 790 }}>
          <div style={{ opacity: tw(f, START + 2, START + 10) }}>
            <Label size={20}>Playing from your device</Label>
          </div>
          <div
            style={{
              fontSize: 128,
              fontWeight: 800,
              letterSpacing: -6,
              lineHeight: 1.05,
              marginTop: 18,
              whiteSpace: "nowrap",
            }}
          >
            {"Neon Harbor".split("").map((ch, i) => {
              const at = START + 3 + i * 1.3;
              const p = tw(f, at, at + 12, 0, 1, ease.outBack);
              const bounce =
                kick * 18 * Math.max(0, Math.sin(i * 0.9 + f * 0.35));
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    opacity: Math.min(1, p * 2),
                    transform: `translateY(${(1 - p) * 120 - bounce}px) rotate(${(1 - p) * 18}deg)`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <div
            style={{
              fontSize: 36,
              color: c.muted,
              marginTop: 10,
              opacity: tw(f, START + 14, START + 24),
            }}
          >
            The Tidelines · Night Ferry
          </div>

          {/* Seek bar */}
          <div
            style={{ marginTop: 50, opacity: tw(f, START + 16, START + 26) }}
          >
            <div
              style={{
                height: 10,
                borderRadius: 5,
                background: c.border,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${18 + t * 0.32}%`,
                  height: "100%",
                  borderRadius: 5,
                  background: c.accent,
                  boxShadow: `0 0 ${12 + kick * 20}px ${c.accent}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: `${18 + t * 0.32}%`,
                  top: -9,
                  width: 28,
                  height: 28,
                  marginLeft: -14,
                  borderRadius: 14,
                  background: c.accent,
                  transform: `scale(${1 + kick * 0.3})`,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 14,
                fontSize: 22,
                color: c.muted,
              }}
            >
              <span>0:{String(41 + Math.floor(t / 30)).padStart(2, "0")}</span>
              <span>3:48</span>
            </div>
          </div>

          {/* Controls pop in on the stabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 46,
              marginTop: 34,
            }}
          >
            {controls.map((ctl, i) => {
              const at = START + 6 + i * 3;
              const s = wobble(f, at, 0.7, 0.2);
              const on = ctl.icon === "shuffle" && f >= 540;
              return (
                <div
                  key={ctl.icon}
                  style={{
                    width: ctl.big ? 116 : 64,
                    height: ctl.big ? 116 : 64,
                    borderRadius: ctl.big ? 58 : 18,
                    background: ctl.big || on ? c.accent : c.elevated,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${s * (ctl.big ? 1 + kick * 0.1 : 1)})`,
                    boxShadow: ctl.big
                      ? `0 0 ${30 + kick * 60}px #d7f79a77`
                      : undefined,
                  }}
                >
                  <Ion
                    name={ctl.icon}
                    size={ctl.big ? 56 : 32}
                    color={ctl.big || on ? c.bg : c.text}
                  />
                </div>
              );
            })}
          </div>

          {/* Karaoke lyrics: each line fills across its bar */}
          <div style={{ marginTop: 56, height: 70, position: "relative" }}>
            {lyrics.map((l, i) => {
              const fill = tw(f, l.at, l.at + 52, 0, 100, (x) => x);
              const p = tw(f, l.at, l.at + 10, 0, 1, ease.outExpo);
              const gone = i === 0 ? tw(f, 538, 546, 0, 1, ease.inExpo) : 0;
              if (p <= 0 || gone >= 1) return null;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    fontFamily: serif,
                    fontSize: 54,
                    fontStyle: "italic",
                    letterSpacing: -1,
                    whiteSpace: "nowrap",
                    opacity: p * (1 - gone),
                    transform: `translateY(${(1 - p) * 40 - gone * 40}px)`,
                    backgroundImage: `linear-gradient(90deg, ${c.accent} ${fill}%, #5d6a63 ${fill}%)`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {l.text}
                </div>
              );
            })}
          </div>
        </div>

        <Burst t={t} x={520} y={540} count={34} power={60} seed={7} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ background: c.teal, opacity: Math.max(0, 1 - t / 3) * 0.85 }}
      />
    </AbsoluteFill>
  );
}
