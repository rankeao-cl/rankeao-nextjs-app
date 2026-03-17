import { apiFetch, apiPost, apiPatch, apiPut, apiDelete } from "./client";
import type { Params } from "@/lib/types/api";

// ── Feed ──

export async function getFeed(params?: Params) {
    return apiFetch<any>("/social/feed", params);
}

export async function getFeedDiscover(params?: Params) {
    return apiFetch<any>("/social/feed/discover", params);
}

// ── Friends ──

export async function getFriends(params?: Params, token?: string) {
    return apiFetch<any>("/social/friends", params, { token });
}

export async function sendFriendRequest(userId: string, token?: string) {
    return apiPost<any>("/social/friends/request", { user_id: userId }, { token });
}

export async function acceptFriendRequest(requestId: string, token?: string) {
    return apiPost<any>(`/social/friends/request/${requestId}/accept`, {}, { token });
}

export async function rejectFriendRequest(requestId: string, token?: string) {
    return apiPost<any>(`/social/friends/request/${requestId}/reject`, {}, { token });
}

export async function getFriendRequests(params?: Params, token?: string) {
    return apiFetch<any>("/social/friends/requests", params, { token });
}

export async function removeFriend(userId: string, token?: string) {
    return apiDelete<any>(`/social/friends/${userId}`, { token });
}

// ── Users ──

export async function searchUsers(params?: Params, token?: string) {
    return apiFetch<any>("/social/users/search", params, { token });
}

export async function autocompleteUsers(q: string, token?: string) {
    return apiFetch<any>("/social/users/autocomplete", { q }, { token });
}

export async function getUserProfile(username: string) {
    return apiFetch<any>(`/social/users/${encodeURIComponent(username)}`, undefined, { revalidate: 30 });
}

export async function getUserActivity(username: string, params?: Params) {
    return apiFetch<any>(`/social/users/${encodeURIComponent(username)}/activity`, params);
}

export async function getUserBadges(username: string) {
    return apiFetch<any>(`/social/users/${encodeURIComponent(username)}/badges`);
}

export async function getUserFriends(username: string, params?: Params) {
    return apiFetch<any>(`/social/users/${encodeURIComponent(username)}/friends`, params);
}

export async function getUserFollowers(username: string, params?: Params) {
    return apiFetch<any>(`/social/users/${encodeURIComponent(username)}/followers`, params);
}

export async function getUserFollowing(username: string, params?: Params) {
    return apiFetch<any>(`/social/users/${encodeURIComponent(username)}/following`, params);
}

export async function getUserDecks(username: string, params?: Params) {
    return apiFetch<any>(`/social/users/${encodeURIComponent(username)}/decks`, params);
}

export async function getUserCollection(username: string, params?: Params) {
    return apiFetch<any>(`/social/users/${encodeURIComponent(username)}/collection`, params);
}

export async function getUserWishlist(username: string) {
    return apiFetch<any>(`/social/users/${encodeURIComponent(username)}/wishlist`);
}

export async function getUserRatingHistory(username: string) {
    return apiFetch<any>(`/social/users/${encodeURIComponent(username)}/rating-history`);
}

export async function getProfile(token: string) {
    return apiFetch<any>("/social/users/me", undefined, { token, cache: "no-store" });
}

export async function updateProfile(payload: {
    bio?: string;
    city?: string;
    country?: string;
    avatar_url?: string;
    banner_url?: string;
    display_name?: string;
}, token?: string) {
    return apiPatch<any>("/social/users/me", payload, { token });
}

// ── Follow / Block ──

export async function followUser(userId: string, token?: string) {
    return apiPost<any>(`/social/users/${userId}/follow`, {}, { token });
}

export async function unfollowUser(userId: string, token?: string) {
    return apiDelete<any>(`/social/users/${userId}/follow`, { token });
}

export async function blockUser(userId: string, reason?: string, token?: string) {
    return apiPost<any>(`/social/users/${userId}/block`, reason ? { reason } : {}, { token });
}

export async function unblockUser(userId: string, token?: string) {
    return apiDelete<any>(`/social/users/${userId}/block`, { token });
}

// ── Tenant Follow ──

export async function listFollowedTenants(token?: string) {
    return apiFetch<any>("/social/tenants/following", undefined, { cache: "no-store", token });
}

export async function followTenant(tenantId: string, token?: string) {
    return apiPost<any>(`/social/tenants/${tenantId}/follow`, {}, { token });
}

export async function unfollowTenant(tenantId: string, token?: string) {
    return apiDelete<any>(`/social/tenants/${tenantId}/follow`, { token });
}

export async function updateTenantFollowPrefs(tenantId: string, notify: boolean, token?: string) {
    return apiPatch<any>(`/social/tenants/${tenantId}/follow`, { notify }, { token });
}

// ── Decks ──

export async function browseDecks(params?: Params) {
    return apiFetch<any>("/social/decks", params);
}

export async function getDeck(deckId: string) {
    return apiFetch<any>(`/social/decks/${encodeURIComponent(deckId)}`);
}

export async function likeDeck(deckId: string, token?: string) {
    return apiPost<any>(`/social/decks/${deckId}/like`, {}, { token });
}

export async function unlikeDeck(deckId: string, token?: string) {
    return apiDelete<any>(`/social/decks/${deckId}/like`, { token });
}

// ── Collection ──

export async function addCollectionItem(payload: any, token?: string) {
    return apiPost<any>("/social/collection/items", payload, { token });
}

export async function updateCollectionItem(itemId: string, payload: any, token?: string) {
    return apiPatch<any>(`/social/collection/items/${itemId}`, payload, { token });
}

export async function removeCollectionItem(itemId: string, token?: string) {
    return apiDelete<any>(`/social/collection/items/${itemId}`, { token });
}

// ── Wishlist ──

export async function addWishlistItem(payload: any, token?: string) {
    return apiPost<any>("/social/wishlist/items", payload, { token });
}

export async function removeWishlistItem(itemId: string, token?: string) {
    return apiDelete<any>(`/social/wishlist/items/${itemId}`, { token });
}
