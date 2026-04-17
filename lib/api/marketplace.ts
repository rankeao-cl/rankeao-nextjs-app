import { apiFetch, apiPost, apiPatch, apiDelete, BASE_URL } from "./client";
import type {
    Listing, ListingsResponse, ListingFilters, CreateListingRequest,
    ListingDetail, Offer, MarketplaceCheckout, MarketplaceOrder, MarketplaceReview,
    Dispute, DisputeEvidence, DisputeMessage, Favorite, PriceAlert, SavedSearch, SellerProfile, BankAccount, Payout,
    ListingImage, GroupedCard, GroupedCardsResponse,
    CreateReviewPayload, AddDisputeEvidencePayload, RespondToDisputePayload,
    UpdatePriceAlertPayload, SetupSellerProfilePayload, UpdateSellerProfilePayload, CheckoutPaymentResult,
    AddBankAccountPayload, UploadMarketplaceFilePayload, CheckoutListingPayload,
} from "@/lib/types/marketplace";
import type { Params, PaginationMeta } from "@/lib/types/api";

// ── Helpers ──

function normalizeMeta(rawMeta: Record<string, unknown> | undefined, fallbackTotal: number): PaginationMeta | undefined {
    if (!rawMeta) return undefined;
    return {
        page: (rawMeta.page as number) ?? 1,
        per_page: (rawMeta.per_page as number) ?? (rawMeta.page_size as number) ?? 20,
        total: (rawMeta.total as number) ?? fallbackTotal,
        total_pages: (rawMeta.total_pages as number) ?? 1,
    };
}

function normalizeListing(item: Record<string, unknown>): Listing {
    const result = { ...item };
    // Flatten nested seller object from API into flat fields for components
    if (result.seller && typeof result.seller === "object") {
        const seller = result.seller as Record<string, unknown>;
        result.seller_username = result.seller_username || seller.username;
        result.seller_avatar_url = result.seller_avatar_url || seller.avatar_url;
        result.is_verified_store = result.is_verified_store ?? seller.is_store ?? false;
        result.seller_id = result.seller_id || seller.id;
    }
    // Flatten nested tenant object if present
    if (result.tenant && typeof result.tenant === "object") {
        const tenant = result.tenant as Record<string, unknown>;
        result.tenant_name = result.tenant_name || tenant.name;
        result.tenant_id = result.tenant_id || tenant.id;
    }

    const listing: Listing = {
        id: asString(result.id) ?? "",
        title: asString(result.title) ?? asString(result.card_name) ?? "Publicacion",
    };

    const price = asNumber(result.price);
    const quantity = asNumber(result.quantity);
    const viewsCount = asNumber(result.views_count);
    const favoritesCount = asNumber(result.favorites_count);
    const latitude = asNumber(result.lat);
    const longitude = asNumber(result.lng);
    const images = asListingImages(result.images);

    if (price !== undefined) listing.price = price;
    if (quantity !== undefined) listing.quantity = quantity;
    if (viewsCount !== undefined) listing.views_count = viewsCount;
    if (favoritesCount !== undefined) listing.favorites_count = favoritesCount;
    if (latitude !== undefined) listing.lat = latitude;
    if (longitude !== undefined) listing.lng = longitude;
    if (images) listing.images = images;

    listing.slug = asString(result.slug);
    listing.currency = asString(result.currency);
    listing.card_condition = asString(result.card_condition);
    listing.card_language = asString(result.card_language);
    listing.card_id = asString(result.card_id);
    listing.card_name = asString(result.card_name);
    listing.printing_id = asString(result.printing_id);
    listing.game_id = asString(result.game_id);
    listing.game_name = asString(result.game_name);
    listing.set_name = asString(result.set_name);
    listing.set_code = asString(result.set_code);
    listing.rarity = asString(result.rarity);
    listing.seller_id = asString(result.seller_id);
    listing.seller_username = asString(result.seller_username);
    listing.seller_avatar_url = asString(result.seller_avatar_url);
    listing.tenant_id = asString(result.tenant_id);
    listing.tenant_name = asString(result.tenant_name);
    listing.city = asString(result.city);
    listing.region = asString(result.region);
    listing.country = asString(result.country);
    listing.card_image_url = asString(result.card_image_url);
    listing.image_url = asString(result.image_url);
    listing.status = asString(result.status);
    listing.created_at = asString(result.created_at);
    listing.updated_at = asString(result.updated_at);
    listing.expires_at = asString(result.expires_at);

    const isFoil = asBoolean(result.is_foil);
    const isFirstEdition = asBoolean(result.is_first_edition);
    const acceptsOffers = asBoolean(result.accepts_offers);
    const acceptsShipping = asBoolean(result.accepts_shipping);
    const acceptsInPerson = asBoolean(result.accepts_in_person);
    const isVerifiedStore = asBoolean(result.is_verified_store);
    const isVerifiedSeller = asBoolean(result.is_verified_seller);

    if (isFoil !== undefined) listing.is_foil = isFoil;
    if (isFirstEdition !== undefined) listing.is_first_edition = isFirstEdition;
    if (acceptsOffers !== undefined) listing.accepts_offers = acceptsOffers;
    if (acceptsShipping !== undefined) listing.accepts_shipping = acceptsShipping;
    if (acceptsInPerson !== undefined) listing.accepts_in_person = acceptsInPerson;
    if (isVerifiedStore !== undefined) listing.is_verified_store = isVerifiedStore;
    if (isVerifiedSeller !== undefined) listing.is_verified_seller = isVerifiedSeller;

    return listing;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value !== "object" || value === null) return null;
    return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
}

