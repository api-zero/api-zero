"use client";

import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * WebGL shaders, loaded on the client only and after first paint.
 *
 * They cannot render on the server, and starting them immediately makes slower
 * devices error with uniforms that are not loaded yet — Fumadocs hits the same
 * thing and delays for the same reason.
 */
const GrainGradient = dynamic(
  () => import("@paper-design/shaders-react").then((m) => m.GrainGradient),
  { ssr: false },
);

const Dithering = dynamic(
  () => import("@paper-design/shaders-react").then((m) => m.Dithering),
  { ssr: false },
);

function useDelayedMount(delay = 400) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(id);
  }, [delay]);
  return ready;
}

/** The grainy field behind the hero. Orange, matching the accent. */
export function HeroGrain() {
  const { resolvedTheme } = useTheme();
  const ready = useDelayedMount();
  if (!ready) return null;

  return (
    <GrainGradient
      className="absolute inset-0 animate-fd-fade-in duration-1000"
      colors={
        resolvedTheme === "dark"
          ? ["#FF8A2B", "#B03A00", "#3A140000"]
          : ["#FFB067", "#FF7A18", "#7A2A0020"]
      }
      colorBack="#00000000"
      softness={1}
      intensity={0.85}
      noise={0.5}
      speed={0.6}
      shape="corners"
      minPixelRatio={1}
      maxPixelCount={1920 * 1080}
    />
  );
}

/** The halftone sphere. Decorative, and the only round shape on the page. */
export function HeroSphere() {
  const { resolvedTheme } = useTheme();
  const ready = useDelayedMount(500);
  if (!ready) return null;

  return (
    <Dithering
      className="absolute -right-28 -top-32 opacity-70 animate-fd-fade-in duration-1000"
      width={480}
      height={480}
      colorBack="#00000000"
      colorFront={resolvedTheme === "dark" ? "#FF7A18" : "#E4560A"}
      shape="sphere"
      type="4x4"
      speed={0.4}
      minPixelRatio={1}
    />
  );
}
