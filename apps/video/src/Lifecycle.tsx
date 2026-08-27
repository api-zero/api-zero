import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";

const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const SANS = 'Inter, -apple-system, "Segoe UI", system-ui, sans-serif';

const BG = "#0A0A0A";
const CARD = "#131313";
const BORDER = "#2A2A2A";
const TEXT = "#EDEDED";
const MUTED = "#8A8A8F";
const ORANGE = "#FF7A18";
const RED = "#F87171";
const GREEN = "#4ADE80";

/**
 * The five stages a request passes through, in order.
 *
 * They are the same stages the lifecycle page documents, so the video and the
 * prose cannot describe different pipelines.
 */
const STAGES = ["Request", "Interceptors", "Transport", "Response", "Validate"];

/**
 * Frame at which each stage lights up, per pass.
 *
 * The first pass stops at Response and fails; the second runs to the end. Times
 * are frames at 30fps, and every animation below reads from this one table so
 * the sequence stays editable in one place.
 */
const PASS_ONE = [20, 34, 48, 64];
const BACKOFF = [80, 128];
const PASS_TWO = [136, 150, 164, 178];
const VALIDATE = 192;
const RESULT = 204;

/** A stage is lit once its frame arrives, and stays lit until the pass resets. */
function litAt(frame: number, at: number, until: number) {
  return interpolate(frame, [at, at + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  }) * interpolate(frame, [until, until + 10], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export const Lifecycle: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      name="Lifecycle"
      style={{
        backgroundColor: BG,
        fontFamily: SANS,
        color: TEXT,
        padding: 56,
        justifyContent: "center",
        // The composition loops on the landing, so the last frame has to hand
        // over to the first one. Without this the result cuts to an empty
        // frame, which reads as a glitch rather than a repeat.
        opacity: interpolate(frame, [232, 250], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <Interactive.Div
        name="Call"
        style={{
          fontFamily: MONO,
          fontSize: 38,
          letterSpacing: -0.5,
          opacity: interpolate(frame, [0, 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [0, 14], ["0px 12px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <span style={{ color: MUTED }}>await </span>
        <span>api.</span>
        <span style={{ color: ORANGE }}>get</span>
        <span style={{ color: MUTED }}>&lt;User&gt;</span>
        <span style={{ color: MUTED }}>(</span>
        <span style={{ color: GREEN }}>"/users/1"</span>
        <span style={{ color: MUTED }}>)</span>
      </Interactive.Div>

      <Interactive.Div
        name="Track"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginTop: 64,
        }}
      >
        {STAGES.map((stage, i) => {
          // Response and Validate only ever light on the second pass; the
          // earlier stages light twice, once per attempt.
          const first = i < 4 ? PASS_ONE[i] : -1;
          const second = i < 4 ? PASS_TWO[i] : VALIDATE;

          // The stage that failed has to stay lit through the whole wait.
          // Dimming everything during the backoff reads as "nothing is
          // happening", which is the opposite of what a retry is.
          const firstEnds = i === 3 ? PASS_TWO[3] : BACKOFF[0];
          const lit =
            (first >= 0 ? litAt(frame, first, firstEnds) : 0) +
            litAt(frame, second, RESULT + 40);

          const accent =
            i === 3
              ? frame >= PASS_TWO[3]
                ? GREEN
                : frame >= PASS_ONE[3]
                  ? RED
                  : ORANGE
              : i === 4 && frame >= RESULT
                ? GREEN
                : ORANGE;

          return (
            <React.Fragment key={stage}>
              {i > 0 && (
                <div
                  style={{
                    height: 2,
                    flex: 1,
                    backgroundColor: BORDER,
                    opacity: 0.9,
                  }}
                />
              )}
              <div
                style={{
                  padding: "14px 22px",
                  borderRadius: 12,
                  border: `1px solid ${BORDER}`,
                  backgroundColor: CARD,
                  fontSize: 24,
                  whiteSpace: "nowrap",
                  borderColor: `color-mix(in srgb, ${accent} ${Math.min(lit, 1) * 100}%, ${BORDER})`,
                  color: `color-mix(in srgb, ${accent} ${Math.min(lit, 1) * 100}%, ${MUTED})`,
                  boxShadow: `0 0 ${Math.min(lit, 1) * 28}px color-mix(in srgb, ${accent} 30%, transparent)`,
                }}
              >
                {stage}
              </div>
            </React.Fragment>
          );
        })}
      </Interactive.Div>

      <Interactive.Div
        name="Failure"
        style={{
          marginTop: 44,
          fontFamily: MONO,
          fontSize: 26,
          color: RED,
          opacity: interpolate(frame, [64, 74, BACKOFF[1], BACKOFF[1] + 10], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        500 Internal Server Error · attempt 1 of 3
      </Interactive.Div>

      <Interactive.Div
        name="Backoff"
        style={{
          marginTop: 20,
          opacity: interpolate(frame, [BACKOFF[0], BACKOFF[0] + 8, BACKOFF[1], BACKOFF[1] + 8], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ fontSize: 22, color: MUTED, marginBottom: 12 }}>
          Exponential backoff with jitter — 1.0s
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: BORDER,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              backgroundColor: ORANGE,
              // Linear: this bar represents elapsed time, and easing it would
              // misreport how the delay is actually spent.
              width: `${interpolate(frame, BACKOFF, [0, 100], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}%`,
            }}
          />
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="Result"
        style={{
          marginTop: 28,
          fontFamily: MONO,
          fontSize: 26,
          color: GREEN,
          opacity: interpolate(frame, [RESULT, RESULT + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [RESULT, RESULT + 12], ["0px 10px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        200 OK · User &#123; id: 1, name: "Ada" &#125;
      </Interactive.Div>
    </AbsoluteFill>
  );
};
