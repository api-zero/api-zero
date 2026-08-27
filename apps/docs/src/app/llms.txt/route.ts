import { llms } from "fumadocs-core/source/llms";
import { source } from "@/lib/source";

export const revalidate = false;

/**
 * A lightweight index of every documentation page, for AI agents to discover
 * what exists before fetching anything.
 *
 * This is the map; `/llms-full.txt` is the territory. An agent that needs one
 * page can find it here and fetch it through `/api/md/<slug>` rather than
 * pulling 195 kB it will mostly discard.
 */
export function GET() {
  // The generated heading is the collection name, "Docs", which tells an agent
  // nothing about whose documentation it just fetched. renderName is not called
  // for the root node, so the heading is replaced here.
  const index = llms(source)
    .index()
    .replace(
      /^# .*/,
      "# api-zero\n\n> A small Fetch-based HTTP client built around reliable transport and runtime-validated contracts. Pairs with TanStack Query or SWR rather than competing with them.",
    );

  return new Response(index, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
