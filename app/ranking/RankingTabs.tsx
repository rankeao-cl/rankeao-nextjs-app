"use client";

import { Card, Chip } from "@heroui/react";
import LeaderboardTable from "@/components/LeaderboardTable";
import { RankedAvatar } from "@/components/RankedAvatar";
import { RankBadge } from "@/components/RankBadge";
import type { LeaderboardEntry } from "@/lib/types/gamification";
import type { CatalogFormat, CatalogGame } from "@/lib/types/catalog";

const medals = ["", "🥇", "🥈", "🥉"];
const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd for visual layout
const podiumPadding = ["pt-8", "pt-0", "pt-12"]; // silver shorter, gold tallest, bronze shortest

function TopThreeCards({ entries, type }: { entries: LeaderboardEntry[]; type: "xp" | "rating" }) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div className="glass p-4 sm:p-6 mb-6">
      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {podiumOrder.map((idx, pos) => {
          const entry = top3[idx];
          if (!entry) return null;
          const rank = entry.rank || idx + 1;
          const isFirst = pos === 1;

          return (
            <div
              key={entry.user_id || idx}
              className={`flex flex-col items-center ${podiumPadding[pos]}`}
            >
              {/* Medal */}
              <span className={`${isFirst ? "text-3xl" : "text-2xl"} mb-1.5 drop-shadow-md`}>
                {medals[rank] || rank}
              </span>

              {/* Avatar */}
              <div className={`mb-2 ${isFirst ? "scale-110" : ""}`}>
                <RankedAvatar
                  src={entry.avatar_url ?? undefined}
                  fallback={entry.username?.charAt(0)?.toUpperCase()}
                  elo={type === "rating" ? entry.rating : undefined}
                  size={isFirst ? "lg" : "md"}
                />
              </div>

              {/* Name */}
              <span className="font-bold text-xs sm:text-sm truncate max-w-[70px] sm:max-w-[120px] text-[var(--foreground)]">
                {entry.username}
              </span>

              {/* Score */}
              {type === "rating" ? (
                <span className="text-xs font-bold mt-1 text-[var(--accent)]">
                  {entry.rating} ELO
                </span>
              ) : (
                <span className="text-xs font-bold mt-1 text-[var(--accent)]">
                  {(entry.total_xp ?? 0).toLocaleString()} XP
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  xpEntries: LeaderboardEntry[];
  ratingEntries: LeaderboardEntry[];
  games: CatalogGame[];
  formats: CatalogFormat[];
  selectedGameSlug?: string;
  selectedFormatSlug?: string;
  selectedTab: "xp" | "ratings";
}

export default function RankingTabs({
  xpEntries,
  ratingEntries,
  selectedTab,
}: Props) {
  const isXp = selectedTab === "xp";
  const entries = isXp ? xpEntries : ratingEntries;
  const type = isXp ? "xp" : "rating";

  return (
    <div>
      {/* Podium */}
      <TopThreeCards entries={entries} type={type} />

      {/* Table */}
      {entries.length > 0 ? (
        <LeaderboardTable entries={entries} type={type} />
      ) : (
        <Card className="glass">
          <Card.Content className="py-16 text-center">
            <p className="text-4xl mb-4">{isXp ? "📊" : "⚔️"}</p>
            <p className="text-lg font-medium text-[var(--foreground)]">
              {isXp ? "No hay datos de leaderboard" : "Selecciona un juego y formato"}
            </p>
            <p className="text-sm mt-1 text-[var(--muted)]">
              {isXp
                ? "Aún no hay jugadores en el ranking de XP."
                : "Usa los filtros de arriba para ver el leaderboard de ratings ELO."}
            </p>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
