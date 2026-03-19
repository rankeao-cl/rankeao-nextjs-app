"use client";

import { Pencil, ShoppingCart, Cup, SquareDashed } from "@gravity-ui/icons";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const quickActions = [
  { href: "/feed/new", icon: <Pencil className="size-3.5" />, label: "Post" },
  { href: "/marketplace/new", icon: <ShoppingCart className="size-3.5" />, label: "Vender" },
  { href: "/decks/new", icon: <SquareDashed className="size-3.5" />, label: "Mazo" },
  { href: "/torneos/new", icon: <Cup className="size-3.5" />, label: "Torneo" },
];

export default function FeedHeader() {
  const { status, session } = useAuth();
  const isAuthenticated = status === "authenticated";

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-3">
      {/* Quick post widget */}
      <div className="border border-[var(--border)] rounded-[var(--card-radius)] bg-[var(--surface)] overflow-hidden">
        <div className="flex items-center gap-3 p-3.5">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[var(--foreground)]">
              {session?.username?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <Link href="/feed/new" className="flex-1">
            <div className="rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:border-[var(--accent)]/30 transition-colors cursor-text">
              ¿Qué estás pensando?
            </div>
          </Link>
        </div>
      </div>

      {/* Quick action buttons row */}
      <div className="flex items-center gap-2">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors"
          >
            {action.icon}
            <span>{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
