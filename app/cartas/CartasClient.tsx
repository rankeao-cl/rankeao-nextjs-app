"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Magnifier } from "@gravity-ui/icons";
import { scryfallSearch, scryfallAutocomplete, type ScryfallSearchResult } from "@/lib/api/catalog";
import { toCardSlug } from "@/lib/utils/format";

export default function CartasClient() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ScryfallSearchResult[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [total, setTotal] = useState(0);
    const [source, setSource] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    const inputRef = useRef<HTMLInputElement>(null);

    // Autocomplete
    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.length < 2) { setSuggestions([]); return; }
        try {
            const res = await scryfallAutocomplete(q);
            const data = res?.data?.data ?? [];
            setSuggestions(data.slice(0, 8));
            setShowSuggestions(true);
        } catch { setSuggestions([]); }
    }, []);

    const handleInputChange = (val: string) => {
        setQuery(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
    };

    // Search
    const doSearch = useCallback(async (q: string, p: number = 1) => {
        if (!q.trim()) return;
        setLoading(true);
        setSearched(true);
        setShowSuggestions(false);
        try {
            const res = await scryfallSearch(q, p, 30);
            const data = res?.data;
            if (data) {
                if (p === 1) {
                    setResults(data.cards ?? []);
                } else {
                    setResults(prev => [...prev, ...(data.cards ?? [])]);
                }
                setTotal(data.total_cards ?? 0);
                setHasMore(data.has_more ?? false);
                setSource(data.source ?? "");
                setPage(p);
            }
        } catch {
            if (p === 1) setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        doSearch(query, 1);
    };

    const selectSuggestion = (name: string) => {
        setQuery(name);
        setShowSuggestions(false);
        doSearch(name, 1);
    };

    // Close suggestions on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
            {/* Header */}
            <h1 className="text-xl font-extrabold mb-1" style={{ color: "var(--foreground)" }}>Buscar Cartas</h1>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
                Busca cartas de Magic: The Gathering. Los resultados se guardan en el catálogo.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSubmit} className="relative mb-6">
                <div className="flex items-center gap-2 rounded-xl border px-4 py-3" style={{ backgroundColor: "var(--surface-solid)", borderColor: "var(--border)" }}>
                    <Magnifier style={{ width: 18, height: 18, color: "var(--muted)", flexShrink: 0 }} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Lightning Bolt, Black Lotus, Ragavan..."
                        value={query}
                        onChange={(e) => handleInputChange(e.target.value)}
                        className="flex-1 text-sm outline-none bg-transparent"
                        style={{ color: "var(--foreground)" }}
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="px-4 py-1.5 rounded-lg border-none text-xs font-bold text-white shrink-0"
                        style={{
                            backgroundColor: "var(--accent)",
                            cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                            opacity: loading || !query.trim() ? 0.5 : 1,
                        }}
                    >
                        {loading ? "..." : "Buscar"}
                    </button>
                </div>

                {/* Autocomplete dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div
                        className="absolute top-full left-0 right-0 mt-1 overflow-hidden rounded-xl z-20"
                        style={{
                            backgroundColor: "var(--surface-solid)",
                            border: "1px solid var(--border)",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                        }}
                    >
                        {suggestions.map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => selectSuggestion(name)}
                                className="w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-colors"
                                style={{ background: "none", border: "none", color: "var(--foreground)" }}
                                onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = "var(--surface)"; }}
                                onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = "transparent"; }}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                )}
            </form>

            {/* Results header */}
            {searched && !loading && (
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                        {total > 0 ? `${total.toLocaleString()} resultado${total !== 1 ? "s" : ""}` : "Sin resultados"}
                        {source && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>{source === "db" ? "catálogo" : "scryfall"}</span>}
                    </span>
                </div>
            )}

            {/* Card grid — deduplicated by name */}
            {results.length > 0 && (() => {
                const seen = new Set<string>();
                const unique = results.filter((c) => {
                    const key = c.name.toLowerCase();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                return (
                <>
                    <div
                        className="grid gap-3"
                        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}
                    >
                        {unique.map((card) => (
                            <CardResult key={card.name} card={card} />
                        ))}
                    </div>

                    {/* Load more */}
                    {hasMore && (
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => doSearch(query, page + 1)}
                                disabled={loading}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold"
                                style={{
                                    border: "1px solid var(--border)",
                                    backgroundColor: "var(--surface-solid)",
                                    color: "var(--foreground)",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                {loading ? "Cargando..." : "Cargar más"}
                            </button>
                        </div>
                    )}
                </>
                );
            })()}

            {/* Empty state */}
            {searched && !loading && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                    <span className="text-3xl opacity-30 mb-3">?</span>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>No se encontraron cartas</p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Intenta con otro nombre o término</p>
                </div>
            )}
        </div>
    );
}

// ── Card result component ──

function CardResult({ card }: { card: ScryfallSearchResult }) {
    const imgUrl = card.image_url || card.image_url_small;

    const rarityColor: Record<string, string> = {
        common: "var(--muted)",
        uncommon: "#C0C0C0",
        rare: "#FFD700",
        mythic: "#F06B2A",
        special: "#9B59B6",
        bonus: "#9B59B6",
    };

    return (
        <Link href={`/cartas/${card.slug || toCardSlug(card.name)}`} className="flex flex-col" style={{ textDecoration: "none" }}>
            {/* Card image */}
            <div
                className="relative w-full overflow-hidden group"
                style={{ aspectRatio: "63 / 88", borderRadius: 4, backgroundColor: "#0a0a0a" }}
            >
                {imgUrl ? (
                    <Image
                        src={imgUrl}
                        alt={card.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 18vw"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-xl opacity-20" style={{ color: "var(--muted)" }}>?</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1 pt-2">
                <p className="line-clamp-2 m-0 text-xs font-semibold leading-4" style={{ color: "var(--foreground)", minHeight: 32 }}>
                    {card.name}
                </p>
                <div className="flex flex-wrap gap-1">
                    {card.rarity && (
                        <span
                            className="text-[9px] font-semibold px-1.5 py-0.5 uppercase"
                            style={{ borderRadius: 4, color: rarityColor[card.rarity] ?? "var(--muted)", backgroundColor: "var(--surface)" }}
                        >
                            {card.rarity}
                        </span>
                    )}
                    {card.set_code && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5" style={{ borderRadius: 4, color: "var(--muted)", backgroundColor: "var(--surface)" }}>
                            {card.set_code.toUpperCase()}
                        </span>
                    )}
                    {card.price_usd && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5" style={{ borderRadius: 4, color: "var(--foreground)", backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)" }}>
                            ${card.price_usd}
                        </span>
                    )}
                </div>
                {card.set_name && (
                    <p className="m-0 text-[10px] leading-[14px]" style={{ color: "var(--muted)" }}>{card.set_name}</p>
                )}
            </div>
        </Link>
    );
}
