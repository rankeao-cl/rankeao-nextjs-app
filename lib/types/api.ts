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
