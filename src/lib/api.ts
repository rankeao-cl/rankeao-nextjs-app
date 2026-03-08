import { toast } from "@heroui/react";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://rankeao-go-gateway-production.up.railway.app/api/v1"
).replace(/\/+$/, "");

function showErrorToast(errMessage: string) {
  if (typeof window !== "undefined") {
    toast.danger("Error", { description: errMessage });
  }
}

interface FetchOptions {
  revalidate?: number | false;
  cache?: RequestCache;
  token?: string;
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const rawSession = localStorage.getItem("rankeao.auth.session");
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      const token = parsed.accessToken || parsed.token;
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    }
  } catch (error) {
    // ignore
  }
  return {};
}

async function apiFetch<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  options: FetchOptions = {}
): Promise<T> {
  const { revalidate = 60, cache, token } = options;
  const url = new URL(`${BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = { ...getAuthHeaders() };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
    headers,
  };
  if (cache) {
    fetchOptions.cache = cache;
  } else if (revalidate !== undefined && revalidate !== false) {
    fetchOptions.next = { revalidate };
  }

  const res = await fetch(url.toString(), fetchOptions);

  if (!res.ok) {
    console.error(`apiFetch ERROR ${res.status} to ${url.toString()} with token:`, token?.substring(0, 10) + "...");
    let message = `API error: ${res.status} ${res.statusText}`;
    try {
      const errorPayload = await res.json();
      if (typeof errorPayload === "object" && errorPayload !== null) {
        if (typeof errorPayload.message === "string") {
          message = errorPayload.message;
        } else if (typeof errorPayload.error === "string") {
          message = errorPayload.error;
        } else {
          message = JSON.stringify(errorPayload);
        }
      }
    } catch { }
    showErrorToast(message);
    throw new Error(message);
  }

  return res.json();
}

async function apiPost<T>(
  endpoint: string,
  body: unknown,
  options?: { token?: string }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`apiPost ERROR ${res.status} to ${endpoint} with token:`, options?.token?.substring(0, 10) + "...");
    let message = `API error: ${res.status} ${res.statusText}`;

    try {
      const errorPayload = await res.json();
      if (errorPayload && typeof errorPayload === "object") {
        if (typeof errorPayload.message === "string") {
          message = errorPayload.message;
        } else if (typeof errorPayload.error === "string") {
          message = errorPayload.error;
        } else {
          message = JSON.stringify(errorPayload);
        }
      }
    } catch { }

    showErrorToast(message);
    throw new Error(message);
  }

  return res.json();
}

// ---- Auth ----
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface RefreshPayload {
  refresh_token: string;
}

export async function loginAuth(payload: LoginPayload): Promise<unknown> {
  return apiPost<unknown>("/auth/login", payload);
}

export async function registerAuth(payload: RegisterPayload): Promise<unknown> {
  return apiPost<unknown>("/auth/register", {
    ...payload,
    name: payload.username,
  });
}

export async function refreshAuth(payload: RefreshPayload): Promise<unknown> {
  return apiPost<unknown>("/auth/refresh", payload);
}

export async function forgotPassword(email: string): Promise<unknown> {
  return apiPost<unknown>("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, new_password: string): Promise<unknown> {
  return apiPost<unknown>("/auth/reset-password", { token, new_password });
}

export async function verifyEmail(token: string): Promise<unknown> {
  return apiPost<unknown>("/auth/verify-email", { token });
}

// ---- Social (Friends, Feed, Users, Me) ----
export async function getFeed(params?: Record<string, any>) {
  return apiFetch<any>("/social/feed", params);
}
export async function getFeedDiscover(params?: Record<string, any>) {
  return apiFetch<any>("/social/feed/discover", params);
}

// Friends
export async function getFriends(params?: Record<string, any>, token?: string) {
  return apiFetch<any>("/social/friends", params, { token });
}
export async function sendFriendRequest(userId: string, token?: string) {
  return apiPost<any>("/social/friends/request", { target_user_id: userId }, { token });
}
export async function acceptFriendRequest(requestId: string, token?: string) {
  return apiPost<any>(`/social/friends/request/${requestId}/accept`, {}, { token });
}
export async function rejectFriendRequest(requestId: string, token?: string) {
  return apiPost<any>(`/social/friends/request/${requestId}/reject`, {}, { token });
}
export async function getFriendRequests(params?: Record<string, any>, token?: string) {
  return apiFetch<any>("/social/friends/requests", params, { token });
}
export async function removeFriend(userId: string, token?: string) {
  return apiFetch<any>(`/social/friends/${userId}`, undefined, { revalidate: false, token }); // Needs DELETE or custom fetch if purely DELETE
}

// Social ME Stats
export async function getMyCosmetics(token?: string) {
  return apiFetch<any>("/social/me/cosmetics", undefined, { cache: "no-store", token });
}
export async function getMyEquipped(token?: string) {
  return apiFetch<any>("/social/me/equipped", undefined, { cache: "no-store", token });
}
export async function getMyTitles(token?: string) {
  return apiFetch<any>("/social/me/titles", undefined, { cache: "no-store", token });
}
export async function getMyXp(token?: string) {
  return apiFetch<any>("/social/me/xp", undefined, { cache: "no-store", token });
}

// Users
export async function searchUsers(params?: Record<string, any>, token?: string) {
  return apiFetch<any>("/social/users/search", params, { token });
}
export async function getUserProfile(username: string) {
  return apiFetch<any>(`/social/users/${encodeURIComponent(username)}`, undefined, { revalidate: 30 });
}
export async function getUserActivity(username: string, params?: Record<string, any>) {
  return apiFetch<any>(`/social/users/${encodeURIComponent(username)}/activity`, params);
}
export async function getUserBadges(username: string) {
  return apiFetch<any>(`/social/users/${encodeURIComponent(username)}/badges`);
}
export async function getUserFriends(username: string, params?: Record<string, any>) {
  return apiFetch<any>(`/social/users/${encodeURIComponent(username)}/friends`, params);
}

export async function getProfile(token: string) {
  const res = await fetch("/api/v1/users/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo cargar el perfil");
  return res.json();
}


// ---- Tournaments ----
export interface Tournament {
  id: string;
  name: string;
  status: string;
  game: string;
  format: string;
  city?: string;
  country?: string;
  is_ranked?: boolean;
  max_players?: number;
  current_round?: number;
  starts_at?: string;
  created_at?: string;
  description?: string;
  prize_pool?: string;
  registered_count?: number;
  tenant_name?: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface TournamentListResponse {
  tournaments: Tournament[];
  meta: PaginationMeta;
}

export interface TournamentFilters {
  status?: string;
  game?: string;
  format?: string;
  city?: string;
  is_ranked?: boolean;
  q?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export async function getTournaments(
  filters: TournamentFilters = {}
): Promise<TournamentListResponse> {
  return apiFetch<TournamentListResponse>(
    "/tournaments",
    filters as Record<string, string | number | boolean | undefined>,
    { revalidate: 30 }
  );
}

export async function getTournament(id: string) {
  return apiFetch<{ tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}`);
}

