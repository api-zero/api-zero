import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./reveal";
import { CtaGrain } from "./shaders";

const MANAGERS = [
  { name: "pnpm", command: "pnpm add @api-zero/core" },
  { name: "npm", command: "npm install @api-zero/core" },
  { name: "yarn", command: "yarn add @api-zero/core" },
  { name: "bun", command: "bun add @api-zero/core" },
];

export function QuickStart() {
  return (
    <section className="border-fd-border border-t px-6 py-24">
      {/*
        A framed band rather than another flat row. The landing opens and closes
        on the same material, which is what stops the page reading as a stack of
        unrelated sections.
      */}
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-fd-border bg-fd-card px-6 py-20 sm:px-14">
        <CtaGrain />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-fd-card via-fd-card/85 to-fd-card/40"
        />
        <div className="relative">
          <Reveal>
            <p className="font-medium font-mono text-fd-primary text-sm">
              Get started
            </p>
            <h2 className="mt-3 text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
              One package to start
            </h2>
            <p className="mt-4 text-fd-muted-foreground">
              <code className="text-fd-primary">@api-zero/core</code> is all you
              need. React bindings and Zod contracts are separate packages you
              add only if your project already has React or Zod.
            </p>
          </Reveal>

          <Reveal delay={60} className="mt-10 max-w-xl">
            <Tabs items={MANAGERS.map((m) => m.name)}>
              {MANAGERS.map((manager) => (
                <Tab key={manager.name} value={manager.name}>
                  <DynamicCodeBlock lang="bash" code={manager.command} />
                </Tab>
              ))}
            </Tabs>
          </Reveal>

          <Reveal
            delay={120}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/docs/core/get-started/quickstart"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-fd-primary px-6 font-medium text-fd-primary-foreground text-sm transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.97]"
            >
              Your first request
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/docs/core/get-started/concepts"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-fd-border px-6 font-medium text-sm transition-[transform,background-color] duration-150 ease-out hover:bg-fd-accent active:scale-[0.97]"
            >
              How it works
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
