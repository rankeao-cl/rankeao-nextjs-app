import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { timeAgo } from "@/lib/utils/format";
import type { Duel } from "@/lib/types/duel";

const STATUS_COLORS: Record<string, string> = {
    PENDING: "var(--warning)",
    ACCEPTED: "var(--accent)",
    IN_PROGRESS: "var(--success)",
    AWAITING_CONFIRMATION: "var(--purple)",
    COMPLETED: "var(--muted)",
    DECLINED: "var(--danger)",
    CANCELLED: "var(--muted)",
    DISPUTED: "var(--danger)",
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptado",
    IN_PROGRESS: "En curso",
    AWAITING_CONFIRMATION: "Esperando",
    COMPLETED: "Finalizado",
    DECLINED: "Rechazado",
    CANCELLED: "Cancelado",
    DISPUTED: "Disputado",
};

function getGameGradient(): string {
    return "var(--background)";
}

function PlayerAvatar({ player, size = 52 }: { player: Duel["challenger"]; size?: number }) {
    return (
        <div
            className="flex items-center justify-center"
            style={{
                width: size + 6, height: size + 6, borderRadius: (size + 6) / 2,
                background: "var(--accent)", padding: 3,
            }}
        >
            <div
                className="flex items-center justify-center overflow-hidden bg-background"
                style={{
                    width: size, height: size, borderRadius: size / 2,
                    fontSize: size * 0.35, fontWeight: 800, color: "var(--foreground)",
                }}
            >
                {player.avatar_url ? (
                    <Image src={player.avatar_url} alt={player.username} width={size} height={size}
                        style={{ objectFit: "cover", width: size, height: size }} />
                ) : (
                    player.username.charAt(0).toUpperCase()
                )}
            </div>
        </div>
    );
}

function DuelCard({ duel }: { duel: Duel }) {
    const sColor = STATUS_COLORS[duel.status] ?? "var(--muted)";
    const sLabel = STATUS_LABELS[duel.status] ?? duel.status;
    const isActive = ["ACCEPTED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(duel.status);
    const isPending = duel.status === "PENDING";
    const isLive = duel.status === "IN_PROGRESS";
    const hasScore = duel.challenger_wins != null && duel.opponent_wins != null && (duel.challenger_wins > 0 || duel.opponent_wins > 0);

    return (
        <Link href={`/duelos/${duel.slug ?? duel.id}`} className="duel-card-hover block no-underline">
            <style>{`
                .duel-card-hover { transition: transform 0.2s, box-shadow 0.2s; }
                .duel-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,130,246,0.15); }
            `}</style>
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    border: `1px solid ${isActive || isPending ? sColor + "40" : "var(--border)"}`,
                    animation: isLive ? "duelCardPulse 2.5s ease-in-out infinite" : undefined,
                }}
            >
                <style>{`
                    @keyframes duelCardPulse {
                        0%, 100% { box-shadow: 0 0 0px rgba(34,197,94,0); }
                        50% { box-shadow: 0 0 16px rgba(34,197,94,0.2); }
                    }
                `}</style>

                {/* Arena background with players */}
                <div
                    className="relative overflow-hidden"
                    style={{
                        background: getGameGradient(),
                        padding: "20px 16px 16px",
                    }}
                >
                    {/* Diagonal slash divider */}
                    <div
                        className="absolute top-0 bottom-0 pointer-events-none"
                        style={{
                            left: "50%",
                            width: 2,
                            background: `linear-gradient(180deg, transparent 0%, ${sColor}40 30%, ${sColor}20 70%, transparent 100%)`,
                            transform: "rotate(12deg) scaleY(1.4)",
                            transformOrigin: "center",
                        }}
                    />
                    <div
                        className="absolute top-0 bottom-0 pointer-events-none"
                        style={{
                            left: "calc(50% + 4px)",
                            width: 1,
                            background: `linear-gradient(180deg, transparent 0%, ${sColor}20 30%, ${sColor}10 70%, transparent 100%)`,
                            transform: "rotate(12deg) scaleY(1.4)",
                            transformOrigin: "center",
                        }}
                    />

                    {/* Status chip — top right */}
                    <div className="absolute top-2.5 right-2.5">
                        <span
                            className="inline-flex items-center gap-[5px] rounded-full px-2.5 py-[3px]"
                            style={{
                                backgroundColor: "rgba(0,0,0,0.5)",
                                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                                border: `1px solid ${sColor}30`,
                            }}
                        >
                            {isLive && (
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: sColor }} />
                            )}
                            <span className="text-[10px] font-bold" style={{ color: sColor }}>{sLabel}</span>
                        </span>
                    </div>

                    {/* Time — top left */}
                    <div className="absolute top-3 left-3">
                        <span className="text-[10px] text-muted">
                            {timeAgo(duel.created_at, { verbose: true, fallbackDays: 7 })}
                        </span>
                    </div>

                    {/* Players row */}
                    <div className="flex items-center justify-center gap-4 mt-2">
                        {/* Challenger */}
                        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                            <PlayerAvatar player={duel.challenger} size={52} />
                            <span className="truncate text-[13px] font-bold text-foreground max-w-[90px] text-center">
                                {duel.challenger.display_name || duel.challenger.username}
                            </span>
                        </div>

                        {/* VS / Score */}
                        <div className="flex flex-col items-center z-[1]">
                            {hasScore ? (
                                <span
                                    className="text-[26px] font-black text-foreground tracking-tight"
                                    style={{ textShadow: "0 0 12px rgba(59,130,246,0.2)" }}
                                >
                                    {duel.challenger_wins} - {duel.opponent_wins}
                                </span>
                            ) : (
                                <span
                                    className="text-[28px] font-black text-accent tracking-widest"
                                    style={{ textShadow: "0 0 24px rgba(59,130,246,0.5), 0 0 48px rgba(59,130,246,0.2)" }}
                                >VS</span>
                            )}
                        </div>

                        {/* Opponent */}
                        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                            <PlayerAvatar player={duel.opponent} size={52} />
                            <span className="truncate text-[13px] font-bold text-foreground max-w-[90px] text-center">
                                {duel.opponent.display_name || duel.opponent.username}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom bar — tags + CTA */}
                <div className="bg-surface-solid flex items-center justify-between px-3.5 py-2.5">
                    <div className="flex gap-1 flex-wrap">
                        {duel.game_name && (
                            <span className="text-[10px] font-semibold text-accent rounded-full px-2 py-[3px]" style={{ backgroundColor: "rgba(59,130,246,0.1)" }}>
                                {duel.game_name}
                            </span>
                        )}
                        {duel.format_name && (
                            <span className="text-[10px] font-semibold text-muted bg-surface rounded-full px-2 py-[3px]">
                                {duel.format_name}
                            </span>
                        )}
                        <span className="text-[10px] font-semibold text-muted bg-surface rounded-full px-2 py-[3px]">
                            Bo{duel.best_of}
                        </span>
                    </div>

                    <span className="text-[11px] font-bold inline-flex items-center gap-[3px]" style={{
                        color: isPending ? "var(--warning)" : isActive ? "var(--accent)" : "var(--muted)",
                    }}>
                        {isPending ? "Responder" : isActive ? "Ver duelo" : "Detalles"}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default memo(DuelCard);
