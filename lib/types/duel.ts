export type DuelStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "DECLINED" | "CANCELLED" | "DISPUTED";

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
    is_ranked: boolean;
    status: DuelStatus;
    challenger_wins?: number;
    opponent_wins?: number;
    winner_id?: string;
    created_at: string;
    started_at?: string;
    finished_at?: string;
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
    challenger_wins: number;
    opponent_wins: number;
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
