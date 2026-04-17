import { apiFetch, apiPost } from "./client";
import { ApiError } from "./errors";
import type { TenantsResponse, TenantFilters, Tenant, TenantEvent, TenantReviewsResponse, CreateTenantReviewRequest, CreateTenantRequest, TenantStaffMembership } from "@/lib/types/tenant";
import type { Params, ApiResponse, ApiMessage } from "@/lib/types/api";

// ── Directory ──

export async function getTenants(
    filters: TenantFilters = {}
): Promise<TenantsResponse> {
    return apiFetch<TenantsResponse>(
        "/tenants",
        filters as Params,
        { cache: "no-store" }
    );
}

export async function getTenant(idOrSlug: string): Promise<{ tenant: Tenant }> {
    const res = await apiFetch<ApiResponse<Tenant>>(
        `/tenants/${encodeURIComponent(idOrSlug)}`,
        undefined,
        { revalidate: 60 }
    );
    // Handle both cases: { data: Tenant } and { tenant: Tenant }
    const tenant = (res.data ?? res.tenant ?? res) as Tenant;
    return { tenant };
}

// ── CRUD ──

export async function createTenant(data: CreateTenantRequest) {
    return apiPost<ApiResponse<{ tenant: Tenant }>>("/tenants", data);
}

// ── Events ──

export async function getTenantEvents(slug: string, params?: Params) {
    return apiFetch<ApiResponse<{ events: TenantEvent[] }>>(`/tenants/${encodeURIComponent(slug)}/events`, params, { revalidate: 60 });
}

// ── Reviews ──

export async function getTenantReviews(slug: string, params?: Params): Promise<TenantReviewsResponse> {
    return apiFetch<TenantReviewsResponse>(
        `/tenants/${encodeURIComponent(slug)}/reviews`,
        params,
        { revalidate: 60 }
    );
}

export async function createTenantReview(slug: string, data: CreateTenantReviewRequest) {
    return apiPost<ApiResponse<ApiMessage>>(`/tenants/${encodeURIComponent(slug)}/reviews`, data);
}

// ── Staff ──

export async function getMyMemberships(token?: string) {
    return apiFetch<ApiResponse<TenantStaffMembership[]>>("/tenants/staff/mine", undefined, { cache: "no-store", token });
}

export async function acceptStaffInvitation(invitationId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/tenants/staff/invitations/${invitationId}/accept`, {}, { token });
}

export async function declineStaffInvitation(invitationId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/tenants/staff/invitations/${invitationId}/decline`, {}, { token });
}

// ── Members (Community Features) ──

/**
 * The backend does not expose GET /tenants/{slug}/members.
 * Keep this function only to fail explicitly if legacy code still calls it.
 */
export async function getTenantMembers(slug: string, params?: Params) {
    void slug;
    void params;
    throw new ApiError("NOT_FOUND", "El backend no expone /tenants/{slug}/members", 404);
}
