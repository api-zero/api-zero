"use client";

import type { ComponentProps } from "react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * Tracks the pointer across a group of cards and lights the one under it.
 *
 * Every card reads two custom properties this sets, so the highlight follows
 * the cursor continuously instead of snapping on at the card boundary. A
 * translate-on-hover is a state change pretending to be motion; this is the
 * pointer's actual position, which is the only thing on the page that already
 * knows where the reader is looking.
 *
 * Written to CSS properties rather than to React state on purpose: this fires
 * on every pointer move, and a re-render per frame would cost more than the
 * effect is worth.
 */
export function Spotlight({
  className,
  onPointerMove,
  ...props
}: ComponentProps<"div">) {
  const track = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      for (const card of event.currentTarget.querySelectorAll<HTMLElement>(
        "[data-spotlight]",
      )) {
        const box = card.getBoundingClientRect();
        card.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
        card.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
      }
      onPointerMove?.(event);
    },
    [onPointerMove],
  );

  return (
    <div
      onPointerMove={track}
      className={cn("group/spotlight", className)}
      {...props}
    />
  );
}