function asListingImages(value: unknown): ListingImage[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const images = value
        .map((entry) => {
            const record = asRecord(entry);
            if (!record) return null;
            const url = asString(record.url) ?? asString(record.image_url);
            if (!url) return null;
            const image: ListingImage = { url };
            const thumbnailUrl = asString(record.thumbnail_url);
            const altText = asString(record.alt_text);
            if (thumbnailUrl) image.thumbnail_url = thumbnailUrl;
            if (altText) image.alt_text = altText;
            return image;
        })
        .filter((image): image is ListingImage => image !== null);

    return images.length > 0 ? images : undefined;
}

function asShippingAddress(value: unknown): MarketplaceCheckout["shipping_address"] | MarketplaceOrder["shipping_address"] | undefined {
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    const address = asRecord(value);
    if (!address) return undefined;
    if (
        typeof address.address_line_1 !== "string" ||
        typeof address.city !== "string" ||
        typeof address.region !== "string"
    ) {
        return undefined;
    }
    return {
        full_name: asString(address.full_name),
        name: asString(address.name),
        address_line_1: address.address_line_1,
        address_line_2: asString(address.address_line_2),
        city: address.city,
        region: address.region,
        postal_code: asString(address.postal_code),
        country: asString(address.country),
        phone: asString(address.phone),
    };
}

function asOffer(value: unknown): Offer | null {
    const record = asRecord(value);
    if (!record) return null;
    if (typeof record.id !== "string" || typeof record.listing_id !== "string" || typeof record.buyer_id !== "string" || typeof record.seller_id !== "string" || typeof record.status !== "string") {
        return null;
    }

    const offer: Offer = {
        id: record.id,
        listing_id: record.listing_id,
        buyer_id: record.buyer_id,
        seller_id: record.seller_id,
        status: record.status,
        amount: asNumber(record.amount) ?? 0,
    };

    offer.quantity = asNumber(record.quantity);
    offer.currency = asString(record.currency);
    offer.buyer_username = asString(record.buyer_username);
    offer.seller_username = asString(record.seller_username);
    offer.message = asString(record.message);
    offer.listing_title = asString(record.listing_title);
    offer.parent_offer_id = asString(record.parent_offer_id);
    offer.counter_amount = asNumber(record.counter_amount);
    offer.counter_message = asString(record.counter_message);
    offer.responded_at = asString(record.responded_at);
    offer.response_message = asString(record.response_message);
    offer.created_at = asString(record.created_at);
    offer.updated_at = asString(record.updated_at);
    offer.expires_at = asString(record.expires_at);

    return offer;
}

function extractOffers(raw: unknown): Offer[] {
    const root = asRecord(raw);
    if (!root) return [];
    const data = asRecord(root.data);
    const candidates: unknown[] = [
        data?.offers,
        data?.items,
        data,
        root.offers,
        root.items,
        root,
    ];
    for (const candidate of candidates) {
        if (!Array.isArray(candidate)) continue;
        return candidate
            .map((entry) => asOffer(entry))
            .filter((entry): entry is Offer => entry !== null);
    }
    return [];
}

