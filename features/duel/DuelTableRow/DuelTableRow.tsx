"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/utils/format";
import type { Duel } from "@/lib/types/duel";

const STATUS_COLORS: Record<string, string> = {
    COMPLETED: "var(--success)",
    DECLINED: "var(--danger)",
    CANCELLED: "var(--muted)",
    DISPUTED: "var(--danger)",
};

const STATUS_LABELS: Record<string, string> = {
    COMPLETED: "Finalizado",
    DECLINED: "Rechazado",
    CANCELLED: "Cancelado",
    DISPUTED: "Disputado",
};

function MiniAvatar({ player, size = 28 }: { player: Duel["challenger"]; size?: number }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: "var(--surface)", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.4, fontWeight: 700, color: "var(--foreground)",
            flexShrink: 0,
        }}>
            {player.avatar_url ? (
                <Image src={player.avatar_url} alt={player.username} width={size} height={size}
                    style={{ objectFit: "cover", width: size, height: size }} />
            ) : (
                player.username.charAt(0).toUpperCase()
            )}
        </div>
    );
}

export default function DuelTableRow({ duel }: { duel: Duel }) {
    const router = useRouter();
    const sColor = STATUS_COLORS[duel.status] ?? "var(--muted)";
    const sLabel = STATUS_LABELS[duel.status] ?? duel.status;
    const hasScore = duel.challenger_wins != null && duel.opponent_wins != null && (duel.challenger_wins > 0 || duel.opponent_wins > 0);
    const isCompleted = duel.status === "COMPLETED";
    const href = `/duelos/${duel.slug ?? duel.id}`;

    return (
        <tr
            className="duel-row-hover"
            onClick={() => router.push(href)}
            style={{
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                transition: "background-color 0.15s",
            }}
        >
            <style>{`
                .duel-row-hover:hover { background-color: rgba(59,130,246,0.04) !important; }
                .duel-row-hover:last-child { border-bottom: none; }
            `}</style>

            {/* Players */}
            <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <MiniAvatar player={duel.challenger} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", maxWidth: 100 }} className="truncate">
                        {duel.challenger.display_name || duel.challenger.username}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>vs</span>
                    <MiniAvatar player={duel.opponent} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", maxWidth: 100 }} className="truncate">
                        {duel.opponent.display_name || duel.opponent.username}
                    </span>
                </div>
            </td>

            {/* Score */}
            <td style={{ padding: "12px 12px", textAlign: "center" }}>
                {hasScore ? (
                    <span style={{
                        fontSize: 14, fontWeight: 800, color: "var(--foreground)",
                        letterSpacing: "-0.5px",
                    }}>
                        {duel.challenger_wins} – {duel.opponent_wins}
                    </span>
                ) : (
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>—</span>
                )}
            </td>

            {/* Game */}
            <td style={{ padding: "12px 12px" }}>
                {duel.game_name && (
                    <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: "var(--accent)",
                        backgroundColor: "rgba(59,130,246,0.08)",
                        padding: "3px 10px", borderRadius: 999,
                    }}>
                        {duel.game_name}
                    </span>
                )}
            </td>

            {/* Best of */}
            <td style={{ padding: "12px 12px", textAlign: "center" }}>
                <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: "var(--muted)",
                    backgroundColor: "var(--surface)",
                    padding: "3px 10px", borderRadius: 999,
                }}>
                    Bo{duel.best_of}
                </span>
            </td>

            {/* Status */}
            <td style={{ padding: "12px 12px", textAlign: "center" }}>
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 600,
                    color: sColor,
                    backgroundColor: `color-mix(in srgb, ${sColor} 10%, transparent)`,
                    padding: "3px 10px", borderRadius: 999,
                }}>
                    {isCompleted && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                    {sLabel}
                </span>
            </td>

            {/* Date */}
            <td style={{ padding: "12px 12px", textAlign: "right" }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    {timeAgo(duel.created_at, { verbose: true, fallbackDays: 7 })}
                </span>
            </td>

            {/* Arrow */}
            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </td>
        </tr>
    );
}
