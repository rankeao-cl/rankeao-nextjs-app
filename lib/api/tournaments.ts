import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import type {
    Tournament,
    TournamentFilters,
    TournamentListResponse,
    Standing,
    TournamentRegistration,
    CreateTournamentRequest,
    UpdateTournamentRequest,
    Round,
    Match,
    ReportMatchPayload,
    DisputeMatchPayload,
    ResolveDisputePayload,
    TournamentRegistrationResponse,
} from "@/lib/types/tournament";
import type { Params } from "@/lib/types/api";

// ── Helpers ──

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
}

function normalizeTournamentSort(sort?: string): string | undefined {
    switch (sort) {
        case "upcoming":
            return "starts_at_asc";
        case "recent":
            return "starts_at_desc";
        case "popular":
            return "current_players_desc";
        default:
            return sort;
    }
}

function normalizeTournamentFilters(filters: TournamentFilters): Params {
    return {
        ...filters,
        sort: normalizeTournamentSort(filters.sort),
    } as Params;
}

function normalizeTournament(value: unknown): Tournament {
    const source = asRecord(value) ?? {};
    const result: Record<string, unknown> = { ...source };
    // Flatten current_players → registered_count
    if (result.current_players != null && result.registered_count == null) {
        result.registered_count = result.current_players;
    }
    // Map game_slug → game (API returns game_slug, frontend expects game)
    if (!result.game && result.game_slug) {
        result.game = result.game_slug;
    }
    // Map format_name → format (API returns format_name, frontend expects format)
    if (!result.format && result.format_name) {
        result.format = result.format_name;
    }
    // Map format_type → structure
    if (!result.structure && result.format_type) {
        result.structure = result.format_type;
    }
    // Fallback: use banner_url as game_logo_url if not already set
    if (!result.game_logo_url && result.banner_url) {
        result.game_logo_url = result.banner_url;
    }
    // Flatten nested tenant object
    if (result.tenant && typeof result.tenant === "object") {
        const tenant = result.tenant as Record<string, unknown>;
        result.tenant_id = result.tenant_id || tenant.id;
        result.tenant_name = result.tenant_name || tenant.name;
        result.tenant_slug = result.tenant_slug || tenant.slug;
        result.tenant_logo_url = result.tenant_logo_url || tenant.logo_url;
    }

    const tournament: Tournament = {
        id: asString(result.id) ?? "",
        name: asString(result.name) ?? "Torneo",
        status: asString(result.status) ?? "draft",
    };

    tournament.slug = asString(result.slug);
    tournament.game = asString(result.game);
    tournament.game_id = asString(result.game_id);
    tournament.game_name = asString(result.game_name);
    tournament.game_logo_url = asString(result.game_logo_url);
    tournament.banner_url = asString(result.banner_url);
    tournament.logo_url = asString(result.logo_url);
    tournament.format = asString(result.format);
    tournament.format_id = asString(result.format_id);
    tournament.format_name = asString(result.format_name);
    tournament.structure = asString(result.structure);
    tournament.city = asString(result.city);
    tournament.country = asString(result.country);
    tournament.country_code = asString(result.country_code);
    tournament.visibility = asString(result.visibility) as Tournament["visibility"];
    tournament.modality = asString(result.modality);
    tournament.tier = asString(result.tier);
    tournament.description = asString(result.description);
    tournament.rules = asString(result.rules);
    tournament.prize_pool = asString(result.prize_pool);
    tournament.entry_fee = asString(result.entry_fee);
    tournament.tenant_id = asString(result.tenant_id);
    tournament.tenant_name = asString(result.tenant_name);
    tournament.tenant_slug = asString(result.tenant_slug);
    tournament.tenant_logo_url = asString(result.tenant_logo_url);
    tournament.starts_at = asString(result.starts_at);
    tournament.ends_at = asString(result.ends_at);
    tournament.created_at = asString(result.created_at);
    tournament.updated_at = asString(result.updated_at);
    tournament.organizer_id = asString(result.organizer_id);
    tournament.organizer_username = asString(result.organizer_username);
    tournament.organizer_name = asString(result.organizer_name);
    tournament.venue_name = asString(result.venue_name);
    tournament.venue_address = asString(result.venue_address);

    const bestOf = asNumber(result.best_of);
    const maxPlayers = asNumber(result.max_players);
    const currentRound = asNumber(result.current_round);
    const totalRounds = asNumber(result.total_rounds);
    const maxRounds = asNumber(result.max_rounds);
    const roundTimer = asNumber(result.round_timer_min);
    const registeredCount = asNumber(result.registered_count);
    const currentPlayers = asNumber(result.current_players);

    if (bestOf !== undefined) tournament.best_of = bestOf;
    if (maxPlayers !== undefined) tournament.max_players = maxPlayers;
    if (currentRound !== undefined) tournament.current_round = currentRound;
    if (totalRounds !== undefined) tournament.total_rounds = totalRounds;
    if (maxRounds !== undefined) tournament.max_rounds = maxRounds;
    if (roundTimer !== undefined) tournament.round_timer_min = roundTimer;
    if (registeredCount !== undefined) tournament.registered_count = registeredCount;
    if (currentPlayers !== undefined) tournament.current_players = currentPlayers;

    const isRanked = asBoolean(result.is_ranked);
    const isOnline = asBoolean(result.is_online);
    if (isRanked !== undefined) tournament.is_ranked = isRanked;
    if (isOnline !== undefined) tournament.is_online = isOnline;

    const tenant = asRecord(result.tenant);
    if (tenant) {
        tournament.tenant = {
            id: asString(tenant.id),
            name: asString(tenant.name),
            slug: asString(tenant.slug),
            logo_url: asString(tenant.logo_url),
        };
    }

    return tournament;
}

