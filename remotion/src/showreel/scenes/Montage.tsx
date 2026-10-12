import { AbsoluteFill } from "remotion";
import { c, Ion, IonName, mono, sans, SITE } from "../brand";
import { B, ease, tw } from "../motion";

// Cuts on 8th notes, then on each hit of the drum fill.
const fill = B.roll.filter((r) => r >= 760 && r < 780);
const cuts = [720, 728, 735, 743, 750, 758, ...fill];
const cards: { word?: string; icon: IonName; bg: string; fg: string }[] = [
  { word: "Import.", icon: "add", bg: c.accent, fg: c.bg },
  { word: "Match.", icon: "link-outline", bg: c.deep, fg: c.accent },
  { word: "Play.", icon: "play", bg: c.teal, fg: c.bg },
  { word: "Lyrics.", icon: "text-outline", bg: c.deep, fg: c.text },
  { word: "Moods.", icon: "sunny-outline", bg: c.orange, fg: c.bg },
  { word: "Queue.", icon: "list-outline", bg: c.deep, fg: c.teal },
  { icon: "heart", bg: c.accent, fg: c.bg },
  { icon: "shuffle", bg: c.deep, fg: c.accent },
  { icon: "repeat", bg: c.teal, fg: c.bg },
  { icon: "pulse", bg: c.deep, fg: c.accent },
];

export function Montage({ f }: { f: number }) {
  let i = 0;
  for (let k = 0; k < cuts.length; k++) if (f >= cuts[k]!) i = k;
  const card = cards[Math.min(i, cards.length - 1)]!;
  const at = cuts[i]!;
  const p = tw(f, at, at + 6, 0, 1, ease.outExpo);
  const dir = i % 2 ? 1 : -1;
  return (
    <AbsoluteFill
      style={{ background: card.bg, fontFamily: sans, overflow: "hidden" }}
    >
      {/* Giant icon sweeping behind */}
      <div
        style={{
          position: "absolute",
          left: 960 - 450 + dir * (1 - p) * 300,
          top: 540 - 450,
          opacity: card.word ? 0.12 : 1,
          transform: `rotate(${dir * (1 - p) * 40 + (f - at) * dir * 1.5}deg) scale(${card.word ? 1.4 : 0.5 + p * 0.5})`,
        }}
      >
        <Ion name={card.icon} size={900} color={card.fg} />
      </div>
      {card.word && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Echo outline */}
          <div
            style={{
              position: "absolute",
              fontSize: 300,
              fontWeight: 900,
              letterSpacing: -14,
              color: "transparent",
              WebkitTextStroke: `3px ${card.fg}`,
              opacity: 0.35 * (1 - p),
              transform: `scale(${1 + (1 - p) * 0.5})`,
            }}
          >
            {card.word}
          </div>
          <div
            style={{
              fontSize: 300,
              fontWeight: 900,
              letterSpacing: -14,
              color: card.fg,
              transform: `scale(${1.25 - 0.25 * p}) rotate(${dir * (1 - p) * -4}deg) translateX(${dir * (1 - p) * -80}px)`,
            }}
          >
            {card.word}
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 70,
          top: 60,
          fontFamily: mono,
          fontSize: 26,
          color: card.fg,
          opacity: 0.8,
        }}
      >
        {String(i + 1).padStart(2, "0")} /{" "}
        {String(cards.length).padStart(2, "0")}
      </div>
      <div
        style={{
          position: "absolute",
          right: 70,
          bottom: 56,
          fontFamily: mono,
          fontSize: 22,
          color: card.fg,
          opacity: 0.7,
        }}
      >
        {SITE}
      </div>
    </AbsoluteFill>
  );
}
