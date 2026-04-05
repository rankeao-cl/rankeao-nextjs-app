"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as socialApi from "@/lib/api/social";
import type { Params } from "@/lib/types/api";
import { ApiError } from "@/lib/api/errors";

// ── Feed ──

export function useFeed(params?: Params, enabled = true) {
    return useQuery({
        queryKey: ["social", "feed", params],
        queryFn: () => socialApi.getFeed(params),
        enabled,
        staleTime: 0,
    });
}

export function useFeedDiscover(params?: Params, enabled = true) {
    return useQuery({
        queryKey: ["social", "feed-discover", params],
        queryFn: () => socialApi.getFeedDiscover(params),
        enabled,
        staleTime: 0,
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

// ── Post Likes & Comments ──

export function useLikePost() {
    const qc = useQueryClient();
    return useMutation<{ liked: boolean; likes_count: number } | null, Error, { postId: string; like: boolean; token?: string }>({
        mutationFn: async ({ postId, like, token }) => {
            try {
                if (like) {
                    const res = await socialApi.likePost(postId, token);
                    return (res as { data?: { liked: boolean; likes_count: number } })?.data ?? null;
                } else {
                    const res = await socialApi.unlikePost(postId, token);
                    return (res as { data?: { liked: boolean; likes_count: number } })?.data ?? null;
                }
            } catch (err: unknown) {
                // 409 = already in the desired state — keep optimistic update, don't revert
                if (err instanceof ApiError && err.status === 409) return null;
                throw err;
            }
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["social", "feed"] }),
    });
}

export function useFirePost() {
    const qc = useQueryClient();
    return useMutation<{ fired: boolean; fires_count: number } | null, Error, { postId: string; fire: boolean; token?: string }>({
        mutationFn: async ({ postId, fire, token }) => {
            try {
                if (fire) {
                    const res = await socialApi.firePost(postId, token);
                    return (res as { data?: { fired: boolean; fires_count: number } })?.data ?? null;
                } else {
                    const res = await socialApi.unfirePost(postId, token);
                    return (res as { data?: { fired: boolean; fires_count: number } })?.data ?? null;
                }
            } catch (err: unknown) {
                // 409 = already in the desired state — keep optimistic update, don't revert
                if (err instanceof ApiError && err.status === 409) return null;
                throw err;
            }
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["social", "feed"] }),
    });
}

export function usePostComments(postId: string, enabled = false) {
    return useQuery({
        queryKey: ["social", "post", postId, "comments"],
        queryFn: () => socialApi.getPostComments(postId),
        enabled: enabled && !!postId,
    });
}

export function useAddComment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ postId, content, token, parentCommentId, replyToUsername }: { postId: string; content: string; token?: string; parentCommentId?: string; replyToUsername?: string }) =>
            socialApi.addPostComment(postId, content, token, parentCommentId, replyToUsername),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ["social", "post", vars.postId, "comments"] });
            qc.invalidateQueries({ queryKey: ["social", "feed"] });
        },
    });
}

export function useLikeComment() {
    const qc = useQueryClient();
    return useMutation<{ liked: boolean; likes_count: number } | null, Error, { commentId: string; like: boolean; token?: string }>({
        mutationFn: async ({ commentId, like, token }) => {
            try {
                if (like) {
                    const res = await socialApi.likeComment(commentId, token);
                    return (res as { data?: { liked: boolean; likes_count: number } })?.data ?? null;
                } else {
                    const res = await socialApi.unlikeComment(commentId, token);
                    return (res as { data?: { liked: boolean; likes_count: number } })?.data ?? null;
                }
            } catch (err: unknown) {
                if (err instanceof ApiError && err.status === 409) return null;
                throw err;
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["social", "post"] });
            qc.invalidateQueries({ queryKey: ["social", "feed"] });
        },
    });
}

// ── Bookmarks ──

export function useBookmark() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ entityType, entityId, bookmark, token }: { entityType: string; entityId: string; bookmark: boolean; token?: string }) => {
            if (bookmark) return socialApi.createBookmark(entityType, entityId, token);
            return socialApi.deleteBookmark(entityType, entityId, token);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["social", "bookmarks"] }),
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
