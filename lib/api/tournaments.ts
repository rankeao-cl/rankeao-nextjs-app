import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import type {
    Tournament,
    TournamentFilters,
    TournamentListResponse,
    Standing,
    TournamentRegistration,
    CreateTournamentRequest,
    UpdateTournamentRequest,
} from "@/lib/types/tournament";
import type { Params } from "@/lib/types/api";

// ── Helpers ──

function normalizeTournament(t: any): Tournament {
    // Flatten current_players → registered_count
    if (t.current_players != null && t.registered_count == null) {
        t.registered_count = t.current_players;
    }
    // Flatten nested tenant object
    if (t.tenant && typeof t.tenant === "object") {
        t.tenant_id = t.tenant_id || t.tenant.id;
        t.tenant_name = t.tenant_name || t.tenant.name;
        t.tenant_slug = t.tenant_slug || t.tenant.slug;
        t.tenant_logo_url = t.tenant_logo_url || t.tenant.logo_url;
    }
    return t as Tournament;
}

// ── List / Search ──

export async function getTournaments(
    filters: TournamentFilters = {}
): Promise<TournamentListResponse> {
    const res = await apiFetch<any>(
        "/tournaments",
        filters as Params,
        { revalidate: 30 }
    );
    const data = res.data || res;
    if (Array.isArray(data.tournaments)) {
        data.tournaments = data.tournaments.map(normalizeTournament);
    }
    return data;
}

// ── Detail ──

export async function getTournament(id: string): Promise<{ tournament: Tournament }> {
    const res = await apiFetch<any>(`/tournaments/${encodeURIComponent(id)}`);
    const unwrapped = res.data || res;
    const tournament = normalizeTournament(unwrapped.tournament || unwrapped);
    return { tournament };
}

// ── CRUD ──

export async function createTournament(data: CreateTournamentRequest) {
    return apiPost<{ tournament: Tournament }>("/tournaments", data);
}

export async function updateTournament(id: string, data: UpdateTournamentRequest) {
    return apiPatch<{ tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}`, data);
}

export async function deleteTournament(id: string) {
    return apiDelete<{ message: string }>(`/tournaments/${encodeURIComponent(id)}`);
}

// ── Registration ──

export async function registerForTournament(id: string, data?: TournamentRegistration) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/register`, data ?? {});
}

export async function unregisterFromTournament(id: string) {
    return apiDelete<any>(`/tournaments/${encodeURIComponent(id)}/register`);
}

export async function checkInTournament(id: string) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/check-in`, {});
}

export async function dropFromTournament(id: string) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/drop`, {});
}

// ── Standings ──

export async function getTournamentStandings(id: string) {
    return apiFetch<{ standings: Standing[] }>(`/tournaments/${encodeURIComponent(id)}/standings`);
}

// ── Rounds & Matches ──

export async function getTournamentRounds(id: string) {
    return apiFetch<any>(`/tournaments/${encodeURIComponent(id)}/rounds`, undefined, { revalidate: 15 });
}

export async function getTournamentMatches(tournamentId: string, params?: Params) {
    return apiFetch<any>(`/tournaments/${encodeURIComponent(tournamentId)}/matches`, params, { revalidate: 30 });
}

export async function getRoundMatches(tournamentId: string, roundNumber: number) {
    const res = await apiFetch<any>(
        `/tournaments/${encodeURIComponent(tournamentId)}/rounds/${roundNumber}/matches`,
        undefined,
        { cache: "no-store" }
    );
    const unwrapped = res.data || res;
    return Array.isArray(unwrapped.matches) ? unwrapped.matches : Array.isArray(unwrapped) ? unwrapped : [];
}

export async function getMyTournamentMatches(tournamentId: string) {
    return apiFetch<any>(`/tournaments/${encodeURIComponent(tournamentId)}/my-matches`, undefined, { cache: "no-store" });
}

export async function reportMatch(tournamentId: string, matchId: string, payload: any) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/report`, payload);
}

export async function disputeMatch(tournamentId: string, matchId: string, payload: any) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/dispute`, payload);
}

export async function confirmMatch(tournamentId: string, matchId: string) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/confirm`, {});
}

export async function resolveDispute(tournamentId: string, matchId: string, payload: any) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/resolve-dispute`, payload);
}

// ── Invitations ──

export async function sendTournamentInvitations(id: string, payload: { user_ids?: string[]; emails?: string[] }) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/invitations`, payload);
}

export async function acceptTournamentInvitation(token: string) {
    return apiPost<any>(`/tournaments/invitations/${encodeURIComponent(token)}/accept`, {});
}

// ── Organizer Actions ──

export async function startTournament(id: string) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/start`, {});
}

export async function finishTournament(id: string) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/finish`, {});
}

export async function closeTournament(id: string) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/close`, {});
}

export async function nextRound(id: string) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/next-round`, {});
}

// ── My History ──

export async function getMyTournamentHistory(params?: Params) {
    return apiFetch<any>("/tournaments/history", params, { cache: "no-store" });
}

// ── Publish ──

export async function publishTournament(id: string) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/publish`, {});
}

// ── Check-in ──

export async function startCheckIn(id: string) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/start-check-in`, {});
}

// ── Registrations ──

export async function getRegistrations(id: string) {
    return apiFetch<any>(`/tournaments/${encodeURIComponent(id)}/registrations`, undefined, { cache: "no-store" });
}

// ── Judges ──

export async function addJudge(id: string, payload: { user_id: string; is_head_judge?: boolean }) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/judges`, payload);
}

export async function removeJudge(id: string, userId: string) {
    return apiDelete<any>(`/tournaments/${encodeURIComponent(id)}/judges/${encodeURIComponent(userId)}`);
}

// ── Penalties ──

export async function issuePenalty(id: string, payload: { player_id: string; match_id: string; severity: string; reason: string; infraction?: string; notes?: string }) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/penalties`, payload);
}

// ── Extend Round Time ──

export async function extendRoundTime(id: string, roundNumber: number, payload: { extra_minutes: number; reason?: string }) {
    return apiPost<any>(`/tournaments/${encodeURIComponent(id)}/rounds/${roundNumber}/extend-time`, payload);
}
