import { Card, Chip, Avatar } from "@heroui/react";
import { Cup, Persons, Link as LinkIcon } from "@gravity-ui/icons";

export interface FeedTournamentResult {
    id: string;
    tournament_name: string;
    game: string;
    podium: { place: number; username: string; avatar_url?: string; elo_change?: number }[];
    participants_count: number;
    rounds_count: number;
    bracket_url?: string;
}

const placeEmoji: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function TournamentResultCard({
    result,
}: {
    result: FeedTournamentResult;
}) {
    return (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Card.Content className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <Cup className="size-5" style={{ color: "var(--warning)" }} />
                    <h3 className="font-bold text-sm flex-1" style={{ color: "var(--foreground)" }}>
                        {result.tournament_name}
                    </h3>
                    <Chip variant="secondary" size="sm">{result.game}</Chip>
                </div>

                {/* Podium */}
                <div className="space-y-2">
                    {result.podium.map((p) => (
                        <div
                            key={p.place}
                            className="flex items-center gap-3 p-2 rounded-lg"
                            style={{ background: "var(--surface-secondary)" }}
                        >
                            <span className="text-lg w-7 text-center">{placeEmoji[p.place] || `#${p.place}`}</span>
                            <Avatar size="sm">
                                {p.avatar_url ? <Avatar.Image alt={p.username} src={p.avatar_url} /> : null}
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