// ── List / Search ──

export async function getTournaments(
    filters: TournamentFilters = {}
): Promise<TournamentListResponse> {
    const res = await apiFetch<{ data?: TournamentListResponse } & TournamentListResponse>(
        "/tournaments",
        normalizeTournamentFilters(filters),
        { cache: "no-store" }
    );
    const data = res.data || res;
    if (Array.isArray(data.tournaments)) {
        data.tournaments = data.tournaments.map((t) => normalizeTournament(t));
    }
    return data;
}

// ── Detail ──

export async function getTournament(id: string): Promise<{ tournament: Tournament }> {
    const res = await apiFetch<{ data?: { tournament?: Tournament } & Record<string, unknown>; tournament?: Tournament } & Record<string, unknown>>(`/tournaments/${encodeURIComponent(id)}`);
    const unwrapped = (res.data || res) as Record<string, unknown>;
    const raw = (unwrapped.tournament || unwrapped) as Record<string, unknown>;
    const tournament = normalizeTournament(raw);
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
    return apiPost<{ registration: TournamentRegistrationResponse }>(`/tournaments/${encodeURIComponent(id)}/register`, data ?? {});
}

export async function unregisterFromTournament(id: string) {
    return apiDelete<{ message: string }>(`/tournaments/${encodeURIComponent(id)}/register`);
}

export async function checkInTournament(id: string) {
    return apiPost<{ message: string }>(`/tournaments/${encodeURIComponent(id)}/check-in`, {});
}

export async function dropFromTournament(id: string) {
    return apiPost<{ message: string }>(`/tournaments/${encodeURIComponent(id)}/drop`, {});
}

// ── Standings ──

export async function getTournamentStandings(id: string) {
    return apiFetch<{ standings: Standing[] }>(`/tournaments/${encodeURIComponent(id)}/standings`);
}

// ── Rounds & Matches ──

export async function getTournamentRounds(id: string) {
    return apiFetch<{ data?: Round[]; rounds?: Round[] }>(`/tournaments/${encodeURIComponent(id)}/rounds`, undefined, { revalidate: 15 });
}

export async function getTournamentMatches(tournamentId: string, params?: Params) {
    return apiFetch<{ data?: Match[]; matches?: Match[] }>(`/tournaments/${encodeURIComponent(tournamentId)}/matches`, params, { cache: "no-store" });
}

export async function getRoundMatches(tournamentId: string, roundNumber: number) {
    const res = await apiFetch<{ data?: { matches?: Match[] } & Record<string, unknown>; matches?: Match[] } & Record<string, unknown>>(
        `/tournaments/${encodeURIComponent(tournamentId)}/rounds/${roundNumber}/matches`,
        undefined,
        { cache: "no-store" }
    );
    const unwrapped = (res.data || res) as Record<string, unknown>;
    return Array.isArray(unwrapped.matches) ? unwrapped.matches : Array.isArray(unwrapped) ? unwrapped : [];
}

