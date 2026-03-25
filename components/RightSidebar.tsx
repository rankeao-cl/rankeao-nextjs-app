"use client";

import { useState, useEffect } from "react";
import { Chip } from "@heroui/react";
import { Flame, Cup, Persons, ArrowRight, ShoppingCart, ChartColumn } from "@gravity-ui/icons";
import Link from "next/link";
import Image from "next/image";
import { getTournaments } from "@/lib/api/tournaments";
import { getGames } from "@/lib/api/catalog";
import { getTenants } from "@/lib/api/tenants";
import { getListings } from "@/lib/api/marketplace";
import { getRatingLeaderboard } from "@/lib/api/ratings";
import type { Tournament } from "@/lib/types/tournament";
import type { CatalogGame } from "@/lib/types/catalog";
import type { Tenant } from "@/lib/types/tenant";
import type { Listing } from "@/lib/types/marketplace";
import { getGameBrand } from "@/lib/gameLogos";

function SidebarSection({ title, icon, children, viewAllHref }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    viewAllHref?: string;
}) {
    return (
        <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h3>
                </div>
                {viewAllHref && (
                    <Link href={viewAllHref} className="text-[10px] font-semibold text-accent hover:underline flex items-center gap-0.5">
                        Ver todo <ArrowRight className="size-3" />
                    </Link>
                )}
            </div>
            {children}
        </div>
    );
}

