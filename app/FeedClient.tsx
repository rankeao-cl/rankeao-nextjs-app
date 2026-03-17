"use client";

import { Avatar, Button } from "@heroui/react";
import { Pencil } from "@gravity-ui/icons";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function FeedHeader() {
  const { status, session } = useAuth();
  const isAuthenticated = status === "authenticated";

  return (
    <>
      {/* Create post card */}
      <div className="glass p-4">
        <div className="flex items-center gap-3">
          <Avatar size="sm" className="w-9 h-9 shrink-0">
            <Avatar.Fallback>{session?.username?.[0]?.toUpperCase() || "U"}</Avatar.Fallback>
          </Avatar>
          <Link href={isAuthenticated ? "/feed/new" : "/login"} className="flex-1">
            <div className="rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-tertiary)] transition-colors cursor-text">
              ¿Qué estás jugando hoy?
            </div>
          </Link>
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
            <Link href="/feed/new" className="flex-1">
              <button className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer">
                <Pencil className="size-4" />
                Publicar
              </button>
            </Link>
            <Link href="/marketplace/new" className="flex-1">
              <button className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer">
                🃏
                Vender carta
              </button>
            </Link>
            <Link href="/torneos/new" className="flex-1">
              <button className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer">
                🏆
                Crear torneo
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
