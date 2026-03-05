const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://rankeao-go-gateway-production.up.railway.app/api/v1"
).replace(/\/+$/, "");

interface FetchOptions {
  revalidate?: number | false;
  cache?: RequestCache;
}

async function apiFetch<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  options: FetchOptions = { revalidate: 60 }
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const fetchOptions: RequestInit & { next?: { revalidate: number } } = {};
  if (options.cache) {
    fetchOptions.cache = options.cache;
  } else if (options.revalidate !== undefined && options.revalidate !== false) {
    fetchOptions.next = { revalidate: options.revalidate };
  }

  const res = await fetch(url.toString(), fetchOptions);

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function apiPost<T>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `API error: ${res.status} ${res.statusText}`;

    try {
      const errorPayload = (await res.json()) as { message?: string; error?: string };
      if (errorPayload.message) {
        message = errorPayload.message;
      } else if (errorPayload.error) {
        message = errorPayload.error;
      }
    } catch {
      // Ignore JSON parse errors and keep default error message.
    }

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
