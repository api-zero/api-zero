import Link from "fumadocs-core/link";
import { PathUtils } from "fumadocs-core/source";
import {
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getPageImage, source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = `/api/md/${page.slugs.join("/")}`;
  const githubUrl = `https://github.com/api-zero/api-zero/blob/main/apps/docs/content/docs/${page.path}`;

  return (
    <DocsPage
      toc={page.data.toc}
      full={false}
      tableOfContent={{
        style: "clerk",
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover markdownUrl={markdownUrl} githubUrl={githubUrl} />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // Internal links resolve to their target page and preview its title
            // and description on hover, so a reader can tell whether a link is
            // worth following without leaving the paragraph.
            a({ href, ...props }) {
              const found = source.getPageByHref(href ?? "", {
                dir: PathUtils.dirname(page.path),
              });

              if (!found) return <Link href={href} {...props} />;

              const target = found.hash
                ? `${found.page.url}#${found.hash}`
                : found.page.url;

              return (
                <HoverCard>
                  <HoverCardTrigger href={target} {...props} />
                  <HoverCardContent>
                    <p className="font-medium text-sm">
                      {found.page.data.title}
                    </p>
                    <p className="mt-1 text-fd-muted-foreground text-sm">
                      {found.page.data.description}
                    </p>
                  </HoverCardContent>
                </HoverCard>
              );
            },
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
