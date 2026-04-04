"use client";

import Link from "next/link";
import { Cup, ChevronRight } from "@gravity-ui/icons";
import type { Tournament } from "@/lib/types/tournament";
import TournamentCard from "@/features/tournament/TournamentCard";

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
        {items.map((t) => (
          <div key={t.id} style={{ flexShrink: 0, width: "75vw", maxWidth: 360, scrollSnapAlign: "start" }}>
            <TournamentCard tournament={t} />
          </div>
        ))}
      </div>

      <style>{`
        .feed-mobile-torneos::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
