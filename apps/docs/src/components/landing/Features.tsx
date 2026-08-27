import {
  CircleAlert,
  Component,
  Network,
  RefreshCw,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { Reveal } from "./reveal";

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
  return (
    <section className="border-fd-border border-t px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <h2 className="text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
            What you get for those five lines
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-fd-border bg-fd-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.href} delay={index * 40}>
              <Link
                href={feature.href}
                className="group relative flex h-full flex-col bg-fd-card p-6 transition-colors duration-200 ease-out hover:bg-fd-accent after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-fd-primary after:opacity-0 after:transition-opacity after:duration-200 hover:after:opacity-100"
              >
                <feature.icon className={`size-5 ${feature.color}`} />
                <h3 className="mt-4 font-medium">{feature.title}</h3>
                <p className="mt-2 text-fd-muted-foreground text-sm leading-relaxed">
                  {feature.body}
                </p>
                <span className="mt-4 font-medium text-fd-primary text-sm opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100">
                  Read more →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
