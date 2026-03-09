"use client";

import { Table, Avatar, Chip } from "@heroui/react";
import type { LeaderboardEntry } from "@/lib/api";
import { RankedAvatar } from "./RankedAvatar";
import { RankBadge } from "./RankBadge";
import { UserDisplayName, getUserRoleData } from "./UserIdentity";

const medalColors = ["", "text-yellow-400", "text-zinc-300", "text-amber-700"];
const medalEmoji = ["", "🥇", "🥈", "🥉"];

interface Props {
  entries: LeaderboardEntry[];
  type?: "xp" | "rating";
}

export default function LeaderboardTable({ entries, type = "xp" }: Props) {
  return (
    <Table
      aria-label="Leaderboard"
      className="surface-panel border border-[var(--border)] rounded-xl overflow-hidden [&_table]:p-0 [&_table]:bg-transparent [&_th]:bg-[var(--surface-secondary)] [&_th]:text-[var(--muted)] [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wider [&_th]:border-b [&_th]:border-[var(--border)] [&_td]:text-sm [&_td]:border-b [&_td]:border-[var(--border)] [&_td]:py-3"
    >
      <Table.Header>
        <Table.Column>Posición</Table.Column>
        <Table.Column>Jugador</Table.Column>
        {type === "xp" ? (
          <>
            <Table.Column>Nivel</Table.Column>
            <Table.Column>Total XP</Table.Column>
          </>
        ) : (
          <>
            <Table.Column>ELO</Table.Column>
            <Table.Column>W/L Ratio</Table.Column>
            <Table.Column>Torneos</Table.Column>
          </>
        )}
      </Table.Header>
      <Table.Body>
        {entries.length === 0 ? (
          <Table.Row key="empty">
            <Table.Cell colSpan={type === "xp" ? 4 : 5} className="text-center py-8 text-[var(--muted)]">
              No hay datos disponibles.
            </Table.Cell>
          </Table.Row>
        ) : (
          entries.map((entry, i) => {
            const rank = entry.rank || i + 1;
            const isTop3 = rank <= 3;

            // Calculate W/L Ratio for rating boards
            let winRateStr = "-";
            if (type === "rating" && (entry.wins || entry.losses)) {
              const wins = entry.wins || 0;
              const losses = entry.losses || 0;
              const total = wins + losses;
              if (total > 0) {
                winRateStr = `${Math.round((wins / total) * 100)}%`;
              }
            }

            return (
              <Table.Row
                key={entry.user_id || i}
                className={isTop3 ? "bg-[var(--surface-secondary)]" : ""}
              >
                <Table.Cell>
                  <span
                    className={`font-extrabold ${isTop3 ? medalColors[rank] : "text-[var(--muted)]"}`}
                  >
                    {isTop3 ? medalEmoji[rank] : rank}
                  </span>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex items-center gap-3">
                    {type === "rating" ? (
                      <RankedAvatar
                        src={entry.avatar_url}
                        fallback={entry.username?.charAt(0)?.toUpperCase()}
                        elo={entry.rating}
                        size="sm"
                      />
                    ) : (
                      <Avatar
                        size="sm"
                        className={isTop3 ? "ring-2 ring-[var(--accent)]" : ""}
                      >
                        <Avatar.Image src={entry.avatar_url ?? undefined} />
                        <Avatar.Fallback>
                          {entry.username?.charAt(0)?.toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar>
                    )}

                    <div className="flex flex-col justify-center">
                      <UserDisplayName
                        user={getUserRoleData(entry)}
                        className={isTop3 ? "font-bold text-[var(--foreground)]" : "text-[var(--foreground)]"}
                      />
                      {type === "rating" && (
                        <div className="mt-0.5 sm:hidden">
                          <RankBadge elo={entry.rating} size="sm" />
                        </div>
                      )}
                    </div>

                    {/* Desktop Rank Badge */}
                    {type === "rating" && (
                      <div className="hidden sm:block ml-2">
                        <RankBadge elo={entry.rating} size="sm" showText={false} />
                      </div>
                    )}
                  </div>
                </Table.Cell>

                {type === "xp" ? (
                  <>
                    <Table.Cell>
                      <span className="text-[var(--foreground)] font-medium">
                        Lv. {entry.level ?? "-"}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Chip size="sm" color="accent" variant="soft">
                        {(entry.total_xp ?? 0).toLocaleString()} XP
                      </Chip>
                    </Table.Cell>
                  </>
                ) : (
                  <>
                    <Table.Cell>
                      <span className="font-bold text-[var(--accent)]">
                        {entry.rating ?? "-"}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-[var(--muted)]">{winRateStr}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-[var(--muted)]">
                        {entry.games_played ?? "-"}
                      </span>
                    </Table.Cell>
                  </>
                )}
              </Table.Row>
            );
          })
        )}
      </Table.Body>
    </Table>
  );
}
