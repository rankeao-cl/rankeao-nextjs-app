"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as marketplaceApi from "@/lib/api/marketplace";
import type { ListingFilters, CreateListingRequest, CreateOfferRequest } from "@/lib/types/marketplace";

// ── Listings ──

export function useListings(filters?: ListingFilters) {
    return useQuery({
        queryKey: ["marketplace", "listings", filters],
        queryFn: () => marketplaceApi.getListings(filters),
    });
}

export function useListingDetail(id: string) {
    return useQuery({
        queryKey: ["marketplace", "listings", id],
        queryFn: () => marketplaceApi.getListingDetail(id),
        enabled: !!id,
    });
}

export function useCreateListing() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateListingRequest) => marketplaceApi.createListing(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace", "listings"] }),
    });
}

// ── Offers ──

export function useMyOffers(params?: Record<string, any>) {
    return useQuery({
        queryKey: ["marketplace", "offers", params],
        queryFn: () => marketplaceApi.getMyOffers(params as any),
    });
}

export function useCreateOffer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ listingId, payload }: { listingId: string; payload: CreateOfferRequest }) =>
            marketplaceApi.createOffer(listingId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
    });
}

// ── Favorites ──

export function useMyFavorites() {
    return useQuery({
        queryKey: ["marketplace", "favorites"],
        queryFn: () => marketplaceApi.getMyFavorites(),
    });
}

export function useToggleFavorite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ listingId, add }: { listingId: string; add: boolean }) =>
            add ? marketplaceApi.addFavorite(listingId) : marketplaceApi.removeFavorite(listingId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace", "favorites"] }),
    });
}

// ── Orders ──

export function useMarketplaceOrders(params?: Record<string, any>) {
    return useQuery({
        queryKey: ["marketplace", "orders", params],
        queryFn: () => marketplaceApi.getMarketplaceOrders(params as any),
    });
}

// ── Seller ──

export function useSellerProfile(userId: string) {
    return useQuery({
        queryKey: ["marketplace", "seller", userId],
        queryFn: () => marketplaceApi.getSellerProfile(userId),
        enabled: !!userId,
    });
}
