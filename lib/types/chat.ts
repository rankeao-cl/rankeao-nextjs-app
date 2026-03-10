// ── Chat types ──

export type ChannelType = "DM" | "GROUP" | "CLAN" | "TOURNAMENT";

export interface Channel {
    id: string;
    type: ChannelType;
    name?: string;
    members?: ChannelMember[];
    last_message?: ChatMessage;
    unread_count?: number;
    is_muted?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ChannelMember {
    user_id: string;
    username: string;
    avatar_url?: string;
    role?: string;
    joined_at?: string;
    is_online?: boolean;
}

export interface ChatMessage {
    id: string;
    channel_id: string;
    sender_id: string;
    sender_username?: string;
    sender_avatar_url?: string;
    content: string;
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
    member_ids: string[];
}

export interface ReportMessagePayload {
    reason: "spam" | "harassment" | "inappropriate" | "other";
    details?: string;
}
