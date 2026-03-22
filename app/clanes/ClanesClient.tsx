"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getClans, getClan, getMyClan } from "@/lib/api/clans";
import { getGames } from "@/lib/api/catalog";
import type { Clan } from "@/lib/types/clan";
import type { CatalogGame } from "@/lib/types/catalog";
import { Persons } from "@gravity-ui/icons";
import ViewToggle, { GRID_ICON, LIST_ICON } from "@/components/ViewToggle";

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
                <div style={{ flex: 1, display: "flex", alignItems: "center", backgroundColor: "#1A1A1E", borderRadius: 999, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.06)", gap: 8 }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar clanes..."
                        style={{ flex: 1, backgroundColor: "transparent", border: "none", outline: "none", fontSize: 14, color: "#F2F2F2", padding: 0 }} />
                    {search && (
                        <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
                        backgroundColor: !hasFilters ? "#F2F2F2" : "#1A1A1E", color: !hasFilters ? "#000000" : "#888891",
                        border: !hasFilters ? "1px solid transparent" : "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                    Todos
                </button>
                <button onClick={() => setFilterRecruiting(!filterRecruiting)}
                    style={{ padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer",
                        backgroundColor: filterRecruiting ? "#F2F2F2" : "#1A1A1E", color: filterRecruiting ? "#000000" : "#888891",
                        border: filterRecruiting ? "1px solid transparent" : "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                    Reclutando
                </button>
                {games.map((g) => (
                    <button key={g.slug} onClick={() => setFilterGame(filterGame === g.slug ? "" : g.slug)}
                        style={{ padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer",
                            backgroundColor: filterGame === g.slug ? "#F2F2F2" : "#1A1A1E", color: filterGame === g.slug ? "#000000" : "#888891",
                            border: filterGame === g.slug ? "1px solid transparent" : "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
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
                        <div style={{ width: 24, height: 24, border: "3px solid rgba(255,255,255,0.06)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
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
                        <div style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#1A1A1E", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                            <span style={{ fontSize: 32, opacity: 0.4 }}>🛡️</span>
                        </div>
                        <p style={{ color: "#F2F2F2", fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 4 }}>No se encontraron clanes</p>
                        <p style={{ color: "#888891", fontSize: 13, margin: 0 }}>{search ? "Intenta con otros terminos." : "Se el primero en crear un clan."}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── My Clan Banner (with banner + logo fetched) ── */
function MyClanBanner({ clan }: { clan: Clan }) {
    const [bannerUrl, setBannerUrl] = useState(clan.banner_url || "");
    const [logoUrl, setLogoUrl] = useState(clan.logo_url || "");

    useEffect(() => {
        if (bannerUrl && logoUrl) return;
        getClan(clan.id)
            .then((res: any) => {
                const detail = res?.data?.clan ?? res?.data ?? res?.clan ?? res;
                if (detail?.banner_url && !bannerUrl) setBannerUrl(detail.banner_url);
                if (detail?.logo_url && !logoUrl) setLogoUrl(detail.logo_url);
            })
            .catch(() => {});
    }, [clan.id]);

    return (
        <div className="mx-4 lg:mx-6 mb-3">
            <Link href={`/clanes/${clan.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                    borderRadius: 16, overflow: "hidden",
                    border: "1px solid rgba(59,130,246,0.25)",
                    position: "relative",
                }}>
                    {/* Banner background */}
                    <div style={{ height: 80, position: "relative", overflow: "hidden" }}>
                        {bannerUrl ? (
                            <img src={bannerUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : logoUrl ? (
                            <img src={logoUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scale(3)", filter: "blur(24px)", opacity: 0.3 }} />
                        ) : (
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(59,130,246,0.15), #1A1A1E)" }} />
                        )}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3))" }} />

                        {/* Content over banner */}
                        <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", alignItems: "center", padding: "0 16px", gap: 14 }}>
                            {/* Logo */}
                            <div style={{
                                width: 52, height: 52, borderRadius: 14,
                                border: "2px solid rgba(255,255,255,0.15)",
                                backgroundColor: "#222226", overflow: "hidden",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                            }}>
                                {logoUrl ? (
                                    <img src={logoUrl} alt={clan.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <span style={{ fontSize: 22, fontWeight: 900, color: "#3B82F6" }}>
                                        {clan.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Text */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>Mi Clan</p>
                                <p style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", margin: 0, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clan.name}</p>
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: 0, marginTop: 1 }}>
                                    [{clan.tag}] · {clan.member_count ?? 0} miembros
                                </p>
                            </div>

                            {/* Chevron */}
                            <svg width={18} height={18} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                                <path d="M6 3l5 5-5 5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}

/* ── Clan Card ── */
function ClanCard({ clan }: { clan: Clan }) {
    const [bannerUrl, setBannerUrl] = useState(clan.banner_url || "");
    const [logoUrl, setLogoUrl] = useState(clan.logo_url || "");

    useEffect(() => {
        if (bannerUrl && logoUrl) return;
        getClan(clan.id)
            .then((res: any) => {
                const detail = res?.data?.clan ?? res?.data ?? res?.clan ?? res;
                if (detail?.banner_url && !bannerUrl) setBannerUrl(detail.banner_url);
                if (detail?.logo_url && !logoUrl) setLogoUrl(detail.logo_url);
            })
            .catch(() => {});
    }, [clan.id]);

    const memberCount = clan.member_count ?? 0;
    const hasRating = clan.rating != null && clan.rating > 0;

    return (
        <Link href={`/clanes/${clan.id}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
            <div style={{
                backgroundColor: "#1A1A1E",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}>
                {/* Banner — large, immersive */}
                <div style={{ height: 110, position: "relative", overflow: "hidden" }}>
                    {bannerUrl ? (
                        <img src={bannerUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : logoUrl ? (
                        <img src={logoUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scale(3)", filter: "blur(24px)", opacity: 0.25 }} />
                    ) : (
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1e293b, #0f172a)" }} />
                    )}
                    {/* Dark overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #1A1A1E 0%, rgba(26,26,30,0.6) 50%, rgba(0,0,0,0.2) 100%)" }} />

                    {/* Badges floating on banner */}
                    <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        {/* Left: location */}
                        <div>
                            {clan.city && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.85)", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", padding: "3px 8px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {clan.city}
                                </span>
                            )}
                        </div>
                        {/* Right: tags */}
                        <div style={{ display: "flex", gap: 4 }}>
                            {clan.is_recruiting && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "3px 10px", borderRadius: 999 }}>
                                    Reclutando
                                </span>
                            )}
                            {clan.game_name && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: "#F2F2F2", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "3px 10px", borderRadius: 999 }}>
                                    {clan.game_name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Logo + Name overlaid on banner bottom */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 14px 12px", display: "flex", alignItems: "flex-end", gap: 12 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            border: "3px solid #1A1A1E",
                            backgroundColor: "#222226", overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                        }}>
                            {logoUrl ? (
                                <img src={logoUrl} alt={clan.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <span style={{ fontSize: 20, fontWeight: 900, color: "#3B82F6" }}>
                                    {clan.name?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, marginBottom: 2 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                                    {clan.name}
                                </h3>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", backgroundColor: "rgba(59,130,246,0.2)", padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>
                                    {clan.tag}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: "10px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Description */}
                    {clan.description ? (
                        <p className="line-clamp-2" style={{ fontSize: 12, color: "#888891", margin: 0, marginBottom: 10, lineHeight: "17px" }}>
                            {clan.description}
                        </p>
                    ) : (
                        <div style={{ flex: 1 }} />
                    )}

                    {/* Stats row — gaming style */}
                    <div style={{
                        display: "flex", alignItems: "center",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        borderRadius: 10, padding: "8px 10px",
                        gap: 4,
                    }}>
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "#F2F2F2", margin: 0 }}>{memberCount}</p>
                            <p style={{ fontSize: 9, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Miembros</p>
                        </div>
                        <div style={{ width: 0.5, height: 24, backgroundColor: "rgba(255,255,255,0.08)" }} />
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: hasRating ? "#F59E0B" : "#F2F2F2", margin: 0 }}>
                                {hasRating ? clan.rating!.toFixed(1) : "—"}
                            </p>
                            <p style={{ fontSize: 9, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Rating</p>
                        </div>
                        <div style={{ width: 0.5, height: 24, backgroundColor: "rgba(255,255,255,0.08)" }} />
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "#F2F2F2", margin: 0 }}>
                                {clan.recruit_min_elo ?? "—"}
                            </p>
                            <p style={{ fontSize: 9, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>ELO Min</p>
                        </div>
                    </div>

                </div>
            </div>
        </Link>
    );
}

/* ── Clan List Row (epic version) ── */
function ClanListRow({ clan }: { clan: Clan }) {
    const [bannerUrl, setBannerUrl] = useState(clan.banner_url || "");
    const [logoUrl, setLogoUrl] = useState(clan.logo_url || "");

    useEffect(() => {
        if (bannerUrl && logoUrl) return;
        getClan(clan.id)
            .then((res: any) => {
                const detail = res?.data?.clan ?? res?.data ?? res?.clan ?? res;
                if (detail?.banner_url && !bannerUrl) setBannerUrl(detail.banner_url);
                if (detail?.logo_url && !logoUrl) setLogoUrl(detail.logo_url);
            })
            .catch(() => {});
    }, [clan.id]);

    const hasRating = clan.rating != null && clan.rating > 0;
    const memberCount = clan.member_count ?? 0;

    return (
        <Link href={`/clanes/${clan.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{
                backgroundColor: "#1A1A1E", borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden", display: "flex", position: "relative",
            }}>
                {/* Banner background — stretches full width behind content */}
                {(bannerUrl || logoUrl) && (
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                        <img
                            src={bannerUrl || logoUrl}
                            alt=""
                            style={{
                                width: "100%", height: "100%", objectFit: "cover",
                                ...(bannerUrl ? {} : { transform: "scale(3)", filter: "blur(24px)", opacity: 0.15 }),
                            }}
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(26,26,30,0.92), rgba(26,26,30,0.75))" }} />
                    </div>
                )}

                {/* Content */}
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", width: "100%" }}>
                    {/* Logo */}
                    <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        backgroundColor: "#222226", overflow: "hidden",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, border: "2px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    }}>
                        {logoUrl ? (
                            <img src={logoUrl} alt={clan.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#3B82F6" }}>{clan.name?.charAt(0)?.toUpperCase()}</span>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>{clan.name}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", backgroundColor: "rgba(59,130,246,0.2)", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{clan.tag}</span>
                            {clan.is_recruiting && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: "#22C55E", backgroundColor: "rgba(34,197,94,0.15)", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>
                                    Reclutando
                                </span>
                            )}
                        </div>
                        {clan.description && (
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {clan.description}
                            </p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "#888891" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <Persons style={{ width: 12, height: 12 }} /> {memberCount}
                            </span>
                            {clan.game_name && (
                                <span style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 4, fontSize: 10 }}>{clan.game_name}</span>
                            )}
                            {hasRating && (
                                <span><span style={{ color: "#F59E0B" }}>★</span> {clan.rating!.toFixed(1)}</span>
                            )}
                            {clan.city && (
                                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {clan.city}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats mini */}
                    <div className="hidden sm:flex" style={{ gap: 2, flexShrink: 0 }}>
                        <div style={{ textAlign: "center", padding: "4px 10px" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "#F2F2F2", margin: 0 }}>{memberCount}</p>
                            <p style={{ fontSize: 8, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Miembros</p>
                        </div>
                        <div style={{ width: 0.5, height: 28, backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
                        <div style={{ textAlign: "center", padding: "4px 10px" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: hasRating ? "#F59E0B" : "#888891", margin: 0 }}>{hasRating ? clan.rating!.toFixed(1) : "—"}</p>
                            <p style={{ fontSize: 8, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Rating</p>
                        </div>
                        <div style={{ width: 0.5, height: 28, backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
                        <div style={{ textAlign: "center", padding: "4px 10px" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "#F2F2F2", margin: 0 }}>{clan.recruit_min_elo ?? "—"}</p>
                            <p style={{ fontSize: 8, fontWeight: 600, color: "#888891", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>ELO Min</p>
                        </div>
                    </div>

                    {/* Chevron */}
                    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M6 3l5 5-5 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
