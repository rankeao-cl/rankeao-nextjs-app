"use client";

import { Avatar } from "@heroui/react";
import { Pencil, ShoppingCart, Cup, SquareDashed } from "@gravity-ui/icons";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const quickActions = [
  { href: "/feed/new", icon: <Pencil className="size-4" />, label: "Post", color: "blue" },
  { href: "/marketplace/new", icon: <ShoppingCart className="size-4" />, label: "Vender", color: "orange" },
  { href: "/decks/new", icon: <SquareDashed className="size-4" />, label: "Mazo", color: "purple" },
  { href: "/torneos/new", icon: <Cup className="size-4" />, label: "Torneo", color: "emerald" },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  orange: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  purple: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  emerald: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
};

export default function FeedHeader() {
  const { status, session } = useAuth();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
      {/* Input row */}
      <div className="flex items-center gap-3 p-4">
        <Avatar size="sm" className="w-10 h-10 shrink-0 border border-[var(--border)]">
          <Avatar.Fallback className="text-sm font-bold">
            {session?.username?.[0]?.toUpperCase() || "?"}
          </Avatar.Fallback>
        </Avatar>
        <Link href={isAuthenticated ? "/feed/new" : "/login"} className="flex-1">
          <div className="rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:border-[var(--accent)]/30 transition-colors cursor-text">
            ¿Qué estás jugando hoy?
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      {isAuthenticated && (
        <div className="flex items-center border-t border-[var(--border)]">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${colorMap[action.color]}`}
            >
              {action.icon}
              <span className="hidden sm:inline">{action.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
