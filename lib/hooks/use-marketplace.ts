"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as marketplaceApi from "@/lib/api/marketplace";
import type { ListingFilters, CreateListingRequest, CreateOfferRequest, Favorite } from "@/lib/types/marketplace";
import type { Params } from "@/lib/types/api";

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

export function useMyOffers(params?: Params) {
    return useQuery({
        queryKey: ["marketplace", "offers", params],
        queryFn: () => marketplaceApi.getMyOffers(params),
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
        mutationFn: async ({ listingId, add }: { listingId: string; add: boolean }) => {
            if (add) return marketplaceApi.addFavorite(listingId);
            await marketplaceApi.removeFavorite(listingId);
            return { favorite: null as unknown as Favorite };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace", "favorites"] }),
    });
}

// ── Orders ──

export function useMarketplaceOrders(params?: Params) {
    return useQuery({
        queryKey: ["marketplace", "orders", params],
        queryFn: () => marketplaceApi.getMarketplaceOrders(params),
    });
}

// ── Buy / Checkout ──

export function useBuyListing() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ listingId, payload }: { listingId: string; payload: { quantity: number; delivery_method: string; shipping_address?: string; notes?: string } }) =>
            marketplaceApi.buyListing(listingId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
    });
}

export function useCheckout(id: string) {
    return useQuery({
        queryKey: ["marketplace", "checkout", id],
        queryFn: () => marketplaceApi.getCheckout(id),
        enabled: !!id,
        refetchInterval: 5000,
    });
}

export function usePayCheckout() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ checkoutId, payload }: { checkoutId: string; payload: { provider?: string } }) =>
            marketplaceApi.payCheckout(checkoutId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace", "checkout"] }),
    });
}

// ── Offer Actions ──

export function useAcceptOffer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (offerId: string) => marketplaceApi.acceptOffer(offerId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
    });
}

export function useRejectOffer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (offerId: string) => marketplaceApi.rejectOffer(offerId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
    });
}

export function useCounterOffer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ offerId, payload }: { offerId: string; payload: { amount: number; message?: string } }) =>
            marketplaceApi.counterOffer(offerId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
    });
}

export function useWithdrawOffer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (offerId: string) => marketplaceApi.withdrawOffer(offerId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
    });
}

export function useAcceptCounterOffer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (offerId: string) => marketplaceApi.acceptCounterOffer(offerId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
    });
}

// ── My Listings (seller) ──

export function useMyListings(params?: Params) {
    return useQuery({
        queryKey: ["marketplace", "my-listings", params],
        queryFn: () => marketplaceApi.getMyListings(params),
    });
}

export function usePauseListing() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => marketplaceApi.pauseListing(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
    });
}

export function useActivateListing() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => marketplaceApi.activateListing(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
    });
}

export function useRenewListing() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => marketplaceApi.renewListing(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
    });
}

export function useDeleteListing() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => marketplaceApi.deleteListing(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace"] }),
    });
}

// ── Payouts ──

export function usePayouts(params?: Params) {
    return useQuery({
        queryKey: ["marketplace", "payouts", params],
        queryFn: () => marketplaceApi.getPayouts(params),
    });
}

export function usePayoutDetail(id: string) {
    return useQuery({
        queryKey: ["marketplace", "payouts", id],
        queryFn: () => marketplaceApi.getPayoutDetail(id),
        enabled: !!id,
    });
}

// ── Disputes ──

export function useDispute(id: string) {
    return useQuery({
        queryKey: ["marketplace", "disputes", id],
        queryFn: () => marketplaceApi.getDispute(id),
        enabled: !!id,
    });
}

export function useAddDisputeEvidence() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ disputeId, payload }: { disputeId: string; payload: Record<string, unknown> }) =>
            marketplaceApi.addDisputeEvidence(disputeId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace", "disputes"] }),
    });
}

export function useSendDisputeMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ disputeId, payload }: { disputeId: string; payload: { content: string } }) =>
            marketplaceApi.sendDisputeMessage(disputeId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace", "disputes"] }),
    });
}

// ── Price Alerts ──

export function usePriceAlerts(params?: Params) {
    return useQuery({
        queryKey: ["marketplace", "price-alerts", params],
        queryFn: () => marketplaceApi.getMyPriceAlerts(params),
    });
}

export function useCreatePriceAlert() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: { card_id?: string; printing_id?: string; target_price: number; condition?: string }) => marketplaceApi.createPriceAlert(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace", "price-alerts"] }),
    });
}

export function useUpdatePriceAlert() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
            marketplaceApi.updatePriceAlert(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace", "price-alerts"] }),
    });
}

export function useDeletePriceAlert() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => marketplaceApi.deletePriceAlert(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace", "price-alerts"] }),
    });
}

// ── Saved Searches ──

export function useSavedSearches() {
    return useQuery({
        queryKey: ["marketplace", "saved-searches"],
        queryFn: () => marketplaceApi.getMySavedSearches(),
    });
}

export function useCreateSavedSearch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: { name?: string; query: string; filters?: Record<string, unknown>; notify?: boolean }) => marketplaceApi.createSavedSearch(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace", "saved-searches"] }),
    });
}

export function useDeleteSavedSearch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => marketplaceApi.deleteSavedSearch(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace", "saved-searches"] }),
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
