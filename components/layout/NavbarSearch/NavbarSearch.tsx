"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@heroui/react/avatar";
import { Spinner } from "@heroui/react/spinner";

import { Magnifier, Person, Cup, Persons, ShoppingCart, Xmark, SquareDashed } from "@gravity-ui/icons";

import { autocompleteUsers } from "@/lib/api/social";
import { getTournaments } from "@/lib/api/tournaments";
import { getTenants } from "@/lib/api/tenants";
import { getListings } from "@/lib/api/marketplace";
import { scryfallSearch } from "@/lib/api/catalog";
import type { ApiResponse } from "@/lib/types/api";
import type { UserProfile } from "@/lib/types/social";
import type { Tournament } from "@/lib/types/tournament";
import type { Tenant } from "@/lib/types/tenant";
import type { Listing } from "@/lib/types/marketplace";
import type { ScryfallSearchResult } from "@/lib/api/catalog";

type SearchResult = {
  id: string;
  type: "user" | "tournament" | "community" | "listing" | "card";
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const TYPE_CONFIG = {
  user: { icon: Person, label: "Jugadores", color: "text-blue-500", bg: "bg-blue-500/15" },
  tournament: { icon: Cup, label: "Torneos", color: "text-purple-500", bg: "bg-purple-500/15" },
  community: { icon: Persons, label: "Comunidades", color: "text-emerald-500", bg: "bg-emerald-500/15" },
  listing: { icon: ShoppingCart, label: "Marketplace", color: "text-orange-500", bg: "bg-orange-500/15" },
  card: { icon: SquareDashed, label: "Cartas", color: "text-amber-500", bg: "bg-amber-500/15" },
} as const;

export default function NavbarSearch({ expanded = false, onClose }: { expanded?: boolean; onClose?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query.trim(), 300);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Autofocus when expanded on mobile
  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  // Search logic
  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    try {
      const [usersRes, tournamentsRes, tenantsRes, listingsRes, cardsRes] = await Promise.allSettled([
        autocompleteUsers(q),
        getTournaments({ q, per_page: 4 }),
        getTenants({ q, per_page: 4 }),
        getListings({ q, per_page: 4 }),
        scryfallSearch(q, 1, 4),
      ]);

      const items: SearchResult[] = [];

      // Users
      if (usersRes.status === "fulfilled") {
        const val = usersRes.value as ApiResponse<{ users?: UserProfile[] }>;
        const users = val?.data?.users || val?.users || (Array.isArray(val) ? val : []);
        users.slice(0, 4).forEach((u: UserProfile) => {
          items.push({
            id: u.id || u.username,
            type: "user",
            title: u.username || u.display_name || "Usuario",
            subtitle: u.display_name && u.display_name !== u.username ? u.display_name : undefined,
            image: u.avatar_url,
            href: `/perfil/${encodeURIComponent(u.username)}`,
          });
        });
      }

      // Tournaments
      if (tournamentsRes.status === "fulfilled") {
        const val = tournamentsRes.value as ApiResponse<{ tournaments?: Tournament[] }>;
        const tournaments = val?.data?.tournaments || val?.tournaments || (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
        tournaments.slice(0, 4).forEach((t: Tournament) => {
          items.push({
            id: t.id,
            type: "tournament",
            title: t.name,
            subtitle: t.game || t.tenant_name || undefined,
            href: `/torneos/${t.slug ?? t.id}`,
          });
        });
      }

      // Communities / Tenants
      if (tenantsRes.status === "fulfilled") {
        const val = tenantsRes.value as ApiResponse<{ tenants?: Tenant[] }>;
        const tenants = val?.data?.tenants || val?.tenants || (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
        tenants.slice(0, 4).forEach((t: Tenant) => {
          items.push({
            id: t.id || t.slug,
            type: "community",
            title: t.name,
            subtitle: t.city ? `${t.city}${t.region ? `, ${t.region}` : ""}` : undefined,
            image: t.logo_url,
            href: `/comunidades/${t.slug}`,
          });
        });
      }

      // Listings
        if (listingsRes.status === "fulfilled") {
          const val = listingsRes.value as ApiResponse<{ listings?: Listing[] }>;
          const listings = val?.data?.listings || val?.listings || (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
          listings.slice(0, 4).forEach((l: Listing) => {
            const previewImage = l.images?.[0]?.thumbnail_url || l.images?.[0]?.url || l.image_url;
            items.push({
              id: l.id,
              type: "listing",
              title: l.title || l.card_name || "Producto",
              subtitle: l.price ? `$${Number(l.price).toLocaleString("es-CL")}` : undefined,
              image: previewImage,
              href: `/marketplace/${l.id}`,
            });
          });
        }

      // Cards (Scryfall)
      if (cardsRes.status === "fulfilled") {
        const val = cardsRes.value as ApiResponse<{ cards?: ScryfallSearchResult[] }>;
        const cards = val?.data?.cards || [];
        const seen = new Set<string>();
        for (const c of cards) {
          const key = (c.name || "").toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          items.push({
            id: c.name,
            type: "card",
            title: c.name,
            subtitle: [c.set_name, c.rarity].filter(Boolean).join(" · "),
            image: c.image_url_small || c.image_url,
            href: `/cartas/${c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
          });
          if (seen.size >= 4) break;
        }
      }

      setResults(items);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        router.push(results[selectedIndex].href);
        handleClear();
      } else if (query.trim()) {
        // Navigate to a general search page
        router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
        handleClear();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      onClose?.();
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onClose?.();
  };

  // Group results by type
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const typeOrder: SearchResult["type"][] = ["user", "tournament", "community", "card", "listing"];
  let globalIndex = -1;

  return (
    <div ref={containerRef} className="relative flex-1">
      <div
        className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm"
        style={{
          background: "var(--field-background)",
          border: "1px solid var(--border)",
          color: "var(--field-foreground)",
        }}
      >
        <Magnifier className="size-4 shrink-0" style={{ color: "var(--field-placeholder)" }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar jugadores, torneos, cartas..."
          className="w-full bg-transparent outline-none placeholder:text-[var(--field-placeholder)]"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="navbar-search-listbox"
          aria-activedescendant={selectedIndex >= 0 ? `search-option-${selectedIndex}` : undefined}
          aria-autocomplete="list"
          aria-label="Buscar"
        />
        {isLoading && <Spinner size="sm" className="shrink-0" />}
        {query && !isLoading && (
          <button onClick={handleClear} className="shrink-0 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer">
            <Xmark className="size-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          id="navbar-search-listbox"
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-[22px] overflow-hidden shadow-2xl z-50 border border-[var(--border)] max-h-[70vh] overflow-y-auto custom-scrollbar backdrop-blur-3xl"
          style={{ background: "var(--surface)" }}
        >
          {results.length === 0 && !isLoading && debouncedQuery.length >= 2 && (
            <div className="py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-3">
                <Magnifier className="size-5 text-[var(--accent)] opacity-60" />
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)] mb-1">Sin resultados</p>
              <p className="text-xs text-[var(--muted)]">No encontramos nada para &quot;{debouncedQuery}&quot;</p>
            </div>
          )}

          {typeOrder.map((type) => {
            const items = groupedResults[type];
            if (!items || items.length === 0) return null;
            const config = TYPE_CONFIG[type];
            const Icon = config.icon;

            return (
              <div key={type}>
                <div className="px-3.5 py-2 flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-secondary)]">
                  <Icon className={`size-3.5 ${config.color}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{config.label}</span>
                  <span className="text-[10px] text-[var(--muted)]">({items.length})</span>
                </div>
                {items.map((item) => {
                  globalIndex++;
                  const idx = globalIndex;
                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      onClick={handleClear}
                      id={`search-option-${idx}`}
                      role="option"
                      aria-selected={idx === selectedIndex}
                      className={`flex items-center gap-3 px-3.5 py-2.5 hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer ${idx === selectedIndex ? "bg-[var(--surface-secondary)]" : ""}`}
                    >
                      {item.image ? (
                        <Avatar size="sm">
                          <Avatar.Image src={item.image} alt={item.title} />
                          <Avatar.Fallback>{item.title[0]?.toUpperCase()}</Avatar.Fallback>
                        </Avatar>
                      ) : (
                        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`size-4 ${config.color}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-[11px] text-[var(--muted)] truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}

          {results.length > 0 && (
            <div className="p-2 border-t border-[var(--border)]">
              <Link
                href={`/buscar?q=${encodeURIComponent(query.trim())}`}
                onClick={handleClear}
                className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
              >
                Ver todos los resultados para &quot;{query.trim()}&quot; →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
