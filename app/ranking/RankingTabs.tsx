"use client";

import LeaderboardTable from "@/components/LeaderboardTable";
import { RankedAvatar } from "@/components/RankedAvatar";
import type { LeaderboardEntry } from "@/lib/types/gamification";
import type { CatalogFormat, CatalogGame } from "@/lib/types/catalog";

const medals = ["", "\u{1F947}", "\u{1F948}", "\u{1F949}"];
const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd for visual layout
const podiumPadding = ["pt-8", "pt-0", "pt-12"];

function TopThreeCards({ entries, type }: { entries: LeaderboardEntry[]; type: "xp" | "rating" }) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: "#1A1A1E",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
      }}
    >
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
              <span className={`${isFirst ? "text-3xl" : "text-2xl"} mb-1.5 drop-shadow-md`}>
                {medals[rank] || rank}
              </span>

              <div className={`mb-2 ${isFirst ? "scale-110" : ""}`}>
                <RankedAvatar
                  src={entry.avatar_url ?? undefined}
                  fallback={entry.username?.charAt(0)?.toUpperCase()}
                  elo={type === "rating" ? entry.rating : undefined}
                  size={isFirst ? "lg" : "md"}
                />
              </div>

              <span
                style={{
                  fontWeight: 700,
                  color: "#F2F2F2",
                  fontSize: 13,
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {entry.username}
              </span>

              {type === "rating" ? (
                <span style={{ fontSize: 12, fontWeight: 700, marginTop: 4, color: "#3B82F6" }}>
                  {entry.rating} ELO
                </span>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, marginTop: 4, color: "#3B82F6" }}>
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
      <TopThreeCards entries={entries} type={type} />

      {entries.length > 0 ? (
        <LeaderboardTable entries={entries} type={type} />
      ) : (
        <div
          style={{
            backgroundColor: "#1A1A1E",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "64px 24px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 40, marginBottom: 16 }}>{isXp ? "\u{1F4CA}" : "\u2694\uFE0F"}</p>
          <p style={{ fontSize: 18, fontWeight: 500, color: "#F2F2F2", margin: 0, marginBottom: 4 }}>
            {isXp ? "No hay datos de leaderboard" : "Selecciona un juego y formato"}
          </p>
          <p style={{ fontSize: 14, color: "#888891", margin: 0 }}>
            {isXp
              ? "Aun no hay jugadores en el ranking de XP."
              : "Usa los filtros de arriba para ver el leaderboard de ratings ELO."}
          </p>
        </div>
      )}
    </div>
  );
}
