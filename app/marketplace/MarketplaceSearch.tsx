"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Magnifier, Xmark } from "@gravity-ui/icons";
import Image from "next/image";
import { autocompleteCards } from "@/lib/api/catalog";

interface Props {
    initialQuery?: string;
}

interface Suggestion {
    id: string;
    name: string;
    set_name?: string;
    set_code?: string;
    game_name?: string;
    image_url?: string;
    thumbnail_url?: string;
}

export default function MarketplaceSearch({ initialQuery = "" }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = useCallback((q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const data = await autocompleteCards(q);
                const items: Suggestion[] =
                    (data as Record<string, unknown>)?.results as Suggestion[] ?? [];
                setSuggestions(items.slice(0, 10));
                setShowSuggestions(items.length > 0);
            } catch {
                setSuggestions([]);
                setShowSuggestions(false);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setQuery(value);
            fetchSuggestions(value);
        },
        [fetchSuggestions]
    );

    const handleSearch = useCallback(
        (e?: React.FormEvent) => {
            if (e) e.preventDefault();
            const params = new URLSearchParams(searchParams.toString());
            if (query.trim()) {
                params.set("q", query.trim());
            } else {
                params.delete("q");
            }
            params.delete("page");
            setShowSuggestions(false);
            router.push(`${pathname}?${params.toString()}`);
        },
        [query, router, pathname, searchParams]
    );

    const handleSelectSuggestion = useCallback(
        (suggestion: Suggestion) => {
            const name = suggestion.name;
            setQuery(name);
            setSuggestions([]);
            setShowSuggestions(false);
            const params = new URLSearchParams(searchParams.toString());
            params.set("q", name);
            params.delete("page");
            router.push(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams]
    );

    const handleClear = useCallback(() => {
        setQuery("");
        setSuggestions([]);
        setShowSuggestions(false);
    }, []);

    return (
        <div ref={wrapperRef} className="relative" style={{ zIndex: 10 }}>
            <form onSubmit={handleSearch}>
                <div
                    className="flex items-center"
                    style={{
                        backgroundColor: "var(--surface-solid)",
                        borderRadius: "999px",
                        padding: "10px 14px",
                        border: "1px solid var(--surface)",
                    }}
                >
                    <Magnifier className="size-[18px] shrink-0" style={{ color: "var(--muted)" }} />
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                        placeholder="Buscar cartas, productos..."
                        className="flex-1 bg-transparent outline-none border-none"
                        style={{
                            color: "var(--foreground)",
                            fontSize: "14px",
                            marginLeft: "8px",
                        }}
                    />
                    {loading && (
                        <div
                            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin mr-1.5"
                            style={{ borderColor: "var(--muted)", borderTopColor: "transparent" }}
                        />
                    )}
                    {query.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="cursor-pointer"
                            style={{ color: "var(--muted)" }}
                        >
                            <Xmark className="size-[18px]" />
                        </button>
                    )}
                </div>
            </form>

            {/* Autocomplete dropdown */}
            {showSuggestions && (
                <div
                    className="absolute top-full left-0 right-0 mt-1 overflow-hidden overflow-y-auto"
                    style={{
                        backgroundColor: "var(--surface-solid)",
                        border: "1px solid var(--surface)",
                        borderRadius: "16px",
                        maxHeight: "280px",
                        zIndex: 20,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    }}
                >
                    {loading && suggestions.length === 0 && (
                        <div style={{ padding: "12px 14px", color: "var(--muted)", fontSize: "13px" }}>
                            Buscando...
                        </div>
                    )}
                    {suggestions.map((s, i) => {
                        const imgUrl = s.image_url || s.thumbnail_url;
                        const setLabel = s.set_name || s.set_code || s.game_name;
                        return (
                            <button
                                key={`${s.id}-${i}`}
                                onClick={() => handleSelectSuggestion(s)}
                                className="w-full flex items-center text-left cursor-pointer"
                                style={{
                                    padding: "10px 14px",
                                    borderBottom: i < suggestions.length - 1 ? "1px solid var(--surface)" : "none",
                                    transition: "background 0.1s",
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-solid-secondary)")}
                                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                                {imgUrl ? (
                                    <div className="shrink-0 overflow-hidden" style={{ width: "28px", height: "38px", borderRadius: "4px", marginRight: "10px" }}>
                                        <Image
                                            src={imgUrl}
                                            alt={s.name}
                                            width={28}
                                            height={38}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className="shrink-0 flex items-center justify-center"
                                        style={{
                                            width: "28px",
                                            height: "38px",
                                            borderRadius: "4px",
                                            marginRight: "10px",
                                            backgroundColor: "var(--surface)",
                                        }}
                                    >
                                        <Magnifier className="size-3" style={{ color: "var(--muted)" }} />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="truncate" style={{ color: "var(--foreground)", fontSize: "13px" }}>{s.name}</p>
                                    {setLabel && (
                                        <p className="truncate" style={{ color: "var(--muted)", fontSize: "10px" }}>{setLabel}</p>
                                    )}
                                </div>
                                <svg className="size-3.5 shrink-0" style={{ color: "var(--muted)" }} viewBox="0 0 16 16" fill="none">
                                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
