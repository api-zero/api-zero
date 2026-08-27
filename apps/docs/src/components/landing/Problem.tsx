import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Reveal } from "./reveal";

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
});`;

export function Problem() {
  return (
    <section className="border-fd-border border-t px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <h2 className="text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
            You have written this file before
          </h2>
          <p className="mt-4 max-w-2xl text-fd-muted-foreground">
            A base URL. A place to keep the token. A helper that throws on
            non-2xx. Re-declared <code className="text-fd-primary">.get</code>{" "}
            and <code className="text-fd-primary">.post</code> so callers stop
            repeating themselves. It is subtly different in every project, and
            nobody ever tests it.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal delay={40}>
            <p className="mb-3 font-medium text-fd-muted-foreground text-sm">
              What you write today
            </p>
            <DynamicCodeBlock lang="ts" code={BEFORE} />
          </Reveal>

          <Reveal delay={80} className="flex flex-col">
            <p className="mb-3 font-medium text-fd-primary text-sm">
              What replaces it
            </p>
            <DynamicCodeBlock lang="ts" code={AFTER} />
            <p className="mt-6 rounded-lg border border-fd-primary/20 bg-fd-primary/5 p-4 text-fd-muted-foreground text-sm leading-relaxed">
              Plus the parts the handwritten version usually gets wrong: empty{" "}
              <code>204</code> bodies, <code>FormData</code> boundaries,
              timeouts that compose with cancellation, and retries that refuse
              to repeat a <code>POST</code>.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
