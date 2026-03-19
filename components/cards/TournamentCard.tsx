import { Chip, Button, Avatar } from "@heroui/react";
import type { Tournament } from "@/lib/types/tournament";
import { Clock, Persons, MapPin, Cup } from "@gravity-ui/icons";
import Image from "next/image";
import Link from "next/link";
import { getGameBrand } from "@/lib/gameLogos";

const statusConfig: Record<string, { color: "success" | "warning" | "danger" | "default"; label: string; barColor: string }> = {
    active:              { color: "success", label: "EN VIVO",               barColor: "var(--success)" },
    ROUND_IN_PROGRESS:   { color: "success", label: "EN VIVO",               barColor: "var(--success)" },
    ROUND_COMPLETE:      { color: "success", label: "EN CURSO",              barColor: "var(--success)" },
    STARTED:             { color: "success", label: "EN CURSO",              barColor: "var(--success)" },
    upcoming:            { color: "warning", label: "Próximo",               barColor: "var(--warning)" },
    OPEN:                { color: "warning", label: "Abierto",               barColor: "var(--accent)" },
    CHECK_IN:            { color: "warning", label: "Check-in",              barColor: "var(--warning)" },
    finished:            { color: "default", label: "Finalizado",            barColor: "var(--border)" },
    FINISHED:            { color: "default", label: "Finalizado",            barColor: "var(--border)" },
    cancelled:           { color: "danger",  label: "Cancelado",             barColor: "var(--danger)" },
    CLOSED:              { color: "danger",  label: "Cerrado",               barColor: "var(--danger)" },
};

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
    const status = statusConfig[tournament.status] || statusConfig.upcoming;
    const isLive = tournament.status === "active" || tournament.status === "ROUND_IN_PROGRESS" || tournament.status === "STARTED" || tournament.status === "ROUND_COMPLETE";
    const isOpen = tournament.status === "OPEN" || tournament.status === "upcoming" || tournament.status === "CHECK_IN";

    const gameBrand = getGameBrand(tournament.game?.toLowerCase?.() || "");

    const date = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleDateString("es-CL", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        })
        : null;

    const progress = tournament.max_players
        ? Math.min(100, ((tournament.registered_count || 0) / tournament.max_players) * 100)
        : null;

    const roundLabel = tournament.current_round
        ? tournament.total_rounds
            ? `Ronda ${tournament.current_round}/${tournament.total_rounds}`
            : `Ronda ${tournament.current_round}`
        : null;

    return (
        <Link href={`/torneos/${tournament.id}`} className="block group">
            <div className="relative border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--surface)] transition-all group-hover:border-[var(--accent)]/40 group-hover:shadow-lg group-hover:shadow-[var(--accent)]/5">
                {/* Colored top bar */}
                <div
                    className={`h-1.5 w-full ${isLive ? "animate-pulse" : ""}`}
                    style={{ background: status.barColor }}
                />

                <div className="p-4 space-y-3">
                    {/* Row 1: Logo + Title + Status */}
                    <div className="flex items-start gap-3">
                        {/* Game color dot + Tenant logo */}
                        <div className="relative shrink-0">
                            {tournament.tenant_logo_url ? (
                                <div className="w-11 h-11 rounded-xl overflow-hidden border border-[var(--border)]">
                                    <Image
                                        src={tournament.tenant_logo_url}
                                        alt={tournament.tenant_name || ""}
                                        width={44}
                                        height={44}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black border"
                                    style={{
                                        background: `${gameBrand.color}15`,
                                        borderColor: `${gameBrand.color}25`,
                                        color: gameBrand.color,
                                    }}
                                >
                                    {tournament.game?.slice(0, 3).toUpperCase() || "TCG"}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                                {tournament.name}
                            </h3>
                            <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                                {tournament.tenant_name || tournament.organizer_username || "Torneo"}
                            </p>
                        </div>

                        <Chip color={status.color} variant="soft" size="sm" className="shrink-0 text-[10px]">
                            {isLive && (
                                <span className="relative inline-flex h-2 w-2 mr-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                                </span>
                            )}
                            {status.label}
                        </Chip>
                    </div>

                    {/* Live round banner */}
                    {isLive && roundLabel && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--success)]/8 border border-[var(--success)]/15">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]" />
                            </span>
                            <span className="text-[11px] font-bold text-[var(--success)]">{roundLabel}</span>
                        </div>
                    )}

                    {/* Tags row */}
                    <div className="flex flex-wrap gap-1.5">
                        <Chip variant="secondary" size="sm">{tournament.game}</Chip>
                        {tournament.format && <Chip variant="secondary" size="sm">{tournament.format}</Chip>}
                        {tournament.is_ranked && <Chip color="warning" variant="soft" size="sm">Ranked</Chip>}
                        {tournament.is_online && <Chip variant="soft" size="sm">Online</Chip>}
                    </div>

                    {/* Info grid: date + location */}
                    <div className="flex items-center gap-4 text-[11px] text-[var(--muted)]">
                        {date && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="size-3.5 text-[var(--accent)]" />
                                <span className="capitalize">{date}</span>
                            </span>
                        )}
                        {tournament.city && (
                            <span className="flex items-center gap-1.5 truncate">
                                <MapPin className="size-3.5 shrink-0" />
                                <span className="truncate">{tournament.city}</span>
                            </span>
                        )}
                    </div>

                    {/* Capacity bar */}
                    {progress !== null && (
                        <div>
                            <div className="flex items-center justify-between text-[11px] mb-1.5 text-[var(--muted)]">
                                <span className="flex items-center gap-1">
                                    <Persons className="size-3.5" />
                                    <span className="font-semibold text-[var(--foreground)]">{tournament.registered_count || 0}</span>
                                    /{tournament.max_players}
                                </span>
                                {(tournament.prize_pool || tournament.entry_fee) && (
                                    <span className="flex items-center gap-2">
                                        {tournament.prize_pool && (
                                            <span className="text-[var(--accent)] font-semibold flex items-center gap-0.5">
                                                <Cup className="size-3" /> {tournament.prize_pool}
                                            </span>
                                        )}
                                        {tournament.entry_fee ? (
                                            <span>· {tournament.entry_fee}</span>
                                        ) : isOpen ? (
                                            <span className="text-[var(--success)] font-semibold">Gratis</span>
                                        ) : null}
                                    </span>
                                )}
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden bg-[var(--surface-secondary)]">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${progress}%`,
                                        background: progress > 85 ? "var(--danger)" : "var(--accent)",
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* CTA row */}
                    <div className="flex gap-2 pt-1">
                        {isLive ? (
                            <Button
                                size="sm"
                                className="flex-1 font-semibold bg-[var(--success)] text-[var(--success-foreground)]"
                            >
                                Ver en vivo
                            </Button>
                        ) : isOpen ? (
                            <>
                                <Button
                                    size="sm"
                                    className="flex-1 font-semibold bg-[var(--accent)] text-[var(--accent-foreground)]"
                                >
                                    Inscribirse
                                </Button>
                                <Button size="sm" variant="secondary" className="font-semibold">
                                    Detalles
                                </Button>
                            </>
                        ) : (
                            <Button size="sm" variant="secondary" className="flex-1 font-semibold">
                                Ver detalles
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
