"use client";

import { useEffect, useState } from "react";
import { Chip, Avatar, Button, Spinner } from "@heroui/react";
import { Cup, Persons, MapPin, Clock } from "@gravity-ui/icons";
import { getTournamentStandings } from "@/lib/api/tournaments";
import type { Tournament, Standing } from "@/lib/types/tournament";
import Link from "next/link";
import Image from "next/image";
import { getGameBrand } from "@/lib/gameLogos";

const placeEmoji: Record<number, string> = { 1: "\u{1F947}", 2: "\u{1F948}", 3: "\u{1F949}" };

export default function PastTournamentCard({ tournament }: { tournament: Tournament }) {
    const [standings, setStandings] = useState<Standing[]>([]);
    const [loading, setLoading] = useState(true);
    const gameBrand = getGameBrand(tournament.game?.toLowerCase?.() || "");

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getTournamentStandings(tournament.id)
            .then((res) => {
                if (mounted && res.standings) setStandings(res.standings.slice(0, 3));
            })
            .catch(() => {})
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [tournament.id]);

    const date = tournament.starts_at
        ? new Date(tournament.starts_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })
        : null;

    return (
        <Link href={`/torneos/${tournament.id}`} className="block group">
            <div className="relative border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--surface)] transition-all group-hover:border-[var(--accent)]/40 group-hover:shadow-lg group-hover:shadow-[var(--accent)]/5">
                {/* Muted top bar */}
                <div className="h-1.5 w-full bg-[var(--border)]" />

                <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
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
                                {tournament.tenant_name || "Torneo finalizado"}
                            </p>
                        </div>

                        <Chip variant="soft" size="sm" className="shrink-0 text-[10px]">Finalizado</Chip>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                        <Chip variant="secondary" size="sm">{tournament.game}</Chip>
                        {tournament.format && <Chip variant="secondary" size="sm">{tournament.format}</Chip>}
                        {tournament.is_ranked && <Chip color="warning" variant="soft" size="sm">Ranked</Chip>}
                    </div>

                    {/* Podium */}
                    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                        <div className="px-3 py-2 bg-[var(--surface-secondary)] border-b border-[var(--border)]">
                            <p className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                                <Cup className="size-3.5" style={{ color: "var(--warning)" }} /> Podio
                            </p>
                        </div>
                        <div className="p-2">
                            {loading ? (
                                <div className="flex justify-center py-4"><Spinner size="sm" /></div>
                            ) : standings.length > 0 ? (
                                <div className="space-y-1">
                                    {standings.map((p) => (
                                        <div
                                            key={p.user_id}
                                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
                                        >
                                            <span className="text-base w-6 text-center">{placeEmoji[p.rank] || `#${p.rank}`}</span>
                                            <Avatar className="w-7 h-7 text-[10px] border border-[var(--border)]">
                                                <Avatar.Fallback>{p.username[0]?.toUpperCase()}</Avatar.Fallback>
                                            </Avatar>
                                            <span className="text-sm font-semibold text-[var(--foreground)] truncate flex-1">{p.username}</span>
                                            <span className="text-[10px] text-[var(--muted)] font-medium shrink-0">
                                                {p.points}pts · {p.wins}W-{p.losses}L
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-center py-3 text-[var(--muted)] italic">Sin resultados</p>
                            )}
                        </div>
                    </div>

                    {/* Info + CTA */}
                    <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                        <div className="flex items-center gap-3">
                            {date && (
                                <span className="flex items-center gap-1">
                                    <Clock className="size-3.5" /> {date}
                                </span>
                            )}
                            {tournament.city && (
                                <span className="flex items-center gap-1 truncate">
                                    <MapPin className="size-3.5" /> {tournament.city}
                                </span>
                            )}
                        </div>
                        <span className="flex items-center gap-1">
                            <Persons className="size-3.5" /> {tournament.registered_count || 0}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
