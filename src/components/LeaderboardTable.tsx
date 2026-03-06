"use client";

import {
  Table,
  Avatar,
  Chip,
} from "@heroui/react";
import type { LeaderboardEntry } from "@/lib/api";

const medalColors = ["", "text-zinc-200", "text-gray-300", "text-zinc-500"];
const medalEmoji = ["", "🥇", "🥈", "🥉"];

export default function LeaderboardTable({
  entries,
  type = "xp",
}: {
  entries: LeaderboardEntry[];
  type?: "xp" | "rating";
}) {
  return (
    <Table
      aria-label="Leaderboard"
      className="surface-panel [&_th]:bg-zinc-500/15 [&_th]:text-zinc-100 [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wider [&_td]:text-sm [&_td]:border-b [&_td]:border-b-white/5"
    >
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <Table.Column>#</Table.Column>
            <Table.Column>Jugador</Table.Column>
            {type === "xp" ? (
              <>
                <Table.Column>XP</Table.Column>
                <Table.Column>Nivel</Table.Column>
              </>
            ) : (
              <>
                <Table.Column>Rating</Table.Column>
                <Table.Column>Partidas</Table.Column>
              </>
            )}
          </Table.Header>
          <Table.Body>
            {entries.length === 0 ? (
              <Table.Row key="empty">
                <Table.Cell colSpan={4}>No hay datos disponibles.</Table.Cell>
              </Table.Row>
            ) : entries.map((entry, i) => {
              const rank = entry.rank || i + 1;
              const isTop3 = rank <= 3;
              return (
                <Table.Row
                  key={entry.user_id || i}
                  className={isTop3 ? "bg-zinc-500/10" : ""}
                >
                  <Table.Cell>
                    <span className={`font-extrabold ${isTop3 ? medalColors[rank] : "text-gray-400"}`}>
                      {isTop3 ? medalEmoji[rank] : rank}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <Avatar
                        size="sm"
                        className={isTop3 ? "ring-2 ring-zinc-300/70" : ""}
                      >
                        <Avatar.Fallback>
                          {entry.username?.charAt(0)?.toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar>
                      <span className={`font-semibold ${isTop3 ? "text-white" : "text-gray-300"}`}>
                        {entry.username || "Anónimo"}
                      </span>
                    </div>
                  </Table.Cell>
                  {type === "xp" ? (
                    <>
                      <Table.Cell>
                        <Chip size="sm" color="accent" variant="soft">
                          {(entry.total_xp ?? 0).toLocaleString()} XP
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-zinc-300 font-medium">
                          Lv. {entry.level ?? "-"}
                        </span>
                      </Table.Cell>
                    </>
                  ) : (
                    <>
                      <Table.Cell>
                        <Chip size="sm" color="accent" variant="soft">
                          {entry.rating ?? "-"}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-gray-400">
                          {entry.games_played ?? "-"}
                        </span>
                      </Table.Cell>
                    </>
                  )}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
