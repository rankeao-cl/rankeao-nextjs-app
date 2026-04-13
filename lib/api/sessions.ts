// ── Types only — API functions removed (system migrated to lib/api/play.ts) ──

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
