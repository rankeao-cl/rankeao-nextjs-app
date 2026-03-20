"use client";

import Image from "next/image";
import Link from "next/link";
import type { Tournament } from "@/lib/types/tournament";
import { Clock, Persons, MapPin, Cup } from "@gravity-ui/icons";

const STATUS_COLORS: Record<string, string> = {
    ROUND_IN_PROGRESS: "#22C55E", STARTED: "#22C55E", ROUND_COMPLETE: "#22C55E",
    CHECK_IN: "#888891", OPEN: "#888891",
    FINISHED: "#6B7280", CLOSED: "#EF4444",
    in_progress: "#22C55E", check_in: "#888891", registration: "#888891",
    upcoming: "#888891", completed: "#6B7280", cancelled: "#EF4444",
};
const STATUS_LABELS: Record<string, string> = {
    ROUND_IN_PROGRESS: "EN VIVO", STARTED: "EN CURSO", ROUND_COMPLETE: "EN CURSO",
    CHECK_IN: "Check-in", OPEN: "Abierto",
    FINISHED: "Finalizado", CLOSED: "Cerrado",
    in_progress: "EN VIVO", check_in: "Check-in", registration: "Inscripciones",
    upcoming: "Próximo", completed: "Finalizado", cancelled: "Cancelado",
};

function isLive(s: string) {
    return ["ROUND_IN_PROGRESS", "STARTED", "ROUND_COMPLETE", "CHECK_IN", "in_progress", "check_in"].includes(s);
}
function isOpen(s: string) {
    return ["OPEN", "registration", "upcoming"].includes(s);
}
function fmtPrice(n: number) {
    return "$" + n.toLocaleString("es-CL");
}

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
    const sColor = STATUS_COLORS[tournament.status] ?? "#888891";
    const sLabel = STATUS_LABELS[tournament.status] ?? tournament.status;
    const live = isLive(tournament.status);
    const open = isOpen(tournament.status);

    const registered = tournament.registered_count ?? 0;
    const maxPlayers = tournament.max_players ?? 0;
    const progress = maxPlayers > 0 ? Math.min((registered / maxPlayers) * 100, 100) : null;

    const date = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleDateString("es-CL", {
            weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        })
        : null;

    const roundLabel = tournament.current_round
        ? tournament.total_rounds
            ? `Ronda ${tournament.current_round}/${tournament.total_rounds}`
            : `Ronda ${tournament.current_round}`
        : null;

    const organizerName = tournament.tenant_name || tournament.organizer_username || "Torneo";

    return (
        <Link href={`/torneos/${tournament.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "#1A1A1E", overflow: "hidden" }}>
                {/* Top bar */}
                <div style={{ height: 4, backgroundColor: live ? sColor : "rgba(255,255,255,0.08)" }} />

                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Header: logo + title/subtitle + status */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        {/* Logo */}
                        {tournament.tenant_logo_url ? (
                            <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                                <Image src={tournament.tenant_logo_url} alt={organizerName} width={44} height={44} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                        ) : (
                            <div style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid rgba(136,136,145,0.19)", backgroundColor: "rgba(136,136,145,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{ fontSize: 12, fontWeight: 900, color: "#888891" }}>
                                    {(tournament.game?.slice(0, 3) || "TCG").toUpperCase()}
                                </span>
                            </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="line-clamp-2" style={{ fontWeight: 700, fontSize: 14, color: "#F2F2F2", lineHeight: "18px", margin: 0 }}>
                                {tournament.name}
                            </p>
                            <p className="truncate" style={{ fontSize: 11, color: "#888891", marginTop: 2, margin: 0 }}>
                                {organizerName}
                            </p>
                        </div>

                        {/* Status chip */}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 999, backgroundColor: sColor + "18", flexShrink: 0 }}>
                            {live && (
                                <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sColor, animation: "pulse 1.6s ease-in-out infinite" }} />
                            )}
                            <span style={{ fontSize: 10, fontWeight: 700, color: sColor }}>{sLabel}</span>
                        </span>
                    </div>

                    {/* Live round banner */}
                    {live && roundLabel && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 10, backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                            <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E", animation: "pulse 1.6s ease-in-out infinite" }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#22C55E" }}>{roundLabel}</span>
                        </div>
                    )}

                    {/* Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {tournament.game && (
                            <span style={{ fontSize: 11, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: 8 }}>
                                {tournament.game_name || tournament.game}
                            </span>
                        )}
                        {tournament.format && (
                            <span style={{ fontSize: 11, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: 8 }}>
                                {tournament.format_name || tournament.format}
                            </span>
                        )}
                        {tournament.is_ranked && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: 8 }}>
                                Ranked
                            </span>
                        )}
                    </div>

                    {/* Info: date + location */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {date && (
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <Clock style={{ width: 13, height: 13, color: "#888891" }} />
                                <span style={{ fontSize: 11, color: "#888891", textTransform: "capitalize" }}>{date}</span>
                            </span>
                        )}
                        {tournament.city && (
                            <span className="truncate" style={{ display: "flex", alignItems: "center", gap: 5, flex: 1 }}>
                                <MapPin style={{ width: 13, height: 13, color: "#888891", flexShrink: 0 }} />
                                <span className="truncate" style={{ fontSize: 11, color: "#888891" }}>{tournament.city}</span>
                            </span>
                        )}
                    </div>

                    {/* Capacity bar */}
                    {progress !== null && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <Persons style={{ width: 13, height: 13, color: "#888891" }} />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: "#F2F2F2" }}>{registered}</span>
                                    <span style={{ fontSize: 11, color: "#888891" }}>/{maxPlayers}</span>
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {tournament.prize_pool && Number(tournament.prize_pool) > 0 && (
                                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                            <Cup style={{ width: 12, height: 12, color: "#888891" }} />
                                            <span style={{ fontSize: 11, fontWeight: 600, color: "#F2F2F2" }}>{fmtPrice(Number(tournament.prize_pool))}</span>
                                        </span>
                                    )}
                                    {tournament.entry_fee && Number(tournament.entry_fee) > 0 ? (
                                        <span style={{ fontSize: 11, color: "#888891" }}>· {fmtPrice(Number(tournament.entry_fee))}</span>
                                    ) : open ? (
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "#888891" }}>Gratis</span>
                                    ) : null}
                                </span>
                            </div>
                            <div style={{ height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                <div style={{ height: "100%", borderRadius: 999, width: `${progress}%`, backgroundColor: progress > 85 ? "#EF4444" : "#888891" }} />
                            </div>
                        </div>
                    )}

                    {/* CTA buttons */}
                    <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
                        {live ? (
                            <span style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#22C55E", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
                                Ver en vivo
                            </span>
                        ) : open ? (
                            <>
                                <span style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#3B82F6", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
                                    Inscribirse
                                </span>
                                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#888891" }}>
                                    Detalles
                                </span>
                            </>
                        ) : (
                            <span style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 600, color: "#888891" }}>
                                Ver detalles
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
