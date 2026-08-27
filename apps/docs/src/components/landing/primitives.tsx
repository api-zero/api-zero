import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * The landing's measure.
 *
 * Wider than the documentation's prose column on purpose: a docs page is read
 * line by line and wants a short measure, while a landing is scanned and wants
 * the room. Every section goes through this so they cannot drift apart.
 */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1400px] px-6 md:px-12", className)}
      {...props}
    />
  );
}

/** The small label above a section heading. */
export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "font-medium text-fd-primary text-sm uppercase tracking-[0.14em]",
        className,
      )}
      {...props}
    />
  );
}

const BUTTON_BASE =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 font-medium text-sm tracking-tight transition-[background-color,border-color,transform,opacity] duration-150 ease-out active:scale-[0.97]";

export const buttonStyles = {
  primary: cn(
    BUTTON_BASE,
    "bg-fd-primary text-fd-primary-foreground hover:opacity-90",
  ),
  secondary: cn(
    BUTTON_BASE,
    "border border-fd-border bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent",
  ),
};

/**
 * A code block that matches the documentation's.
 *
 * `DynamicCodeBlock` highlights at runtime and does not read the MDX pipeline's
 * `rehypeCodeOptions`, so without this the landing and the docs render the same
 * TypeScript in two different palettes.
 */
export function Code({
  code,
  lang = "ts",
  ...props
}: Omit<ComponentProps<typeof DynamicCodeBlock>, "options" | "lang"> & {
  lang?: string;
}) {
  return (
    <DynamicCodeBlock
      lang={lang}
      code={code}
      options={{
        themes: { light: "catppuccin-latte", dark: "catppuccin-mocha" },
      }}
      {...props}
    />
  );
}
