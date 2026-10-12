// SoundTrip's interface rebuilt as components (from src/ui/Shell.tsx,
// LibraryScreen.tsx and app/now-playing.tsx) so each piece can animate.
import { Badge, c, Ion, IonName, moods, sans, serif, SITE } from "./brand";

export const tracks = [
  {
    title: "Neon Harbor",
    artist: "The Tidelines",
    album: "Night Ferry",
    time: "3:48",
    art: 0,
  },
  {
    title: "Slow Static",
    artist: "Mara Vell",
    album: "Low Light",
    time: "4:12",
    art: 1,
  },
  {
    title: "Afterglow",
    artist: "Juno Park",
    album: "Afterglow",
    time: "3:21",
    art: 2,
  },
  {
    title: "Paper Planes Home",
    artist: "Okto",
    album: "Paper Planes",
    time: "2:58",
    art: 3,
  },
  {
    title: "Low Tide Lights",
    artist: "Sela",
    album: "Coastline",
    time: "3:35",
    art: 4,
  },
];

const arts: [string, string, string][] = [
  ["#649b9b", "#243b3e", c.accent],
  ["#bd794f", "#473b3b", c.orange],
  ["#8c809d", "#38333e", "#c9bae9"],
  ["#92936c", "#343934", c.accent],
  ["#83c5b6", "#1f3d37", c.teal],
];

