"use client";

import { useEffect, useState } from "react";
import { Card, Chip, Avatar, Button, Spinner } from "@heroui/react";
import { Cup, Persons, MapPin, Clock } from "@gravity-ui/icons";
import { getTournamentStandings } from "@/lib/api/tournaments";
import type { Tournament, Standing } from "@/lib/types/tournament";
import Link from "next/link";
import Image from "next/image";

const placeEmoji: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function PastTournamentCard({
    tournament,
}: {
    tournament: Tournament;
}) {
    const [standings, setStandings] = useState<Standing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getTournamentStandings(tournament.id)
            .then((res) => {
                if (mounted && res.standings) {
                    setStandings(res.standings.slice(0, 3));
                }
            })
            .catch(() => {
                // fail silently for visual widget
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [tournament.id]);

    const date = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleDateString("es-CL", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
        : null;

    return (
        <Card
            className="overflow-hidden transition-all duration-200 hover:scale-[1.01]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
            <Card.Content className="p-4 space-y-4">
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
                            <div className="flex items-center gap-2 mb-1">
                                <Cup className="size-5" style={{ color: "var(--warning)" }} />
                                <h3 className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>
                                    {tournament.name}
                                </h3>
                            </div>
                            {tournament.tenant_name && (
                                <p className="text-xs" style={{ color: "var(--muted)" }}>
                                    {tournament.tenant_name}
                                </p>
                            )}
                        </div>
                    </div>
                    <Chip variant="soft" size="sm">Finalizado</Chip>
                </div>

                {/* Meta Tags */}
                <div className="flex flex-wrap gap-1.5">
                    <Chip variant="secondary" size="sm">{tournament.game}</Chip>
                    {tournament.format && (
                        <Chip variant="secondary" size="sm">{tournament.format}</Chip>
                    )}
                    {tournament.is_ranked && (
                        <Chip color="warning" variant="soft" size="sm">⭐ Ranked</Chip>
                    )}
                </div>

                {/* Podium */}
                <div className="bg-[var(--surface-secondary)] rounded-xl p-3 space-y-2 border border-[var(--border)]">
                    <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Podio Final</p>
                    {loading ? (
                        <div className="flex justify-center py-4"><Spinner size="sm" /></div>
                    ) : standings.length > 0 ? (
                        standings.map((p) => (
                            <div
                                key={p.user_id}
                                className="flex items-center gap-3 p-2 rounded-lg"
                                style={{ background: "var(--surface-secondary)" }}
                            >
                                <span className="text-lg w-6 text-center">{placeEmoji[p.rank] || `#${p.rank}`}</span>
                                <Avatar size="sm">
                                    <Avatar.Fallback>{p.username[0]?.toUpperCase()}</Avatar.Fallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                                        {p.username}
                                    </p>
                                    <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                                        {p.points} pts ({p.wins}W-{p.losses}L-{p.draws}D)
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-center py-2 italic" style={{ color: "var(--muted)" }}>Resultados no disponibles</p>
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
                    <span className="flex items-center gap-1 ml-auto">
                        <Persons className="size-3" /> {tournament.registered_count || 0}
                    </span>
                </div>

                {/* CTA */}
                <Link href={`/torneos/${tournament.id}`} passHref legacyBehavior>
                    <Button
                        size="sm"
                        className="w-full font-semibold"
                        variant="tertiary"
                    >
                        Ver bracket y detalles
                    </Button>
                </Link>
            </Card.Content>
        </Card>
    );
}
