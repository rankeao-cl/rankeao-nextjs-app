import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import { ApiError } from "./errors";
import type { Params, PaginationMeta, ApiResponse, ApiMessage } from "@/lib/types/api";
import type {
    UserProfile, FriendRequest, Activity, Deck, CollectionItem, WishlistItem,
    FeedResponse, FeedPost, FollowedTenant, UserSearchResult, PostComment,
    AddCollectionItemPayload, UpdateCollectionItemPayload, AddWishlistItemPayload,
    Bookmark, UserBadge, RatingHistoryEntry, Story, StoryTrayGroup,
} from "@/lib/types/social";

// ── Feed ──

export async function getFeed(params?: Params) {
    return apiFetch<FeedResponse>("/social/feed", params);
}

export async function getFeedDiscover(params?: Params) {
    return apiFetch<FeedResponse>("/social/feed/discover", params);
}

// ── Posts ──

export async function listStories(token?: string) {
    return apiFetch<{ data?: { stories?: StoryTrayGroup[] }; stories?: StoryTrayGroup[] }>("/social/stories", undefined, { token, cache: "no-store" });
}

export async function createStory(payload: {
    image_url?: string;
    caption?: string;
    background_color?: string;
    text_color?: string;
    font_weight?: "normal" | "bold";
    font_style?: "normal" | "italic";
    text_x?: number;
    text_y?: number;
}, token?: string) {
    return apiPost<ApiResponse<{ story: Story }>>("/social/stories", payload, { token });
}

export async function markStoryViewed(storyId: string, token?: string) {
    return apiPost<{ viewed: boolean }>(`/social/stories/${encodeURIComponent(storyId)}/view`, {}, { token });
}

export async function createPost(payload: { content: string; image_url?: string }, token?: string) {
    return apiPost<ApiResponse<{ post: FeedPost }>>("/social/feed/posts", payload, { token });
}

export async function getPost(postId: string | number, params?: Params) {
    return apiFetch<{ data?: { post: FeedPost }; post?: FeedPost }>(`/social/feed/posts/${postId}`, params);
}

export async function deletePost(postId: number, token?: string) {
    return apiDelete<ApiResponse<ApiMessage>>(`/social/feed/posts/${postId}`, { token });
}

export async function likePost(postId: string | number, token?: string) {
    return apiPost<{ liked: boolean; likes_count: number }>(`/social/feed/posts/${postId}/like`, {}, { token });
}

export async function unlikePost(postId: string | number, token?: string) {
    return apiDelete<{ liked: boolean; likes_count: number }>(`/social/feed/posts/${postId}/like`, { token });
}

export async function firePost(postId: string | number, token?: string) {
    return apiPost<{ fired: boolean; fires_count: number }>(`/social/feed/posts/${postId}/fire`, {}, { token });
}

export async function unfirePost(postId: string | number, token?: string) {
    return apiDelete<{ fired: boolean; fires_count: number }>(`/social/feed/posts/${postId}/fire`, { token });
}

export type { PostComment };

export async function getPostComments(postId: string | number, params?: Params) {
    return apiFetch<{ data?: { comments: PostComment[] }; comments?: PostComment[]; meta?: PaginationMeta }>(`/social/feed/posts/${postId}/comments`, params);
}

export async function addPostComment(postId: string | number, content: string, token?: string, parentCommentId?: string, replyToUsername?: string) {
    const body: { content: string; parent_comment_id?: number; reply_to_username?: string } = { content };
    if (parentCommentId) body.parent_comment_id = Number(parentCommentId);
    if (replyToUsername) body.reply_to_username = replyToUsername;
    return apiPost<{ comment: PostComment }>(`/social/feed/posts/${postId}/comments`, body, { token });
}

export async function getCommentReplies(commentId: string | number, params?: Params) {
    return apiFetch<{ data?: { replies?: PostComment[]; comments?: PostComment[] }; replies?: PostComment[]; comments?: PostComment[]; meta?: PaginationMeta }>(`/social/feed/comments/${commentId}/replies`, params);
}

export async function likeComment(commentId: string | number, token?: string) {
    return apiPost<{ liked: boolean; likes_count: number }>(`/social/feed/comments/${commentId}/like`, {}, { token });
}

export async function unlikeComment(commentId: string | number, token?: string) {
    return apiDelete<{ liked: boolean; likes_count: number }>(`/social/feed/comments/${commentId}/like`, { token });
}

// ── Bookmarks ──

