import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import type { Params, PaginationMeta, ApiResponse, ApiMessage } from "@/lib/types/api";
import type {
    UserProfile, FriendRequest, Activity, Deck, CollectionItem, WishlistItem,
    FeedResponse, FeedPost, FollowedTenant, UserSearchResult,
} from "@/lib/types/social";

// ── Feed ──

export async function getFeed(params?: Params) {
    return apiFetch<FeedResponse>("/social/feed", params);
}

export async function getFeedDiscover(params?: Params) {
    return apiFetch<FeedResponse>("/social/feed/discover", params);
}

// ── Posts ──

export async function createPost(payload: { content: string; image_url?: string }, token?: string) {
    return apiPost<ApiResponse<{ post: FeedPost }>>("/social/feed/posts", payload, { token });
}

export async function deletePost(postId: number, token?: string) {
    return apiDelete<ApiResponse<ApiMessage>>(`/social/feed/posts/${postId}`, { token });
}

// ── Friends ──

export async function getFriends(params?: Params, token?: string) {
    return apiFetch<{ data?: UserProfile[]; friends?: UserProfile[]; meta?: PaginationMeta }>("/social/friends", params, { token });
}

export async function sendFriendRequest(userId: string, token?: string) {
    return apiPost<{ friend_request: FriendRequest }>("/social/friends/request", { user_id: userId }, { token });
}

export async function acceptFriendRequest(requestId: string, token?: string) {
    return apiPost<{ friend_request: FriendRequest }>(`/social/friends/request/${requestId}/accept`, {}, { token });
}

export async function rejectFriendRequest(requestId: string, token?: string) {
    return apiPost<{ friend_request: FriendRequest }>(`/social/friends/request/${requestId}/reject`, {}, { token });
}

export async function getFriendRequests(params?: Params, token?: string) {
    return apiFetch<{ data?: FriendRequest[]; requests?: FriendRequest[]; meta?: PaginationMeta }>("/social/friends/requests", params, { token });
}

export async function removeFriend(userId: string, token?: string) {
    return apiDelete<{ message: string }>(`/social/friends/${userId}`, { token });
}

// ── Users ──

export async function searchUsers(params?: Params, token?: string) {
    return apiFetch<{ data?: UserSearchResult[]; users?: UserSearchResult[]; meta?: PaginationMeta }>("/social/users/search", params, { token });
}

export async function autocompleteUsers(q: string, token?: string) {
    return apiFetch<{ data?: UserSearchResult[]; users?: UserSearchResult[] }>("/social/users/autocomplete", { q }, { token });
}

export async function getUserProfile(username: string) {
    return apiFetch<{ data?: UserProfile; user?: UserProfile }>(`/social/users/${encodeURIComponent(username)}`, undefined, { revalidate: 30 });
}

export async function getUserActivity(username: string, params?: Params) {
    return apiFetch<{ data?: Activity[]; activities?: Activity[]; meta?: PaginationMeta }>(`/social/users/${encodeURIComponent(username)}/activity`, params);
}

export async function getUserBadges(username: string) {
    return apiFetch<{ data?: Record<string, unknown>[]; badges?: Record<string, unknown>[] }>(`/social/users/${encodeURIComponent(username)}/badges`);
}

export async function getUserFriends(username: string, params?: Params) {
    return apiFetch<{ data?: UserProfile[]; friends?: UserProfile[]; meta?: PaginationMeta }>(`/social/users/${encodeURIComponent(username)}/friends`, params);
}

export async function getUserFollowers(username: string, params?: Params) {
    return apiFetch<{ data?: UserProfile[]; followers?: UserProfile[]; meta?: PaginationMeta }>(`/social/users/${encodeURIComponent(username)}/followers`, params);
}

export async function getUserFollowing(username: string, params?: Params) {
    return apiFetch<{ data?: UserProfile[]; following?: UserProfile[]; meta?: PaginationMeta }>(`/social/users/${encodeURIComponent(username)}/following`, params);
}

export async function getUserDecks(username: string, params?: Params) {
    return apiFetch<{ data?: Deck[]; decks?: Deck[]; meta?: PaginationMeta }>(`/social/users/${encodeURIComponent(username)}/decks`, params);
}

export async function getUserCollection(username: string, params?: Params) {
    return apiFetch<{ data?: CollectionItem[]; items?: CollectionItem[]; meta?: PaginationMeta }>(`/social/users/${encodeURIComponent(username)}/collection`, params);
}

