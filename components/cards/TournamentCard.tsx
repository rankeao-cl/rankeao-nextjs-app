"use client";

import Image from "next/image";
import Link from "next/link";
import type { Tournament } from "@/lib/types/tournament";
import { Clock, Persons, MapPin, Cup } from "@gravity-ui/icons";

const STATUS_COLORS: Record<string, string> = {
    ROUND_IN_PROGRESS: "var(--success)", STARTED: "var(--success)", ROUND_COMPLETE: "var(--success)",
    CHECK_IN: "var(--warning)", OPEN: "var(--accent)",
    FINISHED: "var(--muted)", CLOSED: "var(--muted)",
    in_progress: "var(--success)", check_in: "var(--warning)", registration: "var(--accent)",
    upcoming: "var(--accent)", completed: "var(--muted)", cancelled: "var(--danger)",
};
const STATUS_LABELS: Record<string, string> = {
    ROUND_IN_PROGRESS: "EN VIVO", STARTED: "EN CURSO", ROUND_COMPLETE: "EN CURSO",
    CHECK_IN: "Check-in", OPEN: "Abierto",
    FINISHED: "Finalizado", CLOSED: "Cerrado",
    in_progress: "EN VIVO", check_in: "Check-in", registration: "Inscripciones",
    upcoming: "Próximo", completed: "Finalizado", cancelled: "Cancelado",
};

function isLiveStatus(s: string) {
    return ["ROUND_IN_PROGRESS", "STARTED", "ROUND_COMPLETE", "CHECK_IN", "in_progress", "check_in"].includes(s);
}
function isOpenStatus(s: string) {
    return ["OPEN", "registration", "upcoming"].includes(s);
}
function fmtPrice(n: number) {
    return "$" + n.toLocaleString("es-CL");
}

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
    const sColor = STATUS_COLORS[tournament.status] ?? "var(--muted)";
    const sLabel = STATUS_LABELS[tournament.status] ?? tournament.status;
    const live = isLiveStatus(tournament.status);
    const open = isOpenStatus(tournament.status);

    const registered = tournament.registered_count ?? 0;
    const maxPlayers = tournament.max_players ?? 0;

    const date = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleDateString("es-CL", {
            weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        })
        : null;

    const organizerName = tournament.tenant_name || tournament.organizer_username || "Torneo";

    // Imagen de fondo: usar game_logo_url o tenant_logo_url como fallback
    const bgImage = tournament.game_logo_url || tournament.tenant_logo_url || null;

    return (
        <Link href={`/torneos/${tournament.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div className="relative rounded-xl overflow-hidden feed-card-hover" style={{ aspectRatio: "16/9", border: "1px solid var(--border)", transition: "box-shadow 0.25s, border-color 0.25s" }}>
                <style>{`
                    .feed-card-hover:hover {
                        border-color: rgba(59,130,246,0.4) !important;
                        box-shadow: 0 0 20px rgba(59,130,246,0.15), 0 4px 16px rgba(0,0,0,0.1) !important;
                    }
                `}</style>
                {/* Imagen de fondo */}
                {bgImage ? (
                    <Image
                        src={bgImage}
                        alt={tournament.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                    />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{
                            background: live
                                ? "linear-gradient(135deg, #0d2b1a 0%, #1a3a28 50%, #0a1a10 100%)"
                                : open
                                    ? "linear-gradient(135deg, #0d1b2b 0%, #1a2a3a 50%, #0a1020 100%)"
                                    : "linear-gradient(135deg, #131318 0%, #1e1e24 50%, #0e0e14 100%)",
                        }}
                    />
                )}

                {/* Overlay degradado inferior negro */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Status chip esquina superior derecha */}
                <div className="absolute top-3 right-3">
                    <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{
                            backgroundColor: sColor + "22",
                            color: sColor,
                            border: `1px solid ${sColor}44`,
                            backdropFilter: "blur(8px)",
                        }}
                    >
                        {live && (
                            <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: sColor, animation: "pulse 1.6s ease-in-out infinite" }}
                            />
                        )}
                        {sLabel}
                    </span>
                </div>

                {/* Logo del organizador esquina superior izquierda */}
                {tournament.tenant_logo_url && (
                    <div className="absolute top-3 left-3">
                        <div
                            className="w-8 h-8 rounded-lg overflow-hidden"
                            style={{ border: "1px solid var(--border)" }}
                        >
                            <Image
                                src={tournament.tenant_logo_url}
                                alt={organizerName}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}

                {/* Contenido sobre el overlay inferior */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Nombre */}
                    <h3
                        className="text-white font-bold text-base line-clamp-1 mb-1"
                        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
                    >
                        {tournament.name}
                    </h3>

                    {/* Info: juego + fecha + ciudad */}
                    <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                        {(tournament.game_name || tournament.game) && (
                            <span className="text-[11px] font-medium text-white/70">
                                {tournament.game_name || tournament.game}
                            </span>
                        )}
                        {date && (
                            <span className="flex items-center gap-1 text-[11px] text-white/60">
                                <Clock style={{ width: 11, height: 11 }} />
                                <span className="capitalize">{date}</span>
                            </span>
                        )}
                        {tournament.city && (
                            <span className="flex items-center gap-1 text-[11px] text-white/60 truncate">
                                <MapPin style={{ width: 11, height: 11 }} />
                                <span className="truncate">{tournament.city}</span>
                            </span>
                        )}
                    </div>

                    {/* Fila: participantes + premio + CTA */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[11px] text-white/60">
                                <Persons style={{ width: 12, height: 12 }} />
                                <span className="font-semibold text-white/80">{registered}</span>
                                {maxPlayers > 0 && <span>/{maxPlayers}</span>}
                            </span>
                            {tournament.prize_pool && Number(tournament.prize_pool) > 0 && (
                                <span className="flex items-center gap-1 text-[11px] text-white/60">
                                    <Cup style={{ width: 12, height: 12 }} />
                                    <span className="font-semibold text-white/80">
                                        {fmtPrice(Number(tournament.prize_pool))}
                                    </span>
                                </span>
                            )}
                        </div>

                        {/* CTA */}
                        {live ? (
                            <span
                                className="flex items-center justify-center px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
                                style={{ backgroundColor: "var(--success)" }}
                            >
                                Ver en vivo
                            </span>
                        ) : open ? (
                            <span
                                className="flex items-center justify-center px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
                                style={{ backgroundColor: "var(--accent)" }}
                            >
                                Inscribirse
                            </span>
                        ) : (
                            <span
                                className="flex items-center justify-center px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{ backgroundColor: "var(--border)", color: "var(--muted)" }}
                            >
                                Ver detalles
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