// ---- Gamification / XP Leaderboard ----
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  total_xp?: number;
  level?: number;
  rating?: number;
  games_played?: number;
  wins?: number;
  losses?: number;
}

export interface XpLeaderboardResponse {
  leaderboard?: LeaderboardEntry[];
  entries?: LeaderboardEntry[];
  meta?: PaginationMeta;
}

export async function getXpLeaderboard(params?: {
  period?: string;
  page?: number;
  per_page?: number;
}): Promise<XpLeaderboardResponse> {
  return apiFetch<XpLeaderboardResponse>(
    "/gamification/leaderboard/xp",
    params as Record<string, string | number | boolean | undefined>,
    { revalidate: 60 }
  );
}

// ---- Rating Leaderboard ----
export interface RatingLeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  meta?: PaginationMeta;
}

export async function getRatingLeaderboard(params: {
  game: string;
  format: string;
  page?: number;
  per_page?: number;
}): Promise<RatingLeaderboardResponse> {
  return apiFetch<RatingLeaderboardResponse>(
    "/tournaments/leaderboard",
    params as Record<string, string | number | boolean | undefined>,
    { revalidate: 60 }
  );
}

// ---- Catalog / Games ----
export interface CatalogGame {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logo_url?: string;
  is_active?: boolean;
  formats?: CatalogFormat[];
}

