import { BookOpen, Github, Package, ScrollText } from "lucide-react";
import Link from "next/link";
import { buttonStyles, Container } from "./primitives";
import { CtaGrain } from "./shaders";

const PROMISES = [
  {
    icon: Package,
    title: "Three packages, one version",
    body: "core, react and zod ship in lockstep, so an upgrade is never a compatibility puzzle.",
  },
  {
    icon: ScrollText,
    title: "Every example compiles",
    body: "The 44 snippets in these docs are real files, type-checked against the published packages on every build.",
  },
  {
    icon: BookOpen,
    title: "Decisions written down",
    body: "Scope, supported Node versions and the release policy live in the repository as ADRs.",
  },
];

const LINKS = [
  {
    heading: "Core",
    items: [
      ["Installation", "/docs/core/get-started/installation"],
      ["Getting started", "/docs/core/get-started/quickstart"],
      ["Concepts", "/docs/core/get-started/concepts"],
      ["API reference", "/docs/core/api-reference/client"],
    ],
  },
  {
    heading: "Packages",
    items: [
      ["React bindings", "/docs/react"],
      ["Zod contracts", "/docs/zod"],
      ["FAQ", "/docs/core/help/faq"],
      ["Troubleshooting", "/docs/core/help/troubleshooting"],
    ],
  },
  {
    heading: "Project",
    items: [
      ["GitHub", "https://github.com/api-zero/api-zero"],
      ["npm", "https://www.npmjs.com/package/@api-zero/core"],
      [
        "Decision records",
        "https://github.com/api-zero/api-zero/tree/main/docs/adr",
      ],
      ["llms.txt", "/llms.txt"],
    ],
  },
];

/**
 * The closing block.
 *
 * A column of link lists is a sitemap, not an ending: it asks the reader to
 * pick from twelve equal options at exactly the moment they have decided
 * something. The promises and the two buttons come first, and the lists stay
 * below for the reader who wanted a sitemap after all.
 */
export function Footer() {
  return (
    <footer className="border-fd-border border-t pt-24 pb-12">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-fd-border bg-fd-card p-8 sm:p-14">
          <CtaGrain />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-fd-card via-fd-card/85 to-fd-card/40"
          />

          <div className="relative">
            <h2 className="max-w-2xl text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
              Stop maintaining the file. Start describing the API.
            </h2>

            <ul className="mt-12 grid gap-10 sm:grid-cols-3">
              {PROMISES.map((promise) => (
                <li key={promise.title}>
                  <span className="flex items-center gap-2.5 font-medium">
                    <promise.icon className="size-5 text-fd-primary" />
                    {promise.title}
                  </span>
                  <p className="mt-2.5 text-fd-muted-foreground text-sm leading-relaxed">
                    {promise.body}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-12 flex flex-wrap gap-3">
              <Link href="/docs/core" className={buttonStyles.primary}>
                Read the docs
              </Link>
              <Link
                href="https://github.com/api-zero/api-zero"
                target="_blank"
                rel="noreferrer"
                className={buttonStyles.secondary}
              >
                <Github className="size-4" />
                Open GitHub
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {LINKS.map((group) => (
            <div key={group.heading}>
              <p className="font-medium text-sm">{group.heading}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {group.items.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-fd-muted-foreground text-sm transition-colors duration-150 ease-out hover:text-fd-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-14 border-fd-border border-t pt-8 text-fd-muted-foreground text-sm">
          MIT licensed. Built by{" "}
          <Link
            href="https://github.com/gorkadev"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-fd-foreground"
          >
            gorkadev
          </Link>
          .
        </p>
      </Container>
    </footer>
  );
}
