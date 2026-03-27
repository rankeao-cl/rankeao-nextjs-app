"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cup, TargetDart, ChevronRight } from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import { getDuels } from "@/lib/api/duels";
import TournamentCard from "@/components/cards/TournamentCard";
import { FeedDuelSearchCard } from "@/components/cards";
import type { Tournament } from "@/lib/types/tournament";
import type { Duel } from "@/lib/types/duel";

export default function FeedRightSidebar({ tournaments }: { tournaments: Tournament[] }) {
  const { session, status } = useAuth();
  const isAuth = status === "authenticated";
  const [duels, setDuels] = useState<Duel[]>([]);

  useEffect(() => {
    if (!isAuth || !session?.accessToken) return;
    getDuels({ per_page: 10 }, session.accessToken)
      .then(({ duels }) => setDuels(duels.filter(d => d.status === "PENDING" || d.status === "IN_PROGRESS")))
      .catch(() => {});
  }, [isAuth, session?.accessToken]);

  const upcomingTournaments = tournaments.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 8 }}>
      {/* Duelos */}
      {isAuth && duels.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TargetDart style={{ width: 16, height: 16, color: "var(--accent)" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Duelos</span>
            </div>
            <Link href="/duelos" style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
              Ver todos <ChevronRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          {duels.slice(0, 5).map((d) => (
            <FeedDuelSearchCard key={d.id} duel={d} />
          ))}
        </div>
      )}

      {/* Torneos */}
      {upcomingTournaments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Cup style={{ width: 16, height: 16, color: "var(--accent)" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Torneos</span>
            </div>
            <Link href="/torneos" style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
              Ver todos <ChevronRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          {upcomingTournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
}
