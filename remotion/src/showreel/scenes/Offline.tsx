import {
  evolvePath,
  getPointAtLength,
  getLength,
  getTangentAtLength,
} from "@remotion/paths";
import { noise2D } from "@remotion/noise";
import { AbsoluteFill } from "remotion";
import { c, Ion, IonName, sans } from "../brand";
import { Burst, Glow, MotionBlur } from "../fx";
import { B, ease, hit, tw, wobble } from "../motion";
import {
  Art,
  BrowserFrame,
  Hero,
  MiniPlayer,
  MoodTile,
  PhoneFrame,
} from "../ui";

const START = 600;
const SLASH = 615;
const DEVICES = 660;
const FLIGHT = "M -200 820 C 300 620, 600 980, 960 760 S 1600 380, 2150 470";
const flightLen = getLength(FLIGHT);

function DeviceLabel({
  f,
  at,
  icons,
  text,
}: {
  f: number;
  at: number;
  icons: IonName[];
  text: string;
}) {
  if (f < at) return null;
  const s = wobble(f, at, 0.7, 0.2);
  return (
    <div
      style={{
        marginTop: 26,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontSize: 30,
        fontWeight: 700,
        color: c.text,
        transform: `scale(${s})`,
      }}
    >
      {icons.map((i) => (
        <Ion key={i} name={i} size={32} color={c.accent} />
      ))}
      {text}
    </div>
  );
}