export interface CatalogFormat {
  id: string;
  slug: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface GamesResponse {
  success?: boolean;
  data?: CatalogGame[];
  games?: CatalogGame[];
}

export async function getGames(): Promise<GamesResponse> {
  return apiFetch<GamesResponse>("/catalog/games", undefined, { revalidate: 300 });
}

export async function getGameDetail(slug: string) {
  return apiFetch<{ success?: boolean; data?: CatalogGame }>(
    `/catalog/games/${encodeURIComponent(slug)}`
  );
}

export async function getGameFormats(slug: string) {
  return apiFetch<{ formats?: CatalogFormat[]; data?: CatalogFormat[] }>(
    `/catalog/games/${encodeURIComponent(slug)}/formats`
  );
}

// ---- Badges ----
export interface Badge {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  icon_url?: string;
  rarity?: string;
  category?: string;
  earner_count?: number;
}

export interface BadgesResponse {
  badges: Badge[];
  meta?: PaginationMeta;
}

export async function getBadges(params?: {
  sort?: string;
  per_page?: number;
  category?: string;
  rarity?: string;
}): Promise<BadgesResponse> {
  return apiFetch<BadgesResponse>(
    "/gamification/badges",
    params as Record<string, string | number | boolean | undefined>,
    { revalidate: 120 }
  );
}

// ---- Marketplace Listings ----
export interface Listing {
  id: string;
  title: string;
  price?: number;
  card_condition?: string;
  card_language?: string;
  is_foil?: boolean;
  game_id?: string;
  game_name?: string;
  seller_username?: string;
  seller_id?: string;
  tenant_name?: string;
  city?: string;
  region?: string;
  images?: { url: string; thumbnail_url?: string; alt_text?: string }[];
  status?: string;
  created_at?: string;
  card_name?: string;
}

export interface ListingsResponse {
  listings: Listing[];
  meta?: PaginationMeta;
  facets?: Record<string, unknown>;
}

export interface ListingFilters {
  q?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  sort?: string;
  page?: number;
  per_page?: number;
}

export async function getListings(
  filters: ListingFilters = {}
): Promise<ListingsResponse> {
  return apiFetch<ListingsResponse>(
    "/marketplace/listings",
    filters as Record<string, string | number | boolean | undefined>,
    { cache: "no-store" }
  );
}

// ---- Store Products ----
export interface Product {
  id: string;
  name?: string;
  title?: string;
  price?: number;
  card_condition?: string;
  is_foil?: boolean;
  game_name?: string;
  tenant_name?: string;
  tenant_slug?: string;
  images?: { url: string; thumbnail_url?: string }[];
  city?: string;
  category?: string;
  stock?: number;
  created_at?: string;
}

export interface ProductsResponse {
  products: Product[];
  meta?: PaginationMeta;
  facets?: Record<string, unknown>;
}

export async function getProducts(params?: Record<string, string | number | boolean | undefined>): Promise<ProductsResponse> {
  return apiFetch<ProductsResponse>(
    "/store/products",
    params,
    { revalidate: 30 }
  );
}

// ---- Notifications ----
export async function getNotifications(params?: Record<string, any>) {
  return apiFetch<any>("/notifications", params, { cache: "no-store" });
}
export async function getUnreadNotificationCount() {
  return apiFetch<any>("/notifications/unread-count", undefined, { cache: "no-store" });
}
export async function markAllNotificationsRead() {
  return apiPost<any>("/notifications/read-all", {});
}

// ---- Cart & Checkout ----
export async function getCart(tenantSlug: string) {
  return apiFetch<any>(`/store/${encodeURIComponent(tenantSlug)}/cart`, undefined, { cache: "no-store" });
}
export async function addCartItem(tenantSlug: string, productId: string, quantity: number = 1) {
  return apiPost<any>(`/store/${encodeURIComponent(tenantSlug)}/cart/items`, { product_id: productId, quantity });
}
export async function removeCartItem(tenantSlug: string, itemId: string) {
  return apiFetch<any>(`/store/${encodeURIComponent(tenantSlug)}/cart/items/${itemId}`, undefined, { revalidate: false }); // Needs DELETE mapping if strictly strictly delete
}
export async function createCheckout(tenantSlug: string, payload: Record<string, any>) {
  return apiPost<any>(`/store/${encodeURIComponent(tenantSlug)}/checkout`, payload);
}
export async function payCheckout(checkoutId: string, payload: Record<string, any>) {
  return apiPost<any>(`/store/checkouts/${encodeURIComponent(checkoutId)}/pay`, payload);
}

// ---- Orders ----
export async function getMyOrders(params?: Record<string, any>) {
  return apiFetch<any>("/store/orders", params, { cache: "no-store" });
}
export async function getOrder(orderId: string) {
  return apiFetch<any>(`/store/orders/${encodeURIComponent(orderId)}`, undefined, { cache: "no-store" });
}

// ---- Tenants ----
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status?: string;
  city?: string;
  region?: string;
  country?: string;
  logo_url?: string;
  is_public?: boolean;
  description?: string;
  banner_url?: string;
  rating?: number;
  review_count?: number;
  social_links?: { platform: string; url: string }[];
  created_at?: string;
}

