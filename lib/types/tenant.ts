import type { PaginationMeta } from "./api";

// ── Tenant types ──

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    status?: string;
    city?: string;
    region?: string;
    country?: string;
    country_code?: string;
    address?: string;
    postal_code?: string;
    logo_url?: string;
    banner_url?: string;
    is_public?: boolean;
    description?: string;
    short_description?: string;
    rules?: string;
    email?: string;
    phone?: string;
    website?: string;
    plan?: string;
    timezone?: string;
    currency?: string;
    rating?: number;
    avg_rating?: number;
    review_count?: number;
    follower_count?: number;
    staff_count?: number;
    product_count?: number;
    order_count?: number;
    tournament_count?: number;
    is_open?: boolean;
    is_open_now?: boolean;
    is_verified?: boolean;
    verified_at?: string;
    social_links?: TenantSocialLink[];
    schedules?: TenantSchedule[];
    recent_reviews?: TenantReview[];
    tags?: string[];
    lat?: number;
    lng?: number;
    distance_km?: number;
    is_following?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface TenantSocialLink {
    platform: string;
    url: string;
    sort_order?: number;
    is_active?: boolean;
}

export interface TenantSchedule {
    day: string;
    open_time: string;
    close_time: string;
    is_closed?: boolean;
}

export interface TenantsResponse {
    tenants: Tenant[];
    meta?: PaginationMeta;
}

export interface TenantFilters {
    q?: string;
    city?: string;
    region?: string;
    tags?: string;
    min_rating?: number;
    near_lat?: number;
    near_lng?: number;
    near_radius_km?: number;
    sort?: "recent" | "rating" | "distance" | "popular" | string;
    page?: number;
    per_page?: number;
}

export interface TenantEvent {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    event_type?: string;
    starts_at: string;
    ends_at?: string;
    image_url?: string;
    is_featured?: boolean;
    created_at?: string;
}

export interface TenantReview {
    id: string;
    user_id?: string;
    username?: string;
    reviewer_username?: string;
    avatar_url?: string;
    overall_rating: number;
    product_quality?: number;
    customer_service?: number;
    atmosphere?: number;
    value_for_money?: number;
    comment?: string;
    is_anonymous?: boolean;
    is_visible?: boolean;
    created_at?: string;
}

export interface ReviewStats {
    average_rating?: number;
    avg_rating?: number;
    total_count?: number;
    total_reviews?: number;
    distribution: Record<string, number>; // "1": 5, "2": 3, ...
}

export interface TenantReviewsResponse {
    reviews: TenantReview[];
    stats?: ReviewStats;
    meta?: PaginationMeta;
}

export interface CreateTenantRequest {
    name: string;
    slug: string;
    email: string;
    description?: string;
    city?: string;
    region?: string;
    country_code?: string;
    phone?: string;
    website?: string;
    lat?: number;
    lng?: number;
}

export interface CreateTenantReviewRequest {
    overall_rating: number;
    product_quality?: number;
    customer_service?: number;
    atmosphere?: number;
    value_for_money?: number;
    comment?: string;
    is_anonymous?: boolean;
}

// ── Staff & Members ──

export interface TenantStaffMembership {
    tenant_id: string;
    tenant_name?: string;
    tenant_slug?: string;
    role: string;
    joined_at?: string;
}

export interface TenantMember {
    user_id: string;
    username: string;
    avatar_url?: string;
    role?: string;
    joined_at?: string;
}
