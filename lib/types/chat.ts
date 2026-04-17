// ── Chat types ──

export type ChannelType = "DM" | "GROUP" | "CLAN" | "TOURNAMENT" | "COMMUNITY";

export interface Channel {
    id: string;
    type: ChannelType;
    name?: string;
    members?: ChannelMember[];
    last_message?: ChatMessage;
    last_message_at?: string;
    message_count?: number;
    unread_count?: number;
    is_readonly?: boolean;
    is_muted?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ChannelMember {
    id?: string;
    user_id?: string;
    username: string;
    avatar_url?: string;
    role?: string;
    joined_at?: string;
    is_online?: boolean;
}

export type MessageStatus = "sent" | "delivered" | "read";

export interface MessageEmbed {
    embed_type: "listing" | "post";
    // Listing embed fields
    image_url?: string;
    product_name?: string;
    price?: string;
    listing_url?: string;
    // Post embed fields
    author_name?: string;
    post_text?: string;
    post_url?: string;
}

export interface ChatMessage {
    id: string;
    channel_id: string;
    sender?: {
        id: string;
        username: string;
        avatar_url?: string;
    };
    sender_id?: string;
    sender_username?: string;
    username?: string;
    sender_avatar_url?: string;
    content: string;
    image_url?: string;
    metadata?: MessageEmbed;
    status?: MessageStatus;
    reply_to_id?: string;
    reply_to?: ChatMessage;
    is_edited?: boolean;
    is_deleted?: boolean;
    created_at: string;
    updated_at?: string;
}

export interface SendMessagePayload {
    content: string;
    reply_to_id?: string;
}

export interface CreateChannelPayload {
    type: ChannelType;
    name?: string;
    user_ids: string[];
}

export interface ReportMessagePayload {
    reason: "spam" | "harassment" | "inappropriate" | "other";
    details?: string;
}

// ── Rooms (COMMUNITY / CLAN public discovery) ──

export interface Room {
    id: string;
    type: "COMMUNITY" | "CLAN";
    name: string;
    description?: string;
    avatar_url?: string;
    game_id?: number;
    region?: string;
    member_count: number;
    is_readonly: boolean;
    last_message_at?: string;
    message_count: number;
    created_at: string;
}

export interface RoomListFilters {
    type?: "COMMUNITY" | "CLAN";
    game_id?: number;
    region?: string;
    search?: string;
    page?: number;
    per_page?: number;
}

// ── WebSocket message types ──

export interface WSIncomingMessage {
    type: "subscribe" | "unsubscribe" | "message" | "ping";
    channel_id?: string;
    content?: string;
    reply_to_id?: string;
    client_msg_id?: string;
}

export interface WSPresenceUser {
    id: string;
    username: string;
    avatar_url?: string;
}

export interface WSOutgoingMessage {
    type: "message" | "error" | "subscribed" | "unsubscribed" | "user_joined" | "user_left" | "message_ack";
    channel_id?: string;
    data?:
        | ChatMessage
        | { message: string }
        | { user: WSPresenceUser }
        | { client_msg_id: string; message_id: string };
}
