"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STAGES = ["Request", "Interceptors", "Transport", "Response", "Validate"];

/** One pipeline node. The lit copy sits on top of the dim one and fades in. */
function Node({ index, label }: { index: number; label: string }) {
  return (
    <div className="relative shrink-0 rounded-xl border border-fd-border bg-fd-card px-4 py-3 font-medium text-sm sm:px-6 sm:py-4 sm:text-base">
      {/* Reserves the box; both visible copies are absolutely positioned. */}
      <span className="invisible">{label}</span>
      <span className="absolute inset-0 grid place-items-center text-fd-muted-foreground">
        {label}
      </span>
      <span
        data-node={index}
        className="absolute inset-0 grid place-items-center rounded-xl border border-fd-primary bg-fd-primary/10 text-fd-primary opacity-0 shadow-[0_0_24px_-4px_var(--color-fd-primary)]"
      >
        {label}
      </span>
      <span
        data-node-fail={index}
        className="absolute inset-0 grid place-items-center rounded-xl border border-red-500 bg-red-500/10 text-red-400 opacity-0 shadow-[0_0_24px_-4px_var(--color-red-500)]"
      >
        {label}
      </span>
      <span
        data-node-ok={index}
        className="absolute inset-0 grid place-items-center rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-400 opacity-0 shadow-[0_0_24px_-4px_var(--color-emerald-500)]"
      >
        {label}
      </span>
    </div>
  );
}

function Beam({ index }: { index: number }) {
  return (
    <div className="h-px min-w-4 flex-1 bg-fd-border">
      {/* scaleX rather than width: a width animation relayouts the whole row. */}
      <span
        data-beam={index}
        className="block h-full w-full origin-left scale-x-0 bg-fd-primary"
      />
    </div>
  );
}

