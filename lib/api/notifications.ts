import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import type { Params } from "@/lib/types/api";
import type { RegisterDevicePayload, NotificationPreferences } from "@/lib/types/notification";

// ── List / Read / Delete ──

export async function getNotifications(params?: Params, token?: string) {
    return apiFetch<any>("/notifications", params, { cache: "no-store", token });
}

export async function getUnreadNotificationCount(token?: string) {
    return apiFetch<any>("/notifications/unread-count", undefined, { cache: "no-store", token });
}

export async function markNotificationRead(notificationId: string, token?: string) {
    return apiPost<any>(`/notifications/${notificationId}/read`, {}, { token });
}

export async function markAllNotificationsRead(token?: string) {
    return apiPost<any>("/notifications/read-all", {}, { token });
}

export async function deleteNotification(notificationId: string, token?: string) {
    return apiDelete<any>(`/notifications/${notificationId}`, { token });
}

export async function deleteAllNotifications(token?: string) {
    return apiDelete<any>("/notifications", { token });
}

// ── Preferences ──

export async function getNotificationPreferences(token?: string) {
    return apiFetch<any>("/notifications/preferences", undefined, { cache: "no-store", token });
}

export async function updateNotificationPreferences(prefs: Partial<NotificationPreferences>, token?: string) {
    return apiPatch<any>("/notifications/preferences", prefs, { token });
}

// ── Devices ──

export async function listDevices(token?: string) {
    return apiFetch<any>("/notifications/devices", undefined, { cache: "no-store", token });
}

export async function registerDevice(payload: RegisterDevicePayload, token?: string) {
    return apiPost<any>("/notifications/devices", payload, { token });
}

export async function removeDevice(deviceId: string, token?: string) {
    return apiDelete<any>(`/notifications/devices/${deviceId}`, { token });
}
