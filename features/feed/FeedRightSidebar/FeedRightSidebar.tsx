"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cup, TargetDart, ChevronRight } from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { getDuels } from "@/lib/api/duels";
import TournamentCard from "@/features/tournament/TournamentCard";
import FeedDuelSearchCard from "@/features/feed/FeedDuelSearchCard";
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
    <div className="flex flex-col gap-4">
      {/* Duelos */}
      {isAuth && duels.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <TargetDart className="w-4 h-4 text-foreground" />
              <span className="text-[14px] font-bold text-foreground">Duelos</span>
            </div>
            <Link href="/duelos" className="text-[12px] font-semibold text-accent no-underline flex items-center gap-0.5">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {duels.slice(0, 5).map((d) => (
            <FeedDuelSearchCard key={d.id} duel={d} />
          ))}
        </div>
      )}

      {/* Torneos */}
      {upcomingTournaments.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Cup className="w-4 h-4 text-foreground" />
              <span className="text-[14px] font-bold text-foreground">Torneos</span>
            </div>
            <Link href="/torneos" className="text-[12px] font-semibold text-accent no-underline flex items-center gap-0.5">
              Ver todos <ChevronRight className="w-3 h-3" />
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
