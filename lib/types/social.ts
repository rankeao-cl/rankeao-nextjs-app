import type { PaginationMeta } from "./api";

// ── Social types ──

export interface UserProfile {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    banner_url?: string;
    bio?: string;
    city?: string;
    country?: string;
    country_code?: string;
    level?: number;
    total_xp?: number;
    title?: string;
    equipped_title_id?: string;
    equipped_cosmetic_ids?: string[];
    is_online?: boolean;
    last_seen_at?: string;
    // Relationship context (when authenticated)
    is_friend?: boolean;
    is_following?: boolean;
    is_blocked?: boolean;
    friend_request_id?: string;
    // Stats
    friends_count?: number;
    followers_count?: number;
    following_count?: number;
    badges_count?: number;
    tournaments_count?: number;
    created_at?: string;
}

export interface FriendRequest {
    id: string;
    sender_id: string;
    sender_username?: string;
    sender_avatar_url?: string;
    receiver_id: string;
    receiver_username?: string;
    status: string; // PENDING | ACCEPTED | REJECTED
    created_at: string;
}

export interface Activity {
    id: string;
    user_id: string;
    username?: string;
    avatar_url?: string;
    type: string; // TOURNAMENT_WIN | BADGE_EARNED | FRIENDSHIP | RATING_CHANGE | LEVEL_UP | DECK_PUBLISHED ...
    title?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

export interface Deck {
    id: string;
    user_id: string;
    username?: string;
    name: string;
    game_id?: string;
    game_name?: string;
    format_id?: string;
    format_name?: string;
    description?: string;
    is_public: boolean;
    tags?: string[];
    like_count?: number;
    view_count?: number;
    cards?: DeckCard[];
    created_at?: string;
    updated_at?: string;
}

export interface DeckCard {
    card_id: string;
    card_name: string;
    printing_id?: string;
    image_url?: string;
    quantity: number;
    board: "MAIN" | "SIDE" | "EXTRA" | "MAYBE";
}

export interface CollectionItem {
    id: string;
    printing_id: string;
    card_name?: string;
    image_url?: string;
    set_code?: string;
    quantity: number;
    condition: string;
    language?: string;
    is_foil?: boolean;
    notes?: string;
    created_at?: string;
}

export interface WishlistItem {
    id: string;
    card_id?: string;
    card_name?: string;
    printing_id?: string;
    image_url?: string;
    preferred_condition?: string;
    max_price?: number;
    priority?: number;
    created_at?: string;
}

export interface FeedPost {
    id: string;
    user_id?: string;
    username?: string;
    avatar_url?: string;
    content: string;
    image_url?: string;
    like_count?: number;
    comment_count?: number;
    created_at: string;
    updated_at?: string;
}

export interface FeedItem {
    id: string;
    type: string;
    user_id?: string;
    username?: string;
    avatar_url?: string;
    content?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

export interface FeedResponse {
    items: FeedItem[];
    meta?: PaginationMeta;
}

// ── Follow ──

export interface FollowedTenant {
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string;
    tenant_logo_url?: string;
    notify: boolean;
    followed_at: string;
}

export interface UserSearchResult {
    id: string;
    username: string;
    avatar_url?: string;
}
