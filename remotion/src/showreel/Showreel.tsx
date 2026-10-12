import { noise2D } from "@remotion/noise";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { c } from "./brand";
import { Grain, Vignette } from "./fx";
import { B, hit } from "./motion";
import { Build } from "./scenes/Build";
import { Final } from "./scenes/Final";
import { Import } from "./scenes/Import";
import { Intro } from "./scenes/Intro";
import { Library } from "./scenes/Library";
import { LogoSlam } from "./scenes/LogoSlam";
import { Match } from "./scenes/Match";
import { Montage } from "./scenes/Montage";
import { NowPlaying } from "./scenes/NowPlaying";
import { Offline } from "./scenes/Offline";

type Scene = {
  from: number;
  to: number;
  render: (f: number) => React.ReactNode;
};

const scenes: Scene[] = [
  { from: 0, to: 120, render: (f) => <Intro f={f} /> },
  { from: 120, to: 180, render: (f) => <LogoSlam f={f} /> },
  { from: 180, to: 300, render: (f) => <Library f={f} /> },
  { from: 300, to: 360, render: (f) => <Import f={f} /> },
  { from: 360, to: 480, render: (f) => <Match f={f} /> },
  { from: 480, to: 600, render: (f) => <NowPlaying f={f} /> },
  { from: 600, to: 720, render: (f) => <Offline f={f} /> },
  { from: 720, to: 780, render: (f) => <Montage f={f} /> },
  { from: 780, to: 840, render: (f) => <Build f={f} /> },
  { from: 840, to: 900, render: (f) => <Final f={f} /> },
];

export function Showreel() {
  const f = useCurrentFrame();
  // Camera: a hard shake on impacts, a softer one on kicks.
  const impact = hit(B.impacts, f, 7);
  const kick = hit(B.kicks, f, 3);
  const amp = impact * 26 + kick * 4;
  const x = noise2D("cx", f / 2.2, 0) * amp;
  const y = noise2D("cy", 0, f / 2.2) * amp;
  const r = noise2D("cr", f / 3, 5) * impact * 1.2;
  return (
    <AbsoluteFill style={{ background: c.deep }}>
      <AbsoluteFill
        style={{
          transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${1 + impact * 0.03})`,
        }}
      >
        {scenes.map((s) =>
          f >= s.from && f < s.to ? (
            <AbsoluteFill key={s.from}>{s.render(f)}</AbsoluteFill>
          ) : null,
        )}
      </AbsoluteFill>
      <Vignette />
      <Grain f={f} />
      <Audio src={staticFile("showreel-music.wav")} />
    </AbsoluteFill>
  );
}

export const SHOWREEL_FRAMES = B.durationInFrames;
