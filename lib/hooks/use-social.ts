"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as socialApi from "@/lib/api/social";
import type { Params } from "@/lib/types/api";

// ── Feed ──

export function useFeed(params?: Params, enabled = true) {
    return useQuery({
        queryKey: ["social", "feed", params],
        queryFn: () => socialApi.getFeed(params),
        enabled,
    });
}

export function useFeedDiscover(params?: Params, enabled = true) {
    return useQuery({
        queryKey: ["social", "feed-discover", params],
        queryFn: () => socialApi.getFeedDiscover(params),
        enabled,
    });
}

// ── Friends ──

export function useFriends(token?: string) {
    return useQuery({
        queryKey: ["social", "friends"],
        queryFn: () => socialApi.getFriends(undefined, token),
    });
}

export function useFriendRequests(params?: Params, token?: string) {
    return useQuery({
        queryKey: ["social", "friend-requests", params],
        queryFn: () => socialApi.getFriendRequests(params, token),
    });
}

export function useSendFriendRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => socialApi.sendFriendRequest(userId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["social", "friend-requests"] }),
    });
}

// ── User Profiles ──

export function useUserProfile(username: string) {
    return useQuery({
        queryKey: ["social", "user", username],
        queryFn: () => socialApi.getUserProfile(username),
        enabled: !!username,
    });
}

export function useUserActivity(username: string, params?: Params) {
    return useQuery({
        queryKey: ["social", "user", username, "activity", params],
        queryFn: () => socialApi.getUserActivity(username, params),
        enabled: !!username,
    });
}

export function useUserBadges(username: string) {
    return useQuery({
        queryKey: ["social", "user", username, "badges"],
        queryFn: () => socialApi.getUserBadges(username),
        enabled: !!username,
    });
}

export function useUserDecks(username: string) {
    return useQuery({
        queryKey: ["social", "user", username, "decks"],
        queryFn: () => socialApi.getUserDecks(username),
        enabled: !!username,
    });
}

export function useUserCollection(username: string) {
    return useQuery({
        queryKey: ["social", "user", username, "collection"],
        queryFn: () => socialApi.getUserCollection(username),
        enabled: !!username,
    });
}

// ── Decks ──

export function useBrowseDecks(params?: Params) {
    return useQuery({
        queryKey: ["social", "decks", params],
        queryFn: () => socialApi.browseDecks(params),
    });
}

export function useDeck(deckId: string) {
    return useQuery({
        queryKey: ["social", "decks", deckId],
        queryFn: () => socialApi.getDeck(deckId),
        enabled: !!deckId,
    });
}

export function useLikeDeck() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ deckId, like }: { deckId: string; like: boolean }) =>
            like ? socialApi.likeDeck(deckId) : socialApi.unlikeDeck(deckId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["social", "decks"] }),
    });
}

// ── Follow ──

export function useFollowUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, follow }: { userId: string; follow: boolean }) =>
            follow ? socialApi.followUser(userId) : socialApi.unfollowUser(userId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["social"] }),
    });
}

export function useBlockUser() {
    return useMutation({
        mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
            socialApi.blockUser(userId, reason),
    });
}
