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
        <div
            className="flex items-center justify-center bg-surface overflow-hidden shrink-0"
            style={{
                width: size, height: size, borderRadius: size / 2,
                fontSize: size * 0.4, fontWeight: 700, color: "var(--foreground)",
            }}
        >
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
            className="duel-row-hover border-b border-border cursor-pointer transition-colors duration-150"
            onClick={() => router.push(href)}
        >
            <style>{`
                .duel-row-hover:hover { background-color: rgba(59,130,246,0.04) !important; }
                .duel-row-hover:last-child { border-bottom: none; }
            `}</style>

            {/* Players */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <MiniAvatar player={duel.challenger} />
                    <span className="truncate text-[13px] font-semibold text-foreground max-w-[100px]">
                        {duel.challenger.display_name || duel.challenger.username}
                    </span>
                    <span className="text-[11px] text-muted font-medium">vs</span>
                    <MiniAvatar player={duel.opponent} />
                    <span className="truncate text-[13px] font-semibold text-foreground max-w-[100px]">
                        {duel.opponent.display_name || duel.opponent.username}
                    </span>
                </div>
            </td>

            {/* Score */}
            <td className="px-3 py-3 text-center">
                {hasScore ? (
                    <span className="text-sm font-extrabold text-foreground tracking-tight">
                        {duel.challenger_wins} – {duel.opponent_wins}
                    </span>
                ) : (
                    <span className="text-xs text-muted">—</span>
                )}
            </td>

            {/* Game */}
            <td className="px-3 py-3">
                {duel.game_name && (
                    <span className="text-[11px] font-semibold text-accent rounded-full px-2.5 py-[3px]" style={{ backgroundColor: "rgba(59,130,246,0.08)" }}>
                        {duel.game_name}
                    </span>
                )}
            </td>

            {/* Best of */}
            <td className="px-3 py-3 text-center">
                <span className="text-[11px] font-semibold text-muted bg-surface rounded-full px-2.5 py-[3px]">
                    Bo{duel.best_of}
                </span>
            </td>

            {/* Status */}
            <td className="px-3 py-3 text-center">
                <span
                    className="inline-flex items-center gap-[5px] text-[11px] font-semibold rounded-full px-2.5 py-[3px]"
                    style={{
                        color: sColor,
                        backgroundColor: `color-mix(in srgb, ${sColor} 10%, transparent)`,
                    }}
                >
                    {isCompleted && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                    {sLabel}
                </span>
            </td>

            {/* Date */}
            <td className="px-3 py-3 text-right">
                <span className="text-xs text-muted">
                    {timeAgo(duel.created_at, { verbose: true, fallbackDays: 7 })}
                </span>
            </td>

            {/* Arrow */}
            <td className="px-4 py-3 text-right">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </td>
        </tr>
    );
}
