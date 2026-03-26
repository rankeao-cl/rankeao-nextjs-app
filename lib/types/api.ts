// ── Base API types ──

export interface PaginationMeta {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
}

export interface FetchOptions {
    revalidate?: number | false;
    cache?: RequestCache;
    token?: string;
}

export type Params = Record<string, string | number | boolean | undefined>;

// ── Standard API response wrapper ──
// Intersection with Partial<T> allows accessing data properties directly
// (for dual-path fallback patterns like `res?.data?.duels ?? res?.duels`)

export type ApiResponse<T = unknown> = {
  success?: boolean;
  data?: T;
  meta?: PaginationMeta;
  message?: string;
} & Partial<T extends Record<string, unknown> ? T : Record<string, never>>;

export interface ApiMessage {
  message: string;
}
