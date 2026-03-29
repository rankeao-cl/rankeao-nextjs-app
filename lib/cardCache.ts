import type { ScryfallSearchResult } from "@/lib/api/catalog";

/**
 * In-memory card cache. Stores Scryfall search results so the detail
 * page can display them instantly without a second API call.
 * Survives client-side navigation but not full page reloads.
 */
const cache = new Map<string, ScryfallSearchResult>();

export function cacheCards(cards: ScryfallSearchResult[]) {
    for (const card of cards) {
        const key = card.name.toLowerCase();
        if (!cache.has(key)) {
            cache.set(key, card);
        }
    }
}

export function getCachedCard(name: string): ScryfallSearchResult | undefined {
    return cache.get(name.toLowerCase());
}
