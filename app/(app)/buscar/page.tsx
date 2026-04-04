"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";
import { Magnifier, Person, Cup, Persons, ShoppingCart, Shield, SquareDashed } from "@gravity-ui/icons";
import Link from "next/link";
import Image from "next/image";

import { autocompleteUsers } from "@/lib/api/social";
import { getTournaments } from "@/lib/api/tournaments";
import { getTenants } from "@/lib/api/tenants";
import { getListings } from "@/lib/api/marketplace";
import { getClans } from "@/lib/api/clans";
import { scryfallSearch } from "@/lib/api/catalog";

// ── Types ──

type ResultType = "user" | "tournament" | "community" | "listing" | "clan" | "card";

interface SearchResult {
    id: string;
    type: ResultType;
    title: string;
    subtitle?: string;
    image?: string;
    href: string;
    meta?: Record<string, unknown>;
}

const TAB_CONFIG: Record<ResultType | "all", { icon: typeof Person; label: string; color: string; bg: string }> = {
    all:        { icon: Magnifier,    label: "Todo",         color: "var(--foreground)",  bg: "var(--surface)" },
    user:       { icon: Person,       label: "Jugadores",    color: "var(--accent)",  bg: "color-mix(in srgb, var(--accent) 12%, transparent)" },
    tournament: { icon: Cup,          label: "Torneos",      color: "var(--purple)",  bg: "color-mix(in srgb, var(--purple) 12%, transparent)" },
    clan:       { icon: Shield,       label: "Clanes",       color: "var(--accent)",  bg: "color-mix(in srgb, var(--accent) 12%, transparent)" },
    card:       { icon: SquareDashed, label: "Cartas",       color: "var(--warning)",  bg: "color-mix(in srgb, var(--warning) 12%, transparent)" },
    community:  { icon: Persons,      label: "Comunidades",  color: "var(--success)",  bg: "color-mix(in srgb, var(--success) 12%, transparent)" },
    listing:    { icon: ShoppingCart,  label: "Marketplace",  color: "var(--orange)",  bg: "color-mix(in srgb, var(--orange) 12%, transparent)" },
};

const TAB_ORDER: (ResultType | "all")[] = ["all", "user", "tournament", "clan", "card", "community", "listing"];

