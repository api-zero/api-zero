import { glob, readFile } from "node:fs/promises";
import { printErrors, scanURLs, validateFiles } from "next-validate-link";

/**
 * Checks that every internal link in the documentation resolves to something
 * that exists. Dead links are the most common way documentation rots: a page
 * gets renamed, the build stays green, and the reader hits a 404.
 *
 * The docs route is a catch-all, so the scanner cannot enumerate the real pages
 * on its own — every link would be reported as missing. The page list is
 * derived from the content directory instead, which needs none of the
 * bundler machinery that importing the MDX source would.
 */
const files = [];
for await (const file of glob("content/docs/**/*.mdx")) files.push(file);

const toSlug = (path) =>
  path
    .replace(/^content\/docs\//, "")
    .replace(/\/?index\.mdx$/, "")
    .replace(/\.mdx$/, "")
    .split("/")
    .filter(Boolean);

const scanned = await scanURLs({
  preset: "next",
  populate: {
    "docs/[[...slug]]": files.map((file) => ({
      value: { slug: toSlug(file) },
    })),
  },
});

console.log(`scanned ${scanned.urls.size} URLs from ${files.length} pages`);

const results = await validateFiles(
  await Promise.all(
    files.map(async (path) => ({
      path,
      url: `/docs/${toSlug(path).join("/")}`,
      content: await readFile(path, "utf8"),
    })),
  ),
  {
    scanned,
    // Cards carry links too, and a broken one there looks identical to a
    // working one until someone clicks it.
    markdown: { components: { Card: { attributes: ["href"] } } },
    checkRelativePaths: "as-url",
  },
);

printErrors(results, true);
