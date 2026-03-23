"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getClans, getMyClan } from "@/lib/api/clans";
import { getGames } from "@/lib/api/catalog";
import type { Clan } from "@/lib/types/clan";
import type { CatalogGame } from "@/lib/types/catalog";
import ViewToggle, { GRID_ICON, LIST_ICON } from "@/components/ViewToggle";

import { MyClanBanner, ClanCard, ClanListRow } from "@/components/cards";

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
                const clan = (res as any)?.data?.clan ?? (res as any)?.data ?? (res as any)?.clan ?? res;
                if (clan?.id) setMyClan(clan);
            })
            .catch(() => {});
    }, [isAuth, session]);

    useEffect(() => {
        getGames().then((res) => {
            const list = res?.data ?? [];
            if (Array.isArray(list)) setGames(list);
        }).catch(() => {});
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
                const params: Record<string, any> = { per_page: 30 };
                if (search.trim()) params.search = search.trim();
                if (filterGame) params.game_id = filterGame;
                if (filterRecruiting) params.is_recruiting = true;

                const data = await getClans(params);
                const raw = (data as any)?.data?.clans ?? (data as any)?.clans ?? (data as any)?.data;
                let result = Array.isArray(raw) ? raw : [];

                // Client-side fallback filters (in case API doesn't support them)
                if (filterRecruiting) result = result.filter((c: Clan) => c.is_recruiting);
                if (filterGame) result = result.filter((c: Clan) => c.game_id === filterGame || c.game_name?.toLowerCase().includes(filterGame.toLowerCase()));

                setClans(result);
            } catch {
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
                <div style={{ flex: 1, display: "flex", alignItems: "center", backgroundColor: "var(--surface-solid)", borderRadius: 999, padding: "10px 14px", border: "1px solid var(--border)", gap: 8 }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar clanes..."
                        style={{ flex: 1, backgroundColor: "transparent", border: "none", outline: "none", fontSize: 14, color: "var(--foreground)", padding: 0 }} />
                    {search && (
                        <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
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
                    style={{ padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer",
                        backgroundColor: !hasFilters ? "var(--foreground)" : "var(--surface-solid)", color: !hasFilters ? "var(--background)" : "var(--muted)",
                        border: !hasFilters ? "1px solid transparent" : "1px solid var(--border)", flexShrink: 0 }}>
                    Todos
                </button>
                <button onClick={() => setFilterRecruiting(!filterRecruiting)}
                    style={{ padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer",
                        backgroundColor: filterRecruiting ? "var(--foreground)" : "var(--surface-solid)", color: filterRecruiting ? "var(--background)" : "var(--muted)",
                        border: filterRecruiting ? "1px solid transparent" : "1px solid var(--border)", flexShrink: 0 }}>
                    Reclutando
                </button>
                {games.map((g) => (
                    <button key={g.slug} onClick={() => setFilterGame(filterGame === g.slug ? "" : g.slug)}
                        style={{ padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer",
                            backgroundColor: filterGame === g.slug ? "var(--foreground)" : "var(--surface-solid)", color: filterGame === g.slug ? "var(--background)" : "var(--muted)",
                            border: filterGame === g.slug ? "1px solid transparent" : "1px solid var(--border)", flexShrink: 0 }}>
                        {g.name}
                    </button>
                ))}
            </div>

            {/* My Clan Banner */}
            {myClan && <MyClanBanner clan={myClan} />}

            {/* Content */}
            <div className="mx-4 lg:mx-6 mb-12">
                {searching && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                        <div style={{ width: 24, height: 24, border: "3px solid var(--border)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {!searching && clans.length > 0 && (
                    viewMode === "grid" ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                            {clans.map((clan) => <ClanCard key={clan.id} clan={clan} />)}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {clans.map((clan) => <ClanListRow key={clan.id} clan={clan} />)}
                        </div>
                    )
                )}

                {!searching && clans.length === 0 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0" }}>
                        <div style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "var(--surface-solid)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                            <span style={{ fontSize: 32, opacity: 0.4 }}>🛡️</span>
                        </div>
                        <p style={{ color: "var(--foreground)", fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 4 }}>No se encontraron clanes</p>
                        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>{search ? "Intenta con otros terminos." : "Se el primero en crear un clan."}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
