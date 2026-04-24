"use client";

// Hooks TanStack Query para promociones (WS-I).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    fetchMyChapitas,
    fetchPromotion,
    fetchPromotions,
    fetchWinners,
    mintChapita,
    submitFreeFormEntry,
} from "@/lib/api/promotions";
import { useAuthStore } from "@/lib/stores/auth-store";
import type {
    FreeFormEntryPayload,
    MintChapitaPayload,
} from "@/lib/types/promotions";

export function usePromotions() {
    return useQuery({
        queryKey: ["promotions", "list"],
        queryFn: () => fetchPromotions(),
        staleTime: 60_000,
    });
}

export function usePromotion(slug: string | undefined) {
    return useQuery({
        queryKey: ["promotions", "detail", slug],
        queryFn: () => fetchPromotion(slug as string),
        enabled: !!slug,
        staleTime: 60_000,
    });
}

export function useMyChapitas() {
    const isAuthed = useAuthStore((s) => !!s.accessToken);
    return useQuery({
        queryKey: ["promotions", "me", "chapitas"],
        queryFn: () => fetchMyChapitas(),
        enabled: isAuthed,
        staleTime: 30_000,
    });
}

export function useWinners(slug: string | undefined) {
    return useQuery({
        queryKey: ["promotions", "winners", slug],
        queryFn: () => fetchWinners(slug as string),
        enabled: !!slug,
        staleTime: 60_000,
    });
}

export function useMintChapita(slug: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: MintChapitaPayload = {}) => mintChapita(slug, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["promotions", "me", "chapitas"] });
            qc.invalidateQueries({ queryKey: ["promotions", "detail", slug] });
        },
    });
}

export function useSubmitFreeForm(slug: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: FreeFormEntryPayload) => submitFreeFormEntry(slug, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["promotions", "detail", slug] });
        },
    });
}
