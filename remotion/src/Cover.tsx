import { Sequence } from "remotion";
import { Background, Headline, Logo, Row } from "./components/kit";
import { MatchPhone } from "./scenes/Match";
import { c } from "./theme";

/** Cover image: the playlist-import match screen, frozen with every match ticked. */
export function Cover() {
  return (
    <Background>
      <Row
        gap={22}
        style={{
          position: "absolute",
          top: 110,
          width: "100%",
          justifyContent: "center",
        }}
      >
        <Logo size={84} />
        <div style={{ fontSize: 60, fontWeight: 700, letterSpacing: -2.4 }}>
          SoundTrip
        </div>
      </Row>
      <Headline
        parts={[
          { text: "Bring your playlists" },
          { text: "home.", color: c.accent },
        ]}
        top={250}
        size={96}
        start={-60}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: "scale(0.9)",
          transformOrigin: "540px 560px",
        }}
      >
        <Sequence from={-112} layout="none">
          <MatchPhone top={560} />
        </Sequence>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 260,
          background: `linear-gradient(transparent, ${c.bg} 75%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 90,
          width: "100%",
          textAlign: "center",
          fontSize: 38,
          fontWeight: 600,
          color: c.muted,
        }}
      >
        Spotify export <span style={{ color: c.accent }}>→</span> your own files
      </div>
    </Background>
  );
}
