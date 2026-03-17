import type { PaginationMeta } from "./api";

// ── Notification types ──

export interface Notification {
    id: string;
    user_id: string;
    type: string;
    category?: string; // TOURNAMENT | MARKETPLACE | SOCIAL | SYSTEM
    channel?: string;  // API may return "channel" instead of "category"
    title: string;
    body?: string;
    priority?: "low" | "normal" | "high";
    is_read: boolean;
    read_at?: string | null; // API returns read_at (nullable timestamp)
    action_url?: string;
    metadata?: Record<string, unknown>;
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
