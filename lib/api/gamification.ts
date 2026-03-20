import { apiFetch, apiPatch } from "./client";
import type { XpLeaderboardResponse, BadgesResponse, XpPeriod } from "@/lib/types/gamification";
import type { Params } from "@/lib/types/api";

// ── XP Leaderboard ──

export async function getXpLeaderboard(params?: {
    period?: XpPeriod | string;
    page?: number;
    per_page?: number;
}): Promise<XpLeaderboardResponse> {
    return apiFetch<XpLeaderboardResponse>(
        "/gamification/leaderboard/xp",
        params as Params,
        { revalidate: 60 }
    );
}

// ── Badges ──

export async function getBadges(params?: {
    sort?: string;
    per_page?: number;
    category?: string;
    rarity?: string;
}): Promise<BadgesResponse> {
    return apiFetch<BadgesResponse>(
        "/gamification/badges",
        params as Params,
        { revalidate: 120 }
    );
}

export async function getBadgeDetail(slug: string) {
    return apiFetch<any>(`/gamification/badges/${encodeURIComponent(slug)}`);
}

export async function getBadgeCategories() {
    return apiFetch<any>("/gamification/badge-categories", undefined, { revalidate: 300 });
}

// ── Cosmetics ──

export async function getCosmetics(params?: Params) {
    return apiFetch<any>("/gamification/cosmetics", params, { revalidate: 120 });
}

export async function getCosmeticDetail(slug: string) {
    return apiFetch<any>(`/gamification/cosmetics/${encodeURIComponent(slug)}`);
}

// ── Titles ──

export async function getTitles(params?: Params) {
    return apiFetch<any>("/gamification/titles", params, { revalidate: 120 });
}

export async function getTitleDetail(slug: string) {
    return apiFetch<any>(`/gamification/titles/${encodeURIComponent(slug)}`);
}

// ── Seasons (Gamification) ──

export async function getGamificationSeasons() {
    return apiFetch<any>("/gamification/seasons", undefined, { revalidate: 300 });
}

export async function getGamificationSeason(seasonId: string) {
    return apiFetch<any>(`/gamification/seasons/${encodeURIComponent(seasonId)}`);
}

export async function getSeasonLeaderboard(seasonId: string, params?: Params) {
    return apiFetch<any>(`/gamification/seasons/${encodeURIComponent(seasonId)}/leaderboard`, params, { revalidate: 60 });
}

export async function getSeasonLeaderboardByGames(seasonId: string, params?: Params) {
    return apiFetch<any>(`/gamification/seasons/${encodeURIComponent(seasonId)}/leaderboard/games`, params, { revalidate: 60 });
}

// ── User Stats ──

export async function getUserStats(username: string) {
    return apiFetch<any>(`/gamification/users/${encodeURIComponent(username)}/stats`, undefined, { revalidate: 60 });
}

// ── Levels ──

export async function getLevels() {
    return apiFetch<any>("/gamification/levels", undefined, { revalidate: 300 });
}

// ── XP Events ──

export async function getXpEvents() {
    return apiFetch<any>("/gamification/xp-events", undefined, { revalidate: 300 });
}

// ── My Cosmetics / Titles / XP / Equipped ──

export async function getMyCosmetics(token?: string) {
    return apiFetch<any>("/social/me/cosmetics", undefined, { cache: "no-store", token });
}

export async function getMyTitles(token?: string) {
    return apiFetch<any>("/social/me/titles", undefined, { cache: "no-store", token });
}

export async function getMyXp(token?: string) {
    return apiFetch<any>("/social/me/xp", undefined, { cache: "no-store", token });
}

/**
 * NOTE: GET /social/me/equipped is not in the public OpenAPI spec (only PATCH exists).
 * This may be an internal/undocumented endpoint. Keep for backward compatibility.
 */
export async function getMyEquipped(token?: string) {
    return apiFetch<any>("/social/me/equipped", undefined, { cache: "no-store", token });
}

export async function updateEquipped(payload: { title_id?: string; cosmetic_ids?: string[] }, token?: string) {
    return apiPatch<any>("/social/me/equipped", payload, { token });
}
