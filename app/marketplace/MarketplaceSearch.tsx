"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input, Button } from "@heroui/react";
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

    // Close dropdown when clicking outside
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
                const res = await autocompleteCards(q);
                const data = res as any;
                const items: Suggestion[] =
                    data?.results ?? data?.data?.results ?? data?.suggestions ?? data?.data?.suggestions ?? data?.cards ?? [];
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
        <div ref={wrapperRef} className="relative max-w-lg">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                        placeholder="Buscar carta, juego o tienda..."
                        className="flex-1 bg-[var(--surface-secondary)] border border-[var(--border)] shadow-none text-[var(--foreground)] px-3 py-2 rounded-xl"
                    />
                    {query.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                        >
                            <Xmark className="size-4" />
                        </button>
                    )}
                </div>
                <Button
                    type="submit"
                    className="font-bold border border-transparent bg-[var(--accent)] text-[var(--accent-foreground)]"
                >
                    Buscar
                </Button>
            </form>

            {/* Autocomplete dropdown */}
            {showSuggestions && (
                <div
                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--card-radius,12px)] overflow-hidden max-h-[320px] overflow-y-auto"
                    style={{ boxShadow: "var(--shadow-popover, 0 8px 30px rgba(0,0,0,0.3))" }}
                >
                    {loading && suggestions.length === 0 && (
                        <div className="px-4 py-3 text-xs text-[var(--muted)]">Buscando...</div>
                    )}
                    {suggestions.map((s, i) => {
                        const imgUrl = s.image_url || s.thumbnail_url;
                        const setLabel = s.set_name || s.set_code || s.game_name;
                        return (
                            <button
                                key={`${s.id}-${i}`}
                                onClick={() => handleSelectSuggestion(s)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--surface-secondary)] transition-colors ${
                                    i < suggestions.length - 1 ? "border-b border-[var(--border)]" : ""
                                }`}
                            >
                                {/* Card image thumbnail */}
                                {imgUrl ? (
                                    <div className="w-7 h-10 rounded overflow-hidden flex-shrink-0 bg-[var(--surface-secondary)]">
                                        <Image
                                            src={imgUrl}
                                            alt={s.name}
                                            width={28}
                                            height={40}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-7 h-10 rounded flex-shrink-0 bg-[var(--surface-secondary)] flex items-center justify-center">
                                        <Magnifier className="size-3 text-[var(--muted)]" />
                                    </div>
                                )}

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[var(--foreground)] truncate">{s.name}</p>
                                    {setLabel && (
                                        <p className="text-[10px] text-[var(--muted)] truncate">{setLabel}</p>
                                    )}
                                </div>

                                {/* Arrow */}
                                <svg className="size-3.5 text-[var(--muted)] flex-shrink-0" viewBox="0 0 16 16" fill="none">
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