export async function getUserWishlist(username: string) {
    return apiFetch<{ data?: WishlistItem[]; items?: WishlistItem[] }>(`/social/users/${encodeURIComponent(username)}/wishlist`);
}

export async function getUserRatingHistory(username: string) {
    return apiFetch<{ data?: Record<string, unknown>[]; history?: Record<string, unknown>[] }>(`/social/users/${encodeURIComponent(username)}/rating-history`);
}

/**
 * NOTE: /social/users/me is not in the public OpenAPI spec.
 * This may be an internal/undocumented endpoint. Keep for backward compatibility.
 */
export async function getProfile(token: string) {
    return apiFetch<{ data?: UserProfile; user?: UserProfile }>("/social/users/me", undefined, { token, cache: "no-store" });
}

export async function updateProfile(payload: {
    bio?: string;
    city?: string;
    country?: string;
    avatar_url?: string;
    banner_url?: string;
    display_name?: string;
    language?: string;
}, token?: string) {
    return apiPatch<{ user: UserProfile }>("/social/me/profile", payload, { token });
}

// ── Follow / Block ──

export async function followUser(userId: string, token?: string) {
    return apiPost<{ message: string }>(`/social/users/${userId}/follow`, {}, { token });
}

export async function unfollowUser(userId: string, token?: string) {
    return apiDelete<{ message: string }>(`/social/users/${userId}/follow`, { token });
}

export async function blockUser(userId: string, reason?: string, token?: string) {
    return apiPost<{ message: string }>(`/social/users/${userId}/block`, reason ? { reason } : {}, { token });
}

export async function unblockUser(userId: string, token?: string) {
    return apiDelete<{ message: string }>(`/social/users/${userId}/block`, { token });
}

export async function listBlocks(token?: string) {
    return apiFetch<{ data?: UserProfile[]; blocks?: UserProfile[] }>("/social/blocks", undefined, { cache: "no-store", token });
}

// ── Tenant Follow ──

export async function listFollowedTenants(token?: string) {
    return apiFetch<{ data?: FollowedTenant[]; tenants?: FollowedTenant[] }>("/social/tenants/following", undefined, { cache: "no-store", token });
}

export async function followTenant(tenantId: string, token?: string) {
    return apiPost<{ message: string }>(`/social/tenants/${tenantId}/follow`, {}, { token });
}

export async function unfollowTenant(tenantId: string, token?: string) {
    return apiDelete<{ message: string }>(`/social/tenants/${tenantId}/follow`, { token });
}

export async function updateTenantFollowPrefs(tenantId: string, notify: boolean, token?: string) {
    return apiPatch<{ message: string }>(`/social/tenants/${tenantId}/follow`, { notify }, { token });
}

// ── Decks ──

export async function browseDecks(params?: Params) {
    return apiFetch<{ data?: Deck[]; decks?: Deck[]; meta?: PaginationMeta }>("/social/decks", params);
}

export async function getDeck(deckId: string) {
    return apiFetch<{ data?: Deck; deck?: Deck }>(`/social/decks/${encodeURIComponent(deckId)}`);
}

export async function likeDeck(deckId: string, token?: string) {
    return apiPost<{ message: string }>(`/social/decks/${deckId}/like`, {}, { token });
}

export async function unlikeDeck(deckId: string, token?: string) {
    return apiDelete<{ message: string }>(`/social/decks/${deckId}/like`, { token });
}

// ── Collection ──

export async function addCollectionItem(payload: Record<string, unknown>, token?: string) {
    return apiPost<{ item: CollectionItem }>("/social/collection/items", payload, { token });
}

export async function updateCollectionItem(itemId: string, payload: Record<string, unknown>, token?: string) {
    return apiPatch<{ item: CollectionItem }>(`/social/collection/items/${itemId}`, payload, { token });
}

export async function removeCollectionItem(itemId: string, token?: string) {
    return apiDelete<{ message: string }>(`/social/collection/items/${itemId}`, { token });
}

// ── Wishlist ──

export async function addWishlistItem(payload: Record<string, unknown>, token?: string) {
    return apiPost<{ item: WishlistItem }>("/social/wishlist/items", payload, { token });
}

export async function removeWishlistItem(itemId: string, token?: string) {
    return apiDelete<{ message: string }>(`/social/wishlist/items/${itemId}`, { token });
}
