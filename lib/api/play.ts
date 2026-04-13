import { apiFetch, apiPost, apiDelete } from "./client";
import type { ApiResponse } from "@/lib/types/api";

const BASE = "/play/matches";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PartidaStatus = "lobby" | "active" | "completed" | "cancelled";
export type ParticipantStatus = "invited" | "accepted" | "declined" | "kicked";

export interface Participant {
    id: string;
    partida_id: string;
    user_id: number;
    username: string;
    display_name: string;
    avatar_url?: string;
    seat: number;
    status: ParticipantStatus;
    joined_at?: string;
}

export interface Partida {
    id: string;
    game_slug: string;
    mode_slug: string;
    tracker_type: string;
    host_user_id: number;
    title: string;
    status: PartidaStatus;
    max_players: number;
    tracker_id?: string;
    participants: Participant[];
    created_at: string;
    started_at?: string;
    ended_at?: string;
}

export type LCEventType =
    | "life"
    | "commander_damage"
    | "poison"
    | "energy"
    | "experience"
    | "concede";

export type EliminationReason = "life" | "commander" | "poison" | "concede";

export interface LCPlayer {
    id: string;
    session_id: string;
    user_id?: number;
    seat: number;
    display_name: string;
    color: string;
    life_total: number;
    poison_counters: number;
    energy_counters: number;
    experience_counters: number;
    commander_damage: Record<string, number>; // "2" → cumulative
    is_eliminated: boolean;
    elimination_reason?: EliminationReason;
    eliminated_at?: string;
    updated_at: string;
}

export interface LCSession {
    id: string;
    partida_id: string;
    game_number: number;
    starting_life: number;
    is_commander: boolean;
    status: "active" | "completed";
    players: LCPlayer[];
    started_at: string;
    ended_at?: string;
}

export interface LCEvent {
    id: string;
    session_id: string;
    target_seat: number;
    change_amount: number;
    new_total: number;
    event_type: LCEventType;
    source_seat?: number;
    seq: number;
    created_at: string;
}

export type ResultType = "win" | "draw" | "cancelled";
export type VoteValue = "agree" | "disagree";

export interface ResultVote {
    id: string;
    result_id: string;
    participant_user_id: number;
    vote: VoteValue;
    voted_at: string;
}

export interface PlayResult {
    id: string;
    partida_id: string;
    submitted_by: number;
    result_type: ResultType;
    winner_user_id?: number;
    submitted_at: string;
    votes: ResultVote[];
    consensus_reached: boolean;
}

// ── Partida CRUD ──────────────────────────────────────────────────────────────

export function createPartida(body: { game_slug: string; mode_slug: string; title?: string }) {
    return apiPost<ApiResponse<Partida>>(BASE, body);
}

export function getPartida(id: string) {
    return apiFetch<ApiResponse<Partida>>(`${BASE}/${id}`, undefined, { cache: "no-store" });
}

export function listMyPartidas(params?: { status?: PartidaStatus; limit?: number; offset?: number }) {
    return apiFetch<ApiResponse<Partida[]>>(BASE, params as Record<string, string | number | boolean | undefined>, { cache: "no-store" });
}

export function cancelPartida(id: string) {
    return apiDelete<ApiResponse<null>>(`${BASE}/${id}`);
}

export function joinPartida(id: string, display_name?: string) {
    return apiPost<ApiResponse<Partida>>(`${BASE}/${id}/join`, { display_name });
}

export function leavePartida(id: string) {
    return apiPost<ApiResponse<null>>(`${BASE}/${id}/leave`, {});
}

// ── Tracker ───────────────────────────────────────────────────────────────────

export function startTracker(partidaId: string) {
    return apiPost<ApiResponse<Partida>>(`${BASE}/${partidaId}/tracker/start`, {});
}

// Life
export function updateLife(partidaId: string, seat: number, change: number) {
    return apiPost<ApiResponse<LCSession>>(`${BASE}/${partidaId}/tracker/actions/life`, { seat, change });
}

// Counter (poison / energy / experience)
export function updateCounter(partidaId: string, seat: number, counter_type: "poison" | "energy" | "experience", change: number) {
    return apiPost<ApiResponse<LCSession>>(`${BASE}/${partidaId}/tracker/actions/counter`, { seat, counter_type, change });
}

// Commander damage
export function updateCommanderDamage(partidaId: string, target_seat: number, source_seat: number, damage: number) {
    return apiPost<ApiResponse<LCSession>>(`${BASE}/${partidaId}/tracker/actions/commander-damage`, { target_seat, source_seat, damage });
}

// Concede
export function concede(partidaId: string, seat: number) {
    return apiPost<ApiResponse<LCSession>>(`${BASE}/${partidaId}/tracker/actions/concede`, { seat });
}

// Undo
export function undoLast(partidaId: string) {
    return apiPost<ApiResponse<LCSession>>(`${BASE}/${partidaId}/tracker/actions/undo`, {});
}

// End session
export function endTrackerSession(partidaId: string, winner_seat?: number) {
    return apiPost<ApiResponse<LCSession>>(`${BASE}/${partidaId}/tracker/actions/end`, { winner_seat });
}

// Queries
export function getTrackerState(partidaId: string) {
    return apiFetch<ApiResponse<LCSession>>(`${BASE}/${partidaId}/tracker/queries/state`, undefined, { cache: "no-store" });
}

export function getTrackerHistory(partidaId: string, seat?: number) {
    return apiFetch<ApiResponse<LCEvent[]>>(
        `${BASE}/${partidaId}/tracker/queries/history`,
        seat !== undefined ? { seat } : undefined,
        { cache: "no-store" }
    );
}

// ── Result & voting ───────────────────────────────────────────────────────────

export function submitResult(partidaId: string, body: { result_type: ResultType; winner_user_id?: number }) {
    return apiPost<ApiResponse<PlayResult>>(`${BASE}/${partidaId}/result`, body);
}

export function voteResult(partidaId: string, vote: VoteValue) {
    return apiPost<ApiResponse<PlayResult>>(`${BASE}/${partidaId}/result/vote`, { vote });
}

export function getResult(partidaId: string) {
    return apiFetch<ApiResponse<PlayResult>>(`${BASE}/${partidaId}/result`, undefined, { cache: "no-store" });
}
