"use client";

import LeaderboardTable from "@/features/tournament/LeaderboardTable";
import Image from "next/image";
import type { LeaderboardEntry } from "@/lib/types/gamification";
import type { CatalogFormat, CatalogGame } from "@/lib/types/catalog";
import Link from "next/link";

const MEDALS = ["", "\u{1F947}", "\u{1F948}", "\u{1F949}"];
const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd
const PODIUM_HEIGHTS = [56, 0, 72]; // pt values for vertical offset

interface Props {
    xpEntries: LeaderboardEntry[];
    ratingEntries: LeaderboardEntry[];
    games: CatalogGame[];
    formats: CatalogFormat[];
    selectedGameSlug?: string;
    selectedFormatSlug?: string;
    selectedTab: "xp" | "ratings";
}

export default function RankingTabs({ xpEntries, ratingEntries, selectedTab }: Props) {
    const isXp = selectedTab === "xp";
    const entries = isXp ? xpEntries : ratingEntries;
    const type = isXp ? "xp" : "rating";
    const top3 = entries.slice(0, 3);
    const rest = entries.length > 3 ? entries : entries;

    if (entries.length === 0) {
        return (
            <div style={{
                backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)",
                borderRadius: 16, padding: "64px 24px", textAlign: "center",
            }}>
                <p style={{ fontSize: 40, marginBottom: 16 }}>{isXp ? "\u{1F4CA}" : "\u2694\uFE0F"}</p>
                <p style={{ fontSize: 18, fontWeight: 500, color: "var(--foreground)", margin: "0 0 4px" }}>
                    {isXp ? "No hay datos de leaderboard" : "Selecciona un juego y formato"}
                </p>
                <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
                    {isXp ? "Aun no hay jugadores en el ranking de XP." : "Usa los filtros para ver el leaderboard de ratings ELO."}
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Podium — Top 3 */}
            {top3.length >= 3 && (
                <div style={{
                    backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)",
                    borderRadius: 16, padding: "24px 16px 20px",
                }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12 }}>
                        {PODIUM_ORDER.map((idx, pos) => {
                            const entry = top3[idx];
                            if (!entry) return null;
                            const rank = entry.rank || idx + 1;
                            const isFirst = pos === 1;
                            const value = isXp
                                ? `${(entry.total_xp ?? 0).toLocaleString()} XP`
                                : `${entry.rating ?? 0} ELO`;
                            const valueColor = isXp ? "var(--accent)" : "var(--warning)";

                            return (
                                <Link
                                    key={entry.user_id || idx}
                                    href={`/perfil/${entry.username}`}
                                    style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: PODIUM_HEIGHTS[pos], width: isFirst ? 110 : 90 }}
                                >
                                    {/* Medal */}
                                    <span style={{ fontSize: isFirst ? 28 : 22, marginBottom: 6 }}>
                                        {MEDALS[rank]}
                                    </span>

                                    {/* Avatar */}
                                    <div style={{ position: "relative", marginBottom: 8 }}>
                                        {entry.avatar_url ? (
                                            <Image src={entry.avatar_url} alt={entry.username}
                                                width={isFirst ? 56 : 44} height={isFirst ? 56 : 44}
                                                className="object-cover rounded-full"
                                                style={{
                                                    border: `2px solid ${isFirst ? "var(--warning)" : "var(--border)"}`,
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: isFirst ? 56 : 44, height: isFirst ? 56 : 44,
                                                borderRadius: 999, backgroundColor: "var(--surface-solid-secondary)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: isFirst ? 18 : 14, fontWeight: 700, color: "var(--muted)",
                                                border: `2px solid ${isFirst ? "var(--warning)" : "var(--border)"}`,
                                            }}>
                                                {entry.username?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <span style={{
                                        fontWeight: 700, color: "var(--foreground)", fontSize: 12,
                                        maxWidth: isFirst ? 100 : 80, overflow: "hidden",
                                        textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center",
                                    }}>
                                        {entry.username}
                                    </span>

                                    {/* Value */}
                                    <span style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: valueColor }}>
                                        {value}
                                    </span>

                                    {/* Podium bar */}
                                    <div style={{
                                        width: "100%", marginTop: 8,
                                        height: isFirst ? 48 : pos === 0 ? 32 : 20,
                                        borderRadius: "8px 8px 0 0",
                                        background: isFirst
                                            ? "linear-gradient(180deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))"
                                            : "linear-gradient(180deg, var(--surface), var(--surface-tertiary))",
                                        border: "1px solid var(--border)",
                                        borderBottom: "none",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: isFirst ? "var(--warning)" : "var(--muted)" }}>
                                            #{rank}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Full leaderboard table */}
            <LeaderboardTable entries={rest} type={type} />
        </div>
    );
}
