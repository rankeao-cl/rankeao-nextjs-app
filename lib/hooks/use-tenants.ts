"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as tenantsApi from "@/lib/api/tenants";
import type { TenantFilters, CreateTenantReviewRequest } from "@/lib/types/tenant";

export function useTenants(filters?: TenantFilters) {
    return useQuery({
        queryKey: ["tenants", filters],
        queryFn: () => tenantsApi.getTenants(filters),
    });
}

export function useTenantDetail(slugOrId: string) {
    return useQuery({
        queryKey: ["tenants", slugOrId],
        queryFn: () => tenantsApi.getTenant(slugOrId),
        enabled: !!slugOrId,
    });
}

export function useTenantEvents(slug: string) {
    return useQuery({
        queryKey: ["tenants", slug, "events"],
        queryFn: () => tenantsApi.getTenantEvents(slug),
        enabled: !!slug,
    });
}

export function useTenantReviews(slug: string) {
    return useQuery({
        queryKey: ["tenants", slug, "reviews"],
        queryFn: () => tenantsApi.getTenantReviews(slug),
        enabled: !!slug,
    });
}

export function useCreateTenantReview() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ slug, data }: { slug: string; data: CreateTenantReviewRequest }) =>
            tenantsApi.createTenantReview(slug, data),
        onSuccess: (_, { slug }) => qc.invalidateQueries({ queryKey: ["tenants", slug, "reviews"] }),
    });
}
