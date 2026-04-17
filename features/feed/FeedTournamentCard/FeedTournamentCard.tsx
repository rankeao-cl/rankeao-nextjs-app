"use client";

import { memo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Tournament } from "@/lib/types/tournament";
import { getGameBrand, getGameBannerStyle } from "@/lib/gameLogos";
import { ArrowShapeTurnUpRight, Clock, Persons, MapPin, Cup, Bookmark } from "@gravity-ui/icons";
import { toast } from "@heroui/react/toast";

import { useAuth } from "@/lib/hooks/use-auth";
import { useBookmark } from "@/lib/hooks/use-social";

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    active: { color: "var(--foreground)", bg: "var(--overlay)", label: "EN VIVO" },
    ROUND_IN_PROGRESS: { color: "var(--foreground)", bg: "var(--overlay)", label: "EN VIVO" },
    STARTED: { color: "var(--foreground)", bg: "var(--overlay)", label: "EN CURSO" },
    in_progress: { color: "var(--foreground)", bg: "var(--overlay)", label: "EN CURSO" },
    upcoming: { color: "var(--foreground)", bg: "var(--overlay)", label: "Proximo" },
    registration: { color: "var(--foreground)", bg: "var(--overlay)", label: "Abierto" },
    OPEN: { color: "var(--foreground)", bg: "var(--overlay)", label: "Abierto" },
    check_in: { color: "var(--foreground)", bg: "var(--overlay)", label: "Check-in" },
    CHECK_IN: { color: "var(--foreground)", bg: "var(--overlay)", label: "Check-in" },
    completed: { color: "var(--muted)", bg: "var(--surface)", label: "Finalizado" },
    finished: { color: "var(--muted)", bg: "var(--surface)", label: "Finalizado" },
    FINISHED: { color: "var(--muted)", bg: "var(--surface)", label: "Finalizado" },
    cancelled: { color: "var(--muted)", bg: "var(--surface)", label: "Cancelado" },
    CLOSED: { color: "var(--muted)", bg: "var(--surface)", label: "Cerrado" },
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

