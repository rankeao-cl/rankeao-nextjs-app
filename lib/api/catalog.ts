import { apiFetch } from "./client";
import type { CatalogGame, CatalogFormat, GamesResponse, AutocompleteResult, PricePoint } from "@/lib/types/catalog";
import type { Params } from "@/lib/types/api";

// ── Games ──

export async function getGames(): Promise<GamesResponse> {
    const payload = await apiFetch<any>("/catalog/games", undefined, { revalidate: 300 });
    if (Array.isArray(payload)) return { data: payload, success: true };
    if (payload && Array.isArray(payload.data)) return { data: payload.data, success: true };
    if (payload?.data?.games && Array.isArray(payload.data.games)) return { data: payload.data.games, success: true };
    return payload as GamesResponse;
}

export async function getGameDetail(slug: string) {
    const payload = await apiFetch<any>(`/catalog/games/${encodeURIComponent(slug)}`);
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
    return apiFetch<any>(`/catalog/games/${encodeURIComponent(gameSlug)}/sets`, params);
}

export async function getSetDetail(setId: string) {
    return apiFetch<any>(`/catalog/sets/${encodeURIComponent(setId)}`);
}

// ── Cards ──

export async function getCards(params?: Params) {
    return apiFetch<any>("/catalog/cards", params);
}

export async function getCardDetail(cardId: string) {
    return apiFetch<any>(`/catalog/cards/${encodeURIComponent(cardId)}`);
}

export async function getCardPrintings(cardId: string) {
    return apiFetch<any>(`/catalog/cards/${encodeURIComponent(cardId)}/printings`);
}

export async function getCardLegality(cardId: string) {
    return apiFetch<any>(`/catalog/cards/${encodeURIComponent(cardId)}/legality`);
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
    return apiFetch<any>("/catalog/cards/search", params);
}

export async function getSetCards(setId: string, params?: Params) {
    return apiFetch<any>(`/catalog/sets/${encodeURIComponent(setId)}/cards`, params);
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
