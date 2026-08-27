import { Composition } from "remotion";
import { Failures } from "./Failures";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Failures"
      component={Failures}
      // 18 intro frames plus 26 per failure, at 30fps. Every frame after the
      // intro is full, so a reader who meets the loop mid-cycle still lands on
      // something readable.
      durationInFrames={226}
      fps={30}
      width={1280}
      height={640}
    />
  );
};
