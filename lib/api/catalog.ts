import { apiFetch } from "./client";
import type { CatalogGame, CatalogFormat, GamesResponse, AutocompleteResult, PricePoint, Card, CardSet, Printing, LegalityEntry } from "@/lib/types/catalog";
import type { Params, PaginationMeta } from "@/lib/types/api";

// ── Games ──

export async function getGames(): Promise<GamesResponse> {
    const payload = await apiFetch<GamesResponse>("/catalog/games", undefined, { revalidate: 300 });
    if (Array.isArray(payload)) return { data: payload as unknown as CatalogGame[], success: true };
    if (payload && Array.isArray(payload.data)) return { data: payload.data, success: true };
    const extended = payload as GamesResponse & { data?: { games?: CatalogGame[] } };
    if (extended.data && Array.isArray((extended.data as unknown as { games?: CatalogGame[] }).games))
        return { data: (extended.data as unknown as { games: CatalogGame[] }).games, success: true };
    return payload as GamesResponse;
}

export async function getGameDetail(slug: string) {
    const payload = await apiFetch<{ data?: { game?: CatalogGame } & CatalogGame; game?: CatalogGame; success?: boolean }>(`/catalog/games/${encodeURIComponent(slug)}`);
    // API returns { data: { game: {...} } } — normalize to { data: CatalogGame }
    const game = payload?.data?.game ?? payload?.game ?? payload?.data;
    return { data: game as CatalogGame | undefined, success: payload?.success };
}

export async function getGameFormats(slug: string) {
    return apiFetch<{ formats?: CatalogFormat[]; data?: CatalogFormat[] }>(
        `/catalog/games/${encodeURIComponent(slug)}/formats`
    );
}

// ── Sets ──

export async function getGameSets(gameSlug: string, params?: Params) {
    return apiFetch<{ data?: CardSet[]; sets?: CardSet[]; meta?: PaginationMeta }>(`/catalog/games/${encodeURIComponent(gameSlug)}/sets`, params);
}

export async function getSetDetail(setId: string) {
    return apiFetch<{ data?: CardSet; set?: CardSet }>(`/catalog/sets/${encodeURIComponent(setId)}`);
}

// ── Cards ──

export async function getCards(params?: Params) {
    return apiFetch<{ data?: Card[]; cards?: Card[]; meta?: PaginationMeta }>("/catalog/cards", params);
}

export async function getCardDetail(cardId: string) {
    return apiFetch<{ data?: Card; card?: Card }>(`/catalog/cards/${encodeURIComponent(cardId)}`);
}

export async function getCardPrintings(cardId: string) {
    return apiFetch<{ data?: Printing[]; printings?: Printing[] }>(`/catalog/cards/${encodeURIComponent(cardId)}/printings`);
}

export async function getCardLegality(cardId: string) {
    return apiFetch<{ data?: LegalityEntry[]; legalities?: LegalityEntry[] }>(`/catalog/cards/${encodeURIComponent(cardId)}/legality`);
}

// ── Autocomplete ──

export async function autocompleteCards(q: string, gameId?: string) {
    return apiFetch<{ results: AutocompleteResult[] }>("/catalog/autocomplete", {
        q,
        ...(gameId ? { game_id: gameId } : {}),
    });
}

// ── Search ──

export async function searchCards(params?: Params) {
    return apiFetch<{ data?: Card[]; cards?: Card[]; meta?: PaginationMeta }>("/catalog/cards/search", params);
}

export async function getSetCards(setId: string, params?: Params) {
    return apiFetch<{ data?: Card[]; cards?: Card[]; meta?: PaginationMeta }>(`/catalog/sets/${encodeURIComponent(setId)}/cards`, params);
}

// ── Price History ──

export async function getPriceHistory(printingId: string, params?: Params) {
    return apiFetch<{ prices: PricePoint[] }>(
        `/catalog/printings/${encodeURIComponent(printingId)}/price-history`,
        params
    );
}

export async function getCardPriceHistory(cardId: string, params?: Params) {
    return apiFetch<{ prices: PricePoint[] }>(
        `/catalog/cards/${encodeURIComponent(cardId)}/price-history`,
        params
    );
}
