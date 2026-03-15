"use client";

import { useState, useEffect } from "react";
import { Card, Chip } from "@heroui/react";
import { ArrowUpRightFromSquare, Flame, Cup } from "@gravity-ui/icons";
import Link from "next/link";
import { getTournaments } from "@/lib/api/tournaments";
import { getGames } from "@/lib/api/catalog";
import { getTenants } from "@/lib/api/tenants";
import type { Tournament } from "@/lib/types/tournament";
import type { CatalogGame } from "@/lib/types/catalog";
import type { Tenant } from "@/lib/types/tenant";

export default function RightSidebar() {
    const [ongoingTournaments, setOngoingTournaments] = useState<Tournament[]>([]);
    const [trendingGames, setTrendingGames] = useState<CatalogGame[]>([]);
    const [suggestedTenants, setSuggestedTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch independently to avoid mixed inference issues (more stable for TS)
                const tournamentsT = await getTournaments({ status: "ROUND_IN_PROGRESS", per_page: 2 }).catch(() => null);
                const gamesT = await getGames().catch(() => null);
                const tenantsT = await getTenants({ per_page: 3 }).catch(() => null);

                if (tournamentsT?.tournaments) {
                    setOngoingTournaments(tournamentsT.tournaments);
                }

                // If no ongoing (ROUND_IN_PROGRESS), show upcoming (OPEN)
                if (!tournamentsT?.tournaments?.length) {
                    const upcomingRes = await getTournaments({ status: "OPEN", per_page: 2 }).catch(() => null);
                    if (upcomingRes?.tournaments) {
                        setOngoingTournaments(upcomingRes.tournaments);
                    }
                }

                if (gamesT?.data) {
                    setTrendingGames(gamesT.data.slice(0, 3));
                } else if (gamesT?.games) {
                    setTrendingGames(gamesT.games.slice(0, 3));
                }

                if (tenantsT?.tenants) {
                    setSuggestedTenants(tenantsT.tenants);
                } else if ((tenantsT as any)?.data?.tenants) {
                    setSuggestedTenants((tenantsT as any).data.tenants);
                }
            } catch (error) {
                console.error("Error fetching RightSidebar data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <aside
            className="hidden xl:flex flex-col w-[239px] h-[calc(100vh-4rem)] sticky top-16 border-l overflow-y-auto p-4 gap-4"
            style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
            }}
        >
            {/* Trending Games */}
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Flame className="size-4 text-[var(--warning)]" />
                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        Trending
                    </h3>
                </div>
                <div className="flex flex-col gap-2">
                    {trendingGames.map((game) => (
                        <Link
                            key={game.slug}
                            href={`/juegos/${game.slug}`}
                            className="text-xs px-2.5 py-1.5 rounded-lg transition-colors hover:bg-[var(--surface-tertiary)]"
                            style={{
                                background: "var(--surface-secondary)",
                                color: "var(--foreground)",
                            }}
                        >
                            {game.name}
                        </Link>
                    ))}
                    {!loading && trendingGames.length === 0 && (
                        <span className="text-xs text-[var(--muted)] italic px-1">No hay juegos tendencia</span>
                    )}
                </div>
            </Card>

            {/* Tournaments */}
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Cup className="size-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        Torneos en Curso
                    </h3>
                </div>
                <div className="flex flex-col gap-2">
                    {ongoingTournaments.map((t) => (
                        <Link
                            key={t.id}
                            href={`/torneos?id=${t.id}`} // Or actual tournament page if available
                            className="text-xs p-2 rounded-lg transition-colors hover:bg-[var(--surface-tertiary)]"
                            style={{ background: "var(--surface-secondary)" }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-medium truncate max-w-[120px]" style={{ color: "var(--foreground)" }}>
                                    {t.name}
                                </span>
                                <Chip size="sm" color={t.status === "ROUND_IN_PROGRESS" ? "success" : "warning"} variant="soft">
                                    {t.status === "ROUND_IN_PROGRESS" ? "En vivo" : "Próximo"}
                                </Chip>
                            </div>
                            <span style={{ color: "var(--muted)" }}>
                                {t.registered_count || 0} inscritos {t.current_round ? `• Ronda ${t.current_round}` : ""}
                            </span>
                        </Link>
                    ))}
                    {!loading && ongoingTournaments.length === 0 && (
                        <div className="text-xs p-4 text-center rounded-xl bg-[var(--surface-secondary)]/50 border border-dashed border-[var(--border)]">
                            <p style={{ color: "var(--muted)" }}>No hay torneos activos ahora.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Suggestions */}
            <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
                    Sugerencias
                </h3>
                <div className="flex flex-col gap-3">
                    {suggestedTenants.map((tenant) => (
                        <Link
                            key={tenant.id}
                            href={`/comunidades/${tenant.slug || tenant.id}`}
                            className="flex items-center gap-2 p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
                        >
                            <div className="size-6 rounded bg-[var(--surface-tertiary)] flex items-center justify-center text-[10px] shrink-0 overflow-hidden">
                                {tenant.logo_url ? (
                                    <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover" />
                                ) : "🏠"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold truncate text-[var(--foreground)]">{tenant.name}</p>
                                <p className="text-[9px] text-[var(--muted)] truncate">{tenant.city || "Comunidad"}</p>
                            </div>
                        </Link>
                    ))}

                    <div className="pt-2 border-t flex flex-col gap-1" style={{ borderColor: 'var(--border)' }}>
                        <Link
                            href="/comunidades"
                            className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-[var(--surface-secondary)] text-[10px]"
                            style={{ color: "var(--muted)" }}
                        >
                            <ArrowUpRightFromSquare className="size-3" />
                            <span>Explora todas las tiendas</span>
                        </Link>
                    </div>
                </div>
            </Card>
        </aside>
    );
}
