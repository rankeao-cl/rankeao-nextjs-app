import { apiFetch, apiPost, apiPatch, apiPut, apiDelete } from "./client";
import type { Params } from "@/lib/types/api";
import type {
    RegisterDevicePayload, NotificationPreferences,
    NotificationsResponse, UnreadCountResponse, Notification, PushDevice,
} from "@/lib/types/notification";

// ── List / Read / Delete ──

export async function getNotifications(params?: Params, token?: string) {
    return apiFetch<NotificationsResponse>("/notifications", params, { cache: "no-store", token });
}

export async function getUnreadNotificationCount(token?: string) {
    return apiFetch<UnreadCountResponse>("/notifications/unread-count", undefined, { cache: "no-store", token });
}

export async function markNotificationRead(notificationId: string, token?: string) {
    return apiPost<{ notification: Notification }>(`/notifications/${notificationId}/read`, {}, { token });
}

export async function markAllNotificationsRead(token?: string) {
    return apiPost<{ message: string }>("/notifications/read-all", {}, { token });
}

export async function deleteNotification(notificationId: string, token?: string) {
    return apiDelete<{ message: string }>(`/notifications/${notificationId}`, { token });
}

export async function deleteAllNotifications(token?: string) {
    return apiDelete<{ message: string }>("/notifications", { token });
}

export async function getNotification(notificationId: string, token?: string) {
    return apiFetch<{ data?: Notification; notification?: Notification }>(`/notifications/${notificationId}`, undefined, { cache: "no-store", token });
}

// ── Preferences ──

export async function getNotificationPreferences(token?: string) {
    return apiFetch<{ preferences: NotificationPreferences }>("/notifications/preferences", undefined, { cache: "no-store", token });
}

export async function batchUpdateNotificationPreferences(
    preferences: Array<{ category: string; channel: string; enabled: boolean }>,
    token?: string
) {
    return apiPut<{ preferences: NotificationPreferences }>("/notifications/preferences", { preferences }, { token });
}

export async function updateNotificationPreferences(prefs: Partial<NotificationPreferences>, token?: string) {
    return apiPatch<{ preferences: NotificationPreferences }>("/notifications/preferences", prefs, { token });
}

// ── Devices ──

export async function listDevices(token?: string) {
    return apiFetch<{ data?: PushDevice[]; devices?: PushDevice[] }>("/notifications/devices", undefined, { cache: "no-store", token });
}

export async function registerDevice(payload: RegisterDevicePayload, token?: string) {
    return apiPost<{ device: PushDevice }>("/notifications/devices", payload, { token });
}

export async function removeDevice(deviceId: string, token?: string) {
    return apiDelete<{ message: string }>(`/notifications/devices/${deviceId}`, { token });
}
