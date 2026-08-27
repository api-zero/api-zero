"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CircleAlert,
  Component,
  Network,
  RefreshCw,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FEATURES = [
  {
    icon: CircleAlert,
    color: "text-red-500",
    title: "One error type",
    body: "A DNS failure rejects and a 500 resolves — in native fetch. Here every failure arrives as an ApiError with the status, the resolved URL, the attempt and the original cause.",
    href: "/docs/core/guides/errors",
  },
  {
    icon: RefreshCw,
    color: "text-orange-500",
    title: "Retries you can defend",
    body: "Off until you configure them. Then: idempotent methods only, Retry-After honoured, exponential backoff with jitter, and cancellation that lands mid-wait.",
    href: "/docs/core/guides/retries",
  },
  {
    icon: Workflow,
    color: "text-emerald-500",
    title: "A documented lifecycle",
    body: "Transforms, interceptors, transport, validation. Rejection handlers see every failure class, which is what makes a token-refresh interceptor possible at all.",
    href: "/docs/core/get-started/concepts",
  },
  {
    icon: Network,
    color: "text-teal-500",
    title: "Transport is a boundary",
    body: "One interface with one method. Swap it and the whole network layer is replaced — which is how the test suite runs with no server and no patched globals.",
    href: "/docs/core/guides/testing-with-transports",
  },
  {
    icon: ShieldCheck,
    color: "text-violet-500",
    title: "Contracts, not assertions",
    body: "api.get<User>() is a promise you make to yourself. Add @api-zero/zod and the schema produces both the check and the type, so they cannot disagree.",
    href: "/docs/zod",
  },
  {
    icon: Component,
    color: "text-cyan-500",
    title: "React without a wrapper",
    body: "ApiProvider and useApi. No cache, no useQuery — those belong to TanStack Query and SWR, and pairing with them is the intended setup.",
    href: "/docs/react",
  },
];

export function Features() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Below this width the track is narrower than the gap it would travel,
      // so there is nothing to pin and the cards simply scroll vertically.
      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const el = track.current;
          if (!el) return;

          // Measured, not guessed: the distance is however much of the track
          // hangs off the right edge, so adding a card cannot break the timing.
          const distance = () => el.scrollWidth - el.clientWidth;

          const tween = gsap.to(el, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: () => `+=${distance()}`,
              scrub: 0.6,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          return () => tween.kill();
        },
      );

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="border-fd-border border-t">
      <div className="flex min-h-[70vh] flex-col justify-center overflow-hidden py-24 lg:min-h-screen lg:py-0">
        <div className="mx-auto w-full max-w-5xl px-6">
          <p className="font-medium font-mono text-fd-primary text-sm">
            What you get
          </p>
          <h2 className="mt-3 text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
            Six things you would otherwise write yourself
          </h2>
        </div>

        {/*
          One element in both layouts: a wrapping grid until there is room to
          scroll sideways, then a single row wider than the viewport. Splitting
          it in two would mean two sources of truth for the same six cards.
        */}
        <div
          ref={track}
          className="mt-12 grid gap-5 px-6 sm:grid-cols-2 lg:flex lg:w-max lg:pr-[20vw] lg:pl-[max(1.5rem,calc((100vw-64rem)/2))]"
        >
          {FEATURES.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group flex flex-col rounded-2xl border border-fd-border bg-fd-card p-7 transition-colors duration-200 ease-out hover:border-fd-primary/40 lg:w-[22rem] lg:shrink-0"
            >
              <feature.icon className={`size-6 ${feature.color}`} />
              <h3 className="mt-5 font-medium text-lg">{feature.title}</h3>
              <p className="mt-3 flex-1 text-fd-muted-foreground text-sm leading-relaxed">
                {feature.body}
              </p>
              <span className="mt-6 font-medium text-fd-primary text-sm opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100">
                Read more &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
