import { Github } from "lucide-react";
import Link from "next/link";

const LINKS = [
  { href: "/docs/core", label: "Core" },
  { href: "/docs/react", label: "React" },
  { href: "/docs/zod", label: "Zod" },
];

export function Navbar() {
  return (
    // Sticky and translucent, matching the docs header: crossing between them
    // should not feel like arriving at a different site.
    <header className="sticky top-0 z-40 border-fd-border/60 border-b bg-fd-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
        <Link href="/" className="font-semibold text-sm tracking-tight">
          api-zero
        </Link>

        <div className="flex items-center gap-5">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-fd-muted-foreground text-sm transition-colors duration-200 ease-out hover:text-fd-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="https://github.com/api-zero/api-zero"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="ml-auto text-fd-muted-foreground transition-colors duration-200 ease-out hover:text-fd-foreground"
        >
          <Github className="size-4.5" />
        </Link>
      </nav>
    </header>
  );
}
