import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { MessageCircleIcon } from "lucide-react";
import {
  AISearch,
  AISearchPanel,
  AISearchTrigger,
} from "@/components/ai/search";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { cn } from "@/lib/utils";

// Rendering the trigger without a key gives a button that fails on every
// question. A deployment without one simply does not offer the feature.
const askAiEnabled = Boolean(process.env.OPENROUTER_API_KEY);

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout tree={source.pageTree} {...baseOptions()}>
      {children}
      {askAiEnabled && (
        <AISearch>
          <AISearchPanel />
          <AISearchTrigger
            position="float"
            className={cn(
              buttonVariants({ color: "secondary" }),
              "rounded-2xl text-fd-muted-foreground",
            )}
          >
            <MessageCircleIcon className="size-4.5" />
            Ask AI
          </AISearchTrigger>
        </AISearch>
      )}
    </DocsLayout>
  );
}
