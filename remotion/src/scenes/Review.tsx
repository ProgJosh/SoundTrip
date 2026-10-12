import { useCurrentFrame, useVideoConfig } from "remotion";
import { fade, rise } from "../anim";
import {
  Artwork,
  Background,
  Button,
  Card,
  Checkbox,
  Chips,
  Headline,
  Phone,
  Row,
  Sub,
} from "../components/kit";
import { playlists, totalSongs } from "../data";
import { c } from "../theme";

// New playlists start selected in the app; here the viewer unticks one.
const UNTICK = 2;
const UNTICK_AT = 44;
const IMPORT_AT = 84;

export function Review() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const selected = playlists.length - (frame >= UNTICK_AT ? 1 : 0);
  const done = fade(frame, IMPORT_AT + 8, 10);
  return (
    <Background>
      <Headline
        parts={[
          { text: "Choose what" },
          { text: "comes along.", color: c.accent },
        ]}
        start={2}
        top={150}
      />
      <Phone enter={4}>
        <Card style={{ gap: 14 }}>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
            Review before importing
          </div>
          <Sub>
            {playlists.length} playlists · {totalSongs} songs · 3 podcast or
            unreadable items skipped
          </Sub>
          {playlists.map((p, i) => {
            const e = rise(frame, fps, 8 + i * 5, 16);
            const on = i !== UNTICK || frame < UNTICK_AT;
            return (
              <Row
                key={p.name}
                gap={22}
                style={{
                  minHeight: 104,
                  opacity: e * (on ? 1 : 0.55),
                  transform: `translateX(${(1 - e) * 40}px)`,
                }}
              >
                <Checkbox
                  on={on}
                  changedAt={i === UNTICK ? UNTICK_AT : undefined}
                />
                <Artwork index={i} size={76} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 30, fontWeight: 500 }}>{p.name}</div>
                  <Sub size={24}>{p.songs} songs</Sub>
                </div>
              </Row>
            );
          })}
          <Button primary pressAt={IMPORT_AT}>
            {`Import selected playlists (${selected})`}
          </Button>
        </Card>
        <div
          style={{
            opacity: done,
            transform: `translateY(${(1 - done) * 20}px)`,
          }}
        >
          <Sub color={c.teal} size={27}>
            Imported {selected} playlists. Confirm local files to make them
            playable.
          </Sub>
        </div>
      </Phone>
      <Chips items={["Stays on your device"]} start={92} />
    </Background>
  );
}
