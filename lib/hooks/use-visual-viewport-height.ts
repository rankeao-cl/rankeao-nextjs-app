"use client";

import { useEffect, useState } from "react";

/**
 * Returns the current visual viewport height in pixels, or null on server/unsupported.
 * Reflects on-screen keyboard resizing on mobile (unlike dvh/svh which don't account for it).
 */
export function useVisualViewportHeight() {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => setHeight(vv.height);
    update();

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return height;
}
