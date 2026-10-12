import { Composition, Still } from "remotion";
import { Cover } from "./Cover";
import { DURATION, PlaylistImportVideo } from "./PlaylistImportVideo";
import { Showreel, SHOWREEL_FRAMES } from "./showreel/Showreel";
import { VIDEO } from "./theme";

export function Root() {
  return (
    <>
      <Composition
        id="Showreel"
        component={Showreel}
        durationInFrames={SHOWREEL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PlaylistImport"
        component={PlaylistImportVideo}
        durationInFrames={DURATION}
        {...VIDEO}
      />
      <Still
        id="Cover"
        component={Cover}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  );
}
