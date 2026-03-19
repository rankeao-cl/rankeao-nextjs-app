import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import type { Listing, ListingsResponse, ListingFilters, CreateListingRequest } from "@/lib/types/marketplace";
import type { Params } from "@/lib/types/api";

// ── Helpers ──

function normalizeListing(item: any): Listing {
    // Flatten nested seller object from API into flat fields for components
    if (item?.seller && typeof item.seller === "object") {
        item.seller_username = item.seller_username || item.seller.username;
        item.seller_avatar_url = item.seller_avatar_url || item.seller.avatar_url;
        item.is_verified_store = item.is_verified_store ?? item.seller.is_store ?? false;
        item.seller_id = item.seller_id || item.seller.id;
    }
    // Flatten nested tenant object if present
    if (item?.tenant && typeof item.tenant === "object") {
        item.tenant_name = item.tenant_name || item.tenant.name;
        item.tenant_id = item.tenant_id || item.tenant.id;
    }
    return item as Listing;
}

// ── Listings ──

export async function getListings(
    filters: ListingFilters = {}
): Promise<ListingsResponse> {
    const raw = await apiFetch<any>(
        "/marketplace/listings",
        filters as Params,
        { cache: "no-store" }
    );

    const items = raw?.data?.items ?? raw?.data?.listings ?? raw?.listings ?? raw?.items ?? [];
    const rawMeta = raw?.meta ?? raw?.data?.meta;

    return {
        listings: items.map(normalizeListing),
        meta: rawMeta ? {
            page: rawMeta.page ?? 1,
            per_page: rawMeta.per_page ?? rawMeta.page_size ?? 20,
            total: rawMeta.total ?? items.length,
            total_pages: rawMeta.total_pages ?? 1,
        } : undefined,
        facets: raw?.facets ?? raw?.data?.facets,
    };
}

export async function getListingDetail(id: string) {
    const raw = await apiFetch<any>(`/marketplace/listings/${encodeURIComponent(id)}`);
    const listing = raw?.data ?? raw?.listing ?? raw;
    return normalizeListing(listing);
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
    return apiFetch<any>("/marketplace/offers/mine", params, { cache: "no-store" });
}

// ── My Listings ──

export async function getMyListings(params?: Params) {
    return apiFetch<any>("/marketplace/listings/mine", params, { cache: "no-store" });
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

// ── Buy ──

export async function buyListing(listingId: string, payload: { quantity: number; delivery_method: string; shipping_address?: string }) {
    return apiPost<any>(`/marketplace/listings/${encodeURIComponent(listingId)}/buy`, payload);
}

// ── Counter Offer Accept ──

export async function acceptCounterOffer(offerId: string) {
    return apiPost<any>(`/marketplace/offers/${encodeURIComponent(offerId)}/accept-counter`, {});
}

// ── Listing Images ──

export async function uploadListingImages(listingId: string, payload: { url: string; thumbnail_url?: string; alt_text?: string }) {
    return apiPost<any>(`/marketplace/listings/${encodeURIComponent(listingId)}/images`, payload);
}

export async function deleteListingImage(listingId: string, imageId: string) {
    return apiDelete<any>(`/marketplace/listings/${encodeURIComponent(listingId)}/images/${encodeURIComponent(imageId)}`);
}

// ── Checkout & Orders ──

export async function checkoutListing(listingId: string, payload: any) {
    return apiPost<any>(`/marketplace/listings/${encodeURIComponent(listingId)}/checkout`, payload);
}

export async function getCheckout(checkoutId: string) {
    return apiFetch<any>(`/marketplace/checkouts/${encodeURIComponent(checkoutId)}`, undefined, { cache: "no-store" });
}

export async function payCheckout(checkoutId: string, payload?: { provider?: string }) {
    return apiPost<any>(`/marketplace/checkouts/${encodeURIComponent(checkoutId)}/pay`, payload ?? {});
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

export async function shipOrder(orderId: string, payload: { carrier?: string; tracking_number?: string; tracking_url?: string }) {
    return apiPost<any>(`/marketplace/orders/${encodeURIComponent(orderId)}/ship`, payload);
}

// ── Reviews ──

export async function reviewOrder(orderId: string, payload: any) {
    return apiPost<any>(`/marketplace/orders/${encodeURIComponent(orderId)}/reviews`, payload);
}

// ── Disputes ──

export async function openDispute(orderId: string, payload: { reason: string; description?: string }) {
    return apiPost<any>(`/marketplace/orders/${encodeURIComponent(orderId)}/disputes`, payload);
}

export async function getDispute(disputeId: string) {
    return apiFetch<any>(`/marketplace/disputes/${encodeURIComponent(disputeId)}`, undefined, { cache: "no-store" });
}

export async function addDisputeEvidence(disputeId: string, payload: any) {
    return apiPost<any>(`/marketplace/disputes/${encodeURIComponent(disputeId)}/evidence`, payload);
}

export async function sendDisputeMessage(disputeId: string, payload: { content: string }) {
    return apiPost<any>(`/marketplace/disputes/${encodeURIComponent(disputeId)}/message`, payload);
}

export async function respondToDispute(disputeId: string, payload: any) {
    return apiPost<any>(`/marketplace/disputes/${encodeURIComponent(disputeId)}/respond`, payload);
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

export async function updatePriceAlert(alertId: string, payload: any) {
    return apiPatch<any>(`/marketplace/price-alerts/${encodeURIComponent(alertId)}`, payload);
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

export async function getMySellerProfile() {
    return apiFetch<any>("/marketplace/seller/me", undefined, { cache: "no-store" });
}

export async function updateSellerProfile(payload: any) {
    return apiPatch<any>("/marketplace/seller/me", payload);
}

// ── Bank Accounts ──

export async function addBankAccount(payload: any) {
    return apiPost<any>("/marketplace/seller/bank-accounts", payload);
}

export async function deleteBankAccount(bankAccountId: string) {
    return apiDelete<any>(`/marketplace/seller/bank-accounts/${encodeURIComponent(bankAccountId)}`);
}

// ── Payouts ──

export async function getPayouts(params?: Params) {
    return apiFetch<any>("/marketplace/seller/payouts", params, { cache: "no-store" });
}

export async function getPayoutDetail(payoutId: string) {
    return apiFetch<any>(`/marketplace/seller/payouts/${encodeURIComponent(payoutId)}`, undefined, { cache: "no-store" });
}

// ── Uploads ──

export async function uploadMarketplaceImage(formData: FormData) {
    // Special: uses FormData, not JSON
    const { getAuthHeaders } = await import("./client");
    const headers = getAuthHeaders();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.rankeao.cl/api/v1";
    const res = await fetch(`${baseUrl}/marketplace/uploads`, {
        method: "POST",
        headers,
        body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
}

export async function uploadMarketplaceFile(payload: any) {
    return apiPost<any>("/marketplace/uploads", payload);
}

// ── User Reviews ──

export async function getMarketplaceUserReviews(userId: string, params?: Params) {
    return apiFetch<any>(`/marketplace/users/${encodeURIComponent(userId)}/reviews`, params, { revalidate: 60 });
}
