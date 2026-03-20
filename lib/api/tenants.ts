import { apiFetch, apiPost, apiDelete } from "./client";
import type { TenantsResponse, TenantFilters, Tenant, TenantReviewsResponse, CreateTenantReviewRequest, CreateTenantRequest } from "@/lib/types/tenant";
import type { Params } from "@/lib/types/api";

// ── Directory ──

export async function getTenants(
    filters: TenantFilters = {}
): Promise<TenantsResponse> {
    return apiFetch<TenantsResponse>(
        "/tenants",
        filters as Params,
        { revalidate: 60 }
    );
}

export async function getTenant(idOrSlug: string): Promise<{ tenant: Tenant }> {
    const res = await apiFetch<any>(
        `/tenants/${encodeURIComponent(idOrSlug)}`,
        undefined,
        { revalidate: 60 }
    );
    // Handle both cases: { data: Tenant } and { tenant: Tenant }
    const tenant = res.data || res.tenant || res;
    return { tenant };
}

// ── CRUD ──

export async function createTenant(data: CreateTenantRequest) {
    return apiPost<any>("/tenants", data);
}

// ── Events ──

export async function getTenantEvents(slug: string, params?: Params) {
    return apiFetch<any>(`/tenants/${encodeURIComponent(slug)}/events`, params, { revalidate: 60 });
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
    return apiPost<any>(`/tenants/${encodeURIComponent(slug)}/reviews`, data);
}

// ── Staff ──

export async function getMyMemberships(token?: string) {
    return apiFetch<any>("/tenants/staff/mine", undefined, { cache: "no-store", token });
}

export async function acceptStaffInvitation(invitationId: string, token?: string) {
    return apiPost<any>(`/tenants/staff/invitations/${invitationId}/accept`, {}, { token });
}

export async function declineStaffInvitation(invitationId: string, token?: string) {
    return apiPost<any>(`/tenants/staff/invitations/${invitationId}/decline`, {}, { token });
}

// ── Members (Community Features) ──

/**
 * NOTE: /tenants/{slug}/members is not in the public OpenAPI spec.
 * This may be an internal/undocumented endpoint.
 */
export async function getTenantMembers(slug: string, params?: Params) {
    return apiFetch<any>(`/tenants/${encodeURIComponent(slug)}/members`, params, { revalidate: 30 });
}
