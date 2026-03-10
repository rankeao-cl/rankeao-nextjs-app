import type { PaginationMeta } from "./api";

// ── Tournament types ──

export interface Tournament {
    id: string;
    name: string;
    status: string;
    game: string;
    game_id?: string;
    game_name?: string;
    game_logo_url?: string;
    format: string;
    format_id?: string;
    format_name?: string;
    structure?: string; // SWISS | SINGLE_ELIMINATION | DOUBLE_ELIMINATION | ROUND_ROBIN
    best_of?: number;
    city?: string;
    country?: string;
    country_code?: string;
    is_ranked?: boolean;
    is_online?: boolean;
    visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
    modality?: string;
    tier?: string;
    max_players?: number;
    current_round?: number;
    total_rounds?: number;
    max_rounds?: number;
    round_timer_min?: number;
    starts_at?: string;
    ends_at?: string;
    check_in_opens_at?: string;
    created_at?: string;
    updated_at?: string;
    description?: string;
    rules?: string;
    prize_pool?: string;
    entry_fee?: string;
    registered_count?: number;
    tenant_id?: string;
    tenant_name?: string;
    tenant_slug?: string;
    tenant_logo_url?: string;
    organizer_id?: string;
    organizer_username?: string;
    inscription_url?: string;
    stream_url?: string;
    venue_name?: string;
    venue_address?: string;
}

export interface TournamentDetail extends Tournament {
    rounds?: Round[];
    standings?: Standing[];
    judges?: TournamentJudge[];
    prizes?: TournamentPrize[];
    my_registration?: {
        status: string;
        registered_at?: string;
        checked_in?: boolean;
        deck_id?: string;
    };
}

export interface Round {
    id: string;
    round_number: number;
    status: string;
    started_at?: string;
    ended_at?: string;
    matches?: Match[];
}

export interface Match {
    id: string;
    round_number?: number;
    table_number?: number;
    status: string;
    player1_id: string;
    player1_username?: string;
    player2_id?: string;
    player2_username?: string;
    player1_wins?: number;
    player2_wins?: number;
    draws?: number;
    winner_id?: string;
    reported_by?: string;
    is_bye?: boolean;
    started_at?: string;
    ended_at?: string;
}

export interface Standing {
    rank: number;
    user_id: string;
    username: string;
    avatar_url?: string;
    points: number;
    wins: number;
    losses: number;
    draws: number;
    omw?: number;
    gw?: number;
    ogw?: number;
    match_points?: number;
    rating_delta?: number;
}

export interface TournamentJudge {
    user_id: string;
    username: string;
    role: string;
}

export interface TournamentPrize {
    position: number;
    description: string;
    value?: number;
}

export interface TournamentFilters {
    status?: string;
    game?: string;
    format?: string;
    city?: string;
    country?: string;
    is_ranked?: boolean;
    q?: string;
    sort?: "recent" | "upcoming" | "popular" | string;
    page?: number;
    per_page?: number;
    date_from?: string;
    date_to?: string;
}

export interface TournamentListResponse {
    tournaments: Tournament[];
    meta: PaginationMeta;
}

export interface CreateTournamentRequest {
    name: string;
    game_id: string;
    format_id: string;
    starts_at: string;
    structure?: string;
    best_of?: number;
    max_players?: number;
    max_rounds?: number;
    round_timer_min?: number;
    visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
    modality?: string;
    tier?: string;
    description?: string;
    rules?: string;
    prize_pool?: string;
    entry_fee?: string;
    is_ranked?: boolean;
    venue_name?: string;
    venue_address?: string;
    city?: string;
    country_code?: string;
}

export interface UpdateTournamentRequest {
    name?: string;
    starts_at?: string;
    description?: string;
    rules?: string;
    max_players?: number;
    visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
    prize_pool?: string;
    entry_fee?: string;
}

export interface TournamentRegistration {
    tournament_id: string;
    deck_id?: string;
    deck_list?: string;
}
