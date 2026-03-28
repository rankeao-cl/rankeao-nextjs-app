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
        <div style={{
            width: size + 6, height: size + 6, borderRadius: (size + 6) / 2,
            background: "var(--accent)", padding: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <div style={{
                width: size, height: size, borderRadius: size / 2,
                backgroundColor: "var(--background)", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: size * 0.35, fontWeight: 800, color: "var(--foreground)",
            }}>
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

export default function DuelCard({ duel }: { duel: Duel }) {
    const sColor = STATUS_COLORS[duel.status] ?? "var(--muted)";
    const sLabel = STATUS_LABELS[duel.status] ?? duel.status;
    const isActive = ["ACCEPTED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(duel.status);
    const isPending = duel.status === "PENDING";
    const isLive = duel.status === "IN_PROGRESS";
    const hasScore = duel.challenger_wins != null && duel.opponent_wins != null && (duel.challenger_wins > 0 || duel.opponent_wins > 0);

    return (
        <Link href={`/duelos/${duel.slug ?? duel.id}`} className="duel-card-hover" style={{ textDecoration: "none", display: "block" }}>
            <style>{`
                .duel-card-hover { transition: transform 0.2s, box-shadow 0.2s; }
                .duel-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,130,246,0.15); }
            `}</style>
            <div style={{
                borderRadius: 16, overflow: "hidden",
                border: `1px solid ${isActive || isPending ? sColor + "40" : "var(--border)"}`,
                animation: isLive ? "duelCardPulse 2.5s ease-in-out infinite" : undefined,
            }}>
                <style>{`
                    @keyframes duelCardPulse {
                        0%, 100% { box-shadow: 0 0 0px rgba(34,197,94,0); }
                        50% { box-shadow: 0 0 16px rgba(34,197,94,0.2); }
                    }
                `}</style>

                {/* Arena background with players */}
                <div style={{
                    background: getGameGradient(),
                    padding: "20px 16px 16px",
                    position: "relative",
                    overflow: "hidden",
                }}>
                    {/* Diagonal slash divider */}
                    <div style={{
                        position: "absolute",
                        top: 0, bottom: 0,
                        left: "50%",
                        width: 2,
                        background: `linear-gradient(180deg, transparent 0%, ${sColor}40 30%, ${sColor}20 70%, transparent 100%)`,
                        transform: "rotate(12deg) scaleY(1.4)",
                        transformOrigin: "center",
                        pointerEvents: "none",
                    }} />
                    <div style={{
                        position: "absolute",
                        top: 0, bottom: 0,
                        left: "calc(50% + 4px)",
                        width: 1,
                        background: `linear-gradient(180deg, transparent 0%, ${sColor}20 30%, ${sColor}10 70%, transparent 100%)`,
                        transform: "rotate(12deg) scaleY(1.4)",
                        transformOrigin: "center",
                        pointerEvents: "none",
                    }} />

                    {/* Status chip — top right */}
                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "3px 10px", borderRadius: 999,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                            border: `1px solid ${sColor}30`,
                        }}>
                            {isLive && (
                                <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sColor, animation: "pulse 1.6s ease-in-out infinite" }} />
                            )}
                            <span style={{ fontSize: 10, fontWeight: 700, color: sColor }}>{sLabel}</span>
                        </span>
                    </div>

                    {/* Time — top left */}
                    <div style={{ position: "absolute", top: 12, left: 12 }}>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>
                            {timeAgo(duel.created_at, { verbose: true, fallbackDays: 7 })}
                        </span>
                    </div>

                    {/* Players row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 8 }}>
                        {/* Challenger */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                            <PlayerAvatar player={duel.challenger} size={52} />
                            <span className="truncate" style={{
                                fontSize: 13, fontWeight: 700, color: "var(--foreground)",
                                maxWidth: 90, textAlign: "center",
                            }}>
                                {duel.challenger.display_name || duel.challenger.username}
                            </span>
                        </div>

                        {/* VS / Score */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
                            {hasScore ? (
                                <span style={{
                                    fontSize: 26, fontWeight: 900, color: "var(--foreground)", letterSpacing: "-1px",
                                    textShadow: "0 0 12px rgba(59,130,246,0.2)",
                                }}>
                                    {duel.challenger_wins} - {duel.opponent_wins}
                                </span>
                            ) : (
                                <span style={{
                                    fontSize: 28, fontWeight: 900, color: "var(--accent)",
                                    textShadow: "0 0 24px rgba(59,130,246,0.5), 0 0 48px rgba(59,130,246,0.2)",
                                    letterSpacing: "2px",
                                }}>VS</span>
                            )}
                        </div>

                        {/* Opponent */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                            <PlayerAvatar player={duel.opponent} size={52} />
                            <span className="truncate" style={{
                                fontSize: 13, fontWeight: 700, color: "var(--foreground)",
                                maxWidth: 90, textAlign: "center",
                            }}>
                                {duel.opponent.display_name || duel.opponent.username}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom bar — tags + CTA */}
                <div style={{
                    backgroundColor: "var(--surface-solid)",
                    padding: "10px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {duel.game_name && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", backgroundColor: "rgba(59,130,246,0.1)", padding: "3px 8px", borderRadius: 999 }}>
                                {duel.game_name}
                            </span>
                        )}
                        {duel.format_name && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "3px 8px", borderRadius: 999 }}>
                                {duel.format_name}
                            </span>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "3px 8px", borderRadius: 999 }}>
                            Bo{duel.best_of}
                        </span>
                    </div>

                    <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: isPending ? "var(--warning)" : isActive ? "var(--accent)" : "var(--muted)",
                        display: "inline-flex", alignItems: "center", gap: 3,
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
