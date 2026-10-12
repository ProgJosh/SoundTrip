import { evolvePath } from "@remotion/paths";
import { AbsoluteFill } from "remotion";
import { c, Ion, mono, sans } from "../brand";
import { Glow, MotionBlur, Shockwave } from "../fx";
import { B, ease, hit, tw, wobble } from "../motion";
import { Art } from "../ui";

const START = 360;
const CLAP = 390;
const CONFIRM = 450;

// The shape of Spotify's account-data export (Playlist*.json).
const json: [string, string][] = [
  ["p", "{"],
  ["k", '  "playlists": [{'],
  ["kv", '    "name": |"Late night drive",'],
  ["k", '    "items": ['],
  ["k", '      { "track": {'],
  ["kv", '        "trackName": |"Neon Harbor",'],
  ["kv", '        "artistName": |"The Tidelines",'],
  ["kv", '        "albumName": |"Night Ferry" } },'],
  ["k", '      { "track": {'],
  ["kv", '        "trackName": |"Slow Static",'],
  ["kv", '        "artistName": |"Mara Vell" } },'],
  ["p", "      …"],
];

const songs = [
  {
    title: "Neon Harbor",
    artist: "The Tidelines",
    file: "The Tidelines - Neon Harbor.flac",
    exact: true,
    art: 0,
  },
  {
    title: "Slow Static",
    artist: "Mara Vell",
    file: "Slow Static.mp3",
    exact: true,
    art: 1,
  },
  {
    title: "Afterglow - Remastered",
    artist: "Juno Park",
    file: "Juno Park - Afterglow.wav",
    exact: false,
    art: 2,
  },
];
const CARD_X = 830;
const FILE_X = 1400;
const rowY = (i: number) => 400 + i * 160;

function JsonLine({
  kind,
  text,
  shown,
}: {
  kind: string;
  text: string;
  shown: number;
}) {
  const visible = text.replace("|", "").slice(0, shown);
  if (kind !== "kv")
    return (
      <span style={{ color: kind === "p" ? c.muted : c.teal }}>{visible}</span>
    );
  const split = text.indexOf("|");
  const key = visible.slice(0, split);
  const value = visible.slice(split);
  return (
    <>
      <span style={{ color: c.teal }}>{key}</span>
      <span style={{ color: c.accent }}>{value}</span>
    </>
  );
}

