import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared by the landing and the documentation, so the header is literally the
 * same component in both. Crossing between them changes the page, not the site.
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "api-zero",
    },
    githubUrl: "https://github.com/api-zero/api-zero",
    links: [
      { text: "Core", url: "/docs/core" },
      { text: "React", url: "/docs/react" },
      { text: "Zod", url: "/docs/zod" },
    ],
  };
}
