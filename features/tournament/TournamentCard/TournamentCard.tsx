"use client";

import Image from "next/image";
import Link from "next/link";
import type { Tournament } from "@/lib/types/tournament";
import { Clock, Persons, MapPin, Cup } from "@gravity-ui/icons";
import { getGameBrand } from "@/lib/gameLogos";

const STATUS_CONFIG: Record<string, { label: string; accent: string }> = {
    ROUND_IN_PROGRESS: { label: "EN VIVO", accent: "#EF4444" },
    STARTED:           { label: "EN CURSO", accent: "#EF4444" },
    ROUND_COMPLETE:    { label: "EN CURSO", accent: "#EF4444" },
    CHECK_IN:          { label: "CHECK-IN", accent: "#F59E0B" },
    OPEN:              { label: "ABIERTO", accent: "#22C55E" },
    FINISHED:          { label: "FINALIZADO", accent: "#6B7280" },
    CLOSED:            { label: "CERRADO", accent: "#6B7280" },
    in_progress:       { label: "EN VIVO", accent: "#EF4444" },
    check_in:          { label: "CHECK-IN", accent: "#F59E0B" },
    registration:      { label: "ABIERTO", accent: "#22C55E" },
    upcoming:          { label: "PRÓXIMO", accent: "#3B82F6" },
    completed:         { label: "FINALIZADO", accent: "#6B7280" },
    cancelled:         { label: "CANCELADO", accent: "#6B7280" },
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
    const cfg = STATUS_CONFIG[tournament.status] ?? { label: tournament.status, accent: "#6B7280" };
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
    const brand = getGameBrand(tournament.game || tournament.game_name || "");
    const bgImage = tournament.banner_url || tournament.game_logo_url || tournament.tenant_logo_url || null;

    return (
        <Link href={`/torneos/${tournament.slug ?? tournament.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div className="relative rounded-xl overflow-hidden group" style={{ aspectRatio: "16/9", border: "1px solid var(--border)", transition: "box-shadow 0.25s, border-color 0.25s" }}>
                <style>{`
                    .group:hover {
                        border-color: rgba(255,255,255,0.15) !important;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
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
                            background: `linear-gradient(135deg, ${brand.bg} 0%, color-mix(in srgb, ${brand.color} 8%, ${brand.bg}) 50%, #0a0a10 100%)`,
                        }}
                    />
                )}

                {/* Overlay degradado — más fuerte abajo para legibilidad */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.3) 100%)",
                    }}
                />

                {/* Status badge — sólido, legible */}
                <div className="absolute top-3 right-3 z-10">
                    <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                        style={{
                            backgroundColor: `${cfg.accent}30`,
                            color: "#fff",
                            border: `1px solid ${cfg.accent}40`,
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                        }}
                    >
                        {live && (
                            <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: cfg.accent, animation: "pulse 1.6s ease-in-out infinite" }}
                            />
                        )}
                        {cfg.label}
                    </span>
                </div>

                {/* Logo del organizador */}
                {tournament.tenant_logo_url && (
                    <div className="absolute top-3 left-3 z-10">
                        <div
                            className="w-8 h-8 rounded-lg overflow-hidden"
                            style={{ border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
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

                {/* Contenido inferior */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Nombre */}
                    <h3
                        className="text-white font-bold text-base line-clamp-1 mb-1.5"
                        style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}
                    >
                        {tournament.name}
                    </h3>

                    {/* Info: juego + fecha + ciudad */}
                    <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                        {(tournament.game_name || tournament.game) && (
                            <span
                                className="text-[11px] font-semibold px-2 py-0.5 rounded"
                                style={{
                                    color: brand.color,
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    border: `1px solid ${brand.color}44`,
                                }}
                            >
                                {tournament.game_name || tournament.game}
                            </span>
                        )}
                        {date && (
                            <span className="flex items-center gap-1 text-[11px] text-white/70">
                                <Clock style={{ width: 11, height: 11 }} />
                                <span className="capitalize">{date}</span>
                            </span>
                        )}
                        {tournament.city && (
                            <span className="flex items-center gap-1 text-[11px] text-white/70 truncate">
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
                                <span className="font-semibold text-white/90">{registered}</span>
                                {maxPlayers > 0 && <span>/{maxPlayers}</span>}
                            </span>
                            {tournament.prize_pool && Number(tournament.prize_pool) > 0 ? (
                                <span className="flex items-center gap-1 text-[11px] text-white/60">
                                    <Cup style={{ width: 12, height: 12 }} />
                                    <span className="font-semibold text-white/90">
                                        {fmtPrice(Number(tournament.prize_pool))}
                                    </span>
                                </span>
                            ) : null}
                            {(!tournament.entry_fee || Number(tournament.entry_fee) === 0) && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                    Gratis
                                </span>
                            )}
                        </div>

                        {/* CTA */}
                        {live ? (
                            <span
                                className="flex items-center justify-center px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
                                style={{ backgroundColor: "#EF4444", boxShadow: "0 2px 8px rgba(239,68,68,0.4)" }}
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
                                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
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
