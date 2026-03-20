import { apiFetch, apiPost } from "./client";
import type { Duel, DuelsResponse, CreateDuelRequest, ReportDuelResultRequest } from "@/lib/types/duel";

export async function getDuels(params?: Record<string, string | number | boolean | undefined>, token?: string) {
    return apiFetch<DuelsResponse>("/social/duels", params, { cache: "no-store", token });
}

export async function getDuel(duelId: string, token?: string) {
    return apiFetch<{ duel: Duel }>(`/social/duels/${encodeURIComponent(duelId)}`, undefined, { cache: "no-store", token });
}

export async function createDuel(data: CreateDuelRequest, token?: string) {
    return apiPost<{ duel: Duel }>("/social/duels", data, { token });
}

export async function acceptDuel(duelId: string, token?: string) {
    return apiPost<{ duel: Duel }>(`/social/duels/${encodeURIComponent(duelId)}/accept`, {}, { token });
}

export async function declineDuel(duelId: string, token?: string) {
    return apiPost<{ duel: Duel }>(`/social/duels/${encodeURIComponent(duelId)}/decline`, {}, { token });
}

export async function cancelDuel(duelId: string, token?: string) {
    return apiPost<{ duel: Duel }>(`/social/duels/${encodeURIComponent(duelId)}/cancel`, {}, { token });
}

export async function reportDuelResult(duelId: string, data: ReportDuelResultRequest, token?: string) {
    return apiPost<{ duel: Duel }>(`/social/duels/${encodeURIComponent(duelId)}/report`, data, { token });
}

export async function confirmDuelResult(duelId: string, token?: string) {
    return apiPost<{ duel: Duel }>(`/social/duels/${encodeURIComponent(duelId)}/confirm`, {}, { token });
}

export async function disputeDuel(duelId: string, token?: string) {
    return apiPost<{ duel: Duel }>(`/social/duels/${encodeURIComponent(duelId)}/dispute`, {}, { token });
}
