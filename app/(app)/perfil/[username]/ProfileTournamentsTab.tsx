"use client";

import { Card, Chip } from "@heroui/react";
import { Cup, Clock } from "@gravity-ui/icons";
import Link from "next/link";
import type { UserTournamentHistoryEntry } from "@/lib/types/rating";

const placeEmoji: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

interface TournamentStats {
    total_tournaments?: number;
    total_wins?: number;
    top4_finishes?: number;
    win_rate?: number;
}

export default function ProfileTournamentsTab({
    tournaments,
    stats,
    tournamentsPlayed,
    tournamentsWon,
}: {
    tournaments: any[];
    stats?: TournamentStats;
    tournamentsPlayed: number;
    tournamentsWon: number;
}) {
    const totalTournaments = stats?.total_tournaments ?? tournamentsPlayed;
    const totalWins = stats?.total_wins ?? tournamentsWon;
    const top3Finishes = tournaments.filter((t) => t.position != null && t.position <= 3).length;
    const winRate = stats?.win_rate ?? (totalTournaments > 0 ? Math.round((totalWins / totalTournaments) * 100) : 0);

    if (tournaments.length === 0 && totalTournaments === 0) {
        return (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="py-14 text-center">
                    <p className="text-3xl mb-3 opacity-50">🏆</p>
                    <p className="text-sm font-medium text-[var(--foreground)]">Sin torneos registrados</p>
                    <p className="text-xs mt-1 text-[var(--muted)]">Este jugador aun no ha participado en torneos.</p>
                </Card.Content>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Torneos Jugados", value: totalTournaments, color: "text-[var(--foreground)]" },
                    { label: "Victorias", value: totalWins, color: "text-[var(--success)]" },
                    { label: "Top 3", value: top3Finishes, color: "text-[var(--warning)]" },
                    { label: "Win Rate", value: `${winRate}%`, color: "text-[var(--accent)]" },
                ].map((stat) => (
                    <div key={stat.label} className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center">
                        <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Tournament List */}
            {tournaments.length > 0 && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                    <div className="p-4 border-b border-[var(--border)]">
                        <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide">Historial de Torneos</h3>
                    </div>

                    <div className="divide-y divide-[var(--border)]">
                        {tournaments.map((t, i) => {
                            const date = t.starts_at
                                ? new Date(t.starts_at).toLocaleDateString("es-CL", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })
                                : null;

                            const positionDisplay = t.position != null
                                ? placeEmoji[t.position] || `#${t.position}`
                                : "—";

                            const delta = t.rating_delta;
                            const deltaColor = delta != null
                                ? delta > 0
                                    ? "text-[var(--success)]"
                                    : delta < 0
                                        ? "text-[var(--danger)]"
                                        : "text-[var(--muted)]"
                                : "";
                            const deltaSign = delta != null && delta > 0 ? "+" : "";

                            return (
                                <Link
                                    key={t.tournament_id || i}
                                    href={`/torneos/${t.tournament_id}`}
                                    className="flex items-center gap-3 p-3 sm:p-4 hover:bg-[var(--surface-secondary)]/50 transition-colors"
                                >
                                    {/* Position */}
                                    <div className="w-10 text-center shrink-0">
                                        <span className="text-lg">{positionDisplay}</span>
                                    </div>

                                    {/* Tournament info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                                            {t.tournament_name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            {date && (
                                                <span className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                                                    <Clock className="size-3" /> {date}
                                                </span>
                                            )}
                                            <Chip variant="secondary" size="sm" className="text-[10px]">
                                                {typeof t.game === "object" ? t.game?.name ?? "" : t.game}
                                            </Chip>
                                            {t.format && (
                                                <Chip variant="secondary" size="sm" className="text-[10px]">
                                                    {typeof t.format === "object" ? t.format?.name ?? "" : t.format}
                                                </Chip>
                                            )}
                                            {t.is_ranked && (
                                                <Chip color="warning" variant="soft" size="sm" className="text-[10px]">
                                                    Ranked
                                                </Chip>
                                            )}
                                        </div>
                                    </div>

                                    {/* Record */}
                                    {(t.wins != null || t.losses != null) && (
                                        <div className="text-center shrink-0 hidden sm:block">
                                            <p className="text-xs font-bold text-[var(--foreground)]">
                                                {t.wins ?? 0}W-{t.losses ?? 0}L{t.draws ? `-${t.draws}D` : ""}
                                            </p>
                                            <p className="text-[9px] text-[var(--muted)] uppercase">Record</p>
                                        </div>
                                    )}

                                    {/* ELO Change */}
                                    {delta != null && (
                                        <div className="text-right shrink-0 min-w-[50px]">
                                            <p className={`text-sm font-bold ${deltaColor}`}>
                                                {deltaSign}{delta}
                                            </p>
                                            <p className="text-[9px] text-[var(--muted)] uppercase">ELO</p>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
