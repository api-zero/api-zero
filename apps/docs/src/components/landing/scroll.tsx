"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ComponentProps } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Ties its children's position to the scroll position instead of to a clock.
 *
 * This is the one thing a CSS transition cannot do: the motion has to track the
 * scrollbar frame by frame, so it stays glued to the reader's gesture. Anything
 * with a fixed duration belongs in `Reveal` instead, which runs off the main
 * thread.
 */
export function Parallax({
  className,
  distance = -120,
  fade = true,
  ...props
}: ComponentProps<"div"> & { distance?: number; fade?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Anyone who asked their system for less motion gets the end state and no
      // scroll listener at all.
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(ref.current, {
          y: distance,
          opacity: fade ? 0.15 : 1,
          // Scrubbed motion must be linear. An eased curve fights the
          // scrollbar, and the element appears to lag behind the gesture.
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.4,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return <div ref={ref} className={cn(className)} {...props} />;
}

/**
 * Brings a group of siblings in one after another as the group enters view.
 *
 * The stagger is what makes a grid read as a list rather than as a single block
 * that blinks into place. Children opt in with `data-stagger`.
 */
export function Stagger({ className, ...props }: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-stagger]", {
          opacity: 0,
          y: 24,
          duration: 0.5,
          // Long enough to read as a sequence, short enough that the last card
          // is not still arriving after the reader has looked away.
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 80%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return <div ref={ref} className={cn(className)} {...props} />;
}