function FeedTournamentCard({ tournament }: { tournament: Tournament }) {
    const status = statusConfig[tournament.status] ?? statusConfig.upcoming;
    const isLive = isLiveStatus(tournament.status);
    const isOpen = isOpenStatus(tournament.status);

    const { status: authStatus, session } = useAuth();
    const isAuth = authStatus === "authenticated";
    const bookmarkMutation = useBookmark();
    const [bookmarked, setBookmarked] = useState(false);

    const organizerName = tournament.tenant_name || "Organizador";
    const registered = tournament.registered_count ?? 0;
    const maxPlayers = tournament.max_players;
    const progress = maxPlayers && maxPlayers > 0 ? Math.min(100, (registered / maxPlayers) * 100) : null;

    const gameSlug = tournament.game || tournament.game_name || "";
    const gameBrand = getGameBrand(gameSlug);
    const bannerStyle = getGameBannerStyle(gameSlug);

    const dateFormatted = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" })
        : null;
    const timeFormatted = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
        : null;

    return (
        <Link href={`/torneos/${tournament.slug ?? tournament.id}`} className="no-underline block">
            <article className="bg-surface-solid rounded-[20px] border border-border overflow-hidden">
                {/* Game banner */}
                <div
                    className="relative h-[80px] flex items-center justify-center overflow-hidden"
                    style={bannerStyle}
                >
                    {/* Game logo watermark */}
                    {gameBrand.logo && (
                        <Image
                            src={gameBrand.logo}
                            alt=""
                            width={48}
                            height={48}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-[48px] w-auto opacity-[0.12] brightness-200"
                        />
                    )}
                    {/* Status badge on banner */}
                    <span
                        className="absolute top-[10px] right-[10px] inline-flex items-center gap-[5px] px-[10px] py-1 rounded-lg bg-black/50 backdrop-blur-[8px] text-[10px] font-bold tracking-[0.3px] text-white"
                        style={{
                            border: `1px solid ${isLive ? "rgba(239,68,68,0.4)" : isOpen ? `${gameBrand.color}40` : "rgba(255,255,255,0.15)"}`,
                        }}
                    >
                        {isLive && (
                            <span className="w-[6px] h-[6px] rounded-full bg-[#EF4444] animate-pulse" />
                        )}
                        {status.label}
                    </span>
                    {/* Top accent bar */}
                    <div
                        className="absolute top-0 left-0 right-0 h-[3px] opacity-80"
                        style={{ background: isLive ? "#EF4444" : gameBrand.color }}
                    />
                </div>

                {/* Header: organizer + tournament name */}
                <div className="flex items-center gap-[10px] p-[14px] pb-[10px]">
                    {/* Organizer logo/initial */}
                    {tournament.tenant_logo_url ? (
                        <div className="w-10 h-10 rounded-[10px] overflow-hidden border border-border shrink-0">
                            <Image
                                src={tournament.tenant_logo_url}
                                alt={organizerName}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-[10px] bg-overlay flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                            {organizerName[0]?.toUpperCase()}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-foreground block truncate">
                            {organizerName}
                        </span>
                        <span className="text-[11px] text-muted mt-px">
                            publico un torneo
                        </span>
                    </div>

                </div>

                {/* Body */}
                <div className="px-[14px] pb-[14px] flex flex-col gap-[10px]">
                    {/* Title row: game logo + name + tags */}
                    <div className="flex items-start gap-3">
                        {/* Game logo */}
                        <div className="w-[44px] h-[44px] rounded-[10px] overflow-hidden border border-border bg-surface flex items-center justify-center shrink-0">
                            {tournament.game_logo_url ? (
                                <Image
                                    src={tournament.game_logo_url}
                                    alt={tournament.game || ""}
                                    width={34}
                                    height={34}
                                    className="object-contain"
                                />
                            ) : (
                                <span className="text-[11px] font-black text-foreground">
                                    {tournament.game?.slice(0, 3).toUpperCase() ?? "TCG"}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3
                                className="line-clamp-2 font-bold text-[15px] text-foreground leading-5 m-0"
                            >
                                {tournament.name}
                            </h3>
                            {/* Tags */}
                            <div className="flex flex-wrap gap-[5px] mt-1.5">
                                {tournament.game && (
                                    <span className="text-[11px] text-muted bg-surface-solid px-2 py-[3px] rounded-lg">
                                        {tournament.game}
                                    </span>
                                )}
                                {tournament.format && (
                                    <span className="text-[11px] text-muted bg-surface-solid px-2 py-[3px] rounded-lg">
                                        {tournament.format}
                                    </span>
                                )}
                                {tournament.is_ranked && (
                                    <span className="text-[11px] font-bold text-foreground bg-surface-solid px-2 py-[3px] rounded-lg">
                                        Ranked
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info box */}
                    <div className="bg-surface-tertiary rounded-xl p-3 flex flex-col gap-2">
                        {/* Date + location */}
                        <div className="flex items-center gap-4">
                            {dateFormatted && (
                                <span className="flex items-center gap-1.5 flex-1">
                                    <Clock className="w-3.5 h-3.5 text-muted" />
                                    <span className="text-xs text-muted capitalize">
                                        {dateFormatted} · {timeFormatted}
                                    </span>
                                </span>
                            )}
                            {tournament.city && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                                    <span className="truncate text-xs text-muted">
                                        {tournament.city}
                                    </span>
                                </span>
                            )}
                        </div>

                        {/* Capacity + prize */}
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Persons className="w-3.5 h-3.5 text-muted" />
                                <span className="text-xs font-bold text-foreground">{registered}</span>
                                {maxPlayers != null && (
                                    <span className="text-xs text-muted">/ {maxPlayers}</span>
                                )}
                            </span>
                            <span className="flex items-center gap-[10px]">
                                {tournament.prize_pool && (
                                    <span className="flex items-center gap-1">
                                        <Cup className="w-[13px] h-[13px] text-muted" />
                                        <span className="text-xs font-bold text-foreground">
                                            {formatCLP(Number(tournament.prize_pool))}
                                        </span>
                                    </span>
                                )}
                                {tournament.entry_fee ? (
                                    <span className="text-[11px] text-muted">
                                        Entrada {formatCLP(Number(tournament.entry_fee))}
                                    </span>
                                ) : isOpen ? (
                                    <span className="text-[11px] font-bold text-foreground bg-overlay px-2 py-[2px] rounded-[6px]">
                                        Gratis
                                    </span>
                                ) : null}
                            </span>
                        </div>

                        {/* Progress bar */}
                        {progress !== null && (
                            <div className="h-1 rounded-full bg-border overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-foreground"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>

                    {/* CTA button */}
                    {(isOpen || isLive) && (
                        <span className="flex items-center justify-center w-full py-[11px] rounded-xl text-[13px] font-bold text-white bg-accent">
                            {isLive ? "Ver en vivo" : "Inscribirse"}
                        </span>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-[14px] py-[10px] border-t border-border">
                    <div className="flex items-center gap-[14px]">
                        <button type="button" onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const url = `https://rankeao.cl/torneos/${tournament.slug ?? tournament.id}`;
                            if (navigator.share) {
                                navigator.share({ title: tournament.name, url }).catch((error: unknown) => {
                                    console.warn("No se pudo compartir torneo", error);
                                });
                            } else {
                                navigator.clipboard.writeText(url)
                                    .then(() => toast.success("Enlace copiado"))
                                    .catch((error: unknown) => {
                                        console.warn("No se pudo copiar enlace de torneo", error);
                                    });
                            }
                        }} className="flex items-center gap-[5px] bg-transparent border-none text-muted cursor-pointer p-0">
                            <ArrowShapeTurnUpRight className="w-4 h-4" />
                        </button>
                    </div>
                    <button type="button" onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isAuth) return;
                        const next = !bookmarked;
                        setBookmarked(next);
                        bookmarkMutation.mutate(
                            { entityType: "tournament", entityId: tournament.id, bookmark: next, token: session?.accessToken },
                            { onError: () => setBookmarked(!next) }
                        );
                    }} className="flex items-center border-none p-0" style={{ background: "none", color: bookmarked ? "var(--accent)" : "var(--muted)", cursor: isAuth ? "pointer" : "default" }}>
                        <Bookmark className="w-4 h-4" />
                    </button>
                </div>
            </article>
        </Link>
    );
}

export default memo(FeedTournamentCard);
