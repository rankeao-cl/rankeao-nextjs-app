"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { getClans, getMyClan } from "@/lib/api/clans";
import { getGames } from "@/lib/api/catalog";
import type { Clan } from "@/lib/types/clan";
import type { CatalogGame } from "@/lib/types/catalog";
import ViewToggle, { GRID_ICON, LIST_ICON } from "@/components/ui/ViewToggle";

import MyClanBanner from "@/features/clan/MyClanBanner";
import ClanCard from "@/features/clan/ClanCard";
import ClanListRow from "@/features/clan/ClanListRow";

export default function ClanesClient({ initialClans, initialQuery }: { initialClans: Clan[]; initialQuery?: string }) {
    const { session, status } = useAuth();
    const isAuth = status === "authenticated";

    const [clans, setClans] = useState(initialClans);
    const [search, setSearch] = useState(initialQuery || "");
    const [myClan, setMyClan] = useState<Clan | null>(null);
    const [searching, setSearching] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [games, setGames] = useState<CatalogGame[]>([]);
    const [filterGame, setFilterGame] = useState("");
    const [filterRecruiting, setFilterRecruiting] = useState(false);

    useEffect(() => {
        if (!isAuth || !session?.accessToken) return;
        getMyClan(session.accessToken)
            .then((res) => {
                const clan = res?.data?.clan ?? res?.clan;
                if (clan?.id) setMyClan(clan);
            })
            .catch((err) => console.error("[Clanes] Error fetching my clan:", err));
    }, [isAuth, session]);

    useEffect(() => {
        getGames().then((res) => {
            const list = res?.data ?? [];
            if (Array.isArray(list)) setGames(list);
        }).catch((err) => console.error("[Clanes] Error fetching games:", err));
    }, []);

    useEffect(() => {
        const noFilters = !search.trim() && !filterGame && !filterRecruiting;
        if (noFilters && initialClans.length > 0) {
            setClans(initialClans);
            return;
        }

        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                const params: Record<string, string | number | boolean | undefined> = { per_page: 30 };
                if (search.trim()) params.search = search.trim();
                if (filterGame) params.game_id = filterGame;
                if (filterRecruiting) params.is_recruiting = true;

                const data = await getClans(params);
                const raw = data?.data?.clans ?? data?.clans;
                let result = Array.isArray(raw) ? raw : [];

                // Client-side fallback filters (in case API doesn't support them)
                if (filterRecruiting) result = result.filter((c: Clan) => c.is_recruiting);
                if (filterGame) result = result.filter((c: Clan) => c.game_slug === filterGame || c.game_id === filterGame || c.game_name?.toLowerCase().includes(filterGame.toLowerCase()));

                setClans(result);
            } catch (err) { console.error("[Clanes] Error searching clans:", err);
                setClans([]);
            }
            setSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filterGame, filterRecruiting]);

    const hasFilters = !!filterGame || filterRecruiting;

    return (
        <div>
            {/* Search + view toggle */}
            <div className="mx-4 lg:mx-6 mb-3 flex items-center gap-2">
                <div className="flex-1 flex items-center bg-surface-solid rounded-full px-3.5 py-2.5 border border-border gap-2">
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar clanes..."
                        className="flex-1 bg-transparent border-none outline-none text-[14px] text-foreground p-0" />
                    {search && (
                        <button onClick={() => setSearch("")} className="bg-transparent border-none cursor-pointer p-0">
                            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </button>
                    )}
                </div>
                {/* View toggle */}
                <ViewToggle
                    currentView={viewMode}
                    options={[
                        { key: "grid", icon: GRID_ICON, ariaLabel: "Vista cuadricula" },
                        { key: "list", icon: LIST_ICON, ariaLabel: "Vista lista" },
                    ]}
                    onChange={(v) => setViewMode(v as "grid" | "list")}
                />
            </div>

            {/* Filter pills */}
            <div className="mx-4 lg:mx-6 mb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button onClick={() => { setFilterGame(""); setFilterRecruiting(false); }}
                    className={`py-2 px-4 rounded-full text-[13px] font-semibold whitespace-nowrap cursor-pointer shrink-0 ${!hasFilters ? "bg-foreground text-background border border-transparent" : "bg-surface-solid text-muted border border-border"}`}>
                    Todos
                </button>
                <button onClick={() => setFilterRecruiting(!filterRecruiting)}
                    className={`py-2 px-4 rounded-full text-[13px] font-semibold whitespace-nowrap cursor-pointer shrink-0 ${filterRecruiting ? "bg-foreground text-background border border-transparent" : "bg-surface-solid text-muted border border-border"}`}>
                    Reclutando
                </button>
                {games.map((g) => (
                    <button key={g.slug} onClick={() => setFilterGame(filterGame === g.slug ? "" : g.slug)}
                        className={`py-2 px-4 rounded-full text-[13px] font-semibold whitespace-nowrap cursor-pointer shrink-0 ${filterGame === g.slug ? "bg-foreground text-background border border-transparent" : "bg-surface-solid text-muted border border-border"}`}>
                        {g.name}
                    </button>
                ))}
            </div>

            {/* My Clan Banner */}
            {myClan && <MyClanBanner clan={myClan} />}

            {/* Content */}
            <div className="mx-4 lg:mx-6 mb-12">
                {searching && (
                    <div className="flex justify-center py-6">
                        <div className="w-6 h-6 border-[3px] border-border border-t-accent rounded-full animate-spin" />
                    </div>
                )}

                {!searching && clans.length > 0 && (
                    viewMode === "grid" ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
                            {clans.map((clan) => <ClanCard key={clan.id} clan={clan} />)}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {clans.map((clan) => <ClanListRow key={clan.id} clan={clan} />)}
                        </div>
                    )
                )}

                {!searching && clans.length === 0 && (
                    <div className="flex flex-col items-center py-12">
                        <div className="w-[72px] h-[72px] rounded-full bg-surface-solid flex items-center justify-center mb-4">
                            <span className="text-[32px] opacity-40">&#128737;&#65039;</span>
                        </div>
                        <p className="text-foreground text-[15px] font-semibold m-0 mb-1">No se encontraron clanes</p>
                        <p className="text-muted text-[13px] m-0">{search ? "Intenta con otros terminos." : "Se el primero en crear un clan."}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
