import type { PaginationMeta } from "./api";
import type { LeaderboardEntry } from "./gamification";

// ── Rating types ──

export interface RatingProfile {
    user_id: string;
    username?: string;
    avatar_url?: string;
    game: string;
    format: string;
    rating: number;
    rating_deviation?: number;
    volatility?: number;
    peak_rating?: number;
    peak_rating_date?: string;
    matches_played: number;
    wins: number;
    losses: number;
    draws: number;
    win_rate?: number;
    current_streak?: number;
    best_streak?: number;
    worst_streak?: number;
    history?: RatingHistoryPoint[];
    period_summary?: RatingPeriodSummary;
}

export interface RatingHistoryPoint {
    date: string;
    rating: number;
    rating_deviation?: number;
    tournament_id?: string;
    tournament_name?: string;
    delta?: number;
}

export interface RatingPeriodSummary {
    period: string;
    start_rating: number;
    end_rating: number;
    delta: number;
    matches_played: number;
    wins: number;
    losses: number;
}

export interface RatingLeaderboardResponse {
    leaderboard: LeaderboardEntry[];
    my_position?: LeaderboardEntry;
    meta?: PaginationMeta;
}

export interface Season {
    id: string;
    slug: string;
    name: string;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
}

export interface SeasonsResponse {
    seasons: Season[];
    current?: Season;
}

export interface SeasonSnapshot {
    rank: number;
    user_id: string;
    username: string;
    avatar_url?: string;
    final_rating: number;
    title_earned?: string;
    matches_played?: number;
}

export interface SeasonSnapshotsResponse {
    snapshots: SeasonSnapshot[];
    meta?: PaginationMeta;
}

export interface UserTournamentHistoryEntry {
    tournament_id: string;
    tournament_name: string;
    game: string;
    format: string;
    status: string;
    position?: number;
    wins?: number;
    losses?: number;
    draws?: number;
    match_points?: number;
    rating_delta?: number;
    is_ranked?: boolean;
    starts_at?: string;
}

export interface UserTournamentHistoryResponse {
    tournaments: UserTournamentHistoryEntry[];
    stats?: {
        total_tournaments?: number;
        total_wins?: number;
        top4_finishes?: number;
        win_rate?: number;
    };
    meta?: PaginationMeta;
}