/** Album art in the app's gradient style, with rings and a pulse mark. */
export function Art({
  index,
  size,
  spin = 0,
  style,
}: {
  index: number;
  size: number;
  spin?: number;
  style?: React.CSSProperties;
}) {
  const [a, b, hi] = arts[index % arts.length]!;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 100 ? size * 0.06 + 8 : 10,
        background: `linear-gradient(135deg, ${a}, ${b})`,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
    >
      {[0.95, 0.7, 0.45].map((r, i) => (
        <div
          key={r}
          style={{
            position: "absolute",
            width: size * r,
            height: size * r,
            left: size * (0.62 - r / 2),
            top: size * (0.38 - r / 2),
            borderRadius: "50%",
            border: `${Math.max(1, size * 0.012)}px solid ${hi}`,
            opacity: 0.35 - i * 0.07,
            transform: `rotate(${spin * (i + 1)}deg)`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: size * 0.1,
          bottom: size * 0.08,
          opacity: 0.85,
        }}
      >
        <Ion name="pulse" size={size * 0.22} color={hi} />
      </div>
    </div>
  );
}

export function Label({
  children,
  size = 11,
  color = c.muted,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        color,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: size * 0.16,
        textTransform: "uppercase",
        fontFamily: sans,
      }}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  icon,
  primary,
  compact,
  scale = 1,
  style,
}: {
  children?: React.ReactNode;
  icon?: IonName;
  primary?: boolean;
  compact?: boolean;
  scale?: number;
  style?: React.CSSProperties;
}) {
  const s = scale;
  return (
    <div
      style={{
        minHeight: 44 * s,
        minWidth: 44 * s,
        padding: `0 ${(compact ? 10 : 18) * s}px`,
        borderRadius: 12 * s,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8 * s,
        background: primary ? c.accent : c.elevated,
        color: primary ? c.bg : c.text,
        fontWeight: 600,
        fontSize: 13 * s,
        fontFamily: sans,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {icon && (
        <Ion name={icon} size={20 * s} color={primary ? c.bg : c.text} />
      )}
      {children}
    </div>
  );
}

export function Wordmark({ size }: { size: number }) {
  return (
    <span
      style={{
        fontFamily: sans,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: -size * 0.038,
        color: c.text,
      }}
    >
      soundtrip<span style={{ color: c.accent }}>.</span>
    </span>
  );
}

const nav: { title: string; icon: IonName }[] = [
  { title: "Your library", icon: "albums-outline" },
  { title: "Search", icon: "search-outline" },
  { title: "Playlists", icon: "grid-outline" },
  { title: "Spotify connection", icon: "link-outline" },
];

export function Sidebar() {
  return (
    <div
      style={{
        width: 222,
        height: "100%",
        borderRight: `1px solid ${c.border}`,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 32,
        background: c.bg,
        fontFamily: sans,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Badge size={32} />
        <Wordmark size={21} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Label>Make yourself at home</Label>
        <div style={{ height: 10 }} />
        {nav.map((n, i) => (
          <div
            key={n.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: 10,
              background: i === 0 ? "#d7f79a12" : "transparent",
              color: i === 0 ? c.accent : c.muted,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <Ion name={n.icon} size={20} color={i === 0 ? c.accent : c.muted} />
            {n.title}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Label>Your collections</Label>
        {["Late night drive", "Sunday reset", "Road trip ’24"].map((p) => (
          <div key={p} style={{ color: c.muted, fontSize: 14 }}>
            {p}
          </div>
        ))}
        <div style={{ display: "flex", gap: 12, color: c.teal, fontSize: 14 }}>
          <Ion name="add" size={20} color={c.teal} />
          Create a playlist
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          borderTop: `1px solid ${c.border}`,
          paddingTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ color: c.accent, fontSize: 12 }}>
          ● Made for offline listening
        </div>
        <div style={{ color: c.muted, fontSize: 11, lineHeight: "18px" }}>
          Your files. Your space.
          <br />
          Take the long way home.
        </div>
      </div>
    </div>
  );
}

export function Hero({ width = 780 }: { width?: number }) {
  return (
    <div
      style={{
        width,
        height: 268,
        borderRadius: 22,
        padding: 34,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${c.hero.join(", ")})`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 17,
        fontFamily: sans,
      }}
    >
      <HeroRings />
      <div
        style={{
          color: "#d8e9cb",
          letterSpacing: 2,
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        GOOD MUSIC. NO SIGNAL NEEDED.
      </div>
      <div
        style={{
          fontFamily: serif,
          fontSize: 48,
          lineHeight: "52px",
          color: "#f5f3df",
          letterSpacing: -1.8,
        }}
      >
        Your music.
        <br />
        Your kind of escape.
      </div>
      <div
        style={{
          color: "#cedac5",
          fontSize: 13,
          lineHeight: "20px",
          maxWidth: 330,
        }}
      >
        The songs you carry, wherever you go. Build a little world of your own.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button primary icon="add">
          Import your music
        </Button>
        <span style={{ fontSize: 11, color: "#d5dfcc" }}>From your device</span>
      </div>
    </div>
  );
}

export function HeroRings({ spin = 0 }: { spin?: number }) {
  return (
    <>
      {[
        { s: 300, r: -30, t: -45, w: 1, col: "#c2d4a660", bg: "transparent" },
        { s: 240, r: 0, t: -15, w: 1, col: "#c2d4a660", bg: "transparent" },
        { s: 180, r: 30, t: 15, w: 32, col: "#b8c59b50", bg: "#dce8b324" },
      ].map((o, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: o.s,
            height: o.s,
            right: o.r,
            top: o.t,
            borderRadius: "50%",
            border: `${o.w}px solid ${o.col}`,
            background: o.bg,
            transform: `rotate(${spin * (i + 1)}deg)`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          width: 450,
          height: 90,
          right: -70,
          bottom: -30,
          borderRadius: 120,
          background: "#122b24a0",
          transform: "rotate(-15deg)",
        }}
      />
    </>
  );
}

export function MoodTile({
  index,
  width = 140,
  active,
}: {
  index: number;
  width?: number;
  active?: boolean;
}) {
  const m = moods[index]!;
  return (
    <div
      style={{
        width,
        minHeight: 114,
        borderRadius: 14,
        padding: 18,
        background: m.bg,
        border: `1px solid ${active ? c.accent : "transparent"}`,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 15,
        fontFamily: sans,
        flexShrink: 0,
      }}
    >
      <Ion name={m.icon} size={26} color={m.fg} />
      <div style={{ color: c.text, fontSize: 12, fontWeight: 500 }}>
        {m.name}
      </div>
      <div style={{ position: "absolute", right: 13, bottom: 14 }}>
        <Ion name="shuffle" size={15} color={c.muted} />
      </div>
    </div>
  );
}

export function TrackRow({
  index,
  width = 780,
  playing,
}: {
  index: number;
  width?: number;
  playing?: boolean;
}) {
  const t = tracks[index % tracks.length]!;
  return (
    <div
      style={{
        width,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px",
        borderBottom: `1px solid ${c.border}`,
        fontFamily: sans,
        background: playing ? "#d7f79a10" : "transparent",
        borderRadius: playing ? 10 : 0,
      }}
    >
      <div
        style={{ width: 22, color: playing ? c.accent : c.muted, fontSize: 12 }}
      >
        {playing ? <Ion name="play" size={14} color={c.accent} /> : index + 1}
      </div>
      <Art index={t.art} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: playing ? c.accent : c.text,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {t.title}
        </div>
        <div style={{ color: c.muted, fontSize: 12, marginTop: 4 }}>
          {t.artist}
        </div>
      </div>
      <div style={{ width: 150, color: c.muted, fontSize: 12 }}>{t.album}</div>
      <div style={{ width: 80, color: c.teal, fontSize: 12 }}>● On device</div>
      <div style={{ width: 40, color: c.muted, fontSize: 12 }}>{t.time}</div>
    </div>
  );
}

export function MiniPlayer({
  progress = 0.3,
  playing = true,
  track = 0,
}: {
  progress?: number;
  playing?: boolean;
  track?: number;
}) {
  const t = tracks[track]!;
  return (
    <div
      style={{
        height: 76,
        borderTop: `1px solid ${c.border}`,
        background: c.mini,
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: sans,
      }}
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
        <Art index={t.art} size={48} />
        <div>
          <div style={{ color: c.text, fontWeight: 600, fontSize: 13 }}>
            {t.title}
          </div>
          <div style={{ color: c.muted, fontSize: 11, marginTop: 5 }}>
            {t.artist}
          </div>
        </div>
      </div>
      <div
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Ion name="shuffle" size={20} color={c.text} />
          <Ion name="play-skip-back" size={20} color={c.text} />
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: c.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ion name={playing ? "pause" : "play"} size={20} color={c.bg} />
          </div>
          <Ion name="play-skip-forward" size={20} color={c.text} />
          <Ion name="repeat" size={20} color={c.text} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
          }}
        >
          <span style={{ color: c.muted, fontSize: 10 }}>
            1:{String(Math.floor(progress * 60)).padStart(2, "0")}
          </span>
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: c.border,
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                borderRadius: 2,
                background: c.accent,
              }}
            />
          </div>
          <span style={{ color: c.muted, fontSize: 10 }}>{t.time}</span>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "flex-end",
          gap: 16,
        }}
      >
        <Ion name="text-outline" size={20} color={c.text} />
        <Ion name="list-outline" size={20} color={c.text} />
        <div
          style={{
            width: 80,
            height: 4,
            borderRadius: 2,
            background: c.teal,
            alignSelf: "center",
          }}
        />
      </div>
    </div>
  );
}

/** Browser window chrome with the live site's address. */
export function BrowserFrame({
  width,
  height,
  url = SITE,
  children,
}: {
  width: number;
  height: number;
  url?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 18,
        background: c.bg,
        border: `1px solid #3a4240`,
        overflow: "hidden",
        boxShadow: "0 60px 140px rgba(0,0,0,0.55)",
        display: "flex",
        flexDirection: "column",
        fontFamily: sans,
      }}
    >
      <div
        style={{
          height: 46,
          background: "#151918",
          borderBottom: `1px solid ${c.border}`,
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "0 18px",
          flexShrink: 0,
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
            flex: 1,
            maxWidth: 520,
            height: 28,
            borderRadius: 14,
            background: c.bg,
            border: `1px solid ${c.border}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 14px",
            color: c.muted,
            fontSize: 13,
          }}
        >
          <Ion name="lock-closed-outline" size={13} color={c.muted} />
          {url}
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

export function PhoneFrame({
  width,
  children,
}: {
  width: number;
  children: React.ReactNode;
}) {
  const h = width * 2.05;
  return (
    <div
      style={{
        width,
        height: h,
        borderRadius: width * 0.15,
        background: "#0a0c0c",
        border: "2px solid #3a4240",
        padding: width * 0.035,
        boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: width * 0.12,
          background: c.bg,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: width * 0.04,
            left: "50%",
            width: width * 0.3,
            height: width * 0.085,
            marginLeft: -width * 0.15,
            borderRadius: width * 0.05,
            background: "#000",
            zIndex: 2,
          }}
        />
        {children}
      </div>
    </div>
  );
}