export async function createBookmark(entityType: string, entityId: string, token?: string) {
    return apiPost<{ bookmarked: boolean }>("/social/bookmarks", { entity_type: entityType, entity_id: entityId }, { token });
}

export async function deleteBookmark(entityType: string, entityId: string, token?: string) {
    return apiDelete<{ bookmarked: boolean }>(`/social/bookmarks/${entityType}/${entityId}`, { token });
}

export async function listBookmarks(entityType?: string, params?: Params, token?: string) {
    const p: Record<string, string> = { ...params as Record<string, string> };
    if (entityType) p.entity_type = entityType;
    return apiFetch<{ data?: { bookmarks: Bookmark[] }; bookmarks?: Bookmark[] }>("/social/bookmarks", p, { token });
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

type AutocompleteUsersResponse = {
    data?: UserSearchResult[] | { users?: UserSearchResult[] };
    users?: UserSearchResult[];
};

export function extractUserSearchResults(payload?: AutocompleteUsersResponse | UserSearchResult[] | null): UserSearchResult[] {
    if (Array.isArray(payload)) return payload;
    if (!payload) return [];
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && typeof payload.data === "object" && Array.isArray(payload.data.users)) {
        return payload.data.users;
    }
    if (Array.isArray(payload.users)) return payload.users;
    return [];
}

export async function autocompleteUsers(q: string, token?: string) {
    return apiFetch<AutocompleteUsersResponse>("/social/users/autocomplete", { q }, { token, cache: "no-store" });
}

export async function getUserProfile(username: string) {
    return apiFetch<{ data?: UserProfile; user?: UserProfile }>(`/social/users/${encodeURIComponent(username)}`, undefined, { revalidate: 30 });
}

export async function getUserActivity(username: string, params?: Params) {
    return apiFetch<{ data?: Activity[] | { activity?: Activity[] }; activity?: Activity[]; activities?: Activity[]; meta?: PaginationMeta }>(`/social/users/${encodeURIComponent(username)}/activity`, params);
}

export async function getUserBadges(username: string) {
    return apiFetch<{ data?: UserBadge[]; badges?: UserBadge[] }>(`/social/users/${encodeURIComponent(username)}/badges`);
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
    return apiFetch<{ data?: RatingHistoryEntry[]; history?: RatingHistoryEntry[] }>(`/social/users/${encodeURIComponent(username)}/rating-history`);
}

/**
 * Resolves current user profile via the supported /social/users/:username endpoint.
 * The backend does not expose /social/users/me.
 */
function extractUsernameFromToken(token: string): string | undefined {
    const clean = token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
    const parts = clean.split(".");
    if (parts.length !== 3) return undefined;

    try {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = typeof globalThis.atob === "function"
            ? globalThis.atob(base64)
            : Buffer.from(base64, "base64").toString("utf-8");
        const payload = JSON.parse(json) as Record<string, unknown>;

        const candidates = [payload.username, payload.usr, payload.name, payload.sub];
        for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate.trim().length > 0) {
                return candidate.trim();
            }
        }
        return undefined;
    } catch {
        return undefined;
    }
}

export async function getProfile(token: string) {
    const username = extractUsernameFromToken(token);
    if (!username) {
        throw new ApiError("INVALID_TOKEN", "No se pudo resolver el usuario desde el token de sesion", 401);
    }
    return apiFetch<{ data?: UserProfile; user?: UserProfile }>(
        `/social/users/${encodeURIComponent(username)}`,
        undefined,
        { token, cache: "no-store" },
    );
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

export async function addCollectionItem(payload: AddCollectionItemPayload, token?: string) {
    return apiPost<{ item: CollectionItem }>("/social/collection/items", payload, { token });
}

export async function updateCollectionItem(itemId: string, payload: UpdateCollectionItemPayload, token?: string) {
    return apiPatch<{ item: CollectionItem }>(`/social/collection/items/${itemId}`, payload, { token });
}

export async function removeCollectionItem(itemId: string, token?: string) {
    return apiDelete<{ message: string }>(`/social/collection/items/${itemId}`, { token });
}

// ── Wishlist ──

export async function addWishlistItem(payload: AddWishlistItemPayload, token?: string) {
    return apiPost<{ item: WishlistItem }>("/social/wishlist/items", payload, { token });
}

export async function removeWishlistItem(itemId: string, token?: string) {
    return apiDelete<{ message: string }>(`/social/wishlist/items/${itemId}`, { token });
}
