import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, pop, rise } from "../anim";
import { Background, Headline, Logo } from "../components/kit";
import { c } from "../theme";

export function Reveal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badge = pop(frame, fps, 2);
  const word = rise(frame, fps, 14);
  return (
    <Background>
      {[0, 1, 2].map((i) => {
        const t = interpolate(frame, [6 + i * 10, 60 + i * 10], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 540 - 150,
              top: 640 - 150,
              width: 300,
              height: 300,
              borderRadius: "50%",
              border: `3px solid ${c.accent}`,
              opacity: (1 - t) * 0.5,
              transform: `scale(${1 + t * 1.6})`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 540 - 130,
          top: 640 - 130,
          transform: `scale(${0.6 + 0.4 * badge})`,
          opacity: Math.min(1, badge * 1.5),
        }}
      >
        <Logo size={260} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 820,
          width: "100%",
          textAlign: "center",
          fontSize: 132,
          fontWeight: 700,
          letterSpacing: -5,
          opacity: word,
          transform: `translateY(${(1 - word) * 30}px)`,
        }}
      >
        SoundTrip
      </div>
      <Headline
        parts={[
          { text: "Bring your playlist" },
          { text: "memories.", color: c.accent },
        ]}
        start={28}
        top={1010}
        size={60}
      />
    </Background>
  );
}
