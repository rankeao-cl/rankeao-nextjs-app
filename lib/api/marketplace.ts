import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import type {
    Listing, ListingsResponse, ListingFilters, CreateListingRequest,
    ListingDetail, Offer, MarketplaceCheckout, MarketplaceOrder, MarketplaceReview,
    Dispute, Favorite, PriceAlert, SavedSearch, SellerProfile, BankAccount, Payout,
    ListingImage, GroupedCard, GroupedCardsResponse,
} from "@/lib/types/marketplace";
import type { Params, PaginationMeta } from "@/lib/types/api";

// ── Helpers ──

function normalizeListing(item: Record<string, unknown>): Listing {
    // Flatten nested seller object from API into flat fields for components
    if (item?.seller && typeof item.seller === "object") {
        const seller = item.seller as Record<string, unknown>;
        item.seller_username = item.seller_username || seller.username;
        item.seller_avatar_url = item.seller_avatar_url || seller.avatar_url;
        item.is_verified_store = item.is_verified_store ?? seller.is_store ?? false;
        item.seller_id = item.seller_id || seller.id;
    }
    // Flatten nested tenant object if present
    if (item?.tenant && typeof item.tenant === "object") {
        const tenant = item.tenant as Record<string, unknown>;
        item.tenant_name = item.tenant_name || tenant.name;
        item.tenant_id = item.tenant_id || tenant.id;
    }
    return item as unknown as Listing;
}

// ── Config ──

export async function getMarketplaceConfig() {
    return apiFetch<Record<string, unknown>>("/marketplace/config", undefined, { revalidate: 300 });
}

// ── Listings ──

export async function getListings(
    filters: ListingFilters = {}
): Promise<ListingsResponse> {
    const raw = await apiFetch<Record<string, unknown>>(
        "/marketplace/listings",
        filters as Params,
        { cache: "no-store" }
    );

    const data = (raw?.data ?? {}) as Record<string, unknown>;
    const items = (data?.items ?? data?.listings ?? raw?.listings ?? raw?.items ?? []) as Record<string, unknown>[];
    const rawMeta = (raw?.meta ?? data?.meta) as Record<string, unknown> | undefined;

    return {
        listings: items.map(normalizeListing),
        meta: rawMeta ? {
            page: (rawMeta.page as number) ?? 1,
            per_page: (rawMeta.per_page as number) ?? (rawMeta.page_size as number) ?? 20,
            total: (rawMeta.total as number) ?? items.length,
            total_pages: (rawMeta.total_pages as number) ?? 1,
        } : undefined,
        facets: (raw?.facets ?? data?.facets) as Record<string, unknown> | undefined,
    };
}

// ── Grouped Cards ──

export async function getGroupedCards(
    filters: ListingFilters = {}
): Promise<GroupedCardsResponse> {
    const raw = await apiFetch<Record<string, unknown>>(
        "/marketplace/cards",
        filters as Params,
        { cache: "no-store" }
    );

    const data = (raw?.data ?? {}) as Record<string, unknown>;
    const cards = (data?.cards ?? raw?.cards ?? []) as GroupedCard[];
    const rawMeta = (raw?.meta ?? data?.meta) as Record<string, unknown> | undefined;

    return {
        cards,
        meta: rawMeta ? {
            page: (rawMeta.page as number) ?? 1,
            per_page: (rawMeta.per_page as number) ?? (rawMeta.page_size as number) ?? 20,
            total: (rawMeta.total as number) ?? cards.length,
            total_pages: (rawMeta.total_pages as number) ?? 1,
        } : undefined,
    };
}

export async function getCardListings(
    cardId: number,
    filters: ListingFilters = {}
): Promise<ListingsResponse> {
    const raw = await apiFetch<Record<string, unknown>>(
        `/marketplace/cards/${cardId}/listings`,
        filters as Params,
        { cache: "no-store" }
    );

    const data = (raw?.data ?? {}) as Record<string, unknown>;
    const items = (data?.listings ?? raw?.listings ?? []) as Record<string, unknown>[];
    const rawMeta = (raw?.meta ?? data?.meta) as Record<string, unknown> | undefined;

    return {
        listings: items.map(normalizeListing),
        meta: rawMeta ? {
            page: (rawMeta.page as number) ?? 1,
            per_page: (rawMeta.per_page as number) ?? (rawMeta.page_size as number) ?? 20,
            total: (rawMeta.total as number) ?? items.length,
            total_pages: (rawMeta.total_pages as number) ?? 1,
        } : undefined,
    };
}

