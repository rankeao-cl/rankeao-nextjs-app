import type { PaginationMeta } from "./api";

// ── Notification types ──

export interface Notification {
    id: string | number;
    user_id?: string;
    type?: string;
    category?: string;
    channel?: string;
    title: string;
    body?: string;
    priority?: string;
    is_read?: boolean;
    read_at?: string | null;
    sent_at?: string;
    action_url?: string;
    entity_type?: string;
    entity_id?: string | number;
    metadata?: Record<string, unknown>;
    variables?: Record<string, string>;
    created_at: string;
}

export interface NotificationsResponse {
    notifications: Notification[];
    meta?: PaginationMeta;
}

export interface UnreadCountResponse {
    total: number;
    by_category?: Record<string, number>;
}

export interface NotificationPreferences {
    tournament_updates: boolean;
    match_reminders: boolean;
    marketplace_offers: boolean;
    price_alerts: boolean;
    social_interactions: boolean;
    clan_activity: boolean;
    system_announcements: boolean;
}

export interface PushDevice {
    id: string;
    platform: "web" | "ios" | "android";
    token: string;
    is_active: boolean;
    created_at?: string;
}

export interface RegisterDevicePayload {
    platform: "web" | "ios" | "android";
    token: string;
    device_name?: string;
}
