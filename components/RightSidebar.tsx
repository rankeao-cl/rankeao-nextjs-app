"use client";

import { useState, useEffect } from "react";
import { Chip } from "@heroui/react";
import { Flame, Cup, Persons, ArrowRight } from "@gravity-ui/icons";
import Link from "next/link";
import Image from "next/image";
import { getTournaments } from "@/lib/api/tournaments";
import { getGames } from "@/lib/api/catalog";
import { getTenants } from "@/lib/api/tenants";
import type { Tournament } from "@/lib/types/tournament";
import type { CatalogGame } from "@/lib/types/catalog";
import type { Tenant } from "@/lib/types/tenant";
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
                    <h3 className="text-xs font-bold text-[#F2F2F2] uppercase tracking-wider">{title}</h3>
                </div>
                {viewAllHref && (
                    <Link href={viewAllHref} className="text-[10px] font-semibold text-[#3B82F6] hover:underline flex items-center gap-0.5">
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getTournaments({ status: "ROUND_IN_PROGRESS", per_page: 3 }).catch(() => null),
            getGames().catch(() => null),
            getTenants({ per_page: 3 }).catch(() => null),
        ]).then(async ([tournamentsRes, gamesRes, tenantsRes]) => {
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

            setLoading(false);
        });
    }, []);

    return (
        <aside
            className="hidden xl:flex flex-col w-[260px] h-full border-l overflow-y-auto p-4 gap-5 shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "#000000" }}
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
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[#222226] transition-colors group"
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
                                    <p className="text-xs font-semibold text-[#F2F2F2] truncate group-hover:text-[#3B82F6] transition-colors">
                                        {game.name}
                                    </p>
                                    {game.formats_count != null && (
                                        <p className="text-[10px] text-[#888891]">{game.formats_count} formatos</p>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                    {!loading && games.length === 0 && (
                        <p className="text-[11px] text-[#888891] italic px-2">Sin datos</p>
                    )}
                </div>
            </SidebarSection>

            {/* Tournaments */}
            <SidebarSection
                title="Torneos"
                icon={<Cup className="size-3.5 text-[#3B82F6]" />}
                viewAllHref="/torneos"
            >
                <div className="space-y-1.5">
                    {tournaments.map((t) => {
                        const isLive = t.status === "ROUND_IN_PROGRESS" || t.status === "STARTED";
                        return (
                            <Link
                                key={t.id}
                                href={`/torneos/${t.id}`}
                                className="block p-2.5 rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-[#3B82F6]/30 bg-[#222226] hover:bg-[#222226] transition-colors"
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-[#F2F2F2] truncate flex-1 mr-2">{t.name}</span>
                                    <Chip size="sm" color={isLive ? "success" : "warning"} variant="soft" className="text-[9px] shrink-0">
                                        {isLive ? "En vivo" : "Abierto"}
                                    </Chip>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-[#888891]">
                                    <span>{t.game}</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5">
                                        <Persons className="size-3" /> {t.registered_count || 0}
                                    </span>
                                    {t.current_round && (
                                        <>
                                            <span>·</span>
                                            <span className="text-[#22C55E] font-semibold">R{t.current_round}</span>
                                        </>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                    {!loading && tournaments.length === 0 && (
                        <div className="text-center py-4 px-2 rounded-xl border border-dashed border-[rgba(255,255,255,0.06)]">
                            <p className="text-[11px] text-[#888891]">Sin torneos activos</p>
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
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[#222226] transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-[#222226] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[11px] shrink-0 overflow-hidden">
                                {tenant.logo_url ? (
                                    <Image src={tenant.logo_url} alt={tenant.name} width={32} height={32} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-[#3B82F6]">{tenant.name?.charAt(0)?.toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[#F2F2F2] truncate group-hover:text-[#3B82F6] transition-colors">
                                    {tenant.name}
                                </p>
                                <p className="text-[10px] text-[#888891] truncate">
                                    {tenant.city || "Comunidad"}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </SidebarSection>

            {/* Footer */}
            <div className="mt-auto pt-3 border-t border-[rgba(255,255,255,0.06)] px-1">
                <p className="text-[10px] text-[#888891] leading-relaxed">
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