function asOrder(value: unknown): MarketplaceOrder | null {
    const record = asRecord(value);
    if (!record) return null;
    if (typeof record.id !== "string" || typeof record.status !== "string") return null;

    const listingId = asString(record.listing_id) ?? "";
    const buyerId = asString(record.buyer_id) ?? "";
    const sellerId = asString(record.seller_id) ?? "";

    const order: MarketplaceOrder = {
        id: record.id,
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: sellerId,
        status: record.status,
    };

    order.buyer_username = asString(record.buyer_username);
    order.seller_username = asString(record.seller_username);
    order.quantity = asNumber(record.quantity);
    order.total = asNumber(record.total);
    order.total_price = asNumber(record.total_price);
    if (record.delivery_method === "SHIPPING" || record.delivery_method === "IN_PERSON" || record.delivery_method === "PICKUP") {
        order.delivery_method = record.delivery_method;
    }
    order.shipping_address = asShippingAddress(record.shipping_address);
    order.shipping_name = asString(record.shipping_name);
    order.shipping_phone = asString(record.shipping_phone);
    order.shipping_city = asString(record.shipping_city);
    order.shipping_region = asString(record.shipping_region);
    order.shipping_postal = asString(record.shipping_postal);
    order.carrier = asString(record.carrier) ?? asString(asRecord(record.shipment)?.carrier);
    order.tracking_number = asString(record.tracking_number) ?? asString(asRecord(record.shipment)?.tracking_number);
    order.tracking_url = asString(record.tracking_url) ?? asString(asRecord(record.shipment)?.tracking_url);
    order.created_at = asString(record.created_at);
    order.updated_at = asString(record.updated_at);
    if (asRecord(record.review)) {
        order.review = record.review as MarketplaceOrder["review"];
    }

    return order;
}

function extractOrders(raw: unknown): MarketplaceOrder[] {
    const root = asRecord(raw);
    if (!root) return [];
    const data = asRecord(root.data);
    const candidates: unknown[] = [
        data?.orders,
        data?.items,
        data,
        root.orders,
        root.items,
        root,
    ];
    for (const candidate of candidates) {
        if (!Array.isArray(candidate)) continue;
        return candidate
            .map((entry) => asOrder(entry))
            .filter((entry): entry is MarketplaceOrder => entry !== null);
    }
    return [];
}

function asCheckout(value: unknown): MarketplaceCheckout | null {
    const record = asRecord(value);
    if (!record) return null;
    if (typeof record.id !== "string" || record.id.length === 0) return null;

    const checkout: MarketplaceCheckout = { id: record.id };

    if (typeof record.listing_id === "string") checkout.listing_id = record.listing_id;
    if (
        record.payment_method === "WEBPAY"
        || record.payment_method === "MERCADOPAGO"
        || record.payment_method === "BANK_TRANSFER"
        || record.payment_method === "TRANSFER"
    ) {
        checkout.payment_method = record.payment_method;
    }
    if (record.delivery_method === "SHIPPING" || record.delivery_method === "PICKUP" || record.delivery_method === "IN_PERSON") {
        checkout.delivery_method = record.delivery_method;
    }
    if (typeof record.status === "string") checkout.status = record.status;
    if (typeof record.total === "number") checkout.total = record.total;
    if (typeof record.subtotal === "number") checkout.subtotal = record.subtotal;
    if (typeof record.shipping_cost === "number") checkout.shipping_cost = record.shipping_cost;
    if (typeof record.platform_fee === "number") checkout.platform_fee = record.platform_fee;
    if (typeof record.quantity === "number") checkout.quantity = record.quantity;
    if (typeof record.item_summary === "string") checkout.item_summary = record.item_summary;
    if (typeof record.item_name === "string") checkout.item_name = record.item_name;
    if (typeof record.order_number === "string") checkout.order_number = record.order_number;
    if (typeof record.payment_url === "string") checkout.payment_url = record.payment_url;
    if (typeof record.created_at === "string") checkout.created_at = record.created_at;

    checkout.shipping_address = asShippingAddress(record.shipping_address);

    return checkout;
}

