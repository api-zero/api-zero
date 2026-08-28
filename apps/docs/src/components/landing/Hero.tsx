import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";
import { buttonStyles, Code } from "./primitives";
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
    <section className="px-6 pt-6 pb-12 md:px-12">
      {/*
        Sized to the viewport rather than to its contents. A hero that needs a
        scroll to be seen whole has stopped being a hero, and the bounds keep it
        from collapsing on a laptop or stretching absurdly on a large display.
      */}
      <div className="relative mx-auto flex h-[calc(100vh-7rem)] max-h-[860px] min-h-[560px] w-full max-w-[1400px] overflow-hidden rounded-3xl border border-fd-border bg-fd-card">
        {/*
          Taller than the card it sits in. The layer travels with the scroll, so
          one sized exactly to the card drags its own bottom edge into view and
          the hero appears to peel away from its own background.
        */}
        <Parallax
          className="-inset-y-40 pointer-events-none absolute inset-x-0"
          distance={-90}
        >
          <HeroGrain />
          <HeroSphere />
        </Parallax>
        {/* Keeps the copy legible over the brightest part of the gradient. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fd-card via-fd-card/55 to-transparent"
        />

        <div className="relative grid w-full grid-cols-1 items-center gap-10 p-8 sm:p-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:py-14 lg:pr-0">
          <div>
            <Link
              href="/docs/core/get-started/installation"
              className="landing-enter group inline-flex items-center gap-2 rounded-full border border-fd-primary/30 bg-fd-primary/10 px-3 py-1 font-medium text-fd-primary text-sm"
            >
              v0.1.5 · on npm
              <ArrowRight className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
            </Link>

            <h1
              className="landing-enter mt-7 text-balance font-semibold text-4xl leading-[1.03] tracking-tight sm:text-6xl xl:text-7xl"
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
                className={buttonStyles.primary}
              >
                Get started
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="https://github.com/api-zero/api-zero"
                target="_blank"
                rel="noreferrer"
                className={buttonStyles.secondary}
              >
                <Github className="size-4" />
                GitHub
              </Link>
            </div>
          </div>

          {/*
            The product itself, running off the right edge. A library's product
            is its code, and a hero with nothing to look at gives the eye
            nowhere to rest. Hidden where there is no room for it rather than
            shrunk to illegibility.
          */}
          <div
            className="landing-enter -mr-px hidden overflow-hidden rounded-l-2xl border border-fd-border border-r-0 bg-fd-background/60 backdrop-blur-sm lg:block [&_*]:!rounded-r-none [&_pre]:!border-r-0 [&_pre]:!max-h-[min(46vh,440px)]"
            style={{ transitionDelay: "240ms" }}
          >
            <Code code={SAMPLE} />
          </div>
        </div>
      </div>
    </section>
  );
}
