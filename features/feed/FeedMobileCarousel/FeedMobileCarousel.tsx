"use client";

import Link from "next/link";
import { Cup, Persons, ChevronRight } from "@gravity-ui/icons";
import type { Tournament } from "@/lib/types/tournament";

const STATUS_COLORS: Record<string, string> = {
  ROUND_IN_PROGRESS: "var(--success)", STARTED: "var(--success)",
  CHECK_IN: "var(--warning)", OPEN: "var(--accent)",
  in_progress: "var(--success)", check_in: "var(--warning)",
  registration: "var(--accent)", upcoming: "var(--accent)",
};
const STATUS_LABELS: Record<string, string> = {
  ROUND_IN_PROGRESS: "En vivo", STARTED: "En curso",
  CHECK_IN: "Check-in", OPEN: "Abierto",
  in_progress: "En vivo", check_in: "Check-in",
  registration: "Abierto", upcoming: "Próximo",
};

export default function FeedMobileCarousel({ tournaments }: { tournaments: Tournament[] }) {
  const items = tournaments.slice(0, 8);
  if (items.length === 0) return null;

  return (
    <div className="lg:hidden" style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Cup style={{ width: 14, height: 14, color: "var(--accent)" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>Torneos</span>
        </div>
        <Link href="/torneos" style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
          Ver todos <ChevronRight style={{ width: 10, height: 10 }} />
        </Link>
      </div>

      <div
        className="feed-mobile-torneos"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          scrollbarWidth: "none",
          scrollSnapType: "x mandatory",
        }}
      >
        {items.map((t) => {
          const sColor = STATUS_COLORS[t.status] ?? "var(--muted)";
          const sLabel = STATUS_LABELS[t.status] ?? t.status;
          const registered = t.registered_count ?? t.current_players ?? 0;

          return (
            <Link
              key={t.id}
              href={`/torneos/${t.slug ?? t.id}`}
              style={{
                textDecoration: "none",
                flexShrink: 0,
                width: 150,
                scrollSnapAlign: "start",
                backgroundColor: "var(--surface-solid)",
                borderRadius: 12,
                border: "1px solid var(--border)",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {/* Name */}
              <span style={{
                fontSize: 13, fontWeight: 700, color: "var(--foreground)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {t.name}
              </span>

              {/* Game */}
              {(t.game_name || t.game) && (
                <span style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.game_name || t.game}
                </span>
              )}

              {/* Status + participants */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: sColor,
                  backgroundColor: `color-mix(in srgb, ${sColor} 12%, transparent)`,
                  padding: "2px 7px", borderRadius: 999,
                  display: "inline-flex", alignItems: "center", gap: 3,
                }}>
                  {["in_progress", "ROUND_IN_PROGRESS", "STARTED"].includes(t.status) && (
                    <span style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: sColor, animation: "pulse 1.6s ease-in-out infinite" }} />
                  )}
                  {sLabel}
                </span>
                <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                  <Persons style={{ width: 10, height: 10 }} />
                  {registered}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        .feed-mobile-torneos::-webkit-scrollbar { display: none; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
