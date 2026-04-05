"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import * as gamificationApi from "@/lib/api/gamification";
import type { XpPeriod } from "@/lib/types/gamification";
import type { Params } from "@/lib/types/api";

// ── XP Leaderboard ──

export function useXpLeaderboard(params?: { period?: XpPeriod | string; page?: number; per_page?: number }) {
    return useQuery({
        queryKey: ["gamification", "xp-leaderboard", params],
        queryFn: () => gamificationApi.getXpLeaderboard(params),
    });
}

// ── Badges ──

export function useBadges(params?: { sort?: string; per_page?: number; category?: string; rarity?: string }) {
    return useQuery({
        queryKey: ["gamification", "badges", params],
        queryFn: () => gamificationApi.getBadges(params),
    });
}

export function useBadgeCategories() {
    return useQuery({
        queryKey: ["gamification", "badge-categories"],
        queryFn: gamificationApi.getBadgeCategories,
    });
}

// ── Cosmetics / Titles ──

export function useCosmetics(params?: Params) {
    return useQuery({
        queryKey: ["gamification", "cosmetics", params],
        queryFn: () => gamificationApi.getCosmetics(params),
    });
}

export function useTitles(params?: Params) {
    return useQuery({
        queryKey: ["gamification", "titles", params],
        queryFn: () => gamificationApi.getTitles(params),
    });
}

// ── User Stats ──

export function useUserStats(username: string) {
    return useQuery({
        queryKey: ["gamification", "user-stats", username],
        queryFn: () => gamificationApi.getUserStats(username),
        enabled: !!username,
    });
}

// ── Seasons ──

export function useGamificationSeasons() {
    return useQuery({
        queryKey: ["gamification", "seasons"],
        queryFn: gamificationApi.getGamificationSeasons,
    });
}

export function useSeasonLeaderboard(seasonId: string, params?: Params) {
    return useQuery({
        queryKey: ["gamification", "seasons", seasonId, "leaderboard", params],
        queryFn: () => gamificationApi.getSeasonLeaderboard(seasonId, params),
        enabled: !!seasonId,
    });
}

// ── My Stats ──

export function useMyXp(token?: string) {
    return useQuery({
        queryKey: ["gamification", "my-xp"],
        queryFn: () => gamificationApi.getMyXp(token),
    });
}

export function useMyCosmetics(token?: string) {
    return useQuery({
        queryKey: ["gamification", "my-cosmetics"],
        queryFn: () => gamificationApi.getMyCosmetics(token),
    });
}

export function useMyTitles(token?: string) {
    return useQuery({
        queryKey: ["gamification", "my-titles"],
        queryFn: () => gamificationApi.getMyTitles(token),
    });
}

export function useUpdateEquipped() {
    return useMutation({
        mutationFn: (payload: { title_id?: string; cosmetic_ids?: string[] }) =>
            gamificationApi.updateEquipped(payload),
    });
}
