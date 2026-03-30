export type GameMode = 'simple' | 'advanced';
export type GameStatus = 'active' | 'completed';
export type EventType = 'damage' | 'heal' | 'poison' | 'counter';
export type EventStatus = 'pending' | 'passed' | 'responded' | 'resolved' | 'cancelled';
export type ResponseType = 'pass' | 'respond';

export interface GameRules {
  id: string;
  game_slug: string;
  display_name: string;
  starting_life: number;
  min_life: number;
  supports_poison: boolean;
  poison_to_lose: number | null;
  response_window_ms: number;
  extra_counters: string[];
  available_modes: GameMode[];
}

export interface DuelGame {
  id: string;
  duel_id: string;
  game_number: number;
  mode: GameMode;
  game_rules: GameRules;
  status: GameStatus;
  winner_id: number | null;
  active_player_id: number | null;
  turn_number: number;
  started_at: string;
  ended_at: string | null;
}

export interface GameInteraction {
  id: string;
  game_id: string;
  player_id: number;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface PlayerState {
  id: string;
  game_id: string;
  player_id: number;
  life_total: number;
  counters: Record<string, number>;
  updated_at: string;
}

export interface PendingEvent {
  id: string;
  game_id: string;
  source_player_id: number;
  target_player_id: number | null;
  event_type: EventType | 'life_change';
  amount: number;
  description: string | null;
  status: EventStatus | 'countered' | 'disputed';
  parent_event_id: string | null;
  chain_depth: number;
  response_deadline: string | null;
  created_at: string;
}

export interface GameStateSnapshot {
  game: DuelGame;
  player_states: PlayerState[];
  pending_events: PendingEvent[];
}

// WS message envelope
export interface GameWSMessage {
  type: string;
  payload: unknown;
}
