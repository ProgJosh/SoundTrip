import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, fade, pop } from "../anim";
import {
  Artwork,
  Background,
  Chips,
  Headline,
  Label,
  Phone,
  Row,
  Sub,
} from "../components/kit";
import { Icon, PlayPause } from "../components/Icon";
import { matches, playlists } from "../data";
import { c } from "../theme";

const OFFLINE_AT = 18;
const LENGTH = 228; // 3:48

function time(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function Offline() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pos = interpolate(frame, [0, 150], [41, 46], clamp);
  const pill = pop(frame, fps, OFFLINE_AT + 6);
  const song = matches[0]!;
  return (
    <Background>
      <Headline
        parts={[
          { text: "Then play it." },
          { text: "Offline.", color: c.accent },
        ]}
        start={2}
        top={150}
      />
      <Phone enter={4} offlineAt={OFFLINE_AT}>
        <Row style={{ justifyContent: "space-between" }}>
          <div>
            <Label>Now playing</Label>
            <Sub size={24}>From {playlists[0]!.name} · local playlist</Sub>
          </div>
          <div
            style={{
              transform: `scale(${pill})`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 24,
              background: "rgba(232,174,130,0.14)",
              color: c.orange,
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            <Icon name="plane" size={28} color={c.orange} />
            Offline
          </div>
        </Row>
        <div style={{ alignSelf: "center", marginTop: 10 }}>
          <Artwork index={0} size={560} radius={44} />
        </div>
        <div style={{ marginTop: 8 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <div style={{ fontSize: 48, fontWeight: 600, letterSpacing: -1.5 }}>
              {song.title}
            </div>
            <Equalizer />
          </Row>
          <Sub size={30}>{song.artist}</Sub>
        </div>
        <div>
          <div
            style={{
              height: 10,
              borderRadius: 5,
              background: c.elevated,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(pos / LENGTH) * 100}%`,
                height: "100%",
                background: c.accent,
              }}
            />
          </div>
          <Row style={{ justifyContent: "space-between", marginTop: 12 }}>
            <Sub size={22}>{time(pos)}</Sub>
            <Sub size={22}>{time(LENGTH)}</Sub>
          </Row>
        </div>
        <Row style={{ justifyContent: "space-between", padding: "0 10px" }}>
          <Icon name="shuffle" size={40} color={c.accent} />
          <Icon name="prev" size={44} color={c.text} />
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: 64,
              background: c.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PlayPause playing size={56} color={c.ink} />
          </div>
          <Icon name="next" size={44} color={c.text} />
          <Icon name="repeat" size={40} color={c.muted} />
        </Row>
      </Phone>
      <Chips items={["Plays from your own files"]} start={60} />
    </Background>
  );
}

function Equalizer() {
  const frame = useCurrentFrame();
  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 40 }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            borderRadius: 4,
            background: c.teal,
            height: 10 + 26 * Math.abs(Math.sin(frame / (5 + i) + i * 1.3)),
            opacity: fade(frame, 4, 10),
          }}
        />
      ))}
    </div>
  );
}
