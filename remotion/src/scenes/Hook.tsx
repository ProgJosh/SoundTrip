import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, rise } from "../anim";
import { Artwork, Background, Headline } from "../components/kit";
import { playlists } from "../data";
import { c } from "../theme";

const tilt = [-3, 2, -1.5, 2.5, -2];
const shift = [-34, 40, -18, 30, -42];

export function Hook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dim = interpolate(frame, [62, 82], [0, 1], clamp);
  return (
    <Background>
      <Headline parts={[{ text: "Years of playlists." }]} start={4} top={250} />
      <Headline
        parts={[{ text: "Stuck in" }, { text: "one app.", color: c.orange }]}
        start={58}
        top={350}
      />
      {playlists.map((p, i) => {
        const e = rise(frame, fps, 12 + i * 7, 24);
        return (
          <div
            key={p.name}
            style={{
              position: "absolute",
              left: 160 + shift[i]!,
              top: 640 + i * 200,
              width: 760,
              height: 168,
              opacity: e * (1 - dim * 0.5),
              filter: `grayscale(${dim})`,
              transform: `translateY(${(1 - e) * 280}px) rotate(${tilt[i]! * e}deg) scale(${1 - dim * 0.04})`,
              background: c.panel,
              border: `2px solid ${c.border}`,
              borderRadius: 34,
              boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              gap: 30,
              padding: "0 30px",
            }}
          >
            <Artwork index={i} size={112} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 40, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 28, color: c.muted }}>
                {p.songs} songs
              </div>
            </div>
          </div>
        );
      })}
    </Background>
  );
}
