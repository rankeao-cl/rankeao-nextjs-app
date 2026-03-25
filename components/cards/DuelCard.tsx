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

export default function DuelCard({ duel }: { duel: Duel }) {
    const sColor = STATUS_COLORS[duel.status] ?? "var(--muted)";
    const sLabel = STATUS_LABELS[duel.status] ?? duel.status;
    const isActive = ["ACCEPTED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(duel.status);
    const isPending = duel.status === "PENDING";

    return (
        <Link href={`/duelos/${duel.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{ borderRadius: 14, border: "1px solid var(--border)", backgroundColor: "var(--surface-solid)", overflow: "hidden" }}>
                {/* Top accent */}
                <div style={{ height: 3, backgroundColor: isActive ? sColor : "var(--surface)" }} />

                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Players row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        {/* Challenger */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
                            {duel.challenger.avatar_url ? (
                                <Image src={duel.challenger.avatar_url} alt={duel.challenger.username} width={40} height={40} style={{ borderRadius: 999, objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>
                                        {duel.challenger.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <span className="truncate" style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)", maxWidth: 80, textAlign: "center" }}>
                                {duel.challenger.display_name || duel.challenger.username}
                            </span>
                        </div>

                        {/* VS / Score */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            {(duel.challenger_wins != null && duel.opponent_wins != null && (duel.challenger_wins > 0 || duel.opponent_wins > 0)) ? (
                                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--foreground)" }}>
                                    {duel.challenger_wins} - {duel.opponent_wins}
                                </span>
                            ) : (
                                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>VS</span>
                            )}
                        </div>

                        {/* Opponent */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
                            {duel.opponent.avatar_url ? (
                                <Image src={duel.opponent.avatar_url} alt={duel.opponent.username} width={40} height={40} style={{ borderRadius: 999, objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>
                                        {duel.opponent.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <span className="truncate" style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)", maxWidth: 80, textAlign: "center" }}>
                                {duel.opponent.display_name || duel.opponent.username}
                            </span>
                        </div>
                    </div>

                    {/* Tags + Status row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {duel.game_name && (
                                <span style={{ fontSize: 11, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "3px 8px", borderRadius: 6 }}>
                                    {duel.game_name}
                                </span>
                            )}
                            {duel.format_name && (
                                <span style={{ fontSize: 11, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "3px 8px", borderRadius: 6 }}>
                                    {duel.format_name}
                                </span>
                            )}
                            <span style={{ fontSize: 11, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "3px 8px", borderRadius: 6 }}>
                                Bo{duel.best_of}
                            </span>
                        </div>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 999, backgroundColor: `color-mix(in srgb, ${sColor} 10%, transparent)` }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: sColor }}>{sLabel}</span>
                        </span>
                    </div>

                    {/* Time */}
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{timeAgo(duel.created_at, { verbose: true, fallbackDays: 7 })}</span>

                    {/* CTA hint */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        padding: "10px 0",
                        borderRadius: 10,
                        backgroundColor: isPending ? "color-mix(in srgb, var(--warning) 8%, transparent)" : isActive ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "var(--surface-tertiary)",
                    }}>
                        <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: isPending ? "var(--warning)" : isActive ? "var(--accent)" : "var(--muted)",
                        }}>
                            {isPending ? "Responder invitacion" : isActive ? "Ver duelo" : "Ver resultado"}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isPending ? "var(--warning)" : isActive ? "var(--accent)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    );
}
