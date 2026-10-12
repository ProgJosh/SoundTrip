import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, rise } from "../anim";
import {
  Background,
  Button,
  Card,
  Checkbox,
  Chips,
  Headline,
  Label,
  Phone,
  Row,
  Sub,
} from "../components/kit";
import { Icon } from "../components/Icon";
import { c } from "../theme";

const files = [
  { name: "Playlist1.json", size: "412 KB", pick: 58 },
  { name: "Playlist2.json", size: "188 KB", pick: 68 },
  { name: "Userdata.json", size: "2 KB" },
  { name: "StreamingHistory0.json", size: "1.2 MB" },
];

export function ChooseExport() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = rise(frame, fps, 42, 18);
  const close = interpolate(frame, [96, 108], [0, 1], clamp);
  const sheet = open * (1 - close);
  const reading = frame >= 100;
  const picked = files.filter((f) => f.pick && frame >= f.pick).length;
  return (
    <Background>
      <Headline
        parts={[
          { text: "Start with your" },
          { text: "Spotify export.", color: c.accent },
        ]}
        start={2}
        top={150}
      />
      <Phone enter={6}>
        <Label>Your playlists, on your terms</Label>
        <div
          style={{
            fontSize: 50,
            fontWeight: 600,
            letterSpacing: -2,
            lineHeight: 1.1,
          }}
        >
          Bring your playlist memories.
        </div>
        <Sub>
          Import Spotify’s official playlist export. No Premium, Spotify login
          or internet connection is needed to import a downloaded file.
        </Sub>
        <Card>
          <div style={{ fontSize: 31, fontWeight: 600 }}>
            Start with your Spotify account data
          </div>
          <Sub>
            Extract the ZIP and choose the Playlist*.json files. You can select
            several parts together.
          </Sub>
          <Button primary icon="file" pressAt={34}>
            {reading ? "Reading export…" : "Choose playlist JSON"}
          </Button>
          <Button icon="open">Get Spotify account data · online</Button>
        </Card>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 640,
            transform: `translateY(${(1 - sheet) * 680}px)`,
            background: c.elevated,
            borderTop: `2px solid ${c.border}`,
            borderRadius: "44px 44px 0 0",
            padding: "26px 44px 44px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            boxShadow: "0 -30px 80px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              alignSelf: "center",
              width: 90,
              height: 8,
              borderRadius: 4,
              background: c.border,
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 600 }}>Choose files</div>
          <Sub size={23}>my_spotify_data › Spotify Account Data</Sub>
          {files.map((f) => (
            <Row key={f.name} gap={20} style={{ minHeight: 66 }}>
              <Checkbox on={!!f.pick && frame >= f.pick} changedAt={f.pick} />
              <Icon name="file" size={34} color={c.muted} />
              <div style={{ flex: 1, fontSize: 27 }}>{f.name}</div>
              <Sub size={23}>{f.size}</Sub>
            </Row>
          ))}
          <Button primary pressAt={86} style={{ marginTop: 6 }}>
            {`Open (${picked})`}
          </Button>
        </div>
      </Phone>
      <Chips
        items={["No Premium", "No Spotify login", "No internet"]}
        start={108}
      />
    </Background>
  );
}
