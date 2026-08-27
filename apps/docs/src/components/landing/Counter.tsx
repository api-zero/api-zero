"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Counts up to a number when it scrolls into view.
 *
 * A measured figure earns more attention than a printed one, and the count is
 * the cheapest way to say "this is measured" without a sentence saying so.
 * The final value is in the markup from the first render, so a reader with
 * scripting off or reduced motion set sees the real number, not a zero.
 */
export function Counter({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const node = ref.current;
        if (!node) return;

        const counter = { n: 0 };
        const tween: gsap.core.Tween = gsap.to(counter, {
          n: value,
          duration: 1.1,
          ease: "power2.out",
          onUpdate: () => {
            node.textContent = counter.n.toFixed(decimals) + suffix;
          },
          // Replays whenever it comes back into view. `once` meant a reader
          // who scrolled past and came back found a static number and no idea
          // anything had happened.
          scrollTrigger: {
            trigger: node,
            start: "top 85%",
            onEnter: () => tween.restart(),
            onEnterBack: () => tween.restart(),
          },
        });

        return () => tween.kill();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className="tabular-nums">
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
