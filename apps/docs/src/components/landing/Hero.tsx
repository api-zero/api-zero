import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center px-6 pt-28 pb-20 text-center sm:pt-36">
      <Link
        href="/docs/core/get-started/installation"
        className="landing-enter group inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-3 py-1 text-fd-muted-foreground text-sm transition-colors hover:text-fd-foreground"
      >
        <span className="font-medium text-fd-primary">v0.1.5</span>
        <span aria-hidden>·</span>
        on npm, Node 22+ and Edge
        <ArrowRight className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
      </Link>

      <h1
        className="landing-enter mt-8 max-w-3xl text-balance font-semibold text-4xl tracking-tight sm:text-5xl md:text-6xl"
        style={{ transitionDelay: "60ms" }}
      >
        Stop writing the same{" "}
        <code className="rounded-lg bg-fd-primary/10 px-2 py-1 font-mono text-fd-primary text-[0.85em]">
          api.ts
        </code>{" "}
        in every project
      </h1>

      <p
        className="landing-enter mt-6 max-w-xl text-balance text-fd-muted-foreground md:text-lg"
        style={{ transitionDelay: "120ms" }}
      >
        A Fetch-based HTTP client built around reliable transport and
        runtime-validated contracts. It sits underneath TanStack Query and SWR
        rather than competing with them.
      </p>

      <div
        className="landing-enter mt-10 flex flex-wrap items-center justify-center gap-3"
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
          className="inline-flex h-11 items-center gap-2 rounded-full border border-fd-border px-6 font-medium text-sm transition-[transform,background-color] duration-150 ease-out hover:bg-fd-accent active:scale-[0.97]"
        >
          <Github className="size-4" />
          GitHub
        </Link>
      </div>
    </section>
  );
}