// ── Listing Detail ──

export async function getListingDetail(id: string) {
    const raw = await apiFetch<{ data?: ListingDetail; listing?: ListingDetail } & Record<string, unknown>>(`/marketplace/listings/${encodeURIComponent(id)}`);
    const listing = raw?.data ?? raw?.listing ?? raw;
    return normalizeListing(listing as Record<string, unknown>);
}

export async function createListing(data: CreateListingRequest) {
    return apiPost<{ listing: Listing }>("/marketplace/listings", data);
}

export async function updateListing(id: string, data: Partial<CreateListingRequest>) {
    return apiPatch<{ listing: Listing }>(`/marketplace/listings/${encodeURIComponent(id)}`, data);
}

export async function deleteListing(id: string) {
    return apiDelete<{ message: string }>(`/marketplace/listings/${encodeURIComponent(id)}`);
}

export async function activateListing(id: string) {
    return apiPost<{ listing: Listing }>(`/marketplace/listings/${encodeURIComponent(id)}/activate`, {});
}

export async function pauseListing(id: string) {
    return apiPost<{ listing: Listing }>(`/marketplace/listings/${encodeURIComponent(id)}/pause`, {});
}

export async function renewListing(id: string) {
    return apiPost<{ listing: Listing }>(`/marketplace/listings/${encodeURIComponent(id)}/renew`, {});
}

// ── Offers ──

export async function getMyOffers(params?: Params) {
    return apiFetch<{ data?: Offer[]; offers?: Offer[]; meta?: PaginationMeta }>("/marketplace/offers/mine", params, { cache: "no-store" });
}

// ── My Listings ──

export async function getMyListings(params?: Params) {
    return apiFetch<{ data?: Listing[]; listings?: Listing[]; meta?: PaginationMeta }>("/marketplace/listings/mine", params, { cache: "no-store" });
}

export async function createOffer(listingId: string, payload: { amount: number; message?: string }) {
    return apiPost<{ offer: Offer }>(`/marketplace/listings/${encodeURIComponent(listingId)}/offers`, payload);
}

export async function getListingOffers(listingId: string) {
    return apiFetch<{ data?: Offer[]; offers?: Offer[] }>(`/marketplace/listings/${encodeURIComponent(listingId)}/offers`, undefined, { cache: "no-store" });
}

export async function acceptOffer(offerId: string) {
    return apiPost<{ offer: Offer }>(`/marketplace/offers/${encodeURIComponent(offerId)}/accept`, {});
}

export async function rejectOffer(offerId: string) {
    return apiPost<{ offer: Offer }>(`/marketplace/offers/${encodeURIComponent(offerId)}/reject`, {});
}

export async function counterOffer(offerId: string, payload: { amount: number; message?: string }) {
    return apiPost<{ offer: Offer }>(`/marketplace/offers/${encodeURIComponent(offerId)}/counter`, payload);
}

export async function withdrawOffer(offerId: string) {
    return apiPost<{ offer: Offer }>(`/marketplace/offers/${encodeURIComponent(offerId)}/withdraw`, {});
}

// ── Buy ──

export async function buyListing(listingId: string, payload: { quantity: number; delivery_method: string; shipping_address?: string }) {
    return apiPost<{ checkout: MarketplaceCheckout }>(`/marketplace/listings/${encodeURIComponent(listingId)}/buy`, payload);
}

// ── Counter Offer Accept ──

export async function acceptCounterOffer(offerId: string) {
    return apiPost<{ offer: Offer }>(`/marketplace/offers/${encodeURIComponent(offerId)}/accept-counter`, {});
}

// ── Listing Images ──

