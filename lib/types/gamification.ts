import type { PaginationMeta } from "./api";

// ── Gamification types ──

export interface LeaderboardEntry {
    rank: number;
    user_id: string;
    username: string;
    avatar_url?: string;
    total_xp?: number;
    level?: number;
    rating?: number;
    games_played?: number;
    wins?: number;
    losses?: number;
    current_streak?: number;
    tournaments_played?: number;
    title?: string;
    country?: string;
    city?: string;
}

export interface XpLeaderboardResponse {
    leaderboard?: LeaderboardEntry[];
    entries?: LeaderboardEntry[];
    meta?: PaginationMeta;
}

export type XpPeriod = "all_time" | "season" | "month" | "week";

export interface Badge {
    id?: string;
    slug: string;
    name: string;
    description?: string;
    icon_url?: string;
    rarity?: string;
    category?: string | { name?: string; id?: string };
    earner_count?: number;
    criteria?: string;
    created_at?: string;
}

export interface BadgeCategory {
    slug: string;
    name: string;
    description?: string;
    badge_count?: number;
}

export interface BadgesResponse {
    badges: Badge[];
    meta?: PaginationMeta;
}

export interface Cosmetic {
    id: string;
    slug: string;
    name: string;
    description?: string;
    type: string; // PROFILE_FRAME | CARD_BACK | AVATAR_BORDER ...
    rarity?: string;
    image_url?: string;
    preview_url?: string;
    unlock_method?: string;
    created_at?: string;
}

export interface Title {
    id: string;
    slug: string;
    name: string;
    description?: string;
    display_text: string;
    rarity?: string;
    color?: string;
    unlock_method?: string;
    created_at?: string;
}

export interface GamificationSeason {
    id: string;
    name: string;
    slug?: string;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    description?: string;
    rewards?: SeasonReward[];
}

export interface SeasonReward {
    position_from: number;
    position_to: number;
    title_id?: string;
    cosmetic_id?: string;
    description?: string;
}

export interface SeasonLeaderboardEntry {
    rank: number;
    user_id: string;
    username: string;
    avatar_url?: string;
    total_xp: number;
    level?: number;
    game_id?: string;
    format_id?: string;
}

export interface UserStats {
    user_id: string;
    username: string;
    total_xp: number;
    level: number;
    xp_to_next_level?: number;
    current_level_xp?: number;
    badges_earned?: number;
    tournaments_played?: number;
    tournaments_won?: number;
    total_matches?: number;
    win_rate?: number;
    current_streak?: number;
    best_streak?: number;
    peak_rating?: number;
}

export interface RawLeaderboardEntry {
    rank?: number;
    user_id?: string;
    username?: string;
    avatar_url?: string;
    total_xp?: number;
    xp?: number;
    level?: number;
    rating?: number;
    elo?: number;
    games_played?: number;
    wins?: number;
    losses?: number;
    title?: string;
    user?: { id?: string; username?: string; avatar_url?: string; current_title?: string };
}

export interface RawFormatStat {
    name?: string;
    format?: string;
    count?: number;
    matches?: number;
}

export interface RawGameStat {
    game?: string | { name?: string };
    name?: string;
    win_rate?: number;
    winRate?: number;
    matches?: number;
    total_matches?: number;
}

export interface XpEvent {
    id: string;
    name: string;
    slug: string;
    description?: string;
    xp_amount: number;
    category?: string;
    is_active?: boolean;
}
