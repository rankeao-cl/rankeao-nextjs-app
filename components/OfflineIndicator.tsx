"use client";

import { useEffect, useState } from "react";
import { usePWA } from "@/context/PWAContext";

export default function OfflineIndicator() {
  const { isOffline } = usePWA();
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setVisible(true);
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOffline]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 inset-x-0 z-40 flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold transition-transform duration-300"
      style={{
        background: "var(--danger)",
        color: "#fff",
        transform: show ? "translateY(0)" : "translateY(-100%)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse"
        aria-hidden
      />
      Sin conexión a internet
    </div>
  );
}