export async function uploadListingImages(listingId: string, payload: { url: string; thumbnail_url?: string; alt_text?: string }) {
    return apiPost<{ image: ListingImage }>(`/marketplace/listings/${encodeURIComponent(listingId)}/images`, payload);
}

export async function deleteListingImage(listingId: string, imageId: string) {
    return apiDelete<{ message: string }>(`/marketplace/listings/${encodeURIComponent(listingId)}/images/${encodeURIComponent(imageId)}`);
}

// ── Checkout & Orders ──

/**
 * @deprecated Use buyListing() instead — there is no /listings/{id}/checkout endpoint in the spec.
 * The correct endpoint is POST /marketplace/listings/{id}/buy.
 */
export async function checkoutListing(listingId: string, payload: Record<string, unknown>) {
    return buyListing(listingId, payload as { quantity: number; delivery_method: string; shipping_address?: string });
}

export async function getCheckout(checkoutId: string) {
    return apiFetch<{ data?: MarketplaceCheckout; checkout?: MarketplaceCheckout }>(`/marketplace/checkouts/${encodeURIComponent(checkoutId)}`, undefined, { cache: "no-store" });
}

export async function payCheckout(checkoutId: string, payload?: { provider?: string }) {
    return apiPost<{ checkout: MarketplaceCheckout }>(`/marketplace/checkouts/${encodeURIComponent(checkoutId)}/pay`, payload ?? {});
}

export async function getMarketplaceOrders(params?: Params) {
    return apiFetch<{ data?: MarketplaceOrder[]; orders?: MarketplaceOrder[]; meta?: PaginationMeta }>("/marketplace/orders", params, { cache: "no-store" });
}

export async function getMarketplaceOrderDetail(orderId: string) {
    return apiFetch<{ data?: MarketplaceOrder; order?: MarketplaceOrder }>(`/marketplace/orders/${encodeURIComponent(orderId)}`, undefined, { cache: "no-store" });
}

export async function confirmDelivery(orderId: string) {
    return apiPost<{ order: MarketplaceOrder }>(`/marketplace/orders/${encodeURIComponent(orderId)}/confirm-delivery`, {});
}

export async function shipOrder(orderId: string, payload: { carrier?: string; tracking_number?: string; tracking_url?: string }) {
    return apiPost<{ order: MarketplaceOrder }>(`/marketplace/orders/${encodeURIComponent(orderId)}/ship`, payload);
}

export async function cancelOrder(orderId: string) {
    return apiPost<{ order: MarketplaceOrder }>(`/marketplace/orders/${encodeURIComponent(orderId)}/cancel`, {});
}

// ── Reviews ──

export async function reviewOrder(orderId: string, payload: Record<string, unknown>) {
    return apiPost<{ review: MarketplaceReview }>(`/marketplace/orders/${encodeURIComponent(orderId)}/reviews`, payload);
}

// ── Disputes ──

export async function openDispute(orderId: string, payload: { reason: string; description?: string }) {
    return apiPost<{ dispute: Dispute }>(`/marketplace/orders/${encodeURIComponent(orderId)}/disputes`, payload);
}

export async function getDispute(disputeId: string) {
    return apiFetch<{ data?: Dispute; dispute?: Dispute }>(`/marketplace/disputes/${encodeURIComponent(disputeId)}`, undefined, { cache: "no-store" });
}

export async function addDisputeEvidence(disputeId: string, payload: Record<string, unknown>) {
    return apiPost<{ evidence: Record<string, unknown> }>(`/marketplace/disputes/${encodeURIComponent(disputeId)}/evidence`, payload);
}

export async function sendDisputeMessage(disputeId: string, payload: { content: string }) {
    return apiPost<{ message: Record<string, unknown> }>(`/marketplace/disputes/${encodeURIComponent(disputeId)}/message`, payload);
}

export async function respondToDispute(disputeId: string, payload: Record<string, unknown>) {
    return apiPost<{ dispute: Dispute }>(`/marketplace/disputes/${encodeURIComponent(disputeId)}/respond`, payload);
}

// ── Favorites ──

export async function getMyFavorites(params?: Params) {
    return apiFetch<{ data?: Favorite[]; favorites?: Favorite[]; meta?: PaginationMeta }>("/marketplace/favorites", params, { cache: "no-store" });
}

