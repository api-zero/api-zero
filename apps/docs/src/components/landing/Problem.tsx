import { Code, Container, Eyebrow } from "./primitives";
import { Reveal } from "./reveal";

/**
 * The handwritten client and its replacement, as one diff.
 *
 * Side by side, the two were a twenty-line block next to a five-line block and
 * the imbalance read as a layout bug. As a diff the same asymmetry is the
 * argument: this much of your repository stops existing.
 */
const DIFF = `- // Every project. Slightly different every time.
- let token: string | null = null;
-
- async function request(path: string, init?: RequestInit) {
-   const res = await fetch(API_URL + path, {
-     ...init,
-     headers: {
-       "Content-Type": "application/json",
-       ...(token && { Authorization: \`Bearer \${token}\` }),
-       ...init?.headers,
-     },
-   });
-
-   // loses the response body
-   if (!res.ok) throw new Error(res.statusText);
-   // remembered this time
-   if (res.status === 204) return undefined;
-   return res.json();
- }
+ import { createClient } from "@api-zero/core";
+
+ export const api = createClient({
+   baseURL: process.env.API_URL,
+   timeout: 10_000,
+ });`;

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
          <Code lang="diff" code={DIFF} />
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
