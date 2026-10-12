import { useCurrentFrame, useVideoConfig } from "remotion";
import { fade, pop, rise } from "../anim";
import { Background, Headline, Logo, Row } from "../components/kit";
import { c } from "../theme";

export const SITE = "soundtrip.joshua27emmanuel30.workers.dev";

export function EndCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const brand = rise(frame, fps, 2);
  const url = pop(frame, fps, 34);
  return (
    <Background>
      <Row
        gap={30}
        style={{
          position: "absolute",
          top: 600,
          width: "100%",
          justifyContent: "center",
          opacity: brand,
          transform: `translateY(${(1 - brand) * 30}px)`,
        }}
      >
        <Logo size={150} />
        <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: -4.5 }}>
          SoundTrip
        </div>
      </Row>
      <Headline
        parts={[
          { text: "Your playlists." },
          { text: "Your files.", color: c.accent },
        ]}
        start={12}
        top={830}
        size={72}
      />
      <div
        style={{
          position: "absolute",
          top: 1080,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            transform: `scale(${url})`,
            padding: "26px 44px",
            borderRadius: 60,
            background: c.accent,
            color: c.ink,
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          {SITE}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 120,
          right: 120,
          textAlign: "center",
          color: c.muted,
          fontSize: 24,
          lineHeight: 1.5,
          opacity: fade(frame, 44, 12),
        }}
      >
        Uses Spotify’s account-data export. SoundTrip is independent and not
        endorsed by Spotify. No Spotify audio is downloaded.
      </div>
    </Background>
  );
}
