"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Chip,
} from "@heroui/react";
import type { LeaderboardEntry } from "@/lib/api";

const medalColors = ["", "text-yellow-400", "text-gray-300", "text-amber-600"];
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
      className="surface-panel [&_th]:bg-purple-500/15 [&_th]:text-purple-100 [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wider [&_td]:text-sm [&_td]:border-b [&_td]:border-b-white/5"
    >
      <TableHeader>
        <TableColumn>#</TableColumn>
        <TableColumn>Jugador</TableColumn>
        {type === "xp" ? (
          <>
            <TableColumn>XP</TableColumn>
            <TableColumn>Nivel</TableColumn>
          </>
        ) : (
          <>
            <TableColumn>Rating</TableColumn>
            <TableColumn>Partidas</TableColumn>
          </>
        )}
      </TableHeader>
      <TableBody>
        {entries.length === 0 ? (
          <TableRow key="empty">
            <TableCell colSpan={4}>No hay datos disponibles.</TableCell>
          </TableRow>
        ) : entries.map((entry, i) => {
          const rank = entry.rank || i + 1;
          const isTop3 = rank <= 3;
          return (
            <TableRow
              key={entry.user_id || i}
              className={isTop3 ? "bg-purple-500/10" : ""}
            >
              <TableCell>
                <span className={`font-extrabold ${isTop3 ? medalColors[rank] : "text-gray-400"}`}>
                  {isTop3 ? medalEmoji[rank] : rank}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar
                    size="sm"
                    className={isTop3 ? "ring-2 ring-cyan-400/70" : ""}
                  >
                    <Avatar.Image src={entry.avatar_url ?? undefined} />
                    <Avatar.Fallback>
                      {entry.username?.charAt(0)?.toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar>
                  <span className={`font-semibold ${isTop3 ? "text-white" : "text-gray-300"}`}>
                    {entry.username || "Anónimo"}
                  </span>
                </div>
              </TableCell>
              {type === "xp" ? (
                <>
                  <TableCell>
                    <Chip size="sm" color="accent" variant="soft">
                      {(entry.total_xp ?? 0).toLocaleString()} XP
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-purple-400 font-medium">
                      Lv. {entry.level ?? "-"}
                    </span>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell>
                    <Chip size="sm" color="accent" variant="soft">
                      {entry.rating ?? "-"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-400">
                      {entry.games_played ?? "-"}
                    </span>
                  </TableCell>
                </>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