export async function getMyTournamentMatches(tournamentId: string) {
    return apiFetch<{ data?: Match[]; matches?: Match[] }>(`/tournaments/${encodeURIComponent(tournamentId)}/my-matches`, undefined, { cache: "no-store" });
}

export async function reportMatch(tournamentId: string, matchId: string, payload: ReportMatchPayload) {
    return apiPost<{ match: Match }>(`/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/report`, payload);
}

export async function disputeMatch(tournamentId: string, matchId: string, payload: DisputeMatchPayload) {
    return apiPost<{ match: Match }>(`/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/dispute`, payload);
}

export async function confirmMatch(tournamentId: string, matchId: string) {
    return apiPost<{ match: Match }>(`/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/confirm`, {});
}

export async function resolveDispute(tournamentId: string, matchId: string, payload: ResolveDisputePayload) {
    return apiPost<{ match: Match }>(`/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/resolve-dispute`, payload);
}

// ── Invitations ──

export async function sendTournamentInvitations(id: string, payload: { user_ids?: string[]; emails?: string[] }) {
    return apiPost<{ message: string }>(`/tournaments/${encodeURIComponent(id)}/invitations`, payload);
}

export async function acceptTournamentInvitation(token: string) {
    return apiPost<{ message: string }>(`/tournaments/invitations/${encodeURIComponent(token)}/accept`, {});
}

// ── Organizer Actions ──

export async function startTournament(id: string) {
    return apiPost<{ tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}/start`, {});
}

export async function finishTournament(id: string) {
    return apiPost<{ tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}/finish`, {});
}

export async function closeTournament(id: string) {
    return apiPost<{ tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}/close`, {});
}

export async function nextRound(id: string) {
    return apiPost<{ round: Round }>(`/tournaments/${encodeURIComponent(id)}/next-round`, {});
}

// ── My History ──

export async function getMyTournamentHistory(params?: Params) {
    return apiFetch<{ data?: Tournament[]; tournaments?: Tournament[] }>("/tournaments/history", params, { cache: "no-store" });
}

// ── Publish ──

export async function publishTournament(id: string) {
    return apiPost<{ tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}/publish`, {});
}

// ── Check-in ──

export async function startCheckIn(id: string) {
    return apiPost<{ message: string }>(`/tournaments/${encodeURIComponent(id)}/start-check-in`, {});
}

// ── Registrations ──

export async function getRegistrations(id: string) {
    return apiFetch<{ data?: TournamentRegistrationResponse[]; registrations?: TournamentRegistrationResponse[] }>(`/tournaments/${encodeURIComponent(id)}/registrations`, undefined, { cache: "no-store" });
}

// ── Judges ──

export async function addJudge(id: string, payload: { user_id: string; is_head_judge?: boolean }) {
    return apiPost<{ message: string }>(`/tournaments/${encodeURIComponent(id)}/judges`, payload);
}

export async function removeJudge(id: string, userId: string) {
    return apiDelete<{ message: string }>(`/tournaments/${encodeURIComponent(id)}/judges/${encodeURIComponent(userId)}`);
}

// ── Follow ──

export async function followTournament(id: string) {
    return apiPost<{ following: boolean; followers_count: number }>(`/tournaments/${encodeURIComponent(id)}/follow`, {});
}

export async function unfollowTournament(id: string) {
    return apiDelete<{ message: string }>(`/tournaments/${encodeURIComponent(id)}/follow`);
}

// ── Penalties ──

export async function issuePenalty(id: string, payload: { player_id: string; match_id: string; severity: string; reason: string; infraction?: string; notes?: string }) {
    return apiPost<{ message: string }>(`/tournaments/${encodeURIComponent(id)}/penalties`, payload);
}

// ── Extend Round Time ──

export async function extendRoundTime(id: string, roundNumber: number, payload: { extra_minutes: number; reason?: string }) {
    return apiPost<{ message: string }>(`/tournaments/${encodeURIComponent(id)}/rounds/${roundNumber}/extend-time`, payload);
}
