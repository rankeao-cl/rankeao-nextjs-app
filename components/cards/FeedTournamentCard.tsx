"use client";

import { Avatar, Chip, Button } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import type { Tournament } from "@/lib/types/tournament";
import { Heart, Comment, ArrowShapeTurnUpRight, Clock, Persons, MapPin, Cup } from "@gravity-ui/icons";
import { getGameBrand } from "@/lib/gameLogos";

const statusConfig: Record<string, { color: "success" | "warning" | "danger" | "default"; label: string }> = {
    active: { color: "success", label: "EN VIVO" },
    ROUND_IN_PROGRESS: { color: "success", label: "EN VIVO" },
    STARTED: { color: "success", label: "EN CURSO" },
    upcoming: { color: "warning", label: "Próximo" },
    OPEN: { color: "warning", label: "Abierto" },
    CHECK_IN: { color: "warning", label: "Check-in" },
    finished: { color: "default", label: "Finalizado" },
    FINISHED: { color: "default", label: "Finalizado" },
    cancelled: { color: "danger", label: "Cancelado" },
    CLOSED: { color: "danger", label: "Cerrado" },
};

export default function FeedTournamentCard({ tournament }: { tournament: Tournament }) {
    const status = statusConfig[tournament.status] || statusConfig.upcoming;
    const isLive = tournament.status === "active" || tournament.status === "ROUND_IN_PROGRESS" || tournament.status === "STARTED";
    const isOpen = tournament.status === "OPEN" || tournament.status === "upcoming" || tournament.status === "CHECK_IN";
    const gameBrand = getGameBrand(tournament.game?.toLowerCase?.() || "");

    const dateFormatted = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" })
        : null;
    const timeFormatted = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
        : null;

    const progress = tournament.max_players
        ? Math.min(100, ((tournament.registered_count || 0) / tournament.max_players) * 100)
        : null;

    return (
        <article className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
            {/* Header: organizer */}
            <div className="flex items-center gap-3 px-4 py-3">
                {tournament.tenant_logo_url ? (
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-[var(--border)] shrink-0">
                        <Image
                            src={tournament.tenant_logo_url}
                            alt={tournament.tenant_name || ""}
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <Avatar size="sm" className="w-9 h-9 shrink-0">
                        <Avatar.Fallback className="text-xs">{(tournament.tenant_name || "T")[0]?.toUpperCase()}</Avatar.Fallback>
                    </Avatar>
                )}
                <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[var(--foreground)] truncate block">
                        {tournament.tenant_name || "Organizador"}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">publicó un torneo</span>
                </div>
                <Chip color={status.color} variant="soft" size="sm" className="shrink-0 text-[10px]">
                    {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
                    {status.label}
                </Chip>
            </div>

            {/* Tournament card body */}
            <Link href={`/torneos/${tournament.id}`} className="block">
                <div
                    className="mx-3 mb-3 rounded-xl overflow-hidden border border-[var(--border)]"
                    style={{ background: `linear-gradient(135deg, ${gameBrand.bg}80, var(--surface-secondary))` }}
                >
                    {/* Color accent bar */}
                    <div
                        className={`h-1 w-full ${isLive ? "animate-pulse" : ""}`}
                        style={{ background: gameBrand.color }}
                    />

                    <div className="p-4 space-y-3">
                        {/* Title + game logo */}
                        <div className="flex items-start gap-3">
                            <div
                                className="w-10 h-10 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center text-xs font-black"
                                style={{
                                    borderColor: `${gameBrand.color}30`,
                                    background: `${gameBrand.color}15`,
                                    color: gameBrand.color,
                                }}
                            >
                                {tournament.game_logo_url ? (
                                    <Image src={tournament.game_logo_url} alt={tournament.game} width={32} height={32} className="object-contain" />
                                ) : (
                                    tournament.game?.slice(0, 3).toUpperCase()
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm text-white leading-tight mb-0.5">
                                    {tournament.name}
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                    <Chip variant="secondary" size="sm">{tournament.game}</Chip>
                                    {tournament.format && <Chip variant="secondary" size="sm">{tournament.format}</Chip>}
                                    {tournament.is_ranked && <Chip color="warning" variant="soft" size="sm">Ranked</Chip>}
                                </div>
                            </div>
                        </div>

                        {/* Info row */}
                        <div className="flex items-center gap-4 text-[11px] text-white/60">
                            {dateFormatted && (
                                <span className="flex items-center gap-1.5">
                                    <Clock className="size-3.5" />
                                    <span className="capitalize">{dateFormatted} {timeFormatted}</span>
                                </span>
                            )}
                            {tournament.city && (
                                <span className="flex items-center gap-1.5 truncate">
                                    <MapPin className="size-3.5" />
                                    {tournament.city}
                                </span>
                            )}
                        </div>

                        {/* Capacity + Prize row */}
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-1.5 text-white/60">
                                <Persons className="size-3.5" />
                                <span className="font-semibold text-white">{tournament.registered_count || 0}</span>
                                {tournament.max_players && <span>/{tournament.max_players}</span>}
                            </span>
                            <div className="flex items-center gap-2">
                                {tournament.prize_pool && (
                                    <span className="font-semibold flex items-center gap-1" style={{ color: gameBrand.color }}>
                                        <Cup className="size-3" /> {tournament.prize_pool}
                                    </span>
                                )}
                                {tournament.entry_fee ? (
                                    <span className="text-white/50">· {tournament.entry_fee}</span>
                                ) : isOpen ? (
                                    <span className="text-green-400 font-semibold">Gratis</span>
                                ) : null}
                            </div>
                        </div>

                        {/* Progress bar */}
                        {progress !== null && (
                            <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${progress}%`,
                                        background: progress > 85 ? "var(--danger)" : gameBrand.color,
                                    }}
                                />
                            </div>
                        )}

                        {/* CTA */}
                        {(isOpen || isLive) && (
                            <div className="flex gap-2">
                                {isLive ? (
                                    <Button size="sm" className="flex-1 font-semibold bg-[var(--success)] text-[var(--success-foreground)]">
                                        Ver en vivo
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        className="flex-1 font-semibold text-white"
                                        style={{ background: gameBrand.color }}
                                    >
                                        Inscribirse
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            {/* Social footer */}
            <div className="flex items-center px-4 py-2 text-xs text-[var(--muted)]">
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors cursor-pointer">
                        <Heart className="size-4" /> Me gusta
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors cursor-pointer">
                        <Comment className="size-4" /> Comentar
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors cursor-pointer">
                        <ArrowShapeTurnUpRight className="size-4" /> Compartir
                    </button>
                </div>
            </div>
        </article>
    );
}