// ── Search Content ──

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<ResultType | "all">("all");

    useEffect(() => {
        if (!query || query.length < 2) { setResults([]); return; }

        const controller = new AbortController();
        setIsLoading(true);
        setActiveTab("all");

        Promise.allSettled([
            autocompleteUsers(query),
            getTournaments({ q: query, per_page: 20 }),
            getTenants({ q: query, per_page: 20 }),
            getListings({ q: query, per_page: 20 }),
            getClans({ q: query, per_page: 20 }),
            scryfallSearch(query, 1, 20),
        ]).then(([usersRes, tournamentsRes, tenantsRes, listingsRes, clansRes, cardsRes]) => {
            if (controller.signal.aborted) return;
            const items: SearchResult[] = [];

            // Users
            if (usersRes.status === "fulfilled") {
                const val = usersRes.value as any;
                const users = val?.data?.users || val?.users || (Array.isArray(val) ? val : []);
                for (const u of users) {
                    items.push({
                        id: u.id || u.username, type: "user",
                        title: u.username || "Usuario",
                        subtitle: u.display_name && u.display_name !== u.username ? u.display_name : u.city || undefined,
                        image: u.avatar_url,
                        href: `/perfil/${encodeURIComponent(u.username)}`,
                        meta: { elo: u.elo, rating: u.rating, rank_badge: u.rank_badge },
                    });
                }
            }

            // Tournaments
            if (tournamentsRes.status === "fulfilled") {
                const val = tournamentsRes.value as any;
                const tournaments = val?.data?.tournaments || val?.tournaments || [];
                for (const t of tournaments) {
                    items.push({
                        id: t.id, type: "tournament",
                        title: t.name,
                        subtitle: [t.game, t.format_type, t.status].filter(Boolean).join(" · "),
                        href: `/torneos/${t.slug ?? t.id}`,
                        meta: { status: t.status, game: t.game, registered_count: t.registered_count },
                    });
                }
            }

            // Clans
            if (clansRes.status === "fulfilled") {
                const val = clansRes.value as any;
                const clans = val?.data?.clans || val?.clans || (Array.isArray(val?.data) ? val.data : []);
                for (const c of clans) {
                    items.push({
                        id: c.id || c.public_id, type: "clan",
                        title: c.name,
                        subtitle: [c.tag ? `[${c.tag}]` : null, c.game_name, c.city].filter(Boolean).join(" · "),
                        image: c.logo_url,
                        href: `/clanes/${c.id || c.public_id}`,
                        meta: { member_count: c.member_count, is_recruiting: c.is_recruiting },
                    });
                }
            }

            // Cards (Scryfall)
            if (cardsRes.status === "fulfilled") {
                const val = cardsRes.value as any;
                const cards = val?.data?.cards || [];
                const seen = new Set<string>();
                if (Array.isArray(cards)) {
                    for (const card of cards) {
                        const key = (card.name || "").toLowerCase();
                        if (seen.has(key)) continue;
                        seen.add(key);
                        items.push({
                            id: card.name, type: "card",
                            title: card.name,
                            subtitle: [card.game_name || "Magic: The Gathering", card.set_name].filter(Boolean).join(" · "),
                            image: card.image_url_small || card.image_url,
                            href: `/cartas/${card.slug || card.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
                            meta: { rarity: card.rarity, price_usd: card.price_usd },
                        });
                    }
                }
            }

            // Communities
            if (tenantsRes.status === "fulfilled") {
                const val = tenantsRes.value as any;
                const tenants = val?.data?.tenants || val?.tenants || [];
                for (const t of tenants) {
                    items.push({
                        id: t.id || t.slug, type: "community",
                        title: t.name,
                        subtitle: t.city ? `${t.city}${t.region ? `, ${t.region}` : ""}` : undefined,
                        image: t.logo_url,
                        href: `/comunidades/${t.slug}`,
                        meta: { rating: t.average_rating },
                    });
                }
            }

            // Listings
            if (listingsRes.status === "fulfilled") {
                const val = listingsRes.value as any;
                const listings = val?.data?.listings || val?.listings || [];
                for (const l of listings) {
                    items.push({
                        id: l.id, type: "listing",
                        title: l.title || l.card_name || "Producto",
                        subtitle: l.price ? `$${Number(l.price).toLocaleString("es-CL")}` : undefined,
                        image: l.images?.[0]?.thumbnail_url || l.images?.[0]?.url || l.card_image_url,
                        href: `/marketplace/${l.id}`,
                        meta: { condition: l.card_condition, seller: l.seller_username },
                    });
                }
            }

            setResults(items);
            setIsLoading(false);
        });

        return () => controller.abort();
    }, [query]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: results.length };
        for (const r of results) c[r.type] = (c[r.type] || 0) + 1;
        return c;
    }, [results]);

    const filtered = activeTab === "all" ? results : results.filter(r => r.type === activeTab);

    // ── Empty state ──
    if (!query) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                    <Magnifier style={{ width: 32, height: 32, color: "var(--muted)" }} />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", margin: "0 0 8px" }}>Buscar en Rankeao</h1>
                <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 320 }}>Jugadores, torneos, clanes, cartas, comunidades y publicaciones.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--foreground)", margin: "0 0 4px" }}>
                    Resultados para <span style={{ color: "var(--accent)" }}>&quot;{query}&quot;</span>
                </h1>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                    {results.length} resultado{results.length !== 1 ? "s" : ""} en toda la plataforma
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }} className="no-scrollbar">
                {TAB_ORDER.map((tab) => {
                    const count = counts[tab] || 0;
                    if (tab !== "all" && count === 0) return null;
                    const config = TAB_CONFIG[tab];
                    const isActive2 = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "8px 14px", borderRadius: 10,
                                backgroundColor: isActive2 ? config.bg : "transparent",
                                border: isActive2 ? `1px solid color-mix(in srgb, ${config.color} 19%, transparent)` : "1px solid var(--border)",
                                color: isActive2 ? config.color : "var(--muted)",
                                fontSize: 13, fontWeight: 600, cursor: "pointer",
                                whiteSpace: "nowrap", flexShrink: 0,
                                transition: "all 0.15s",
                            }}
                        >
                            {config.label}
                            <span style={{
                                fontSize: 10, fontWeight: 700,
                                backgroundColor: isActive2 ? `color-mix(in srgb, ${config.color} 12%, transparent)` : "var(--surface)",
                                color: isActive2 ? config.color : "var(--muted)",
                                padding: "2px 6px", borderRadius: 999,
                            }}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Results */}
            {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                    <Spinner size="lg" />
                </div>
            ) : filtered.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                    {filtered.map((item) => (
                        <ResultCard key={`${item.type}-${item.id}`} item={item} />
                    ))}
                </div>
            ) : (
                <div style={{
                    padding: "80px 16px", textAlign: "center",
                    border: "2px dashed var(--surface)", borderRadius: 16,
                }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", margin: "0 0 8px" }}>Sin resultados</p>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Prueba con otras palabras o revisa la escritura.</p>
                </div>
            )}
        </div>
    );
}

// ── Result Card (enriched per type) ──

function ResultCard({ item }: { item: SearchResult }) {
    const config = TAB_CONFIG[item.type];
    const Icon = config.icon;
    const meta = (item.meta || {}) as Record<string, string | number | boolean | null | undefined>;

    return (
        <Link href={item.href} style={{ textDecoration: "none" }}>
            <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: 14, borderRadius: 14,
                backgroundColor: "var(--surface-solid)",
                border: "1px solid var(--border)",
                transition: "border-color 0.15s",
            }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `color-mix(in srgb, ${config.color} 25%, transparent)`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
                {/* Image / Icon */}
                {item.image ? (
                    <div style={{
                        width: item.type === "card" ? 42 : 44,
                        height: item.type === "card" ? 58 : 44,
                        borderRadius: item.type === "card" ? 6 : item.type === "user" ? 22 : 10,
                        overflow: "hidden", flexShrink: 0,
                        backgroundColor: "var(--surface-solid)",
                    }}>
                        <Image src={item.image} alt={item.title} width={44} height={item.type === "card" ? 58 : 44}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                ) : (
                    <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        backgroundColor: config.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, color: config.color,
                    }}>
                        <Icon style={{ width: 20, height: 20 }} />
                    </div>
                )}

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{
                            fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                            color: config.color, backgroundColor: config.bg,
                            padding: "2px 6px", borderRadius: 4, flexShrink: 0,
                        }}>
                            {config.label}
                        </span>
                        {/* Enriched badges */}
                        {item.type === "tournament" && meta.status && (
                            <span style={{
                                fontSize: 9, fontWeight: 700,
                                color: meta.status === "ROUND_IN_PROGRESS" ? "var(--success)" : "var(--warning)",
                                backgroundColor: meta.status === "ROUND_IN_PROGRESS" ? "color-mix(in srgb, var(--success) 12%, transparent)" : "color-mix(in srgb, var(--warning) 12%, transparent)",
                                padding: "2px 6px", borderRadius: 4,
                            }}>
                                {meta.status === "ROUND_IN_PROGRESS" ? "En vivo" : String(meta.status)}
                            </span>
                        )}
                        {item.type === "clan" && meta.is_recruiting && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--success)", backgroundColor: "color-mix(in srgb, var(--success) 12%, transparent)", padding: "2px 6px", borderRadius: 4 }}>
                                Reclutando
                            </span>
                        )}
                        {item.type === "listing" && meta.condition && (
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "2px 6px", borderRadius: 4 }}>
                                {String(meta.condition)}
                            </span>
                        )}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                    </p>
                    {item.subtitle && (
                        <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.subtitle}
                        </p>
                    )}
                    {/* Enriched meta line */}
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        {item.type === "user" && meta.rank_badge && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--warning)" }}>{String(meta.rank_badge)}</span>
                        )}
                        {item.type === "tournament" && meta.registered_count != null && (
                            <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 2 }}>
                                <Persons style={{ width: 10, height: 10 }} /> {String(meta.registered_count)}
                            </span>
                        )}
                        {item.type === "clan" && meta.member_count != null && (
                            <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 2 }}>
                                <Persons style={{ width: 10, height: 10 }} /> {String(meta.member_count)} miembros
                            </span>
                        )}
                        {item.type === "card" && meta.rarity && (
                            <span style={{ fontSize: 10, color: "var(--muted)" }}>{String(meta.rarity)}</span>
                        )}
                        {item.type === "listing" && meta.seller && (
                            <span style={{ fontSize: 10, color: "var(--muted)" }}>@{String(meta.seller)}</span>
                        )}
                        {item.type === "community" && meta.rating != null && Number(meta.rating) > 0 && (
                            <span style={{ fontSize: 10, color: "var(--warning)" }}>★ {Number(meta.rating).toFixed(1)}</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ── Page wrapper ──

export default function BuscarPage() {
    return (
        <Suspense fallback={
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                <Spinner size="lg" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
