import { Card, Chip, Button, Avatar } from "@heroui/react";
import type { Tournament } from "@/lib/types/tournament";
import { Clock, Persons, MapPin } from "@gravity-ui/icons";
import Image from "next/image";
import Link from "next/link";

const statusConfig: Record<string, { color: "success" | "warning" | "danger" | "default"; label: string }> = {
    active: { color: "success", label: "EN VIVO" },
    ROUND_IN_PROGRESS: { color: "success", label: "EN VIVO" },
    upcoming: { color: "warning", label: "Próximo" },
    OPEN: { color: "warning", label: "Inscripciones abiertas" },
    CHECK_IN: { color: "warning", label: "Check-in" },
    finished: { color: "default", label: "Finalizado" },
    FINISHED: { color: "default", label: "Finalizado" },
    cancelled: { color: "danger", label: "Cancelado" },
    CLOSED: { color: "danger", label: "Cerrado" },
};

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
    const status = statusConfig[tournament.status] || statusConfig.upcoming;
    const isLive = tournament.status === "active" || tournament.status === "ROUND_IN_PROGRESS";
    const isOpen = tournament.status === "OPEN" || tournament.status === "upcoming" || tournament.status === "CHECK_IN";

    const date = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleDateString("es-CL", {
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
            ? `Ronda ${tournament.current_round} de ${tournament.total_rounds}`
            : `Ronda ${tournament.current_round}`
        : null;

    return (
        <Card
            className="overflow-hidden transition-all duration-200 hover:scale-[1.01]"
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
            }}
        >
            <Card.Content className="p-0">
                {/* Status bar */}
                <div
                    className={`h-1 w-full ${isLive ? "animate-pulse" : ""}`}
                    style={{
                        background: isLive
                            ? "var(--success)"
                            : isOpen
                                ? "var(--warning)"
                                : "var(--border)",
                    }}
                />

                <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Tenant logo */}
                            {tournament.tenant_logo_url ? (
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border)]">
                                    <Image
                                        src={tournament.tenant_logo_url}
                                        alt={tournament.tenant_name || ""}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : tournament.tenant_name ? (
                                <Avatar size="sm" className="flex-shrink-0">
                                    <Avatar.Fallback>{tournament.tenant_name[0]?.toUpperCase()}</Avatar.Fallback>
                                </Avatar>
                            ) : null}

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>
                                    {tournament.name}
                                </h3>
                                {tournament.tenant_name && (
                                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                                        {tournament.tenant_name}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Chip color={status.color} variant="soft" size="sm" className="flex-shrink-0">
                            {status.label}
                        </Chip>
                    </div>

                    {/* Live round indicator */}
                    {isLive && roundLabel && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span>
                            </span>
                            <span className="text-xs font-semibold text-[var(--success)]">{roundLabel}</span>
                        </div>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap gap-1.5">
                        <Chip variant="secondary" size="sm">{tournament.game}</Chip>
                        {tournament.format && (
                            <Chip variant="secondary" size="sm">{tournament.format}</Chip>
                        )}
                        {tournament.is_ranked && (
                            <Chip color="warning" variant="soft" size="sm">Ranked</Chip>
                        )}
                    </div>

                    {/* Info row */}
                    <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
                        {date && (
                            <span className="flex items-center gap-1">
                                <Clock className="size-3" /> {date}
                            </span>
                        )}
                        {tournament.city && (
                            <span className="flex items-center gap-1">
                                <MapPin className="size-3" /> {tournament.city}
                            </span>
                        )}
                    </div>

                    {/* Capacity bar */}
                    {progress !== null && (
                        <div>
                            <div className="flex items-center justify-between text-xs mb-1" style={{ color: "var(--muted)" }}>
                                <span className="flex items-center gap-1">
                                    <Persons className="size-3" />
                                    {tournament.registered_count || 0}/{tournament.max_players}
                                </span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div
                                className="h-1.5 rounded-full overflow-hidden"
                                style={{ background: "var(--surface-tertiary)" }}
                            >
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${progress}%`, background: "var(--accent)" }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Prize & Entry fee */}
                    <div className="flex items-center justify-between">
                        {tournament.prize_pool && (
                            <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                                🏆 {tournament.prize_pool}
                            </p>
                        )}
                        {tournament.entry_fee && (
                            <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                                Inscripción: {tournament.entry_fee}
                            </p>
                        )}
                        {!tournament.entry_fee && !tournament.prize_pool && isOpen && (
                            <p className="text-xs font-medium" style={{ color: "var(--success)" }}>
                                Gratis
                            </p>
                        )}
                    </div>

                    {/* CTA */}
                    {isLive ? (
                        <Link href={`/torneos/${tournament.id}`} passHref legacyBehavior>
                            <Button
                                size="sm"
                                className="w-full font-semibold"
                                style={{
                                    background: "var(--success)",
                                    color: "var(--success-foreground)",
                                }}
                            >
                                Ver en vivo
                            </Button>
                        </Link>
                    ) : isOpen ? (
                        <div className="flex gap-2">
                            {tournament.inscription_url ? (
                                <a href={tournament.inscription_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                    <Button
                                        size="sm"
                                        className="w-full font-semibold"
                                        style={{
                                            background: "var(--accent)",
                                            color: "var(--accent-foreground)",
                                        }}
                                    >
                                        Inscribirse
                                    </Button>
                                </a>
                            ) : (
                                <Link href={`/torneos/${tournament.id}`} passHref legacyBehavior>
                                    <Button
                                        size="sm"
                                        className="w-full font-semibold"
                                        style={{
                                            background: "var(--accent)",
                                            color: "var(--accent-foreground)",
                                        }}
                                    >
                                        Inscribirse
                                    </Button>
                                </Link>
                            )}
                            <Link href={`/torneos/${tournament.id}`} passHref legacyBehavior>
                                <Button
                                    size="sm"
                                    variant="tertiary"
                                    className="font-semibold"
                                >
                                    Detalles
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Link href={`/torneos/${tournament.id}`} passHref legacyBehavior>
                            <Button
                                size="sm"
                                className="w-full font-semibold"
                                variant="tertiary"
                            >
                                Ver detalles
                            </Button>
                        </Link>
                    )}
                </div>
            </Card.Content>
        </Card>
    );
}
