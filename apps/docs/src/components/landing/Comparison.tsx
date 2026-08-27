import Link from "next/link";
import { Reveal } from "./reveal";

const STATS = [
  {
    value: "6.0 kB",
    label: "@api-zero/core, gzipped",
    body: "Measured from the published bundle on every CI run, with a budget that fails the build if it grows.",
  },
  {
    value: "0.7 kB",
    label: "@api-zero/react",
    body: "A provider and a hook. Everything else is core, which you would install anyway.",
  },
  {
    value: "0",
    label: "runtime dependencies",
    body: "Native fetch. Zod and React are peer dependencies of their own packages, never bundled.",
  },
  {
    value: "44",
    label: "compiled examples",
    body: "Every snippet in these docs is a real file, type-checked against the published packages on every build.",
  },
];

export function Comparison() {
  return (
    <section className="border-fd-border border-t px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <h2 className="text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
            Numbers we actually measure
          </h2>
          <p className="mt-4 max-w-2xl text-fd-muted-foreground">
            We do not publish a comparison table against other libraries. Their
            numbers are not ours to claim, and a table like that ages badly.
            These are ours, and CI keeps them honest.
          </p>
        </Reveal>

        <dl className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 40}>
              <dt className="font-semibold text-4xl tracking-tight">
                {stat.value}
              </dt>
              <dd className="mt-2 font-medium text-sm">{stat.label}</dd>
              <dd className="mt-2 text-fd-muted-foreground text-sm leading-relaxed">
                {stat.body}
              </dd>
            </Reveal>
          ))}
        </dl>

        <Reveal delay={160} className="mt-12">
          <Link
            href="/docs/core"
            className="font-medium text-fd-primary text-sm transition-opacity duration-200 ease-out hover:opacity-80"
          >
            How the three packages split →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
