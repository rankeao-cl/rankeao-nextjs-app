"use client";

import Image from "next/image";
import Link from "next/link";
import type { Tournament } from "@/lib/types/tournament";
import { Heart, Comment, ArrowShapeTurnUpRight, Clock, Persons, MapPin, Cup, Bookmark } from "@gravity-ui/icons";

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    active: { color: "var(--foreground)", bg: "rgba(255,255,255,0.08)", label: "EN VIVO" },
    ROUND_IN_PROGRESS: { color: "var(--foreground)", bg: "rgba(255,255,255,0.08)", label: "EN VIVO" },
    STARTED: { color: "var(--foreground)", bg: "rgba(255,255,255,0.08)", label: "EN CURSO" },
    in_progress: { color: "var(--foreground)", bg: "rgba(255,255,255,0.08)", label: "EN CURSO" },
    upcoming: { color: "var(--foreground)", bg: "rgba(255,255,255,0.08)", label: "Proximo" },
    registration: { color: "var(--foreground)", bg: "rgba(255,255,255,0.08)", label: "Abierto" },
    OPEN: { color: "var(--foreground)", bg: "rgba(255,255,255,0.08)", label: "Abierto" },
    check_in: { color: "var(--foreground)", bg: "rgba(255,255,255,0.08)", label: "Check-in" },
    CHECK_IN: { color: "var(--foreground)", bg: "rgba(255,255,255,0.08)", label: "Check-in" },
    completed: { color: "var(--muted)", bg: "rgba(255,255,255,0.06)", label: "Finalizado" },
    finished: { color: "var(--muted)", bg: "rgba(255,255,255,0.06)", label: "Finalizado" },
    FINISHED: { color: "var(--muted)", bg: "rgba(255,255,255,0.06)", label: "Finalizado" },
    cancelled: { color: "var(--muted)", bg: "rgba(255,255,255,0.06)", label: "Cancelado" },
    CLOSED: { color: "var(--muted)", bg: "rgba(255,255,255,0.06)", label: "Cerrado" },
};

const isLiveStatus = (s: string) =>
    s === "active" || s === "ROUND_IN_PROGRESS" || s === "STARTED" || s === "in_progress";
const isOpenStatus = (s: string) =>
    s === "OPEN" || s === "upcoming" || s === "CHECK_IN" || s === "registration" || s === "check_in";

function formatCLP(n: number | string): string {
    const num = typeof n === "string" ? Number(n) : n;
    if (isNaN(num)) return String(n);
    return `$${num.toLocaleString("es-CL")}`;
}

