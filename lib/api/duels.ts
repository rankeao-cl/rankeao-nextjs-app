import { apiFetch, apiPost } from "./client";
import type { Duel, DuelInfoRaw, CreateDuelRequest, ReportDuelResultRequest } from "@/lib/types/duel";
import { mapDuel } from "@/lib/types/duel";

// ── List ──

export async function getDuels(params?: Record<string, string | number | boolean | undefined>, token?: string) {
    const res = await apiFetch<any>("/social/duels", params, { cache: "no-store", token });
    const raw: DuelInfoRaw[] = res?.data?.duels ?? res?.duels ?? [];
    return {
        duels: raw.map(mapDuel),
        meta: res?.meta ?? res?.data?.meta,
    };
}

// ── Detail ──

export async function getDuel(duelId: string, token?: string) {
    const res = await apiFetch<any>(`/social/duels/${encodeURIComponent(duelId)}`, undefined, { cache: "no-store", token });
    const raw: DuelInfoRaw | undefined = res?.data?.duel ?? res?.duel;
    return {
        duel: raw ? mapDuel(raw) : null,
    };
}

// ── Create ──

export async function createDuel(data: CreateDuelRequest, token?: string) {
    const res = await apiPost<any>("/social/duels", {
        challenged_id: data.opponent_id,
        game_id: data.game_id,
        format_id: data.format_id || undefined,
        best_of: data.best_of ?? 1,
        message: data.message,
    }, { token });
    const raw: DuelInfoRaw | undefined = res?.data?.duel ?? res?.duel;
    return {
        duel: raw ? mapDuel(raw) : null,
    };
}

// ── Actions ──

export async function acceptDuel(duelId: string, token?: string) {
    return apiPost<any>(`/social/duels/${encodeURIComponent(duelId)}/accept`, {}, { token });
}

export async function declineDuel(duelId: string, token?: string) {
    return apiPost<any>(`/social/duels/${encodeURIComponent(duelId)}/decline`, {}, { token });
}

export async function cancelDuel(duelId: string, token?: string) {
    return apiPost<any>(`/social/duels/${encodeURIComponent(duelId)}/cancel`, {}, { token });
}

// ── Report / Confirm / Dispute ──

export async function reportDuelResult(duelId: string, data: ReportDuelResultRequest, token?: string) {
    return apiPost<any>(`/social/duels/${encodeURIComponent(duelId)}/report`, data, { token });
}

export async function confirmDuelResult(duelId: string, token?: string) {
    return apiPost<any>(`/social/duels/${encodeURIComponent(duelId)}/confirm`, {}, { token });
}

export async function disputeDuel(duelId: string, token?: string) {
    return apiPost<any>(`/social/duels/${encodeURIComponent(duelId)}/dispute`, {}, { token });
}

// ── Comments ──

export async function getDuelComments(duelId: string, token?: string) {
    return apiFetch<any>(`/social/duels/${encodeURIComponent(duelId)}/comments`, undefined, { cache: "no-store", token });
}

export async function createDuelComment(duelId: string, data: { content: string }, token?: string) {
    return apiPost<any>(`/social/duels/${encodeURIComponent(duelId)}/comments`, data, { token });
}

// ── Report opponent ──

export async function reportDuelOpponent(duelId: string, data: { reason: string }, token?: string) {
    return apiPost<any>(`/social/duels/${encodeURIComponent(duelId)}/report-opponent`, data, { token });
}

// ── Broadcast search ──

export async function broadcastDuelSearch(data: {
    game_id?: string;
    best_of?: number;
    message?: string;
}, token?: string) {
    return apiPost<any>("/social/duels/search", data, { token });
}