export interface TenantsResponse {
  tenants: Tenant[];
  meta?: PaginationMeta;
}

export interface TenantFilters {
  q?: string;
  city?: string;
  region?: string;
  min_rating?: number;
  sort?: string;
  page?: number;
  per_page?: number;
}

export async function getTenants(
  filters: TenantFilters = {}
): Promise<TenantsResponse> {
  return apiFetch<TenantsResponse>(
    "/tenants",
    filters as Record<string, string | number | boolean | undefined>,
    { revalidate: 60 }
  );
}

// ---- Seasons ----
export interface Season {
  id: string;
  slug: string;
  name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

export async function getSeasons() {
  return apiFetch<{ seasons: Season[]; current?: Season }>(
    "/tournaments/seasons",
    undefined,
    { revalidate: 300 }
  );
}

// ---- Clans ----
export async function getClans(params?: Record<string, any>) {
  return apiFetch<any>("/social/clans", params, { revalidate: 60 });
}
export async function getClan(clanId: string) {
  return apiFetch<any>(`/social/clans/${encodeURIComponent(clanId)}`, undefined, { revalidate: 30 });
}

// ---- Tournament Matches & Disputes ----
export async function getTournamentMatches(tournamentId: string, params?: Record<string, any>) {
  return apiFetch<any>(`/tournaments/${encodeURIComponent(tournamentId)}/matches`, params, { revalidate: 30 });
}
export async function getMyTournamentMatches(tournamentId: string) {
  return apiFetch<any>(`/tournaments/${encodeURIComponent(tournamentId)}/my-matches`, undefined, { cache: "no-store" });
}
export async function reportMatch(tournamentId: string, matchId: string, payload: any) {
  return apiPost<any>(`/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/report`, payload);
}
export async function disputeMatch(tournamentId: string, matchId: string, payload: any) {
  return apiPost<any>(`/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/dispute`, payload);
}

// ---- Marketplace Offers ----
export async function getMyOffers(params?: Record<string, any>) {
  return apiFetch<any>("/marketplace/offers", params, { cache: "no-store" });
}
export async function createOffer(listingId: string, payload: any) {
  return apiPost<any>(`/marketplace/listings/${encodeURIComponent(listingId)}/offers`, payload);
}

// ---- Chat ----
export async function getChatChannels(params?: Record<string, any>, token?: string) {
  return apiFetch<any>("/social/chat/channels", params, { cache: "no-store", token });
}
export async function getChatMessages(channelId: string, params?: Record<string, any>, token?: string) {
  return apiFetch<any>(`/social/chat/channels/${encodeURIComponent(channelId)}/messages`, params, { cache: "no-store", token });
}
export async function sendChatMessage(channelId: string, payload: { content: string; reply_to_id?: string }, token?: string) {
  return apiPost<any>(`/social/chat/channels/${encodeURIComponent(channelId)}/messages`, payload, { token });
}

export async function editChatMessage(messageId: string, payload: { content: string }, token?: string) {
  return apiPatch<any>(`/social/chat/messages/${encodeURIComponent(messageId)}`, payload, { token });
}

export async function deleteChatMessage(messageId: string, token?: string) {
  return apiDelete<any>(`/social/chat/messages/${encodeURIComponent(messageId)}`, { token });
}

async function apiPatch<T>(
  endpoint: string,
  body: unknown,
  options?: { token?: string }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `API error: ${res.status} ${res.statusText}`;
    try {
      const errorPayload = (await res.json()) as { message?: string; error?: string };
      if (errorPayload.message) message = errorPayload.message;
      else if (errorPayload.error) message = errorPayload.error;
    } catch { }
    showErrorToast(message);
    throw new Error(message);
  }

  return res.json();
}

async function apiDelete<T>(
  endpoint: string,
  options?: { token?: string }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `API error: ${res.status} ${res.statusText}`;
    try {
      const errorPayload = (await res.json()) as { message?: string; error?: string };
      if (errorPayload.message) message = errorPayload.message;
      else if (errorPayload.error) message = errorPayload.error;
    } catch { }
    showErrorToast(message);
    throw new Error(message);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}