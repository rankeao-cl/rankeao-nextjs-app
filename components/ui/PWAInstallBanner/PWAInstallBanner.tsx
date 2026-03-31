"use client";

import { useEffect, useState } from "react";
import { usePWA } from "@/context/PWAContext";

export default function PWAInstallBanner() {
  const { canInstall, install, dismissInstall, hasUpdate, applyUpdate } =
    usePWA();
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Delay showing the install prompt so it's not intrusive on first load
  useEffect(() => {
    if (!canInstall && !hasUpdate) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, [canInstall, hasUpdate]);

  if (!mounted || (!canInstall && !hasUpdate)) return null;

  // Update available banner takes priority
  if (hasUpdate) {
    return (
      <div className="fixed bottom-[76px] lg:bottom-6 inset-x-4 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-sm z-40">
        <div
          className="transition-all duration-300"
          style={{
            opacity: show ? 1 : 0,
            transform: `translateY(${show ? "0" : "16px"})`,
          }}
        >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
          style={{
            background: "var(--surface-solid)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--accent)" }}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              Nueva versión disponible
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Actualiza para ver los últimos cambios
            </p>
          </div>
          <button
            onClick={applyUpdate}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Actualizar
          </button>
        </div>
      </div>
      </div>
    );
  }

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-[76px] lg:bottom-6 inset-x-4 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-sm z-40">
      <div
        className="transition-all duration-300"
        style={{
          opacity: show ? 1 : 0,
          transform: `translateY(${show ? "0" : "16px"})`,
        }}
      >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
        style={{
          background: "var(--surface-solid)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: "var(--accent)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt="Rankeao"
            className="w-10 h-10 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-tight"
            style={{ color: "var(--foreground)" }}
          >
            Instala Rankeao
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Accede más rápido desde tu pantalla
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={dismissInstall}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:opacity-70"
            style={{ color: "var(--muted)" }}
            aria-label="Cerrar"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button
            onClick={install}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Instalar
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