export function Offline({ f }: { f: number }) {
  const kick = hit(B.kicks, f, 4);
  const pop = wobble(f, START - 3, 0.5, 0.15);
  const slash = tw(f, SLASH, SLASH + 6, 0, 1, ease.outExpo);
  const shake = hit([SLASH], f, 4) * 18;
  const fly = tw(f, 617, 646, 0, 1, ease.inOutCubic);
  const away = tw(f, DEVICES - 4, DEVICES + 4, 0, 1, ease.inExpo);
  const exit = tw(f, 713, 720, 0, 1, ease.inExpo);

  const point = getPointAtLength(FLIGHT, fly * flightLen) ?? { x: 0, y: 0 };
  const tan = getTangentAtLength(
    FLIGHT,
    Math.min(flightLen - 1, fly * flightLen),
  ) ?? { x: 1, y: 0 };
  const trail = evolvePath(fly, FLIGHT);

  return (
    <AbsoluteFill
      style={{
        background: c.deep,
        color: c.text,
        fontFamily: sans,
        overflow: "hidden",
      }}
    >
      <Glow x={960} y={460} size={1500} color="#2b3f37" opacity={0.8} />
      <Glow
        x={960}
        y={460}
        size={700}
        color={c.orange}
        opacity={hit([SLASH], f, 10) * 0.35}
      />

      {/* Part 1: the signal goes, the music stays */}
      <MotionBlur amount={away * 40} vertical>
        <AbsoluteFill
          style={{
            transform: `translateY(${-away * 900}px)`,
            opacity: 1 - away,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 960 - 190,
              top: 120,
              width: 380,
              height: 380,
              transform: `scale(${pop}) translateX(${Math.sin(f * 2.3) * shake}px)`,
            }}
          >
            <Ion
              name="wifi"
              size={380}
              color={f >= SLASH ? "#58635e" : c.text}
            />
            <svg
              width={380}
              height={380}
              style={{ position: "absolute", inset: 0, overflow: "visible" }}
            >
              {(() => {
                const d = "M 40 40 L 340 340";
                const ev = evolvePath(slash, d);
                return (
                  <path
                    d={d}
                    stroke={c.orange}
                    strokeWidth={26}
                    strokeLinecap="round"
                    strokeDasharray={ev.strokeDasharray}
                    strokeDashoffset={ev.strokeDashoffset}
                    style={{ filter: `drop-shadow(0 0 18px ${c.orange})` }}
                  />
                );
              })()}
            </svg>
          </div>
          <Burst t={f - SLASH} x={960} y={310} count={22} power={34} seed={3} />

          <div
            style={{
              position: "absolute",
              top: 540,
              width: "100%",
              textAlign: "center",
              fontSize: 140,
              fontWeight: 900,
              letterSpacing: -6,
              lineHeight: 1.05,
            }}
          >
            {[
              { w: "No signal.", at: SLASH + 2, col: c.text },
              { w: "Still playing.", at: 645, col: c.accent },
            ].map(({ w, at, col }) => {
              const p = tw(f, at, at + 9, 0, 1, ease.outExpo);
              const punch = hit([at], f, 5);
              return (
                <div key={w} style={{ overflow: "hidden", height: 150 }}>
                  <div
                    style={{
                      color: col,
                      transform: `translateY(${(1 - p) * 100}%) scale(${1 + punch * 0.05})`,
                    }}
                  >
                    {w}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Flight path */}
          <svg
            width={1920}
            height={1080}
            style={{ position: "absolute", inset: 0 }}
          >
            <path
              d={FLIGHT}
              fill="none"
              stroke={c.accent}
              strokeWidth={4}
              strokeDasharray={trail.strokeDasharray}
              strokeDashoffset={trail.strokeDashoffset}
              opacity={0.6 * (1 - tw(f, 646, 656))}
              strokeLinecap="round"
            />
          </svg>
          {fly > 0 && fly < 1 && (
            <div
              style={{
                position: "absolute",
                left: point.x - 75,
                top: point.y - 75,
                filter: `drop-shadow(0 0 24px ${c.accent})`,
                transform: `rotate(${(Math.atan2(tan.y, tan.x) * 180) / Math.PI + 45}deg)`,
              }}
            >
              <MotionBlur amount={10}>
                <Ion name="airplane" size={150} color={c.accent} />
              </MotionBlur>
            </div>
          )}
        </AbsoluteFill>
      </MotionBlur>

      {/* Part 2: every screen */}
      {f >= DEVICES - 2 && (
        <AbsoluteFill
          style={{
            transform: `translateY(${exit * -200}px)`,
            opacity: 1 - exit,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 70,
              width: "100%",
              textAlign: "center",
              fontSize: 96,
              fontWeight: 900,
              letterSpacing: -4,
            }}
          >
            {["On", "every", "screen."].map((w, i) => {
              const at = DEVICES + 2 + i * 4;
              const p = tw(f, at, at + 10, 0, 1, ease.outExpo);
              return (
                <span
                  key={w}
                  style={{
                    display: "inline-block",
                    marginRight: 26,
                    opacity: p,
                    transform: `translateY(${(1 - p) * 70}px)`,
                    color: i === 2 ? c.accent : c.text,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>

          {[
            {
              at: DEVICES,
              x: 250,
              y: 250,
              label: (
                <DeviceLabel
                  f={f}
                  at={675}
                  icons={["logo-apple", "logo-android"]}
                  text="iOS · Android"
                />
              ),
              body: (
                <PhoneFrame width={300}>
                  <div
                    style={{
                      padding: "52px 22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    <Art index={0} size={256} spin={f} />
                    <div
                      style={{ color: c.text, fontSize: 26, fontWeight: 700 }}
                    >
                      Neon Harbor
                    </div>
                    <div style={{ color: c.muted, fontSize: 17 }}>
                      The Tidelines
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: c.border,
                      }}
                    >
                      <div
                        style={{
                          width: `${40 + (f - DEVICES) * 0.4}%`,
                          height: "100%",
                          borderRadius: 3,
                          background: c.accent,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-around",
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <Ion name="play-skip-back" size={28} color={c.text} />
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          background: c.accent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ion name="pause" size={30} color={c.bg} />
                      </div>
                      <Ion name="play-skip-forward" size={28} color={c.text} />
                    </div>
                  </div>
                </PhoneFrame>
              ),
            },
            {
              at: 675,
              x: 640,
              y: 300,
              label: (
                <DeviceLabel
                  f={f}
                  at={690}
                  icons={["globe-outline"]}
                  text="Web"
                />
              ),
              body: (
                <BrowserFrame width={720} height={470}>
                  <div
                    style={{
                      transform: "scale(0.62)",
                      transformOrigin: "0 0",
                      width: 1160,
                      padding: 30,
                    }}
                  >
                    <Hero width={1100} />
                    <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <MoodTile key={i} index={i} width={208} />
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      transform: "scale(0.62)",
                      transformOrigin: "0 100%",
                      width: 1160,
                    }}
                  >
                    <MiniPlayer progress={0.4} />
                  </div>
                </BrowserFrame>
              ),
            },
            {
              at: 690,
              x: 1420,
              y: 260,
              label: (
                <DeviceLabel
                  f={f}
                  at={705}
                  icons={["tablet-portrait-outline"]}
                  text="Tablet"
                />
              ),
              body: (
                <div
                  style={{
                    width: 300,
                    height: 400,
                    borderRadius: 34,
                    background: "#0a0c0c",
                    border: "2px solid #3a4240",
                    padding: 14,
                    boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 22,
                      background: c.bg,
                      padding: 18,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    {[0, 1, 2, 3, 4, 0].map((a, i) => (
                      <Art
                        key={i}
                        index={a}
                        size={114}
                        spin={f * (i % 2 ? 1 : -1)}
                      />
                    ))}
                  </div>
                </div>
              ),
            },
          ].map((d, i) => {
            const p = tw(f, d.at, d.at + 13, 0, 1, ease.outExpo);
            const s = wobble(f, d.at, 0.5, 0.16);
            if (p <= 0) return null;
            const bob = noise2D("d" + i, f / 50, 0) * 10 - kick * 6;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: d.x,
                  top: d.y + (1 - p) * 500 + bob,
                  transform: `perspective(1400px) rotateX(${(1 - p) * 35}deg) scale(${0.8 + 0.2 * s})`,
                  opacity: Math.min(1, p * 1.5),
                }}
              >
                {d.body}
                {d.label}
              </div>
            );
          })}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
