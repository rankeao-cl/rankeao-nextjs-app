import { Avatar, Chip, Button } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import type { Tournament } from "@/lib/types/tournament";
import { Heart, Comment, ArrowShapeTurnUpRight, Clock, Persons, MapPin, Play, Cup } from "@gravity-ui/icons";

const statusConfig: Record<string, { color: "success" | "warning" | "danger" | "default"; label: string }> = {
    active: { color: "success", label: "EN VIVO" },
    ROUND_IN_PROGRESS: { color: "success", label: "EN VIVO" },
    upcoming: { color: "warning", label: "Proximo" },
    OPEN: { color: "warning", label: "Abierto" },
    CHECK_IN: { color: "warning", label: "Check-in" },
    finished: { color: "default", label: "Finalizado" },
    FINISHED: { color: "default", label: "Finalizado" },
    cancelled: { color: "danger", label: "Cancelado" },
    CLOSED: { color: "danger", label: "Cerrado" },
};

const structureLabels: Record<string, string> = {
    SWISS: "Suizo",
    SINGLE_ELIMINATION: "Eliminacion directa",
    DOUBLE_ELIMINATION: "Doble eliminacion",
    ROUND_ROBIN: "Round Robin",
};

export default function FeedTournamentCard({ tournament }: { tournament: Tournament }) {
    const status = statusConfig[tournament.status] || statusConfig.upcoming;
    const isLive = tournament.status === "active" || tournament.status === "ROUND_IN_PROGRESS";
    const isOpen = tournament.status === "OPEN" || tournament.status === "upcoming" || tournament.status === "CHECK_IN";
    const isFinished = tournament.status === "finished" || tournament.status === "FINISHED";

    const dateFormatted = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleDateString("es-CL", {
            weekday: "long",
            day: "numeric",
            month: "long",
        })
        : null;

    const timeFormatted = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
        })
        : null;

    const progress = tournament.max_players
        ? Math.min(100, ((tournament.registered_count || 0) / tournament.max_players) * 100)
        : null;

    const roundLabel = tournament.current_round
        ? tournament.total_rounds
            ? `Ronda ${tournament.current_round} de ${tournament.total_rounds}`
            : `Ronda ${tournament.current_round}`
        : null;

    return (
        <article className="glass overflow-hidden">
            {/* Organizer header */}
            <div className="flex items-center gap-3 px-4 py-3">
                {tournament.tenant_logo_url ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[var(--border)]">
                        <Image
                            src={tournament.tenant_logo_url}
                            alt={tournament.tenant_name || ""}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <Avatar size="sm" className="w-10 h-10">
                        <Avatar.Fallback>{(tournament.tenant_name || "T")[0]?.toUpperCase()}</Avatar.Fallback>
                    </Avatar>
                )}
                <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[var(--foreground)] truncate block">
                        {tournament.tenant_name || "Organizador"}
                    </span>
                    <span className="text-xs text-[var(--muted)]">publico un torneo</span>
                </div>
                <Chip color={status.color} variant="soft" size="sm" className="shrink-0">
                    {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
                    {status.label}
                </Chip>
            </div>

            {/* Tournament hero banner */}
            <Link href={`/torneos/${tournament.id}`} className="block">
                <div className="relative mx-4 rounded-xl overflow-hidden bg-[var(--surface-secondary)]">
                    {/* Top color accent */}
                    <div
                        className={`h-1 w-full ${isLive ? "animate-pulse" : ""}`}
                        style={{ background: isLive ? "var(--success)" : isOpen ? "var(--accent)" : "var(--border)" }}
                    />

                    <div className="p-4 sm:p-5">
                        {/* Live indicator */}
                        {isLive && roundLabel && (
                            <div className="flex items-center gap-2 mb-3">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--success)]" />
                                </span>
                                <span className="text-xs font-bold text-[var(--success)] uppercase tracking-wide">{roundLabel}</span>
                                {tournament.stream_url && (
                                    <a href={tournament.stream_url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline">
                                        <Play className="size-3" /> Ver stream
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Title + game logo */}
                        <div className="flex items-start gap-3 mb-3">
                            {tournament.game_logo_url && (
                                <div className="w-10 h-10 rounded-lg bg-[var(--surface-tertiary)] border border-[var(--border)] overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                    <Image src={tournament.game_logo_url} alt={tournament.game} width={32} height={32} className="object-contain" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base sm:text-lg text-[var(--foreground)] leading-tight mb-1">
                                    {tournament.name}
                                </h3>
                                {tournament.description && (
                                    <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                                        {tournament.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            <Chip variant="secondary" size="sm">{tournament.game}</Chip>
                            {tournament.format && <Chip variant="secondary" size="sm">{tournament.format}</Chip>}
                            {tournament.structure && structureLabels[tournament.structure] && (
                                <Chip variant="soft" size="sm">{structureLabels[tournament.structure]}</Chip>
                            )}
                            {tournament.is_ranked && <Chip color="warning" variant="soft" size="sm">Ranked</Chip>}
                            {tournament.is_online && <Chip variant="soft" size="sm">Online</Chip>}
                            {tournament.tier && <Chip variant="soft" size="sm">Tier {tournament.tier}</Chip>}
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            {dateFormatted && (
                                <div className="flex items-center gap-2 text-[var(--muted)]">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-tertiary)] flex items-center justify-center shrink-0">
                                        <Clock className="size-4 text-[var(--accent)]" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--foreground)] capitalize">{dateFormatted}</p>
                                        {timeFormatted && <p>{timeFormatted}</p>}
                                    </div>
                                </div>
                            )}
                            {(tournament.venue_name || tournament.city) && (
                                <div className="flex items-center gap-2 text-[var(--muted)]">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-tertiary)] flex items-center justify-center shrink-0">
                                        <MapPin className="size-4 text-[var(--accent)]" />
                                    </div>
                                    <div className="min-w-0">
                                        {tournament.venue_name && (
                                            <p className="font-medium text-[var(--foreground)] truncate">{tournament.venue_name}</p>
                                        )}
                                        <p className="truncate">{tournament.venue_address || tournament.city}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Capacity bar */}
                        {progress !== null && (
                            <div className="mb-3">
                                <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                        <Persons className="size-3.5" />
                                        <span className="font-medium text-[var(--foreground)]">{tournament.registered_count || 0}</span>
                                        /{tournament.max_players} jugadores
                                    </span>
                                    <span className="font-medium">{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden bg-[var(--surface-tertiary)]">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${progress}%`,
                                            background: progress > 80 ? "var(--danger)" : "var(--accent)",
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Prize + Entry row */}
                        {(tournament.prize_pool || tournament.entry_fee) && (
                            <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)]">
                                {tournament.prize_pool && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                                            <Cup className="size-3.5 text-[var(--accent)]" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-[var(--muted)] leading-none">Premio</p>
                                            <p className="text-sm font-bold text-[var(--accent)]">{tournament.prize_pool}</p>
                                        </div>
                                    </div>
                                )}
                                {tournament.entry_fee ? (
                                    <div className="ml-auto text-right">
                                        <p className="text-[11px] text-[var(--muted)] leading-none">Entrada</p>
                                        <p className="text-sm font-semibold text-[var(--foreground)]">{tournament.entry_fee}</p>
                                    </div>
                                ) : isOpen ? (
                                    <div className="ml-auto">
                                        <Chip color="success" variant="soft" size="sm">Gratis</Chip>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* CTA */}
                        {(isOpen || isLive) && (
                            <div className="flex gap-2 mt-3">
                                {isOpen && (
                                    <Link href={tournament.inscription_url || `/torneos/${tournament.id}`} className="flex-1">
                                        <Button className="w-full font-semibold bg-[var(--accent)] text-[var(--accent-foreground)]">
                                            Inscribirse
                                        </Button>
                                    </Link>
                                )}
                                {isLive && (
                                    <Link href={`/torneos/${tournament.id}`} className="flex-1">
                                        <Button className="w-full font-semibold bg-[var(--success)] text-[var(--success-foreground)]">
                                            Ver en vivo
                                        </Button>
                                    </Link>
                                )}
                                <Link href={`/torneos/${tournament.id}`}>
                                    <Button variant="secondary" className="font-semibold">
                                        Detalles
                                    </Button>
                                </Link>
                            </div>
                        )}
                        {isFinished && (
                            <div className="mt-3">
                                <Link href={`/torneos/${tournament.id}`}>
                                    <Button variant="secondary" className="w-full font-semibold">
                                        Ver resultados
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            {/* Social footer */}
            <div className="flex items-center justify-between px-4 py-2.5 mt-2">
                <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
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
