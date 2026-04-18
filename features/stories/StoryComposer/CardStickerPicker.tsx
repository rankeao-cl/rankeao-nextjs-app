"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { scryfallSearch } from "@/lib/api/catalog";
import type { ScryfallSearchResult } from "@/lib/api/catalog";
import type { ApiResponse } from "@/lib/types/api";

type CardStickerPickerProps = {
  onSelect: (card: { cardId: string; name: string; imageUrl: string }) => void;
};

export default function CardStickerPicker({ onSelect }: CardStickerPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScryfallSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const raw = await scryfallSearch(trimmed, 1, 12);
        const payload = raw as ApiResponse<{ cards?: ScryfallSearchResult[] }>;
        const cards = payload?.data?.cards ?? [];
        const seen = new Set<string>();
        const deduped = cards.filter((card) => {
          const key = (card.name ?? "").toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setResults(deduped);
      } catch (error: unknown) {
        console.warn("Fallo buscando cartas", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar carta..."
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
      />
      {loading && (
        <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
          Buscando...
        </p>
      )}
      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
          Sin resultados
        </p>
      )}
      {results.length > 0 && (
        <div className="grid max-h-[220px] grid-cols-3 gap-2 overflow-y-auto pr-1">
          {results.map((card) => {
            const imageUrl = card.image_url ?? card.image_url_small;
            if (!imageUrl) return null;
            const cardId = card.slug ?? card.name;
            return (
              <button
                key={`card-sticker-${cardId}`}
                type="button"
                onClick={() =>
                  onSelect({
                    cardId,
                    name: card.name,
                    imageUrl,
                  })
                }
                className="group relative aspect-[3/4] overflow-hidden rounded-lg border"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                title={card.name}
                aria-label={`Agregar sticker ${card.name}`}
              >
                <Image
                  src={imageUrl}
                  alt={card.name}
                  fill
                  sizes="120px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
