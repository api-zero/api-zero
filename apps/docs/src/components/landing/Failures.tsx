import { Container, Eyebrow } from "./primitives";
import { Reveal } from "./reveal";

/**
 * The eight ways a request dies, and what `ApiError` reports for each.
 *
 * This was a rendered video first, which was the wrong medium twice over: text
 * in a video is soft on a retina display, it cost 600 kB, and when the codec or
 * the autoplay policy disagreed the reader got a black rectangle. The same
 * thing in the DOM is sharp at any density, weighs nothing, and cannot fail to
 * decode.
 */
const FAILURES = [
  {
    label: "DNS lookup failed",
    message: "getaddrinfo ENOTFOUND api.example.com",
    status: "null",
    attempt: "1",
    matcher: "isNetworkError()",
  },
  {
    label: "Connection refused",
    message: "connect ECONNREFUSED 127.0.0.1:443",
    status: "null",
    attempt: "1",
    matcher: "isNetworkError()",
  },
  {
    label: "Timed out",
    message: "Request exceeded 10000ms",
    status: "null",
    attempt: "3",
    matcher: "isTimeout()",
  },
  {
    label: "Caller aborted",
    message: "The operation was aborted",
    status: "null",
    attempt: "1",
    matcher: "isAborted()",
  },
  {
    label: "404 Not Found",
    message: "Request failed with status 404",
    status: "404",
    attempt: "1",
    matcher: "isNotFound()",
  },
  {
    label: "500 Server Error",
    message: "Request failed with status 500",
    status: "500",
    attempt: "3",
    matcher: "isServerError()",
  },
  {
    label: "429 Rate limited",
    message: "Request failed with status 429",
    status: "429",
    attempt: "3",
    matcher: "isRateLimited()",
  },
  {
    label: "Malformed JSON body",
    message: "Unexpected token < in JSON at position 0",
    status: "200",
    attempt: "1",
    matcher: "isParseError()",
  },
];

/** Seconds each row holds. The full cycle is this times the row count. */
const STEP = 1.6;

function Field({
  name,
  value,
  tone,
}: {
  name: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex gap-4 font-mono text-sm sm:text-base">
      <span className="w-28 shrink-0 text-fd-muted-foreground">{name}</span>
      <span className={`truncate ${tone}`}>{value}</span>
    </div>
  );
}

export function Failures() {
  const cycle = `${STEP * FAILURES.length}s`;

  return (
    <section className="border-fd-border border-t py-28">
      <Container>
        <Reveal>
          <Eyebrow>Error handling</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
            Eight ways to fail, one thing to catch
          </h2>
          <p className="mt-4 max-w-2xl text-fd-muted-foreground leading-relaxed">
            Native fetch splits these down the middle: a DNS failure rejects, a
            500 resolves, and your caller has to know which is which. Here they
            all arrive as an <code className="text-fd-primary">ApiError</code>{" "}
            carrying the status, the resolved URL, the attempt and the cause.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <ul className="flex flex-col gap-2">
              {FAILURES.map((failure, i) => (
                <li
                  key={failure.label}
                  className="relative rounded-xl border border-fd-border bg-fd-card px-4 py-3"
                >
                  <span className="flex items-center gap-3 font-mono text-fd-muted-foreground text-sm">
                    <span className="size-2 rounded-full bg-fd-border" />
                    {failure.label}
                  </span>
                  {/*
                    One CSS animation per row, offset by its index. Nothing runs
                    on the main thread and nothing needs a timer, so the section
                    costs the same whether or not anyone scrolls to it.
                  */}
                  <span
                    aria-hidden
                    className="landing-cycle absolute inset-0 flex items-center gap-3 rounded-xl border border-fd-primary bg-fd-primary/10 px-4 py-3 font-mono text-fd-primary text-sm"
                    style={{
                      animationDuration: cycle,
                      animationDelay: `${i * STEP}s`,
                    }}
                  >
                    <span className="size-2 rounded-full bg-fd-primary" />
                    {failure.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="relative min-h-72 overflow-hidden rounded-2xl border border-fd-border bg-fd-card p-7">
              <p className="font-mono text-fd-primary text-sm sm:text-base">
                if (error instanceof ApiError)
              </p>
              {FAILURES.map((failure, i) => (
                <div
                  key={failure.label}
                  // Stacked and cross-faded on the same schedule as the rows, so
                  // the card and the highlight can never disagree.
                  className="landing-cycle absolute inset-x-7 top-20 flex flex-col gap-3.5"
                  style={{
                    animationDuration: cycle,
                    animationDelay: `${i * STEP}s`,
                  }}
                >
                  <Field
                    name="message"
                    value={`"${failure.message}"`}
                    tone="text-emerald-400"
                  />
                  <Field
                    name="status"
                    value={failure.status}
                    tone="text-sky-300"
                  />
                  <Field
                    name="url"
                    value='"/users/1"'
                    tone="text-emerald-400"
                  />
                  <Field
                    name="attempt"
                    value={failure.attempt}
                    tone="text-sky-300"
                  />
                  <Field
                    name="matched by"
                    value={failure.matcher}
                    tone="text-fd-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
