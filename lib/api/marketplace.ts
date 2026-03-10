import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import type { ListingsResponse, ListingFilters, CreateListingRequest } from "@/lib/types/marketplace";
import type { Params } from "@/lib/types/api";

// ── Listings ──

export async function getListings(
    filters: ListingFilters = {}
): Promise<ListingsResponse> {
    return apiFetch<ListingsResponse>(
        "/marketplace/listings",
        filters as Params,
        { cache: "no-store" }
    );
}

export async function getListingDetail(id: string) {
    return apiFetch<any>(`/marketplace/listings/${encodeURIComponent(id)}`);
}

export async function createListing(data: CreateListingRequest) {
    return apiPost<any>("/marketplace/listings", data);
}

export async function updateListing(id: string, data: Partial<CreateListingRequest>) {
    return apiPatch<any>(`/marketplace/listings/${encodeURIComponent(id)}`, data);
}

export async function deleteListing(id: string) {
    return apiDelete<any>(`/marketplace/listings/${encodeURIComponent(id)}`);
}

export async function activateListing(id: string) {
    return apiPost<any>(`/marketplace/listings/${encodeURIComponent(id)}/activate`, {});
}

export async function pauseListing(id: string) {
    return apiPost<any>(`/marketplace/listings/${encodeURIComponent(id)}/pause`, {});
}

export async function renewListing(id: string) {
    return apiPost<any>(`/marketplace/listings/${encodeURIComponent(id)}/renew`, {});
}

// ── Offers ──

export async function getMyOffers(params?: Params) {
    return apiFetch<any>("/marketplace/offers", params, { cache: "no-store" });
}

export async function createOffer(listingId: string, payload: { amount: number; message?: string }) {
    return apiPost<any>(`/marketplace/listings/${encodeURIComponent(listingId)}/offers`, payload);
}

export async function getListingOffers(listingId: string) {
    return apiFetch<any>(`/marketplace/listings/${encodeURIComponent(listingId)}/offers`, undefined, { cache: "no-store" });
}

export async function acceptOffer(offerId: string) {
    return apiPost<any>(`/marketplace/offers/${encodeURIComponent(offerId)}/accept`, {});
}

export async function rejectOffer(offerId: string) {
    return apiPost<any>(`/marketplace/offers/${encodeURIComponent(offerId)}/reject`, {});
}

export async function counterOffer(offerId: string, payload: { amount: number; message?: string }) {
    return apiPost<any>(`/marketplace/offers/${encodeURIComponent(offerId)}/counter`, payload);
}

export async function withdrawOffer(offerId: string) {
    return apiPost<any>(`/marketplace/offers/${encodeURIComponent(offerId)}/withdraw`, {});
}

// ── Checkout & Orders ──

export async function checkoutListing(listingId: string, payload: any) {
    return apiPost<any>(`/marketplace/listings/${encodeURIComponent(listingId)}/checkout`, payload);
}

export async function getMarketplaceOrders(params?: Params) {
    return apiFetch<any>("/marketplace/orders", params, { cache: "no-store" });
}

export async function getMarketplaceOrderDetail(orderId: string) {
    return apiFetch<any>(`/marketplace/orders/${encodeURIComponent(orderId)}`, undefined, { cache: "no-store" });
}

export async function confirmDelivery(orderId: string) {
    return apiPost<any>(`/marketplace/orders/${encodeURIComponent(orderId)}/confirm-delivery`, {});
}

export async function shipOrder(orderId: string, payload: { tracking_number?: string; tracking_url?: string }) {
    return apiPost<any>(`/marketplace/orders/${encodeURIComponent(orderId)}/ship`, payload);
}

// ── Reviews ──

export async function reviewOrder(orderId: string, payload: any) {
    return apiPost<any>(`/marketplace/orders/${encodeURIComponent(orderId)}/review`, payload);
}

// ── Disputes ──

export async function openDispute(orderId: string, payload: { reason: string; description?: string }) {
    return apiPost<any>(`/marketplace/orders/${encodeURIComponent(orderId)}/dispute`, payload);
}

export async function getDispute(disputeId: string) {
    return apiFetch<any>(`/marketplace/disputes/${encodeURIComponent(disputeId)}`, undefined, { cache: "no-store" });
}

export async function addDisputeEvidence(disputeId: string, payload: any) {
    return apiPost<any>(`/marketplace/disputes/${encodeURIComponent(disputeId)}/evidence`, payload);
}

export async function sendDisputeMessage(disputeId: string, payload: { content: string }) {
    return apiPost<any>(`/marketplace/disputes/${encodeURIComponent(disputeId)}/messages`, payload);
}

// ── Favorites ──

export async function getMyFavorites(params?: Params) {
    return apiFetch<any>("/marketplace/favorites", params, { cache: "no-store" });
}

export async function addFavorite(listingId: string) {
    return apiPost<any>(`/marketplace/listings/${encodeURIComponent(listingId)}/favorite`, {});
}

export async function removeFavorite(listingId: string) {
    return apiDelete<any>(`/marketplace/listings/${encodeURIComponent(listingId)}/favorite`);
}

// ── Price Alerts ──

export async function getMyPriceAlerts(params?: Params) {
    return apiFetch<any>("/marketplace/price-alerts", params, { cache: "no-store" });
}

export async function createPriceAlert(payload: { card_id?: string; printing_id?: string; target_price: number; condition?: string }) {
    return apiPost<any>("/marketplace/price-alerts", payload);
}

export async function deletePriceAlert(id: string) {
    return apiDelete<any>(`/marketplace/price-alerts/${encodeURIComponent(id)}`);
}

// ── Saved Searches ──

export async function getMySavedSearches() {
    return apiFetch<any>("/marketplace/saved-searches", undefined, { cache: "no-store" });
}

export async function createSavedSearch(payload: { name?: string; query: string; filters?: Record<string, unknown>; notify?: boolean }) {
    return apiPost<any>("/marketplace/saved-searches", payload);
}

export async function deleteSavedSearch(id: string) {
    return apiDelete<any>(`/marketplace/saved-searches/${encodeURIComponent(id)}`);
}

// ── Seller Profile ──

export async function getSellerProfile(userId: string) {
    return apiFetch<any>(`/marketplace/sellers/${encodeURIComponent(userId)}`, undefined, { revalidate: 60 });
}

export async function setupSellerProfile(payload: any) {
    return apiPost<any>("/marketplace/seller/setup", payload);
}

export async function updateSellerProfile(payload: any) {
    return apiPatch<any>("/marketplace/seller/profile", payload);
}

// ── Uploads ──

export async function uploadMarketplaceImage(formData: FormData) {
    // Special: uses FormData, not JSON
    const { getAuthHeaders } = await import("./client");
    const headers = getAuthHeaders();
    const res = await fetch("https://api.rankeao.cl/api/v1/marketplace/uploads", {
        method: "POST",
        headers,
        body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
}
