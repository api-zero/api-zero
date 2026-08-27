import Link from "next/link";

const SECTIONS = [
  {
    title: "Core",
    links: [
      { href: "/docs/core/get-started/installation", label: "Installation" },
      { href: "/docs/core/get-started/quickstart", label: "Getting started" },
      { href: "/docs/core/get-started/concepts", label: "Concepts" },
      { href: "/docs/core/api-reference/api-client", label: "API reference" },
    ],
  },
  {
    title: "Packages",
    links: [
      { href: "/docs/react", label: "React bindings" },
      { href: "/docs/zod", label: "Zod contracts" },
      { href: "/docs/core/help/faq", label: "FAQ" },
      { href: "/docs/core/help/troubleshooting", label: "Troubleshooting" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "https://github.com/api-zero/api-zero", label: "GitHub" },
      { href: "https://www.npmjs.com/org/api-zero", label: "npm" },
      {
        href: "https://github.com/api-zero/api-zero/tree/main/docs/adr",
        label: "Decision records",
      },
      { href: "/llms.txt", label: "llms.txt" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-fd-border border-t px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 sm:grid-cols-3">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="font-medium text-sm">{section.title}</h2>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-fd-muted-foreground text-sm transition-colors duration-200 ease-out hover:text-fd-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 border-fd-border border-t pt-8 text-fd-muted-foreground text-sm">
          MIT licensed. Built by{" "}
          <Link
            href="https://github.com/gorkadev"
            target="_blank"
            rel="noreferrer"
            className="text-fd-foreground transition-opacity duration-200 ease-out hover:opacity-80"
          >
            gorkadev
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