function extractCheckout(raw: unknown): MarketplaceCheckout | null {
    const root = asRecord(raw);
    if (!root) return null;

    const data = asRecord(root.data);
    const candidates: unknown[] = [
        data?.checkout,
        data,
        root.checkout,
        root,
    ];
    for (const candidate of candidates) {
        const checkout = asCheckout(candidate);
        if (checkout) return checkout;
    }
    return null;
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
        meta: normalizeMeta(rawMeta, items.length),
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
        meta: normalizeMeta(rawMeta, cards.length),
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
        meta: normalizeMeta(rawMeta, items.length),
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

export async function getMyOffers(params?: Params): Promise<{ data: Offer[]; meta?: PaginationMeta }> {
    const raw = await apiFetch<Record<string, unknown>>("/marketplace/offers/mine", params, { cache: "no-store" });
    const root = asRecord(raw);
    const data = root ? asRecord(root.data) : null;
    const rawMeta = (root?.meta ?? data?.meta) as Record<string, unknown> | undefined;
    const offers = extractOffers(raw);
    return { data: offers, meta: normalizeMeta(rawMeta, offers.length) };
}

// ── My Listings ──

export async function getMyListings(params?: Params) {
    return apiFetch<{ data?: Listing[]; listings?: Listing[]; meta?: PaginationMeta }>("/marketplace/listings/mine", params, { cache: "no-store" });
}

export async function createOffer(listingId: string, payload: { amount: number; message?: string }) {
    return apiPost<{ offer: Offer }>(`/marketplace/listings/${encodeURIComponent(listingId)}/offers`, payload);
}

export async function getListingOffers(listingId: string): Promise<{ data: Offer[]; meta?: PaginationMeta }> {
    const raw = await apiFetch<Record<string, unknown>>(`/marketplace/listings/${encodeURIComponent(listingId)}/offers`, undefined, { cache: "no-store" });
    const root = asRecord(raw);
    const data = root ? asRecord(root.data) : null;
    const rawMeta = (root?.meta ?? data?.meta) as Record<string, unknown> | undefined;
    const offers = extractOffers(raw);
    return { data: offers, meta: normalizeMeta(rawMeta, offers.length) };
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

export async function buyListing(listingId: string, payload: CheckoutListingPayload): Promise<MarketplaceCheckout> {
    const raw = await apiPost<Record<string, unknown>>(
        `/marketplace/listings/${encodeURIComponent(listingId)}/buy`,
        payload,
    );
    const checkout = extractCheckout(raw);
    if (!checkout) {
        throw new Error("Respuesta inválida al iniciar la compra");
    }
    return checkout;
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
export async function checkoutListing(listingId: string, payload: CheckoutListingPayload) {
    return buyListing(listingId, payload);
}

export async function getCheckout(checkoutId: string): Promise<MarketplaceCheckout> {
    const raw = await apiFetch<Record<string, unknown>>(
        `/marketplace/checkouts/${encodeURIComponent(checkoutId)}`,
        undefined,
        { cache: "no-store" },
    );
    const checkout = extractCheckout(raw);
    if (!checkout) {
        throw new Error("Checkout no encontrado");
    }
    return checkout;
}

export async function payCheckout(checkoutId: string, payload?: { provider?: string }): Promise<CheckoutPaymentResult> {
    const raw = await apiPost<Record<string, unknown>>(
        `/marketplace/checkouts/${encodeURIComponent(checkoutId)}/pay`,
        payload ?? {},
    );
    const data = asRecord(raw.data);
    const base = data ?? raw;
    return {
        checkout_id: typeof base.checkout_id === "string" ? base.checkout_id : undefined,
        payment_id: typeof base.payment_id === "string" ? base.payment_id : undefined,
        payment_url: typeof base.payment_url === "string" ? base.payment_url : undefined,
        provider: typeof base.provider === "string" ? base.provider : undefined,
        payment_status: typeof base.payment_status === "string" ? base.payment_status : undefined,
    };
}

export async function getMarketplaceOrders(params?: Params): Promise<{ data: MarketplaceOrder[]; meta?: PaginationMeta }> {
    const raw = await apiFetch<Record<string, unknown>>("/marketplace/orders", params, { cache: "no-store" });
    const root = asRecord(raw);
    const data = root ? asRecord(root.data) : null;
    const rawMeta = (root?.meta ?? data?.meta) as Record<string, unknown> | undefined;
    const orders = extractOrders(raw);
    return { data: orders, meta: normalizeMeta(rawMeta, orders.length) };
}

export async function getMarketplaceOrderDetail(orderId: string): Promise<MarketplaceOrder> {
    const raw = await apiFetch<Record<string, unknown>>(`/marketplace/orders/${encodeURIComponent(orderId)}`, undefined, { cache: "no-store" });
    const root = asRecord(raw);
    const data = root ? asRecord(root.data) : null;
    const candidates: unknown[] = [data?.order, data, root?.order, root];
    for (const candidate of candidates) {
        const order = asOrder(candidate);
        if (order) return order;
    }
    throw new Error("Orden no encontrada");
}

export async function confirmDelivery(orderId: string) {
    return apiPost<{ order: MarketplaceOrder }>(`/marketplace/orders/${encodeURIComponent(orderId)}/confirm-delivery`, {});
}

export async function shipOrder(orderId: string, payload: { carrier?: string; carrier_name?: string; tracking_number?: string; tracking_url?: string }) {
    return apiPost<{ order: MarketplaceOrder }>(`/marketplace/orders/${encodeURIComponent(orderId)}/ship`, payload);
}

export async function cancelOrder(orderId: string) {
    return apiPost<{ order: MarketplaceOrder }>(`/marketplace/orders/${encodeURIComponent(orderId)}/cancel`, {});
}

// ── Reviews ──

export async function reviewOrder(orderId: string, payload: CreateReviewPayload) {
    return apiPost<{ review: MarketplaceReview }>(`/marketplace/orders/${encodeURIComponent(orderId)}/reviews`, payload);
}

// ── Disputes ──

export async function openDispute(orderId: string, payload: { reason: string; description?: string }) {
    return apiPost<{ dispute: Dispute }>(`/marketplace/orders/${encodeURIComponent(orderId)}/disputes`, payload);
}

export async function getDispute(disputeId: string) {
    return apiFetch<{ data?: Dispute; dispute?: Dispute }>(`/marketplace/disputes/${encodeURIComponent(disputeId)}`, undefined, { cache: "no-store" });
}

export async function addDisputeEvidence(disputeId: string, payload: AddDisputeEvidencePayload) {
    return apiPost<{ evidence: DisputeEvidence }>(`/marketplace/disputes/${encodeURIComponent(disputeId)}/evidence`, payload);
}

export async function sendDisputeMessage(disputeId: string, payload: { content: string }) {
    return apiPost<{ message: DisputeMessage }>(`/marketplace/disputes/${encodeURIComponent(disputeId)}/message`, payload);
}

export async function respondToDispute(disputeId: string, payload: RespondToDisputePayload) {
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

export async function updatePriceAlert(alertId: string, payload: UpdatePriceAlertPayload) {
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

export async function setupSellerProfile(payload: SetupSellerProfilePayload) {
    return apiPost<{ seller: SellerProfile }>("/marketplace/seller/setup", payload);
}

export async function getMySellerProfile() {
    return apiFetch<{ data?: SellerProfile; seller?: SellerProfile }>("/marketplace/seller/me", undefined, { cache: "no-store" });
}

export async function updateSellerProfile(payload: UpdateSellerProfilePayload) {
    return apiPatch<{ seller: SellerProfile }>("/marketplace/seller/me", payload);
}

// ── Bank Accounts ──

export async function addBankAccount(payload: AddBankAccountPayload) {
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
    const res = await fetch(`${BASE_URL}/marketplace/uploads`, {
        method: "POST",
        headers,
        body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
}

export async function uploadMarketplaceFile(payload: UploadMarketplaceFilePayload) {
    return apiPost<{ url: string }>("/marketplace/uploads", payload);
}

// ── User Reviews ──

export async function getMarketplaceUserReviews(userId: string, params?: Params) {
    return apiFetch<{ data?: MarketplaceReview[]; reviews?: MarketplaceReview[]; meta?: PaginationMeta }>(`/marketplace/users/${encodeURIComponent(userId)}/reviews`, params, { revalidate: 60 });
}
