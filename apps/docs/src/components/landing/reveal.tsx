"use client";

import { type ComponentProps, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveals its children once, when they scroll into view.
 *
 * Deliberately CSS rather than a motion library: these are predetermined
 * entrance animations, and CSS transitions run off the main thread. The landing
 * page animates while Next is still hydrating and prefetching the docs, which
 * is exactly when a main-thread animation drops frames.
 */
export function Reveal({
  className,
  delay = 0,
  ...props
}: ComponentProps<"div"> & { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      // Start slightly before the element is fully in view, so the motion has
      // finished by the time the reader's eye arrives.
      { rootMargin: "-64px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-shown={shown || undefined}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn("landing-reveal", className)}
      {...props}
    />
  );
}