function Status({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      data-status={id}
      className={`absolute inset-x-0 top-0 font-mono text-sm opacity-0 sm:text-base ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * The request lifecycle, advanced by the reader's scroll.
 *
 * A retry is a sequence in time, and prose describing one always reads as a
 * list of guarantees. This was a looping video first, which was worse in two
 * ways: nobody controls it, so most readers meet it mid-cycle with no idea what
 * they are looking at, and it cannot be paused on the failure — which is the
 * only frame that matters.
 */
export function Lifecycle() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Pinning a section on a phone hijacks a scroll gesture people use to
      // escape. Small screens get the finished state instead.
      mm.add(
        {
          animate:
            "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
          static: "(max-width: 767px), (prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { animate } = context.conditions as { animate: boolean };

          if (!animate) {
            gsap.set("[data-node='4'], [data-node-ok='3'], [data-result]", {
              opacity: 1,
            });
            gsap.set("[data-beam]", { scaleX: 1 });
            gsap.set("[data-status='ok']", { opacity: 1 });
            return;
          }

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              // Three viewports of scroll for nine beats. Less and the reader
              // cannot stop on the failure; more and it feels like the page
              // has stopped responding.
              end: "+=300%",
              scrub: 0.6,
              pin: true,
              anticipatePin: 1,
            },
          });

          tl.to("[data-call]", { opacity: 1, y: 0, duration: 0.6 })
            .to("[data-node='0']", { opacity: 1, duration: 0.4 })
            .to("[data-beam='0']", { scaleX: 1, duration: 0.5 })
            .to("[data-node='1']", { opacity: 1, duration: 0.4 })
            .to("[data-beam='1']", { scaleX: 1, duration: 0.5 })
            .to("[data-node='2']", { opacity: 1, duration: 0.4 })
            .to("[data-beam='2']", { scaleX: 1, duration: 0.5 })
            .to("[data-node-fail='3']", { opacity: 1, duration: 0.4 })
            .to("[data-status='fail']", { opacity: 1, duration: 0.3 }, "<")

            // The wait. Everything upstream dims, the failure stays lit: a
            // pipeline that goes dark here reads as "nothing is happening",
            // which is the opposite of what a retry is.
            .to("[data-node='0'], [data-node='1'], [data-node='2']", {
              opacity: 0.25,
              duration: 0.4,
            })
            .to(
              "[data-beam='0'], [data-beam='1'], [data-beam='2']",
              {
                opacity: 0.25,
                duration: 0.4,
              },
              "<",
            )
            .to("[data-backoff-wrap]", { opacity: 1, duration: 0.3 }, "<")
            .to("[data-backoff]", { scaleX: 1, duration: 2 })

            // Second attempt.
            .to("[data-backoff-wrap]", { opacity: 0, duration: 0.3 })
            .to("[data-status='fail']", { opacity: 0, duration: 0.3 }, "<")
            .to("[data-node-fail='3']", { opacity: 0, duration: 0.3 }, "<")
            .to(
              "[data-node='0'], [data-node='1'], [data-node='2'], [data-beam='0'], [data-beam='1'], [data-beam='2']",
              { opacity: 1, duration: 0.4 },
            )
            .to("[data-node-ok='3']", { opacity: 1, duration: 0.4 })
            .to("[data-status='ok']", { opacity: 1, duration: 0.3 }, "<")
            .to("[data-beam='3']", { scaleX: 1, duration: 0.5 })
            .to("[data-node='4']", { opacity: 1, duration: 0.4 })
            .to("[data-result]", { opacity: 1, y: 0, duration: 0.6 })
            // A beat of stillness at the end, so the last thing the reader
            // scrolls past is the finished result rather than a jump cut.
            .to({}, { duration: 0.8 });

          return () => tl.kill();
        },
      );

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="border-fd-border border-t">
      <div className="flex min-h-[70vh] items-center px-6 py-24 md:min-h-screen md:py-0">
        <div className="mx-auto w-full max-w-5xl">
          <p className="font-medium font-mono text-fd-primary text-sm">
            The request lifecycle
          </p>
          <h2 className="mt-3 text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
            One call, and everything underneath it
          </h2>
          <p className="mt-4 max-w-2xl text-fd-muted-foreground leading-relaxed">
            A 500 does not reach your <code>catch</code> block on the first
            attempt. Keep scrolling to walk a request through the policy you
            configured.
          </p>

          <div
            data-call
            className="mt-12 translate-y-3 font-mono text-lg opacity-0 sm:text-2xl"
          >
            <span className="text-fd-muted-foreground">await </span>api.
            <span className="text-fd-primary">get</span>
            <span className="text-fd-muted-foreground">&lt;User&gt;(</span>
            <span className="text-emerald-400">"/users/1"</span>
            <span className="text-fd-muted-foreground">)</span>
          </div>

          <div className="mt-10 flex items-center gap-2 overflow-x-auto pb-2 sm:gap-3">
            {STAGES.map((stage, i) => (
              <div key={stage} className="contents">
                {i > 0 && <Beam index={i - 1} />}
                <Node index={i} label={stage} />
              </div>
            ))}
          </div>

          <div className="relative mt-10 h-6">
            <Status id="fail" className="text-red-400">
              500 Internal Server Error · attempt 1 of 3
            </Status>
            <Status id="ok" className="text-emerald-400">
              200 OK · retried once, never surfaced to your code
            </Status>
          </div>

          <div data-backoff-wrap className="mt-2 opacity-0">
            <p className="mb-3 text-fd-muted-foreground text-sm">
              Exponential backoff with jitter — waiting 1.0s
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-fd-border">
              <span
                data-backoff
                className="block h-full w-full origin-left scale-x-0 rounded-full bg-fd-primary"
              />
            </div>
          </div>

          <div
            data-result
            className="mt-8 translate-y-3 font-mono text-emerald-400 text-sm opacity-0 sm:text-base"
          >
            User &#123; id: 1, name: "Ada" &#125;
          </div>
        </div>
      </div>
    </section>
  );
}
