"use client";

import { useTournaments } from "@/lib/hooks/use-tournaments";
import { TournamentCard } from "@/components/cards";
import { Button, Card } from "@heroui/react";
import Link from "next/link";

interface Props {
    gameSlug: string;
}

export default function GameActiveTournaments({ gameSlug }: Props) {
    const { data, isLoading } = useTournaments({ game: gameSlug, per_page: 6 });
    const tournaments = data?.tournaments ?? [];

    // Filter to upcoming/active only
    const activeTournaments = tournaments.filter((t) => {
        return t.status !== "FINISHED" && t.status !== "finished" && t.status !== "CLOSED" && t.status !== "cancelled";
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Torneos Activos</h2>
                <Link href={`/torneos?game=${gameSlug}`}>
                    <Button variant="secondary" size="sm" className="font-semibold">
                        Ver todos &rarr;
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-48 rounded-[22px] bg-[var(--surface-secondary)] animate-pulse" />
                    ))}
                </div>
            ) : activeTournaments.length > 0 ? (
                <div className="flex flex-col gap-4 max-w-4xl">
                    {activeTournaments.map((tournament) => (
                        <TournamentCard key={tournament.id} tournament={tournament} />
                    ))}
                </div>
            ) : (
                <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Card.Content className="py-12 text-center">
                        <p className="text-3xl mb-3 opacity-50">⚔️</p>
                        <p className="text-lg font-medium text-[var(--foreground)]">No hay torneos activos</p>
                        <p className="text-sm mt-1 text-[var(--muted)]">No hay torneos próximos o en curso para este juego.</p>
                    </Card.Content>
                </Card>
            )}
        </div>
    );
}
