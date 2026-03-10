"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "@/lib/api/notifications";
import type { Params } from "@/lib/types/api";

export function useNotifications(params?: Params, token?: string) {
    return useQuery({
        queryKey: ["notifications", params],
        queryFn: () => notificationsApi.getNotifications(params, token),
    });
}

export function useUnreadCount(token?: string) {
    return useQuery({
        queryKey: ["notifications", "unread-count"],
        queryFn: () => notificationsApi.getUnreadNotificationCount(token),
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
        mutationFn: (prefs: Record<string, boolean>) => notificationsApi.updateNotificationPreferences(prefs as any),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "preferences"] }),
    });
}