export async function addFavorite(listingId: string) {
    return apiPost<{ favorite: Favorite }>(`/marketplace/listings/${encodeURIComponent(listingId)}/favorite`, {});
}

export async function removeFavorite(listingId: string) {
    return apiDelete<{ message: string }>(`/marketplace/listings/${encodeURIComponent(listingId)}/favorite`);
}

// ── Price Alerts ──

export async function getMyPriceAlerts(params?: Params) {
    return apiFetch<{ data?: PriceAlert[]; price_alerts?: PriceAlert[]; meta?: PaginationMeta }>("/marketplace/price-alerts", params, { cache: "no-store" });
}

export async function createPriceAlert(payload: { card_id?: string; printing_id?: string; target_price: number; condition?: string }) {
    return apiPost<{ price_alert: PriceAlert }>("/marketplace/price-alerts", payload);
}

export async function updatePriceAlert(alertId: string, payload: Record<string, unknown>) {
    return apiPatch<{ price_alert: PriceAlert }>(`/marketplace/price-alerts/${encodeURIComponent(alertId)}`, payload);
}

export async function deletePriceAlert(id: string) {
    return apiDelete<{ message: string }>(`/marketplace/price-alerts/${encodeURIComponent(id)}`);
}

// ── Saved Searches ──

export async function getMySavedSearches() {
    return apiFetch<{ data?: SavedSearch[]; saved_searches?: SavedSearch[] }>("/marketplace/saved-searches", undefined, { cache: "no-store" });
}

export async function createSavedSearch(payload: { name?: string; query: string; filters?: Record<string, unknown>; notify?: boolean }) {
    return apiPost<{ saved_search: SavedSearch }>("/marketplace/saved-searches", payload);
}

export async function deleteSavedSearch(id: string) {
    return apiDelete<{ message: string }>(`/marketplace/saved-searches/${encodeURIComponent(id)}`);
}

// ── Seller Profile ──

export async function getSellerProfile(userId: string) {
    return apiFetch<{ data?: SellerProfile; seller?: SellerProfile }>(`/marketplace/sellers/${encodeURIComponent(userId)}`, undefined, { revalidate: 60 });
}

export async function setupSellerProfile(payload: Record<string, unknown>) {
    return apiPost<{ seller: SellerProfile }>("/marketplace/seller/setup", payload);
}

export async function getMySellerProfile() {
    return apiFetch<{ data?: SellerProfile; seller?: SellerProfile }>("/marketplace/seller/me", undefined, { cache: "no-store" });
}

export async function updateSellerProfile(payload: Record<string, unknown>) {
    return apiPatch<{ seller: SellerProfile }>("/marketplace/seller/me", payload);
}

// ── Bank Accounts ──

export async function addBankAccount(payload: Record<string, unknown>) {
    return apiPost<{ bank_account: BankAccount }>("/marketplace/seller/bank-accounts", payload);
}

export async function deleteBankAccount(bankAccountId: string) {
    return apiDelete<{ message: string }>(`/marketplace/seller/bank-accounts/${encodeURIComponent(bankAccountId)}`);
}

// ── Payouts ──

export async function getPayouts(params?: Params) {
    return apiFetch<{ data?: Payout[]; payouts?: Payout[]; meta?: PaginationMeta }>("/marketplace/seller/payouts", params, { cache: "no-store" });
}

export async function getPayoutDetail(payoutId: string) {
    return apiFetch<{ data?: Payout; payout?: Payout }>(`/marketplace/seller/payouts/${encodeURIComponent(payoutId)}`, undefined, { cache: "no-store" });
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

export async function uploadMarketplaceFile(payload: Record<string, unknown>) {
    return apiPost<{ url: string }>("/marketplace/uploads", payload);
}

// ── User Reviews ──

export async function getMarketplaceUserReviews(userId: string, params?: Params) {
    return apiFetch<{ data?: MarketplaceReview[]; reviews?: MarketplaceReview[]; meta?: PaginationMeta }>(`/marketplace/users/${encodeURIComponent(userId)}/reviews`, params, { revalidate: 60 });
}
