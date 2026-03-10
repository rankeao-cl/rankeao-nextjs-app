"use client";

import { useQuery } from "@tanstack/react-query";
import * as catalogApi from "@/lib/api/catalog";

// ── Games ──

export function useGames() {
    return useQuery({
        queryKey: ["catalog", "games"],
        queryFn: catalogApi.getGames,
    });
}

export function useGameDetail(slug: string) {
    return useQuery({
        queryKey: ["catalog", "games", slug],
        queryFn: () => catalogApi.getGameDetail(slug),
        enabled: !!slug,
    });
}

export function useGameFormats(slug: string) {
    return useQuery({
        queryKey: ["catalog", "formats", slug],
        queryFn: () => catalogApi.getGameFormats(slug),
        enabled: !!slug,
    });
}

export function useGameSets(gameSlug: string) {
    return useQuery({
        queryKey: ["catalog", "sets", gameSlug],
        queryFn: () => catalogApi.getGameSets(gameSlug),
        enabled: !!gameSlug,
    });
}

export function useCards(params?: Record<string, any>) {
    return useQuery({
        queryKey: ["catalog", "cards", params],
        queryFn: () => catalogApi.getCards(params as any),
    });
}

export function useCardDetail(cardId: string) {
    return useQuery({
        queryKey: ["catalog", "cards", cardId],
        queryFn: () => catalogApi.getCardDetail(cardId),
        enabled: !!cardId,
    });
}
