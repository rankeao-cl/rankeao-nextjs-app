import { apiFetch, apiPost, apiPatch } from './client';
import type { ApiResponse } from '@/lib/types/api';
import type { GameStateSnapshot } from '../types/game';

// ── Start Game ──

export async function startGame(
    duelID: string,
    data: { mode: string; game_rules_slug: string },
    token?: string
) {
    return apiPost<ApiResponse<{ game: GameStateSnapshot }>>(
        `/social/duels/${encodeURIComponent(duelID)}/games`,
        data,
        { token }
    );
}

// ── Get Game State ──

export async function getGameState(
    duelID: string,
    gameNumber: number,
    token?: string
): Promise<GameStateSnapshot> {
    const res = await apiFetch<ApiResponse<GameStateSnapshot>>(
        `/social/duels/${encodeURIComponent(duelID)}/games/${gameNumber}`,
        undefined,
        { cache: 'no-store', token }
    );
    // Backend returns { data: { state: { game, player_states, pending_events } } }
    const data = (res as any)?.data?.state ?? (res as any)?.data ?? res;
    return data as GameStateSnapshot;
}

// ── Update Life (simple) ──

export async function updateLife(
    duelID: string,
    gameNumber: number,
    data: { delta: number },
    token?: string
) {
    return apiPatch<ApiResponse<unknown>>(
        `/social/duels/${encodeURIComponent(duelID)}/games/${gameNumber}/life`,
        data,
        { token }
    );
}

// ── Declare Event (advanced) ──

export async function declareEvent(
    duelID: string,
    gameNumber: number,
    data: {
        target_player_id: number;
        event_type: string;
        amount: number;
        description?: string;
    },
    token?: string
) {
    return apiPost<ApiResponse<unknown>>(
        `/social/duels/${encodeURIComponent(duelID)}/games/${gameNumber}/events`,
        data,
        { token }
    );
}

// ── Respond to Event ──

export async function respondEvent(
    duelID: string,
    gameNumber: number,
    eventID: string,
    data: { response_type: string; description?: string },
    token?: string
) {
    return apiPost<ApiResponse<unknown>>(
        `/social/duels/${encodeURIComponent(duelID)}/games/${gameNumber}/events/${encodeURIComponent(eventID)}/respond`,
        data,
        { token }
    );
}

// ── End Game ──

export async function endGame(
    duelID: string,
    gameNumber: number,
    data: { winner_id: number },
    token?: string
) {
    return apiPost<ApiResponse<unknown>>(
        `/social/duels/${encodeURIComponent(duelID)}/games/${gameNumber}/end`,
        data,
        { token }
    );
}
