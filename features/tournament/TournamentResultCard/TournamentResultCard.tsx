import { Avatar } from "@heroui/react/avatar";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";

import { Cup, Persons, Link as LinkIcon } from "@gravity-ui/icons";

export interface FeedTournamentResult {
    id: string;
    tournament_name: string;
    game: string;
    format?: string;
    structure?: string;
    podium: { place: number; username: string; avatar_url?: string; elo_change?: number }[];
    participants_count: number;
    rounds_count: number;
    bracket_url?: string;
}

const placeConfig: Record<number, { emoji: string; color: string; bgColor: string; height: string; label: string }> = {
    1: { emoji: "🥇", color: "#FFD700", bgColor: "rgba(255, 215, 0, 0.15)", height: "h-24", label: "1er" },
    2: { emoji: "🥈", color: "#C0C0C0", bgColor: "rgba(192, 192, 192, 0.15)", height: "h-16", label: "2do" },
    3: { emoji: "🥉", color: "#CD7F32", bgColor: "rgba(205, 127, 50, 0.15)", height: "h-12", label: "3er" },
};

export default function TournamentResultCard({
    result,
}: {
    result: FeedTournamentResult;
}) {
    // Order podium: 2nd, 1st, 3rd for visual display
    const first = result.podium.find((p) => p.place === 1);
    const second = result.podium.find((p) => p.place === 2);
    const third = result.podium.find((p) => p.place === 3);
    const podiumOrder = [second, first, third].filter(Boolean) as typeof result.podium;

    return (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Card.Content className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-2">
                    <Cup className="size-5 flex-shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>
                            {result.tournament_name}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                            <Chip variant="secondary" size="sm">{result.game}</Chip>
                            {result.format && <Chip variant="secondary" size="sm">{result.format}</Chip>}
                            {result.structure && <Chip variant="secondary" size="sm">{result.structure}</Chip>}
                        </div>
                    </div>
                </div>

                {/* Visual Podium */}
                {podiumOrder.length > 0 && (
                    <div className="flex items-end justify-center gap-2 px-2 pt-2">
                        {podiumOrder.map((p) => {
                            const config = placeConfig[p.place] || placeConfig[3];
                            return (
                                <div
                                    key={p.place}
                                    className="flex flex-col items-center flex-1 max-w-[100px]"
                                >
                                    {/* Avatar + Name above podium */}
                                    <div className="flex flex-col items-center mb-2">
                                        <Avatar size="sm" className="mb-1">
                                            {p.avatar_url ? (
                                                <Avatar.Image alt={p.username} src={p.avatar_url} />
                                            ) : null}
                                            <Avatar.Fallback>{p.username[0]?.toUpperCase()}</Avatar.Fallback>
                                        </Avatar>
                                        <p
                                            className="text-[10px] font-semibold truncate max-w-full text-center"
                                            style={{ color: "var(--foreground)" }}
                                        >
                                            {p.username}
                                        </p>
                                        {/* ELO change */}
                                        {p.elo_change != null && (
                                            <span
                                                className="text-[10px] font-bold"
                                                style={{
                                                    color: p.elo_change >= 0 ? "var(--success)" : "var(--danger)",
                                                }}
                                            >
                                                {p.elo_change >= 0 ? "+" : ""}{p.elo_change} ELO
                                            </span>
                                        )}
                                    </div>
                                    {/* Podium block */}
                                    <div
                                        className={`w-full ${config.height} rounded-t-lg flex flex-col items-center justify-center border-t-2`}
                                        style={{
                                            background: config.bgColor,
                                            borderColor: config.color,
                                        }}
                                    >
                                        <span className="text-lg">{config.emoji}</span>
                                        <span
                                            className="text-[10px] font-bold"
                                            style={{ color: config.color }}
                                        >
                                            {config.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Flat list fallback for non-top-3 */}
                {result.podium.filter((p) => p.place > 3).length > 0 && (
                    <div className="space-y-1.5">
                        {result.podium
                            .filter((p) => p.place > 3)
                            .map((p) => (
                                <div
                                    key={p.place}
                                    className="flex items-center gap-3 p-2 rounded-lg"
                                    style={{ background: "var(--surface-secondary)" }}
                                >
                                    <span className="text-xs font-bold w-6 text-center text-[var(--muted)]">
                                        #{p.place}
                                    </span>
                                    <Avatar size="sm">
                                        {p.avatar_url ? (
                                            <Avatar.Image alt={p.username} src={p.avatar_url} />
                                        ) : null}
                                        <Avatar.Fallback>{p.username[0]?.toUpperCase()}</Avatar.Fallback>
                                    </Avatar>
                                    <span className="text-sm font-semibold flex-1" style={{ color: "var(--foreground)" }}>
                                        {p.username}
                                    </span>
                                    {p.elo_change != null && (
                                        <span
                                            className="text-xs font-bold"
                                            style={{
                                                color: p.elo_change >= 0 ? "var(--success)" : "var(--danger)",
                                            }}
                                        >
                                            {p.elo_change >= 0 ? "+" : ""}{p.elo_change} ELO
                                        </span>
                                    )}
                                </div>
                            ))}
                    </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
                    <span className="flex items-center gap-1">
                        <Persons className="size-3" /> {result.participants_count} participantes
                    </span>
                    <span>{result.rounds_count} rondas</span>
                    {result.bracket_url && (
                        <a
                            href={result.bracket_url}
                            className="flex items-center gap-1 ml-auto hover:underline"
                            style={{ color: "var(--accent)" }}
                        >
                            <LinkIcon className="size-3" /> Ver bracket
                        </a>
                    )}
                </div>
            </Card.Content>
        </Card>
    );
}