export default function RightSidebar() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [games, setGames] = useState<CatalogGame[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [topPlayers, setTopPlayers] = useState<{ username: string; avatar_url?: string; elo: number; rank: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getTournaments({ status: "ROUND_IN_PROGRESS", per_page: 3 }).catch(() => null),
            getGames().catch(() => null),
            getTenants({ per_page: 3 }).catch(() => null),
            getListings({ sort: "newest", per_page: 4 }).catch(() => null),
            getRatingLeaderboard({ game: "pokemon-tcg", format: "standard", per_page: 5 }).catch(() => null),
        ]).then(async ([tournamentsRes, gamesRes, tenantsRes, listingsRes, leaderboardRes]) => {
            // Tournaments: prefer live, fallback to upcoming
            let t = tournamentsRes?.tournaments;
            if (!t?.length) {
                const upcoming = await getTournaments({ status: "OPEN", per_page: 3 }).catch(() => null);
                t = upcoming?.tournaments;
            }
            if (Array.isArray(t)) setTournaments(t);

            // Games
            const rawG = gamesRes as any;
            const g = rawG?.data?.games ?? rawG?.games ?? rawG?.data;
            if (Array.isArray(g)) setGames(g.slice(0, 4));

            // Tenants
            const tn = tenantsRes?.tenants ?? (tenantsRes as any)?.data?.tenants;
            if (Array.isArray(tn)) setTenants(tn.slice(0, 3));

            // Listings
            const ls = listingsRes?.listings ?? (listingsRes as any)?.data?.listings;
            if (Array.isArray(ls)) setListings(ls.slice(0, 4));

            // Top players
            const lb = leaderboardRes?.leaderboard ?? (leaderboardRes as any)?.data?.leaderboard ?? (leaderboardRes as any)?.data;
            if (Array.isArray(lb)) {
                setTopPlayers(lb.slice(0, 5).map((p: any, i: number) => ({
                    username: p.username ?? p.user?.username ?? "",
                    avatar_url: p.avatar_url ?? p.user?.avatar_url,
                    elo: p.elo ?? p.rating ?? 0,
                    rank: i + 1,
                })));
            }

            setLoading(false);
        });
    }, []);

    return (
        <aside
            className="hidden xl:flex flex-col w-[260px] h-full border-l overflow-y-auto p-4 gap-5 shrink-0"
            style={{ borderColor: "var(--border)", background: "var(--background)" }}
        >
            {/* Trending Games */}
            <SidebarSection
                title="Juegos"
                icon={<Flame className="size-3.5 text-orange-500" />}
                viewAllHref="/juegos"
            >
                <div className="space-y-1">
                    {games.map((game) => {
                        const brand = getGameBrand(game.slug);
                        return (
                            <Link
                                key={game.slug}
                                href={`/juegos/${game.slug}`}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-surface-solid transition-colors group"
                            >
                                <div
                                    className="w-8 h-8 rounded-lg overflow-hidden border shrink-0"
                                    style={{ borderColor: `${brand.color}25` }}
                                >
                                    {game.logo_url ? (
                                        <Image src={game.logo_url} alt={game.name} width={32} height={32} className="w-full h-full object-cover" />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center text-[9px] font-black"
                                            style={{ background: `${brand.bg}`, color: brand.color }}
                                        >
                                            {game.short_name || game.slug.slice(0, 3).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                                        {game.name}
                                    </p>
                                    {game.formats_count != null && (
                                        <p className="text-[10px] text-muted">{game.formats_count} formatos</p>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                    {!loading && games.length === 0 && (
                        <p className="text-[11px] text-muted italic px-2">Sin datos</p>
                    )}
                </div>
            </SidebarSection>

            {/* Tournaments */}
            <SidebarSection
                title="Torneos"
                icon={<Cup className="size-3.5 text-accent" />}
                viewAllHref="/torneos"
            >
                <div className="space-y-1.5">
                    {tournaments.map((t) => {
                        const isLive = t.status === "ROUND_IN_PROGRESS" || t.status === "STARTED";
                        return (
                            <Link
                                key={t.id}
                                href={`/torneos/${t.id}`}
                                className="block p-2.5 rounded-xl border border-border hover:border-accent/30 bg-surface-solid hover:bg-surface-solid transition-colors"
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-foreground truncate flex-1 mr-2">{t.name}</span>
                                    <Chip size="sm" color={isLive ? "success" : "warning"} variant="soft" className="text-[9px] shrink-0">
                                        {isLive ? "En vivo" : "Abierto"}
                                    </Chip>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted">
                                    <span>{t.game}</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5">
                                        <Persons className="size-3" /> {t.registered_count || 0}
                                    </span>
                                    {t.current_round && (
                                        <>
                                            <span>·</span>
                                            <span className="text-success font-semibold">R{t.current_round}</span>
                                        </>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                    {!loading && tournaments.length === 0 && (
                        <div className="text-center py-4 px-2 rounded-xl border border-dashed border-border">
                            <p className="text-[11px] text-muted">Sin torneos activos</p>
                        </div>
                    )}
                </div>
            </SidebarSection>

            {/* Communities */}
            <SidebarSection
                title="Comunidades"
                icon={<Persons className="size-3.5 text-emerald-500" />}
                viewAllHref="/comunidades"
            >
                <div className="space-y-1">
                    {tenants.map((tenant) => (
                        <Link
                            key={tenant.id}
                            href={`/comunidades/${tenant.slug || tenant.id}`}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-surface-solid transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-surface-solid border border-border flex items-center justify-center text-[11px] shrink-0 overflow-hidden">
                                {tenant.logo_url ? (
                                    <Image src={tenant.logo_url} alt={tenant.name} width={32} height={32} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-accent">{tenant.name?.charAt(0)?.toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                                    {tenant.name}
                                </p>
                                <p className="text-[10px] text-muted truncate">
                                    {tenant.city || "Comunidad"}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </SidebarSection>

            {/* Top Players */}
            {topPlayers.length > 0 && (
                <SidebarSection
                    title="Top Jugadores"
                    icon={<ChartColumn className="size-3.5 text-warning" />}
                    viewAllHref="/ranking"
                >
                    <div className="space-y-0.5">
                        {topPlayers.map((player) => (
                            <Link
                                key={player.username}
                                href={`/perfil/${player.username}`}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-surface-solid transition-colors group"
                            >
                                <span className="text-[10px] font-bold text-muted w-4 text-right shrink-0">
                                    #{player.rank}
                                </span>
                                {player.avatar_url ? (
                                    <Image src={player.avatar_url} alt={player.username} width={28} height={28} className="rounded-full object-cover shrink-0" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-surface-solid flex items-center justify-center text-[10px] font-bold text-muted shrink-0">
                                        {player.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                                        {player.username}
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-warning shrink-0">
                                    {player.elo}
                                </span>
                            </Link>
                        ))}
                    </div>
                </SidebarSection>
            )}

            {/* Recent Listings */}
            {listings.length > 0 && (
                <SidebarSection
                    title="Publicaciones"
                    icon={<ShoppingCart className="size-3.5 text-success" />}
                    viewAllHref="/marketplace"
                >
                    <div className="space-y-1.5">
                        {listings.map((listing) => {
                            const imageUrl = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url || listing.card_image_url;
                            const price = listing.price != null ? `$${Number(listing.price).toLocaleString("es-CL")}` : "";
                            return (
                                <Link
                                    key={listing.id}
                                    href={`/marketplace/${listing.id}`}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-surface-solid transition-colors group"
                                >
                                    <div className="w-9 h-12 rounded-lg bg-surface-solid border border-border overflow-hidden shrink-0">
                                        {imageUrl ? (
                                            <Image src={imageUrl} alt={listing.card_name || ""} width={36} height={48} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[8px] text-muted">TCG</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                                            {listing.card_name || listing.title || "Carta"}
                                        </p>
                                        {price && (
                                            <p className="text-[11px] font-bold text-success">{price}</p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </SidebarSection>
            )}

            {/* Footer */}
            <div className="mt-auto pt-3 border-t border-border px-1">
                <p className="text-[10px] text-muted leading-relaxed">
                    <Link href="/terminos" className="hover:underline">Términos</Link>
                    {" · "}
                    <Link href="/privacidad" className="hover:underline">Privacidad</Link>
                    {" · "}
                    <span>Rankeao.cl © 2026</span>
                </p>
            </div>
        </aside>
    );
}
