import { apiFetch, apiPost, apiPatch, apiPut, apiDelete } from "./client";
import type { Params } from "@/lib/types/api";
import type {
    RegisterDevicePayload, NotificationPreferences,
    NotificationsResponse, UnreadCountResponse, Notification, PushDevice,
} from "@/lib/types/notification";

// ── List / Read / Delete ──

export async function getNotifications(params?: Params, token?: string) {
    const res = await apiFetch<any>("/notifications", params, { cache: "no-store", token });
    // Backend returns { success, data: [...], meta: {...} }
    const data = res?.data ?? res;
    const items: Notification[] = Array.isArray(data) ? data : [];
    return { notifications: items, meta: res?.meta } as NotificationsResponse;
}

export async function getUnreadNotificationCount(token?: string) {
    const res = await apiFetch<any>("/notifications/unread-count", undefined, { cache: "no-store", token });
    // Backend returns { success, data: { total: N, by_category: {...} } }
    const data = res?.data ?? res;
    return { total: data?.total ?? 0, by_category: data?.by_category } as UnreadCountResponse;
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

/**
 * Batch delete notifications.
 * Spec requires a body: { notification_ids?: number[], all_read?: boolean }.
 * Pass notificationIds to delete specific ones, or allRead=true to delete all read.
 */
export async function batchDeleteNotifications(
    payload: { notification_ids?: number[]; all_read?: boolean },
    token?: string
) {
    const { getAuthHeaders } = await import("./client");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.rankeao.cl/api/v1";
    const headers: Record<string, string> = { "Content-Type": "application/json", ...getAuthHeaders() };
    if (token) {
        const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        headers.Authorization = `Bearer ${cleanToken}`;
    }
    const res = await fetch(`${baseUrl}/notifications`, {
        method: "DELETE",
        headers,
        body: JSON.stringify(payload),
        cache: "no-store",
    });
    if (!res.ok) {
        const { showErrorToast } = await import("./client");
        const { ApiError, parseErrorResponse } = await import("./errors");
        const { code, message } = await parseErrorResponse(res);
        const error = new ApiError(code, message, res.status);
        showErrorToast(error);
        throw error;
    }
    if (res.status === 204) return {} as { deleted: number };
    return res.json();
}

/** @deprecated Use batchDeleteNotifications({ all_read: true }) instead. */
export async function deleteAllNotifications(token?: string) {
    return batchDeleteNotifications({ all_read: true }, token);
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
