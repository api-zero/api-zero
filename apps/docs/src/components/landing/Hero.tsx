import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";
import { Parallax } from "./scroll";
import { HeroGrain, HeroSphere } from "./shaders";

const SAMPLE = `import { createClient, ApiError } from "@api-zero/core";

export const api = createClient({
  baseURL: "https://api.example.com",
  timeout: 10_000,
  retry: { attempts: 3, delay: 1_000, backoff: "exponential" },
});

try {
  const user = await api.get<User>("/users/1");
} catch (error) {
  if (error instanceof ApiError && error.isNotFound()) {
    // 404, a network failure and a timeout all arrive the same way
  }
}`;

export function Hero() {
  return (
    <section className="px-6 pt-8 pb-20">
      {/*
        A framed surface, slightly lifted off the page. Without it the hero is a
        void: nothing establishes a plane, so nothing reads as being on top of
        anything.
      */}
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-fd-border bg-fd-card">
        {/*
          The decoration drifts against the scroll while the text holds still,
          which is what separates the two planes. Only the decoration moves:
          parallaxing the copy makes it harder to read, not more alive.
        */}
        <Parallax
          className="pointer-events-none absolute inset-0"
          distance={-90}
        >
          <HeroGrain />
          <HeroSphere />
        </Parallax>
        {/* Keeps the text legible over the brightest part of the gradient. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fd-card via-fd-card/70 to-transparent"
        />
        {/* The decoration has to end before the code panel starts. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-fd-card to-transparent"
        />

        <div className="relative px-6 pt-16 pb-0 sm:px-12 sm:pt-20">
          <Link
            href="/docs/core/get-started/installation"
            className="landing-enter group inline-flex items-center gap-2 rounded-full border border-fd-primary/30 bg-fd-primary/10 px-3 py-1 font-medium text-fd-primary text-sm"
          >
            v0.1.5 · on npm
            <ArrowRight className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </Link>

          <h1
            className="landing-enter mt-7 max-w-3xl text-balance font-semibold text-4xl leading-[1.05] tracking-tight sm:text-6xl"
            style={{ transitionDelay: "60ms" }}
          >
            Stop writing the same{" "}
            <span className="text-fd-primary">api.ts</span> in every project
          </h1>

          <p
            className="landing-enter mt-6 max-w-xl text-balance text-fd-muted-foreground md:text-lg"
            style={{ transitionDelay: "120ms" }}
          >
            A Fetch-based HTTP client built around reliable transport and
            runtime-validated contracts. It sits underneath TanStack Query and
            SWR rather than competing with them.
          </p>

          <div
            className="landing-enter mt-9 flex flex-wrap items-center gap-3"
            style={{ transitionDelay: "180ms" }}
          >
            <Link
              href="/docs/core/get-started/quickstart"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-fd-primary px-6 font-medium text-fd-primary-foreground text-sm transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.97]"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="https://github.com/api-zero/api-zero"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-fd-border bg-fd-background px-6 font-medium text-sm transition-[transform,background-color] duration-150 ease-out hover:bg-fd-accent active:scale-[0.97]"
            >
              <Github className="size-4" />
              GitHub
            </Link>
          </div>

          {/*
            The product itself, bleeding off the bottom edge. A library's
            product is its code, and a landing with nothing to look at gives
            the eye nowhere to rest.
          */}
          <div
            className="landing-enter -mb-px mt-14 max-h-72 overflow-hidden rounded-t-xl border border-fd-border border-b-0 [&_*]:!rounded-b-none [&_pre]:!border-b-0"
            style={{ transitionDelay: "240ms" }}
          >
            <DynamicCodeBlock lang="ts" code={SAMPLE} />
          </div>
        </div>
      </div>
    </section>
  );
}
