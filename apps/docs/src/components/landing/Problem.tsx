import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { Code, Container, Eyebrow } from "./primitives";
import { Reveal } from "./reveal";

/**
 * The handwritten client and its replacement, in one panel.
 *
 * Side by side, a twenty-line block next to a five-line block read as a layout
 * bug. As a unified diff it read as a wall of red. Two tabs over one panel keep
 * a single footprint and let the reader flip between them, which is closer to
 * how the comparison actually lands: the same job, twice.
 */
const BEFORE = `// Every project. Slightly different every time.
let token: string | null = null;

async function request(path: string, init?: RequestInit) {
  const res = await fetch(API_URL + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: \`Bearer \${token}\` }),
      ...init?.headers,
    },
  });

  // loses the response body
  if (!res.ok) throw new Error(res.statusText);
  // remembered this time
  if (res.status === 204) return undefined;
  return res.json();
}`;

const AFTER = `import { createClient } from "@api-zero/core";

export const api = createClient({
  baseURL: process.env.API_URL,
  timeout: 10_000,
});

// Everything above is now configuration, not code you maintain:
// 204s, FormData, timeouts, cancellation and retries are handled.`;

/** The cases the handwritten version tends to miss. */
const MISSED = [
  ["Empty 204 bodies", "res.json() throws on a body that is not there."],
  ["FormData boundaries", "Setting Content-Type by hand breaks the upload."],
  ["Timeouts and cancellation", "Two signals that have to compose into one."],
  ["Retrying a POST", "A policy that repeats one has already lost."],
];

export function Problem() {
  return (
    <section className="border-fd-border border-t py-20">
      <Container>
        <Reveal>
          <Eyebrow>The problem</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
            You have written this file before
          </h2>
          <p className="mt-4 max-w-2xl text-fd-muted-foreground leading-relaxed">
            A base URL. A place to keep the token. A helper that throws on
            non-2xx. Re-declared <code className="text-fd-primary">.get</code>{" "}
            and <code className="text-fd-primary">.post</code> so callers stop
            repeating themselves. It is subtly different in every project, and
            nobody ever tests it.
          </p>
        </Reveal>

        <Reveal delay={40} className="mt-10">
          <Tabs items={["By hand", "With api-zero"]}>
            <Tab value="By hand">
              <Code code={BEFORE} />
            </Tab>
            <Tab value="With api-zero">
              <Code code={AFTER} />
            </Tab>
          </Tabs>
        </Reveal>

        {/*
          The cases the handwritten version tends to miss, as named cases rather
          than one paragraph. A reader scanning the page can find the one that
          bit them last month.
        */}
        <Reveal delay={80} className="mt-5">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-fd-border bg-fd-border sm:grid-cols-2 lg:grid-cols-4">
            {MISSED.map(([title, body]) => (
              <div key={title} className="bg-fd-card p-6">
                <p className="font-medium text-sm">{title}</p>
                <p className="mt-2 text-fd-muted-foreground text-sm leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
