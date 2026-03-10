"use client";

import { Card, Chip } from "@heroui/react";
import LeaderboardTable from "@/components/LeaderboardTable";
import { RankedAvatar } from "@/components/RankedAvatar";
import { RankBadge } from "@/components/RankBadge";
import type { LeaderboardEntry } from "@/lib/types/gamification";
import type { CatalogFormat, CatalogGame } from "@/lib/types/catalog";

const medals = ["", "🥇", "🥈", "🥉"];

function TopThreeCards({ entries, type }: { entries: LeaderboardEntry[]; type: "xp" | "rating" }) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  const order = top3.length >= 3 ? [1, 0, 2] : top3.map((_, i) => i);
  const sizes = ["h-32", "h-40", "h-28"];

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-6 mb-8">
      {order.map((idx, pos) => {
        const entry = top3[idx];
        if (!entry) return null;
        const rank = entry.rank || idx + 1;
        return (
          <div
            key={entry.user_id || idx}
            className={`flex flex-col items-center ${sizes[pos]} justify-end relative`}
          >
            <span className="text-2xl mb-2 drop-shadow-md">{medals[rank] || rank}</span>
            <div className="mb-2">
              <RankedAvatar
                src={entry.avatar_url ?? undefined}
                fallback={entry.username?.charAt(0)?.toUpperCase()}
                elo={type === "rating" ? entry.rating : undefined}
                size="lg"
              />
            </div>
            <span className="font-bold text-sm truncate max-w-[80px] sm:max-w-[120px]" style={{ color: "var(--foreground)" }}>
              {entry.username}
            </span>
            {type === "rating" ? (
              <div className="mt-1">
                <RankBadge elo={entry.rating} size="sm" showIcon={false} />
              </div>
            ) : (
              <Chip size="sm" color="accent" variant="soft" className="mt-1 font-bold">
                {(entry.total_xp ?? 0).toLocaleString()} XP
              </Chip>
            )}
            {type === "rating" && (
              <span className="text-xs font-bold mt-1" style={{ color: "var(--accent)" }}>
                {entry.rating} ELO
              </span>
            )}
          </div>
        );
      })}
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
  const title = isXp ? "XP Global" : "Ratings ELO";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          {title}
          <Chip size="sm" className="bg-[var(--surface-secondary)] text-[var(--muted)] border-0">
            {entries.length} jugadores
          </Chip>
        </h2>
      </div>

      <TopThreeCards entries={entries} type={type} />

      {entries.length > 0 ? (
        <LeaderboardTable entries={entries} type={type} />
      ) : (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Card.Content className="py-14 text-center">
            <p className="text-3xl mb-3">{isXp ? "📊" : "⚔️"}</p>
            <p style={{ color: "var(--muted)" }}>
              {isXp
                ? "No hay datos de leaderboard disponibles."
                : "Selecciona un juego y formato en el panel lateral para ver el leaderboard de ratings."}
            </p>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
