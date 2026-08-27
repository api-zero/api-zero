"use client";

import { useEffect, useRef } from "react";
import { Reveal } from "./reveal";

/**
 * The request lifecycle, as a loop.
 *
 * A retry is a sequence in time, and prose describing one always reads as a
 * list of guarantees. Showing the failure, the wait and the second attempt is
 * the only honest way to explain what the retry policy buys.
 */
export function Lifecycle() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // A looping video that plays off-screen costs battery for nothing, and
    // anyone who asked for less motion should never see it move at all.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.35 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="border-fd-border border-t px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <h2 className="text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
            One call, and everything underneath it
          </h2>
          <p className="mt-4 max-w-2xl text-fd-muted-foreground leading-relaxed">
            A 500 does not reach your <code>catch</code> block on the first
            attempt. The response goes back through the policy you configured —
            idempotent method, exponential backoff, jitter — and only the last
            failure is yours to handle.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-10">
          <video
            ref={ref}
            className="w-full rounded-xl border border-fd-border"
            poster="/lifecycle-poster.png"
            muted
            loop
            playsInline
            preload="none"
            // Decorative: the paragraph above already carries the meaning, so a
            // screen reader gains nothing from being told a video is here.
            aria-hidden
          >
            <source src="/lifecycle.webm" type="video/webm" />
            <source src="/lifecycle.mp4" type="video/mp4" />
          </video>
        </Reveal>
      </div>
    </section>
  );
}
