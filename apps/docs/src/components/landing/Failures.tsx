"use client";

import { useEffect, useRef } from "react";
import { Reveal } from "./reveal";

/**
 * Every failure class, arriving at the same `catch`.
 *
 * A loop rather than a scroll-driven sequence on purpose: this is a list, not a
 * process. There is no order to walk through, so handing the reader a scrubber
 * would only ask them to do work the content does not need.
 */
export function Failures() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // A looping video playing off-screen costs battery for nothing, and anyone
    // who asked for less motion should never see it move at all.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.3 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="border-fd-border border-t px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="font-medium font-mono text-fd-primary text-sm">
            Error handling
          </p>
          <h2 className="mt-3 text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
            Eight ways to fail, one thing to catch
          </h2>
          <p className="mt-4 max-w-2xl text-fd-muted-foreground leading-relaxed">
            Native fetch splits these down the middle: a DNS failure rejects, a
            500 resolves, and your caller has to know which is which. Here they
            all arrive as an <code className="text-fd-primary">ApiError</code>{" "}
            carrying the status, the resolved URL, the attempt and the cause.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-12">
          <video
            ref={ref}
            className="w-full rounded-2xl border border-fd-border"
            poster="/failures-poster.png"
            muted
            loop
            playsInline
            preload="metadata"
            // Decorative: the paragraph above carries the meaning, and the
            // errors page carries the detail.
            aria-hidden
          >
            <source src="/failures.webm" type="video/webm" />
            <source src="/failures.mp4" type="video/mp4" />
          </video>
        </Reveal>
      </div>
    </section>
  );
}
