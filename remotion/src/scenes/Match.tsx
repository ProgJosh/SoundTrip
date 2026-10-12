import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, count, fade, rise } from "../anim";
import {
  Background,
  Button,
  Checkbox,
  Chips,
  Headline,
  Phone,
  Row,
  Sub,
} from "../components/kit";
import { matched, matches, playlists } from "../data";
import { c } from "../theme";

const FIND_AT = 16;
const CLOSE_AT = 92;
const CONFIRM_AT = 118;
const songs = playlists[0]!.songs;

/** The phone half of the scene, reused by the cover still. */
export function MatchPhone({ top }: { top?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const review = rise(frame, fps, FIND_AT + 8, 18);
  const after = interpolate(
    frame,
    [CONFIRM_AT + 6, CONFIRM_AT + 18],
    [0, 1],
    clamp,
  );
  const confirmed = count(frame, CONFIRM_AT + 8, 24, 0, matched);
  const selected = matched - 1 + (frame >= CLOSE_AT ? 1 : 0);
  return (
    <Phone enter={2} top={top}>
      <div style={{ fontSize: 46, fontWeight: 600, letterSpacing: -1.5 }}>
        {playlists[0]!.name}
      </div>
      <Sub>
        Account-data export · {songs} songs ·{" "}
        <span style={{ color: confirmed ? c.teal : c.muted }}>
          {confirmed} confirmed files
        </span>
      </Sub>
      <Button icon="search" primary={frame < CONFIRM_AT} pressAt={FIND_AT}>
        Find matching files for all songs
      </Button>
      <div style={{ position: "relative", flex: 1 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: review * (1 - after),
            transform: `translateY(${(1 - review) * 40}px)`,
            border: `2px solid ${c.border}`,
            background: c.panel,
            borderRadius: 26,
            padding: 26,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 33, fontWeight: 600 }}>
            Review proposed matches
          </div>
          <Sub size={23}>
            Same title and artist matches are selected. Check close matches
            before selecting them.
          </Sub>
          {matches.map((m, i) => {
            const e = rise(frame, fps, FIND_AT + 16 + i * 6, 16);
            const on = m.exact || frame >= CLOSE_AT;
            return (
              <Row
                key={m.title}
                gap={20}
                style={{
                  minHeight: 108,
                  opacity: e,
                  transform: `translateX(${(1 - e) * 40}px)`,
                }}
              >
                <Checkbox on={on} changedAt={m.exact ? undefined : CLOSE_AT} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 27,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.title} · {m.artist}
                  </div>
                  <Row gap={10}>
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        padding: "4px 12px",
                        borderRadius: 12,
                        color: m.exact ? c.teal : c.orange,
                        background: m.exact
                          ? "rgba(131,197,182,0.14)"
                          : "rgba(232,174,130,0.14)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.exact ? "Same title and artist" : "Close match"}
                    </span>
                    <span
                      style={{
                        fontSize: 21,
                        color: c.muted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {m.file}
                    </span>
                  </Row>
                </div>
              </Row>
            );
          })}
          <Button primary icon="link" pressAt={CONFIRM_AT}>
            {`Confirm selected matches (${selected})`}
          </Button>
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: after,
            transform: `translateY(${(1 - after) * 30}px)`,
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <Sub color={c.teal} size={28}>
            Confirmed {matched} files. {songs - matched} songs still need a
            local file.
          </Sub>
          <Button primary>Create local playlist</Button>
          <Button icon="shuffle">Shuffle confirmed files</Button>
        </div>
      </div>
    </Phone>
  );
}

export function Match() {
  const frame = useCurrentFrame();
  const caption = fade(frame, CONFIRM_AT + 14, 10);
  return (
    <Background>
      <Headline
        parts={[
          { text: "Match the files" },
          { text: "you own.", color: c.accent },
        ]}
        start={2}
        top={150}
      />
      <MatchPhone />
      <div style={{ opacity: caption }}>
        <Chips items={["Nothing links until you confirm"]} start={0} />
      </div>
    </Background>
  );
}
