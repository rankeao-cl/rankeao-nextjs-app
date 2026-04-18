"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseHorizontalScrollOptions = {
  scrollAmount: number;
  resetKey?: unknown;
};

export function useHorizontalScroll({ scrollAmount, resetKey }: UseHorizontalScrollOptions) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, [update, resetKey]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      const rawDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (rawDelta === 0) return;
      e.preventDefault();
      e.stopPropagation();
      const unit = e.deltaMode === 1 ? 14 : e.deltaMode === 2 ? el.clientWidth : 1;
      const pxDelta = rawDelta * unit;
      const step = Math.sign(pxDelta) * Math.min(40, Math.max(10, Math.abs(pxDelta) * 0.28));
      el.scrollBy({ left: step, behavior: "auto" });
      update();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [update]);

  const scroll = useCallback(
    (direction: "left" | "right") => {
      const el = ref.current;
      if (!el) return;
      el.scrollBy({ left: direction === "right" ? scrollAmount : -scrollAmount, behavior: "smooth" });
    },
    [scrollAmount]
  );

  return { ref, canScrollLeft, canScrollRight, scroll };
}
