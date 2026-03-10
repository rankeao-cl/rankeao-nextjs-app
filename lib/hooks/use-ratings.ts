"use client";

import { useQuery } from "@tanstack/react-query";
import * as ratingsApi from "@/lib/api/ratings";

export function useRatingLeaderboard(params: { game: string; format: string; season?: string; country?: string; city?: string; page?: number }) {
    return useQuery({
        queryKey: ["ratings", "leaderboard", params],
        queryFn: () => ratingsApi.getRatingLeaderboard(params),
        enabled: !!params.game && !!params.format,
    });
}

export function useUserRating(userId: string, params: { game: string; format: string; period?: string }) {
    return useQuery({
        queryKey: ["ratings", "user", userId, params],
        queryFn: () => ratingsApi.getUserRating(userId, params),
        enabled: !!userId && !!params.game && !!params.format,
    });
}

export function useSeasons() {
    return useQuery({
        queryKey: ["ratings", "seasons"],
        queryFn: ratingsApi.getSeasons,
    });
}

export function useUserTournamentHistory(userId: string, params?: Record<string, any>) {
    return useQuery({
        queryKey: ["ratings", "history", userId, params],
        queryFn: () => ratingsApi.getUserTournamentHistory(userId, params as any),
        enabled: !!userId,
    });
}
