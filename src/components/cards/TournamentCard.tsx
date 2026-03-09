import { Card, Chip, Button, Avatar } from "@heroui/react";
import type { Tournament } from "@/lib/api";
import { Clock, Persons, MapPin } from "@gravity-ui/icons";

const statusConfig: Record<string, { color: "success" | "warning" | "danger" | "default"; label: string }> = {
    active: { color: "success", label: "En vivo" },
    upcoming: { color: "warning", label: "Próximo" },
    finished: { color: "default", label: "Finalizado" },
    cancelled: { color: "danger", label: "Cancelado" },
};

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
    const status = statusConfig[tournament.status] || statusConfig.upcoming;
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
                    className="h-1 w-full"
                    style={{
                        background:
                            tournament.status === "active"
                                ? "var(--success)"
                                : tournament.status === "upcoming"
                                    ? "var(--warning)"
                                    : "var(--border)",
                    }}
                />

                <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
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
                        <Chip color={status.color} variant="soft" size="sm">
                            {status.label}
                        </Chip>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-1.5">
                        <Chip variant="secondary" size="sm">{tournament.game}</Chip>
                        {tournament.format && (
                            <Chip variant="secondary" size="sm">{tournament.format}</Chip>
                        )}
                        {tournament.is_ranked && (
                            <Chip color="warning" variant="soft" size="sm">⭐ Ranked</Chip>
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

                    {/* Prize */}
                    {tournament.prize_pool && (
                        <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                            🏆 {tournament.prize_pool}
                        </p>
                    )}

                    {/* CTA */}
                    <Button
                        size="sm"
                        className="w-full font-semibold"
                        style={{
                            background: tournament.status === "active" ? "var(--success)" : "var(--accent)",
                            color: tournament.status === "active" ? "var(--success-foreground)" : "var(--accent-foreground)",
                        }}
                    >
                        {tournament.status === "active" ? "Ver en vivo" : "Ver detalles"}
                    </Button>
                </div>
            </Card.Content>
        </Card>
    );
}
