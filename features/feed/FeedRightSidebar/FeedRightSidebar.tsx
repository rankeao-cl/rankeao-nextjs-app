"use client";

import Link from "next/link";
import { Cup, ChevronRight } from "@gravity-ui/icons";
import TournamentCard from "@/features/tournament/TournamentCard";
import type { Tournament } from "@/lib/types/tournament";

export default function FeedRightSidebar({ tournaments }: { tournaments: Tournament[] }) {
  const upcomingTournaments = tournaments.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
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
