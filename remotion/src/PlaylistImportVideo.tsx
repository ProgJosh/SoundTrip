import React from "react";
import { Audio, interpolate, staticFile } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { ChooseExport } from "./scenes/ChooseExport";
import { EndCard } from "./scenes/EndCard";
import { Hook } from "./scenes/Hook";
import { Match } from "./scenes/Match";
import { Offline } from "./scenes/Offline";
import { Reveal } from "./scenes/Reveal";
import { Review } from "./scenes/Review";

const scenes = [
  { component: Hook, frames: 120 },
  { component: Reveal, frames: 90 },
  { component: ChooseExport, frames: 150 },
  { component: Review, frames: 140 },
  { component: Match, frames: 180 },
  { component: Offline, frames: 150 },
  { component: EndCard, frames: 120 },
];

const TRANSITION = 14;

export const DURATION =
  scenes.reduce((n, s) => n + s.frames, 0) - TRANSITION * (scenes.length - 1);

export function PlaylistImportVideo() {
  return (
    <>
      {/* The showreel soundtrack, faded out to fit this cut. */}
      <Audio
        src={staticFile("showreel-music.wav")}
        volume={(f) =>
          interpolate(f, [0, 10, DURATION - 24, DURATION], [0, 0.85, 0.85, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <TransitionSeries>
        {scenes.map(({ component: Scene, frames }, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <TransitionSeries.Transition
                presentation={
                  // The app screens slide in; brand moments cross-fade.
                  i >= 3 && i <= 5 ? slide({ direction: "from-right" }) : fade()
                }
                timing={linearTiming({ durationInFrames: TRANSITION })}
              />
            )}
            <TransitionSeries.Sequence durationInFrames={frames}>
              <Scene />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
    </>
  );
}
