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
import { Container, Eyebrow } from "./primitives";

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

          // Measured against the viewport, not against the element. The track
          // is `w-max`, so it is exactly as wide as its content and never
          // overflows itself: scrollWidth and clientWidth are equal, and
          // measuring those gives zero — a pin with no length and no movement.
          const distance = () =>
            Math.max(0, el.scrollWidth - document.documentElement.clientWidth);

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
      <div className="relative flex min-h-[70vh] flex-col justify-center overflow-hidden py-24 lg:min-h-screen lg:py-0">
        {/*
          Two drifting washes behind the cards. Without them the row travels
          across a flat black field and the movement reads as a bug rather than
          as depth.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="landing-drift absolute top-[10%] left-[8%] size-[520px] rounded-full bg-fd-primary/12 blur-[120px]" />
          <div
            className="landing-drift absolute right-[6%] bottom-[6%] size-[420px] rounded-full bg-sky-500/10 blur-[120px]"
            style={{ animationDelay: "-9s", animationDirection: "reverse" }}
          />
        </div>

        <Container className="relative">
          <Eyebrow>What you get</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
            Six things you would otherwise write yourself
          </h2>
        </Container>

        {/*
          One element in both layouts: a wrapping grid until there is room to
          scroll sideways, then a single row wider than the viewport. Splitting
          it in two would mean two sources of truth for the same six cards.
        */}
        <div
          ref={track}
          className="relative mt-14 grid gap-5 px-6 sm:grid-cols-2 md:px-12 lg:flex lg:w-max lg:pr-[20vw] lg:pl-[max(3rem,calc((100vw-1400px)/2+3rem))]"
        >
          {FEATURES.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-fd-border bg-fd-card/70 p-8 backdrop-blur-xl transition-[transform,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-fd-border/80 lg:w-[24rem] lg:shrink-0"
            >
              {/*
                A wash that fills the card on hover instead of a coloured
                outline. An accent border on hover is the tell of a component
                nobody designed, and it fights the card's own edge.
              */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fd-primary/[0.07] to-transparent opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
              />
              <span className="relative grid size-11 place-items-center rounded-xl border border-fd-border bg-fd-background">
                <feature.icon className={`size-5 ${feature.color}`} />
              </span>
              <h3 className="relative mt-6 font-medium text-xl tracking-tight">
                {feature.title}
              </h3>
              <p className="relative mt-3 flex-1 text-fd-muted-foreground text-sm leading-relaxed">
                {feature.body}
              </p>
              <span className="relative mt-7 inline-flex items-center gap-1.5 font-medium text-fd-primary text-sm">
                Read more
                <span className="transition-transform duration-200 ease-out group-hover:translate-x-1">
                  &rarr;
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
