import { notFound } from "next/navigation";
import { getLLMText, source } from "@/lib/source";

export const revalidate = false;

/**
 * Serves a single page as raw Markdown.
 *
 * This is what the "Copy Markdown" button copies and what the view-options
 * popover opens, so a reader can hand an exact page to an LLM without the
 * site chrome around it.
 */
export async function GET(
  _request: Request,
  props: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
