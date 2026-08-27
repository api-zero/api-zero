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
const GREEN = "#4ADE80";
const BLUE = "#7DD3FC";

/**
 * The eight ways a request dies, and what `ApiError` reports for each.
 *
 * Native fetch splits these down the middle: a DNS failure rejects, a 500
 * resolves, and the caller has to know which is which. Every row below arrives
 * at one `catch`, which is the whole argument for the library and the reason
 * this is worth animating rather than listing.
 */
const FAILURES = [
  {
    label: "DNS lookup failed",
    message: "getaddrinfo ENOTFOUND api.example.com",
    status: "null",
    attempt: "1",
    flag: "isNetworkError()",
  },
  {
    label: "Connection refused",
    message: "connect ECONNREFUSED 127.0.0.1:443",
    status: "null",
    attempt: "1",
    flag: "isNetworkError()",
  },
  {
    label: "Timed out",
    message: "Request exceeded 10000ms",
    status: "null",
    attempt: "3",
    flag: "isTimeout()",
  },
  {
    label: "Caller aborted",
    message: "The operation was aborted",
    status: "null",
    attempt: "1",
    flag: "isAborted()",
  },
  {
    label: "404 Not Found",
    message: "Request failed with status 404",
    status: "404",
    attempt: "1",
    flag: "isNotFound()",
  },
  {
    label: "500 Server Error",
    message: "Request failed with status 500",
    status: "500",
    attempt: "3",
    flag: "isServerError()",
  },
  {
    label: "429 Rate limited",
    message: "Request failed with status 429",
    status: "429",
    attempt: "3",
    flag: "isRateLimited()",
  },
  {
    label: "Malformed JSON body",
    message: "Unexpected token < in JSON at position 0",
    status: "200",
    attempt: "1",
    flag: "isParseError()",
  },
];

const INTRO = 18;
/** Frames each failure holds. The full loop is INTRO + 8 * HOLD. */
const HOLD = 26;

function Row({ index, active }: { index: number; active: number }) {
  const frame = useCurrentFrame();
  const isActive = index === active;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "13px 18px",
        borderRadius: 10,
        // Every row is on screen the whole time. A list that reveals one item
        // at a time leaves most of the frame empty, which is what made the
        // first version of this unreadable at a glance.
        border: `1px solid ${isActive ? ORANGE : BORDER}`,
        backgroundColor: isActive ? "#1C1207" : CARD,
        opacity: interpolate(
          frame,
          [index * 2, index * 2 + INTRO],
          [0, isActive ? 1 : 0.55],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          },
        ),
        translate: interpolate(
          frame,
          [index * 2, index * 2 + INTRO],
          ["-16px 0px", "0px 0px"],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          },
        ),
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: isActive ? ORANGE : BORDER,
        }}
      />
      <span
        style={{
          fontFamily: MONO,
          fontSize: 21,
          color: isActive ? TEXT : MUTED,
        }}
      >
        {FAILURES[index].label}
      </span>
    </div>
  );
}

function Field({ name, value, tone }: { name: string; value: string; tone: string }) {
  return (
    <div style={{ display: "flex", gap: 16, fontFamily: MONO, fontSize: 21 }}>
      <span style={{ color: MUTED, width: 150, flexShrink: 0 }}>{name}</span>
      <span style={{ color: tone }}>{value}</span>
    </div>
  );
}

export const Failures: React.FC = () => {
  const frame = useCurrentFrame();
  const active = Math.min(
    FAILURES.length - 1,
    Math.max(0, Math.floor((frame - INTRO) / HOLD)),
  );
  const current = FAILURES[active];

  // Restarts on every change, so the card reads as being rewritten rather than
  // as static text whose contents silently swapped.
  const since = frame - INTRO - active * HOLD;

  return (
    <AbsoluteFill
      name="Failures"
      style={{
        backgroundColor: BG,
        fontFamily: SANS,
        color: TEXT,
        padding: 56,
        flexDirection: "row",
        gap: 40,
        alignItems: "center",
      }}
    >
      <Interactive.Div
        name="Failure list"
        style={{ display: "flex", flexDirection: "column", gap: 9, width: 470 }}
      >
        {FAILURES.map((failure, i) => (
          <Row key={failure.label} index={i} active={active} />
        ))}
      </Interactive.Div>

      <Interactive.Div
        name="Arrow"
        style={{
          fontFamily: MONO,
          fontSize: 30,
          color: ORANGE,
          opacity: interpolate(frame, [INTRO, INTRO + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        →
      </Interactive.Div>

      <Interactive.Div
        name="ApiError"
        style={{
          flex: 1,
          alignSelf: "stretch",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 18,
          padding: 36,
          borderRadius: 16,
          border: `1px solid ${BORDER}`,
          backgroundColor: CARD,
          opacity: interpolate(frame, [8, 8 + INTRO], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 23, color: ORANGE, whiteSpace: "nowrap" }}>
          if (error instanceof ApiError)
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 6,
            opacity: interpolate(since, [0, 6], [0.25, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(since, [0, 6], ["0px 6px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <Field name="message" value={`"${current.message}"`} tone={GREEN} />
          <Field name="status" value={current.status} tone={BLUE} />
          <Field name="url" value='"/users/1"' tone={GREEN} />
          <Field name="attempt" value={current.attempt} tone={BLUE} />
          <Field name="matched by" value={current.flag} tone={ORANGE} />
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
