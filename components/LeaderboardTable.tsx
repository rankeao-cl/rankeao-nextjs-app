"use client";

import Link from "next/link";
import type { LeaderboardEntry } from "@/lib/types/gamification";

interface Props {
    entries: LeaderboardEntry[];
    type?: "xp" | "rating";
}

const MEDALS = ["", "\u{1F947}", "\u{1F948}", "\u{1F949}"];

export default function LeaderboardTable({ entries, type = "xp" }: Props) {
    const isXp = type === "xp";

    if (entries.length === 0) return null;

    return (
        <div style={{ borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center", padding: "10px 16px", gap: 12,
                backgroundColor: "var(--surface-solid)", borderBottom: "1px solid var(--border)",
                fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5,
            }}>
                <span style={{ width: 36, textAlign: "center" }}>#</span>
                <span style={{ flex: 1 }}>Jugador</span>
                {isXp ? (
                    <>
                        <span style={{ width: 50, textAlign: "center" }}>Nivel</span>
                        <span style={{ width: 80, textAlign: "right" }}>XP</span>
                    </>
                ) : (
                    <>
                        <span style={{ width: 60, textAlign: "right" }}>ELO</span>
                        <span style={{ width: 50, textAlign: "right" }}>W/L</span>
                        <span className="hidden sm:block" style={{ width: 60, textAlign: "right" }}>Torneos</span>
                        <span className="hidden sm:block" style={{ width: 60, textAlign: "right" }}>Racha</span>
                    </>
                )}
            </div>

            {/* Rows */}
            {entries.map((entry, i) => {
                const rank = entry.rank || i + 1;
                const isTop3 = rank <= 3;

                const wins = entry.wins || 0;
                const losses = entry.losses || 0;
                const total = wins + losses;
                const winRate = total > 0 ? `${Math.round((wins / total) * 100)}%` : "—";

                const streak = entry.current_streak;
                let streakText = "—";
                let streakColor = "var(--muted)";
                if (streak != null && streak !== 0) {
                    if (streak > 0) { streakText = `${streak}W`; streakColor = "var(--success)"; }
                    else { streakText = `${Math.abs(streak)}L`; streakColor = "var(--danger)"; }
                }

                return (
                    <Link
                        key={entry.user_id || i}
                        href={`/perfil/${entry.username}`}
                        style={{ textDecoration: "none", display: "block" }}
                    >
                        <div style={{
                            display: "flex", alignItems: "center", padding: "10px 16px", gap: 12,
                            backgroundColor: isTop3 ? "color-mix(in srgb, var(--accent) 4%, transparent)" : "var(--surface-solid)",
                            borderBottom: i < entries.length - 1 ? "1px solid var(--border)" : "none",
                            transition: "background-color 0.15s",
                        }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--surface-hover)"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = isTop3 ? "color-mix(in srgb, var(--accent) 4%, transparent)" : "var(--surface-solid)"}
                        >
                            {/* Rank */}
                            <span style={{
                                width: 36, textAlign: "center",
                                fontSize: isTop3 ? 16 : 13, fontWeight: 700,
                                color: isTop3 ? undefined : "var(--muted)",
                            }}>
                                {isTop3 ? MEDALS[rank] : rank}
                            </span>

                            {/* Player */}
                            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                {entry.avatar_url ? (
                                    <img src={entry.avatar_url} alt={entry.username} style={{
                                        width: 32, height: 32, borderRadius: 16, objectFit: "cover", flexShrink: 0,
                                        border: isTop3 ? "2px solid color-mix(in srgb, var(--accent) 30%, transparent)" : "none",
                                    }} />
                                ) : (
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 16, backgroundColor: "var(--surface-solid)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 12, fontWeight: 700, color: "var(--muted)", flexShrink: 0,
                                    }}>
                                        {entry.username?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div style={{ minWidth: 0 }}>
                                    <p style={{
                                        fontSize: 13, fontWeight: isTop3 ? 700 : 600, color: "var(--foreground)", margin: 0,
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                        {entry.username}
                                    </p>
                                    {entry.title && (
                                        <p style={{ fontSize: 10, color: "var(--muted)", margin: 0 }}>{entry.title}</p>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            {isXp ? (
                                <>
                                    <span style={{ width: 50, textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
                                        Lv.{entry.level ?? "—"}
                                    </span>
                                    <span style={{ width: 80, textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
                                        {(entry.total_xp ?? 0).toLocaleString()}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span style={{ width: 60, textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--warning)" }}>
                                        {entry.rating ?? "—"}
                                    </span>
                                    <span style={{ width: 50, textAlign: "right", fontSize: 12, color: "var(--muted)" }}>
                                        {winRate}
                                    </span>
                                    <span className="hidden sm:block" style={{ width: 60, textAlign: "right", fontSize: 12, color: "var(--muted)" }}>
                                        {entry.tournaments_played ?? entry.games_played ?? "—"}
                                    </span>
                                    <span className="hidden sm:block" style={{ width: 60, textAlign: "right", fontSize: 12, fontWeight: 600, color: streakColor }}>
                                        {streakText}
                                    </span>
                                </>
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
