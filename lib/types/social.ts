import type { PaginationMeta } from "./api";

// ── Social types ──

export interface UserProfile {
    id: string;
    username: string;
    display_name?: string;
    name?: string;
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
    follower_count?: number;
    followers_count?: number;
    following_count?: number;
    badges_count?: number;
    tournaments_count?: number;
    // Extended profile fields
    user_id?: string;
    rating?: number;
    win_rate?: number;
    games?: (string | { name?: string })[];
    role?: string;
    is_verified?: boolean;
    verified?: boolean;
    is_premium?: boolean;
    premium?: boolean;
    is_admin?: boolean;
    is_moderator?: boolean;
    clan?: { id: string; name: string; tag: string; logo_url?: string };
    user_clan?: { id: string; name: string; tag: string; logo_url?: string };
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
    slug?: string;
    user_id: string;
    username?: string;
    name: string;
    game_id?: string;
    game?: string;
    game_name?: string;
    format_id?: string;
    format?: string;
    format_name?: string;
    description?: string;
    is_public: boolean;
    tags?: string[];
    like_count?: number;
    likes_count?: number;
    view_count?: number;
    is_liked?: boolean;
    card_count?: number;
    avatar_url?: string;
    owner?: { username?: string; avatar_url?: string };
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
    content?: string;
    description?: string;
    text?: string;
    image_url?: string;
    images?: string[];
    like_count?: number;
    likes_count?: number;
    comment_count?: number;
    comments_count?: number;
    is_liked?: boolean;
    user?: { username?: string; avatar_url?: string; [key: string]: unknown };
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

// ── Raw Feed API response shapes ──

export interface RawFeedUser {
    id?: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
    rating?: number;
    rank_badge?: string;
}

export interface RawFeedMeta {
    duel_id?: string;
    deck_id?: string;
    deck_name?: string;
    game_name?: string;
    format_name?: string;
    best_of?: number;
    views_count?: number;
    cards?: Deck["cards"];
    [key: string]: unknown;
}

export interface RawFeedEntry {
    id: string;
    type?: string;
    item_type?: string;
    user?: RawFeedUser;
    user_id?: string;
    username?: string;
    avatar_url?: string;
    entity_id?: string;
    entity_type?: string;
    title?: string;
    description?: string;
    text?: string;
    content?: string;
    image_url?: string;
    images?: string[];
    tags?: string[];
    game?: string;
    game_name?: string;
    metadata?: RawFeedMeta;
    likes_count?: number;
    like_count?: number;
    is_liked?: boolean;
    comments_count?: number;
    comment_count?: number;
    created_at?: string;
}
