"use client";

import { useState } from "react";
import { useRatingLeaderboard } from "@/lib/hooks/use-ratings";
import { useGameFormats } from "@/lib/hooks/use-catalog";
import { Avatar, Button, Select, ListBox, Card } from "@heroui/react";
import Link from "next/link";

interface Props {
    gameSlug: string;
}

export default function GameLeaderboard({ gameSlug }: Props) {
    const { data: formatsData } = useGameFormats(gameSlug);
    const rawFormats = formatsData?.data || formatsData?.formats;
    const formats = Array.isArray(rawFormats) ? rawFormats : [];

    const [selectedFormat, setSelectedFormat] = useState(formats[0]?.slug || formats[0]?.id || "");

    // Update format when formats load
    const formatId = selectedFormat || formats[0]?.slug || formats[0]?.id || "";

    const { data, isLoading } = useRatingLeaderboard({
        game: gameSlug,
        format: formatId,
    });

    const leaderboard = data?.leaderboard ?? [];
    const top10 = leaderboard.slice(0, 10);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Tabla de Clasificación</h2>
                {formats.length > 1 && (
                    <Select
                        selectedKey={formatId}
                        onSelectionChange={(key) => setSelectedFormat(String(key))}
                        className="max-w-[200px]"
                        aria-label="Formato"
                    >
                        <Select.Trigger className="min-h-9 text-sm rounded-xl bg-[var(--surface)] border border-[var(--border)]" />
                        <Select.Popover>
                            <ListBox>
                                {formats.map((f) => (
                                    <ListBox.Item key={f.slug || f.id} id={f.slug || f.id} textValue={f.name}>
                                        {f.name}
                                    </ListBox.Item>
                                ))}
                            </ListBox>
                        </Select.Popover>
                    </Select>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-14 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
                    ))}
                </div>
            ) : top10.length > 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                    {top10.map((entry, idx) => {
                        const isTopThree = entry.rank <= 3;
                        const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;
                        return (
                            <div
                                key={entry.user_id}
                                className={`flex items-center gap-3 px-4 py-3 ${
                                    idx < top10.length - 1 ? "border-b border-[var(--border)]" : ""
                                } ${isTopThree ? "bg-[var(--accent)]/5" : ""}`}
                            >
                                <span className="w-8 text-center font-bold text-sm text-[var(--muted)]">
                                    {medal || `#${entry.rank}`}
                                </span>
                                <Avatar size="sm" className="flex-shrink-0">
                                    {entry.avatar_url ? (
                                        <Avatar.Image src={entry.avatar_url} />
                                    ) : null}
                                    <Avatar.Fallback className="text-[10px]">
                                        {entry.username?.[0]?.toUpperCase() || "?"}
                                    </Avatar.Fallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <Link href={`/jugadores/${entry.username}`} className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent)] truncate block">
                                        {entry.username}
                                    </Link>
                                    {entry.title && (
                                        <p className="text-[10px] text-[var(--muted)]">{entry.title}</p>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-bold text-[var(--accent)]">
                                        {entry.rating ?? entry.total_xp ?? 0}
                                    </p>
                                    {entry.wins != null && (
                                        <p className="text-[10px] text-[var(--muted)]">
                                            {entry.wins}W {entry.losses ?? 0}L
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Card.Content className="py-12 text-center">
                        <p className="text-3xl mb-3 opacity-50">🏆</p>
                        <p className="text-lg font-medium text-[var(--foreground)]">Sin rankings disponibles</p>
                        <p className="text-sm mt-1 text-[var(--muted)]">
                            {!formatId
                                ? "No hay formatos registrados para este juego aún."
                                : "Aún no hay datos de ranking para este formato."}
                        </p>
                    </Card.Content>
                </Card>
            )}

            <Link href="/ranking" className="self-center">
                <Button variant="secondary" size="sm" className="font-semibold">
                    Ver Ranking General &rarr;
                </Button>
            </Link>
        </div>
    );
}
