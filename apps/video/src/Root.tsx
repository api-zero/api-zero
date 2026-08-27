import { Composition } from "remotion";
import { Lifecycle } from "./Lifecycle";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Lifecycle"
      component={Lifecycle}
      // 8 seconds at 30fps. The loop has to hold long enough to read the
      // failure and the backoff, and short enough that a reader who scrolls
      // past twice sees the same thing rather than a fragment.
      durationInFrames={252}
      fps={30}
      width={1280}
      height={600}
    />
  );
};