export default function FeedTournamentCard({ tournament }: { tournament: Tournament }) {
    const status = statusConfig[tournament.status] ?? statusConfig.upcoming;
    const isLive = isLiveStatus(tournament.status);
    const isOpen = isOpenStatus(tournament.status);

    const organizerName = tournament.tenant_name || "Organizador";
    const registered = tournament.registered_count ?? 0;
    const maxPlayers = tournament.max_players;
    const progress = maxPlayers && maxPlayers > 0 ? Math.min(100, (registered / maxPlayers) * 100) : null;

    const dateFormatted = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" })
        : null;
    const timeFormatted = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
        : null;

    return (
        <Link href={`/torneos/${tournament.id}`} style={{ textDecoration: "none", display: "block" }}>
            <article
                style={{
                    backgroundColor: "var(--surface-solid)",
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                }}
            >
                {/* Top accent line */}
                <div style={{ height: 3, backgroundColor: "var(--border)" }} />

                {/* Header: organizer + status */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 14,
                        paddingBottom: 10,
                    }}
                >
                    {/* Organizer logo/initial */}
                    {tournament.tenant_logo_url ? (
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                overflow: "hidden",
                                border: "1px solid var(--border)",
                                flexShrink: 0,
                            }}
                        >
                            <Image
                                src={tournament.tenant_logo_url}
                                alt={organizerName}
                                width={40}
                                height={40}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        </div>
                    ) : (
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: "rgba(255,255,255,0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                fontWeight: 700,
                                color: "var(--foreground)",
                                flexShrink: 0,
                            }}
                        >
                            {organizerName[0]?.toUpperCase()}
                        </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "var(--foreground)",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {organizerName}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                            publico un torneo
                        </span>
                    </div>

                    {/* Status badge */}
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 10px",
                            borderRadius: 10,
                            backgroundColor: status.bg,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.3px",
                            color: status.color,
                            flexShrink: 0,
                        }}
                    >
                        {isLive && (
                            <span
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: 4,
                                    backgroundColor: "#ED4245",
                                    animation: "pulse 1.6s ease-in-out infinite",
                                }}
                            />
                        )}
                        {status.label}
                    </span>
                </div>

                {/* Body */}
                <div style={{ paddingLeft: 14, paddingRight: 14, paddingBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Title row: game logo + name + tags */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        {/* Game logo */}
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 10,
                                overflow: "hidden",
                                border: "1px solid var(--border)",
                                backgroundColor: "rgba(255,255,255,0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            {tournament.game_logo_url ? (
                                <Image
                                    src={tournament.game_logo_url}
                                    alt={tournament.game || ""}
                                    width={34}
                                    height={34}
                                    style={{ objectFit: "contain" }}
                                />
                            ) : (
                                <span style={{ fontSize: 11, fontWeight: 900, color: "var(--foreground)" }}>
                                    {tournament.game?.slice(0, 3).toUpperCase() ?? "TCG"}
                                </span>
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3
                                className="line-clamp-2"
                                style={{
                                    fontWeight: 700,
                                    fontSize: 15,
                                    color: "#FFFFFF",
                                    lineHeight: "20px",
                                    margin: 0,
                                }}
                            >
                                {tournament.name}
                            </h3>
                            {/* Tags */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                                {tournament.game && (
                                    <span style={{ fontSize: 11, color: "var(--muted)", backgroundColor: "var(--surface-solid)", padding: "3px 8px", borderRadius: 8 }}>
                                        {tournament.game}
                                    </span>
                                )}
                                {tournament.format && (
                                    <span style={{ fontSize: 11, color: "var(--muted)", backgroundColor: "var(--surface-solid)", padding: "3px 8px", borderRadius: 8 }}>
                                        {tournament.format}
                                    </span>
                                )}
                                {tournament.is_ranked && (
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", backgroundColor: "var(--surface-solid)", padding: "3px 8px", borderRadius: 8 }}>
                                        Ranked
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info box */}
                    <div
                        style={{
                            backgroundColor: "rgba(255,255,255,0.03)",
                            borderRadius: 12,
                            padding: 12,
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                        }}
                    >
                        {/* Date + location */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            {dateFormatted && (
                                <span style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                                    <Clock style={{ width: 14, height: 14, color: "var(--muted)" }} />
                                    <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "capitalize" }}>
                                        {dateFormatted} · {timeFormatted}
                                    </span>
                                </span>
                            )}
                            {tournament.city && (
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <MapPin style={{ width: 14, height: 14, color: "var(--muted)", flexShrink: 0 }} />
                                    <span className="truncate" style={{ fontSize: 12, color: "var(--muted)" }}>
                                        {tournament.city}
                                    </span>
                                </span>
                            )}
                        </div>

                        {/* Capacity + prize */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Persons style={{ width: 14, height: 14, color: "var(--muted)" }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{registered}</span>
                                {maxPlayers != null && (
                                    <span style={{ fontSize: 12, color: "var(--muted)" }}>/ {maxPlayers}</span>
                                )}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {tournament.prize_pool && (
                                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <Cup style={{ width: 13, height: 13, color: "var(--muted)" }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>
                                            {formatCLP(Number(tournament.prize_pool))}
                                        </span>
                                    </span>
                                )}
                                {tournament.entry_fee ? (
                                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                                        Entrada {formatCLP(Number(tournament.entry_fee))}
                                    </span>
                                ) : isOpen ? (
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: "var(--foreground)",
                                            backgroundColor: "rgba(255,255,255,0.08)",
                                            padding: "2px 8px",
                                            borderRadius: 6,
                                        }}
                                    >
                                        Gratis
                                    </span>
                                ) : null}
                            </span>
                        </div>

                        {/* Progress bar */}
                        {progress !== null && (
                            <div
                                style={{
                                    height: 4,
                                    borderRadius: 9999,
                                    backgroundColor: "var(--border)",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        borderRadius: 9999,
                                        width: `${progress}%`,
                                        backgroundColor: "var(--foreground)",
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* CTA button */}
                    {(isOpen || isLive) && (
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                paddingTop: 11,
                                paddingBottom: 11,
                                borderRadius: 12,
                                fontSize: 13,
                                fontWeight: 700,
                                color: isLive ? "#FFFFFF" : "#FFFFFF",
                                backgroundColor: "#3B82F6",
                            }}
                        >
                            {isLive ? "Ver en vivo" : "Inscribirse"}
                        </span>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingLeft: 14,
                        paddingRight: 14,
                        paddingTop: 10,
                        paddingBottom: 10,
                        borderTop: "1px solid var(--border)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <button type="button" style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}>
                            <Heart style={{ width: 16, height: 16 }} />
                        </button>
                        <button type="button" style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}>
                            <Comment style={{ width: 16, height: 16 }} />
                        </button>
                        <button type="button" style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}>
                            <ArrowShapeTurnUpRight style={{ width: 16, height: 16 }} />
                        </button>
                    </div>
                    <button type="button" style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}>
                        <Bookmark style={{ width: 16, height: 16 }} />
                    </button>
                </div>
            </article>
        </Link>
    );
}