export function Match({ f }: { f: number }) {
  const enter = tw(f, START, START + 8, 0, 1, ease.outExpo);
  const clap = hit(B.claps, f, 6);
  const push = tw(f, 452, 479, 0, 1, ease.inExpo);
  const roll = hit(
    B.roll.filter((r) => r > 460 && r < 480),
    f,
    2,
  );
  const chars = Math.floor(tw(f, START + 2, CLAP - 2, 0, 1, (x) => x) * 330);
  let budget = chars;

  return (
    <AbsoluteFill
      style={{
        background: c.deep,
        color: c.text,
        fontFamily: sans,
        overflow: "hidden",
      }}
    >
      <MotionBlur amount={(1 - enter) * 40}>
        <AbsoluteFill
          style={{
            transform: `translateX(${(1 - enter) * 700}px) scale(${1 + push * 2.4})`,
            transformOrigin: `${CARD_X + 200}px ${rowY(0) + 60}px`,
          }}
        >
          <Glow x={960} y={600} size={1700} color="#24423a" opacity={0.7} />
          <Glow
            x={960}
            y={600}
            size={900}
            color={c.teal}
            opacity={0.06 + clap * 0.2}
          />

          <div style={{ position: "absolute", left: 130, top: 96 }}>
            <div
              style={{
                fontFamily: mono,
                color: c.muted,
                fontSize: 20,
                letterSpacing: 3,
              }}
            >
              SPOTIFY ACCOUNT-DATA EXPORT → YOUR FILES
            </div>
            <div
              style={{
                fontSize: 112,
                fontWeight: 900,
                letterSpacing: -5,
                lineHeight: 1.02,
                marginTop: 14,
              }}
            >
              {["Bring", "your", "playlists."].map((w, i) => {
                const p = tw(
                  f,
                  START + 4 + i * 4,
                  START + 16 + i * 4,
                  0,
                  1,
                  ease.outExpo,
                );
                return (
                  <span
                    key={w}
                    style={{
                      display: "inline-block",
                      marginRight: 28,
                      opacity: p,
                      transform: `translateY(${(1 - p) * 60}px)`,
                      color: i === 2 ? c.accent : c.text,
                    }}
                  >
                    {w}
                  </span>
                );
              })}
            </div>
          </div>

          {/* The export file, typing itself out */}
          <div
            style={{
              position: "absolute",
              left: 130,
              top: 330,
              width: 620,
              height: 600,
              borderRadius: 22,
              background: "#0e1211",
              border: `1px solid ${c.border}`,
              boxShadow: `0 40px 100px rgba(0,0,0,0.5)`,
              overflow: "hidden",
              opacity: 1 - push,
              transform: `scale(${1 - clap * 0.03})`,
            }}
          >
            <div
              style={{
                height: 54,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 22px",
                borderBottom: `1px solid ${c.border}`,
                color: c.text,
                fontSize: 19,
                fontWeight: 600,
              }}
            >
              <Ion name="document-text-outline" size={24} color={c.accent} />
              Playlist1.json
              <span
                style={{
                  marginLeft: "auto",
                  color: c.muted,
                  fontSize: 15,
                  fontFamily: mono,
                }}
              >
                412 KB
              </span>
            </div>
            <div
              style={{
                padding: "18px 22px",
                fontFamily: mono,
                fontSize: 19,
                lineHeight: "38px",
                whiteSpace: "pre",
              }}
            >
              {json.map(([kind, text], i) => {
                const len = text.replace("|", "").length;
                const shown = Math.max(0, Math.min(len, budget));
                budget -= len;
                // Song lines glow when their card pops out on the clap.
                const lit =
                  f >= CLAP && (i === 5 || i === 9) ? hit([CLAP], f, 10) : 0;
                return (
                  <div
                    key={i}
                    style={{
                      background: `rgba(215,247,154,${lit * 0.25})`,
                      borderRadius: 6,
                    }}
                  >
                    <JsonLine kind={kind} text={text} shown={shown} />
                    {shown < len && shown > 0 && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 11,
                          height: 22,
                          background: c.accent,
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Song references spring out of the export */}
          {songs.map((s, i) => {
            const at = CLAP + i * 3;
            if (f < at) return null;
            const p = wobble(f, at, 0.5, 0.17);
            const fly = tw(f, at, at + 12, 0, 1, ease.outExpo);
            const confirmed = f >= CONFIRM;
            return (
              <div
                key={s.title}
                style={{
                  position: "absolute",
                  left: 400 + (CARD_X - 400) * fly,
                  top: 560 + (rowY(i) - 560) * fly,
                  width: 420,
                  height: 120,
                  borderRadius: 20,
                  background: c.panel,
                  border: `2px solid ${confirmed ? c.accent : c.border}`,
                  boxShadow: `0 30px 70px rgba(0,0,0,0.5)${i === 0 ? `, 0 0 ${roll * 50}px ${c.accent}` : ""}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "0 20px",
                  transform: `perspective(900px) rotateY(${(1 - Math.min(1, p)) * 70}deg) scale(${0.7 + 0.3 * p})`,
                  opacity: i === 0 ? 1 : 1 - push,
                }}
              >
                <Art index={s.art} size={80} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 600,
                      color: c.text,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.title}
                  </div>
                  <div style={{ fontSize: 20, color: c.muted, marginTop: 4 }}>
                    {s.artist}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Your local files */}
          {songs.map((s, i) => {
            const at = CLAP + 6 + i * 3;
            const p = tw(f, at, at + 12, 0, 1, ease.outBack);
            if (p <= 0) return null;
            return (
              <div
                key={s.file}
                style={{
                  position: "absolute",
                  left: FILE_X + (1 - p) * 300,
                  top: rowY(i) + 34,
                  opacity: Math.min(1, p) * (1 - push),
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 20px",
                  borderRadius: 14,
                  background: c.elevated,
                  border: `1px solid ${c.border}`,
                  fontFamily: mono,
                  fontSize: 19,
                  color: c.text,
                  whiteSpace: "nowrap",
                }}
              >
                <Ion name="musical-note" size={22} color={c.teal} />
                {s.file}
              </div>
            );
          })}

          {/* Connectors drawn on each beat, ending in a match badge */}
          <svg
            width={1920}
            height={1080}
            style={{ position: "absolute", inset: 0, opacity: 1 - push }}
          >
            {songs.map((s, i) => {
              const at = 405 + i * 15;
              const p = tw(f, at, at + 11, 0, 1, ease.inOutCubic);
              if (p <= 0) return null;
              const y = rowY(i) + 60;
              const d = `M ${CARD_X + 420} ${y} C ${CARD_X + 520} ${y}, ${FILE_X - 110} ${y}, ${FILE_X} ${y}`;
              const ev = evolvePath(p, d);
              const x = CARD_X + 420 + (FILE_X - CARD_X - 420) * p;
              return (
                <g key={i}>
                  <path
                    d={d}
                    fill="none"
                    stroke={s.exact ? c.teal : c.orange}
                    strokeWidth={4}
                    strokeDasharray={ev.strokeDasharray}
                    strokeDashoffset={ev.strokeDashoffset}
                  />
                  {p < 1 && <circle cx={x} cy={y} r={9} fill={c.accent} />}
                </g>
              );
            })}
          </svg>
          {songs.map((s, i) => {
            const at = 405 + i * 15 + 11;
            if (f < at) return null;
            const p = wobble(f, at, 0.8, 0.2);
            return (
              <div
                key={`b${i}`}
                style={{
                  position: "absolute",
                  left: (CARD_X + 420 + FILE_X) / 2,
                  top: rowY(i) + 60,
                  transform: `translate(-50%, -150%) scale(${p})`,
                  padding: "6px 14px",
                  borderRadius: 12,
                  fontSize: 17,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  color: s.exact ? c.teal : c.orange,
                  background: s.exact
                    ? "rgba(131,197,182,0.16)"
                    : "rgba(232,174,130,0.16)",
                  opacity: 1 - push,
                }}
              >
                {s.exact ? "Same title and artist" : "Close match"}
              </div>
            );
          })}

          {/* Confirm on the second clap */}
          {f >= CONFIRM && (
            <>
              <Shockwave
                t={f - CONFIRM}
                x={1290}
                y={930}
                size={200}
                spread={4}
                count={2}
              />
              <div
                style={{
                  position: "absolute",
                  left: 1290,
                  top: 930,
                  transform: `translate(-50%, -50%) scale(${wobble(f, CONFIRM, 0.6, 0.18)})`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "18px 30px",
                  borderRadius: 40,
                  background: c.accent,
                  color: c.bg,
                  fontSize: 30,
                  fontWeight: 800,
                  opacity: 1 - push,
                }}
              >
                <Ion name="checkmark-circle" size={34} color={c.bg} />
                Confirmed 58 files
              </div>
            </>
          )}

          <div
            style={{
              position: "absolute",
              left: 130,
              bottom: 40,
              fontSize: 15,
              color: "#6f7b75",
              opacity: 1 - push,
            }}
          >
            Spotify is a trademark of Spotify AB. SoundTrip is independent and
            not endorsed by Spotify. No Spotify audio is used.
          </div>
        </AbsoluteFill>
      </MotionBlur>
      <AbsoluteFill
        style={{
          background: c.accent,
          opacity: tw(f, 474, 479, 0, 0.9, ease.inExpo),
        }}
      />
    </AbsoluteFill>
  );
}
