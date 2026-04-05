"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "@/lib/api/notifications";
import type { Params } from "@/lib/types/api";
import type { NotificationPreferences } from "@/lib/types/notification";

export function useNotifications(params?: Params, token?: string) {
    return useQuery({
        queryKey: ["notifications", params],
        queryFn: () => notificationsApi.getNotifications(params, token),
    });
}

export function useUnreadCount(token?: string) {
    return useQuery({
        queryKey: ["notifications", "unread-count"],
        queryFn: async () => {
            const res = await notificationsApi.getUnreadNotificationCount(token);
            return { total: res?.total ?? 0, by_category: res?.by_category };
        },
        refetchInterval: 30000, // Poll every 30s
    });
}

export function useMarkAllRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (token?: string) => notificationsApi.markAllNotificationsRead(token),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export function useNotificationPreferences(token?: string) {
    return useQuery({
        queryKey: ["notifications", "preferences"],
        queryFn: () => notificationsApi.getNotificationPreferences(token),
    });
}

export function useUpdateNotificationPreferences() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (prefs: Partial<NotificationPreferences>) => notificationsApi.updateNotificationPreferences(prefs),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "preferences"] }),
    });
}
