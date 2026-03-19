"use client";

import Link from "next/link";
import { Cup, ShoppingCart, Persons, ArrowChevronRight } from "@gravity-ui/icons";

const suggestions = [
  {
    href: "/torneos",
    icon: <Cup className="size-5" />,
    title: "Explorar torneos",
    description: "Compite y sube en el ranking",
  },
  {
    href: "/marketplace",
    icon: <ShoppingCart className="size-5" />,
    title: "Buscar cartas",
    description: "Encuentra cartas y accesorios",
  },
  {
    href: "/buscar",
    icon: <Persons className="size-5" />,
    title: "Encontrar jugadores",
    description: "Conecta con la comunidad",
  },
];

export default function FeedEmptyState() {
  return (
    <div className="pt-12 pb-6 space-y-3">
      {/* Header */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4">
          <svg
            className="size-7 text-[var(--muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
            />
          </svg>
        </div>
        <p className="font-bold text-lg text-[var(--foreground)] mb-1">Tu feed esta vacio</p>
        <p className="text-sm text-[var(--muted)]">Descubre contenido</p>
      </div>

      {/* Suggestion cards */}
      {suggestions.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--card-radius)] p-4 hover:bg-[var(--surface-secondary)] transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center shrink-0 text-[var(--foreground)]">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
            <p className="text-xs text-[var(--muted)]">{item.description}</p>
          </div>
          <ArrowChevronRight className="size-4 text-[var(--muted)] shrink-0" />
        </Link>
      ))}
    </div>
  );
}
