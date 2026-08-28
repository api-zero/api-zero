"use client";

import { useEffect } from "react";

/**
 * Turns on scroll snapping for as long as the landing is mounted.
 *
 * `scroll-snap-type` only does anything on the scroll container, and here that
 * is the root element — the documentation pages share it, so the property
 * cannot simply live in the stylesheet. This adds it on mount and takes it away
 * on unmount, which is also what makes the transition into the docs normal
 * again the moment a reader follows a link.
 */
export function SnapScroll() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("landing-snapping");
    return () => root.classList.remove("landing-snapping");
  }, []);

  return null;
}
