"use client";

import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import Link from "fumadocs-core/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function HoverCard(
  props: ComponentProps<typeof HoverCardPrimitive.Root>,
) {
  return (
    <HoverCardPrimitive.Root openDelay={200} closeDelay={100} {...props} />
  );
}

/**
 * An internal documentation link. Underlined and accent-coloured so it reads as
 * a link inside prose, and it previews its target on hover.
 */
export function HoverCardTrigger({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <HoverCardPrimitive.Trigger asChild>
      <Link
        className={cn(
          "font-medium text-fd-primary underline decoration-fd-primary/40 underline-offset-4 transition-colors hover:decoration-fd-primary",
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Trigger>
  );
}

export function HoverCardContent({
  className,
  ...props
}: ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        sideOffset={8}
        collisionPadding={16}
        className={cn(
          "z-50 max-w-xs rounded-lg border bg-fd-popover p-3 text-fd-popover-foreground shadow-lg",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
}
