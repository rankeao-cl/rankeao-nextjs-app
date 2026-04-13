import { apiFetch, apiPost, apiPatch } from "./client";
import type { ApiResponse } from "@/lib/types/api";

const BASE = "/duels";

// ── Types ──

export interface SessionPlayer {
    id: string;
    seat: number;
    display_name: string;
    color: string;
    life_total: number;
    poison_counters: number;
    energy_counters: number;
    experience_counters: number;
    commander_damage: Record<string, number>; // "2" → 7
    is_eliminated: boolean;
    elimination_reason?: "life" | "commander" | "poison" | "concede";
    user_id?: string;
}

export type SessionFormat =
    | "COMMANDER"
    | "STANDARD"
    | "MODERN"
    | "PIONEER"
    | "LEGACY"
    | "DRAFT"
    | "CUSTOM";

export interface Session {
    id: string;
    duel_id: string;
    game_number: number;
    format: SessionFormat;
    starting_life: number;
    player_count: number;
    host_mode: boolean;
    status: "active" | "completed" | "abandoned";
    winner_player_id?: string;
    players: SessionPlayer[];
}

export interface LifeEvent {
    id: string;
    target_seat: number;
    change_amount: number;
    new_total: number;
    event_type:
        | "life"
        | "commander_damage"
        | "poison"
        | "energy"
        | "experience"
        | "concede"
        | "reset";
    source_seat?: number;
    seq: number;
    created_at: string;
}

export interface CreateSessionRequest {
    format: SessionFormat;
    starting_life: number;
    player_count: number;
    host_mode?: boolean;
    players?: Array<{
        seat: number;
        display_name: string;
        color: string;
        user_id?: string;
    }>;
}

// ── API Functions ──

export async function createSession(
    duelId: string,
    data: CreateSessionRequest
): Promise<Session> {
    const res = await apiPost<ApiResponse<{ session: Session }>>(
        `${BASE}/${encodeURIComponent(duelId)}/games`,
        data
    );
    return (res?.data?.session ?? (res as unknown as { session: Session })?.session) as Session;
}

export async function getSession(
    duelId: string,
    gameNumber: number
): Promise<Session> {
    const res = await apiFetch<ApiResponse<{ session: Session }>>(
        `${BASE}/${encodeURIComponent(duelId)}/games/${gameNumber}`,
        undefined,
        { cache: "no-store" }
    );
    return (res?.data?.session ?? (res as unknown as { session: Session })?.session) as Session;
}

export async function updateLife(
    duelId: string,
    gameNumber: number,
    seat: number,
    change: number
): Promise<Session> {
    const res = await apiPost<ApiResponse<{ session: Session }>>(
        `${BASE}/${encodeURIComponent(duelId)}/games/${gameNumber}/seats/${seat}/life`,
        { change }
    );
    return (res?.data?.session ?? (res as unknown as { session: Session })?.session) as Session;
}

export async function updateCommanderDamage(
    duelId: string,
    gameNumber: number,
    targetSeat: number,
    sourceSeat: number,
    damage: number
): Promise<Session> {
    const res = await apiPost<ApiResponse<{ session: Session }>>(
        `${BASE}/${encodeURIComponent(duelId)}/games/${gameNumber}/seats/${targetSeat}/commander-damage`,
        { source_seat: sourceSeat, damage }
    );
    return (res?.data?.session ?? (res as unknown as { session: Session })?.session) as Session;
}

export async function updateCounter(
    duelId: string,
    gameNumber: number,
    seat: number,
    type: "poison" | "energy" | "experience",
    change: number
): Promise<Session> {
    const res = await apiPost<ApiResponse<{ session: Session }>>(
        `${BASE}/${encodeURIComponent(duelId)}/games/${gameNumber}/seats/${seat}/counters`,
        { type, change }
    );
    return (res?.data?.session ?? (res as unknown as { session: Session })?.session) as Session;
}

export async function undoLast(
    duelId: string,
    gameNumber: number
): Promise<Session> {
    const res = await apiPost<ApiResponse<{ session: Session }>>(
        `${BASE}/${encodeURIComponent(duelId)}/games/${gameNumber}/undo`,
        {}
    );
    return (res?.data?.session ?? (res as unknown as { session: Session })?.session) as Session;
}

export async function concede(
    duelId: string,
    gameNumber: number,
    seat: number
): Promise<Session> {
    const res = await apiPost<ApiResponse<{ session: Session }>>(
        `${BASE}/${encodeURIComponent(duelId)}/games/${gameNumber}/seats/${seat}/concede`,
        {}
    );
    return (res?.data?.session ?? (res as unknown as { session: Session })?.session) as Session;
}

export async function endSession(
    duelId: string,
    gameNumber: number,
    winnerUserId?: string
): Promise<Session> {
    const res = await apiPatch<ApiResponse<{ session: Session }>>(
        `${BASE}/${encodeURIComponent(duelId)}/games/${gameNumber}/end`,
        { winner_user_id: winnerUserId }
    );
    return (res?.data?.session ?? (res as unknown as { session: Session })?.session) as Session;
}

export async function getHistory(
    duelId: string,
    gameNumber: number,
    seat?: number
): Promise<LifeEvent[]> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (seat !== undefined) params.seat = seat;
    const res = await apiFetch<ApiResponse<{ events: LifeEvent[] }>>(
        `${BASE}/${encodeURIComponent(duelId)}/games/${gameNumber}/history`,
        params,
        { cache: "no-store" }
    );
    return (
        res?.data?.events ?? (res as unknown as { events: LifeEvent[] })?.events ?? []
    );
}
