"use client";

import { useGSAP } from "@gsap/react";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { Reveal } from "./reveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

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
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          // The handwritten file recedes as the replacement arrives. Tying it to
          // scroll rather than a timer lets the reader hold both on screen and
          // compare them, which is the entire point of putting them side by side.
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top 70%",
              end: "bottom 75%",
              scrub: 0.5,
            },
          });

          tl.to("[data-before]", { opacity: 0.35, scale: 0.96 }, 0).fromTo(
            "[data-after]",
            { opacity: 0.4, scale: 0.97 },
            { opacity: 1, scale: 1 },
            0,
          );

          return () => tl.kill();
        },
      );
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="border-fd-border border-t px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="font-medium font-mono text-fd-primary text-sm">
            The problem
          </p>
          <h2 className="mt-3 text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
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

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <div data-before className="origin-top-left">
            <p className="mb-3 font-medium text-fd-muted-foreground text-sm">
              What you write today
            </p>
            <DynamicCodeBlock lang="ts" code={BEFORE} />
          </div>

          <div data-after className="flex origin-top-left flex-col">
            <p className="mb-3 font-medium text-fd-primary text-sm">
              What replaces it
            </p>
            <DynamicCodeBlock lang="ts" code={AFTER} />
            <p className="mt-6 rounded-xl border border-fd-primary/20 bg-fd-primary/5 p-5 text-fd-muted-foreground text-sm leading-relaxed">
              Plus the parts the handwritten version usually gets wrong: empty{" "}
              <code>204</code> bodies, <code>FormData</code> boundaries,
              timeouts that compose with cancellation, and retries that refuse
              to repeat a <code>POST</code>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
