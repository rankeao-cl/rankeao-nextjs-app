export type DuelStatus =
    | "PENDING"
    | "ACCEPTED"
    | "IN_PROGRESS"
    | "AWAITING_CONFIRMATION"
    | "COMPLETED"
    | "DECLINED"
    | "CANCELLED"
    | "DISPUTED";

export interface DuelPlayer {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    rating?: number;
}

export interface Duel {
    id: string;
    challenger: DuelPlayer;
    opponent: DuelPlayer;
    game_id?: string;
    game_name?: string;
    game_slug?: string;
    format_id?: string;
    format_name?: string;
    best_of: number; // 1, 3, or 5
    is_ranked?: boolean;
    status: DuelStatus;
    challenger_wins?: number;
    opponent_wins?: number;
    winner_id?: string;
    reporter_id?: string;
    confirmed?: boolean;
    message?: string;
    created_at: string;
    xp_gained?: number;
    scheduled_at?: string;
    played_at?: string;
}

// Raw shape returned by backend (DuelInfo)
export interface DuelInfoRaw {
    id: string;
    challenger_id: string;
    challenger_username: string;
    challenger_avatar?: string;
    challenged_id: string;
    challenged_username: string;
    challenged_avatar?: string;
    game_name: string;
    game_slug?: string;
    format_name?: string;
    status: DuelStatus;
    best_of: number;
    message?: string;
    winner_id?: string;
    score_challenger: number;
    score_challenged: number;
    reporter_id?: string;
    confirmed: boolean;
    scheduled_at?: string;
    played_at?: string;
    created_at: string;
    xp_gained?: number;
}

// Map raw backend response to frontend-friendly Duel
export function mapDuel(raw: DuelInfoRaw): Duel {
    return {
        id: raw.id,
        challenger: {
            id: raw.challenger_id,
            username: raw.challenger_username,
            avatar_url: raw.challenger_avatar || undefined,
        },
        opponent: {
            id: raw.challenged_id,
            username: raw.challenged_username,
            avatar_url: raw.challenged_avatar || undefined,
        },
        game_name: raw.game_name,
        game_slug: raw.game_slug,
        format_name: raw.format_name,
        status: raw.status,
        best_of: raw.best_of,
        message: raw.message,
        winner_id: raw.winner_id,
        reporter_id: raw.reporter_id,
        confirmed: raw.confirmed,
        challenger_wins: raw.score_challenger,
        opponent_wins: raw.score_challenged,
        xp_gained: raw.xp_gained,
        scheduled_at: raw.scheduled_at,
        played_at: raw.played_at,
        created_at: raw.created_at,
    };
}

export interface CreateDuelRequest {
    opponent_id: string;
    game_id?: string;
    format_id?: string;
    best_of?: number;
    is_ranked?: boolean;
    message?: string;
}

export interface ReportDuelResultRequest {
    winner_id: string;
    score_challenger: number;
    score_challenged: number;
}

export interface DuelComment {
    id: string;
    duel_id: string;
    user_id: string;
    username?: string;
    avatar_url?: string;
    content: string;
    created_at: string;
    updated_at?: string;
}

export interface DuelsResponse {
    duels: Duel[];
    meta?: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
    };
}
