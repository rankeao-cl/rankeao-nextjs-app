import type { PaginationMeta } from "./api";

// ── Marketplace types ──

export interface Listing {
    id: string;
    title: string;
    price?: number;
    currency?: string;
    card_condition?: string;
    card_language?: string;
    is_foil?: boolean;
    quantity?: number;
    card_id?: string;
    card_name?: string;
    printing_id?: string;
    game_id?: string;
    game_name?: string;
    set_name?: string;
    rarity?: string;
    accepts_offers?: boolean;
    accepts_shipping?: boolean;
    accepts_in_person?: boolean;
    // Seller — API returns nested object; flatten for display
    seller?: { username?: string; avatar_url?: string; is_store?: boolean };
    seller_id?: string;
    seller_username?: string;
    seller_avatar_url?: string;
    is_verified_store?: boolean;
    tenant_id?: string;
    tenant_name?: string;
    city?: string;
    region?: string;
    country?: string;
    lat?: number;
    lng?: number;
    card_image_url?: string;
    is_verified_seller?: boolean;
    images?: ListingImage[];
    status?: string;
    views_count?: number;
    favorites_count?: number;
    created_at?: string;
    updated_at?: string;
    expires_at?: string;
}

export interface ListingImage {
    url: string;
    thumbnail_url?: string;
    alt_text?: string;
}

export interface ListingDetail extends Listing {
    description?: string;
    price_context?: {
        min_price?: number;
        max_price?: number;
        avg_price?: number;
        listings_count?: number;
    };
    similar_listings?: Listing[];
}

export interface ListingsResponse {
    listings: Listing[];
    meta?: PaginationMeta;
    facets?: Record<string, unknown>;
}

export interface ListingFilters {
    q?: string;
    card_id?: string;
    condition?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
    page?: number;
    per_page?: number;
    game?: string;
    city?: string;
    seller_type?: string;
    category?: string;
    lat?: number;
    lng?: number;
    radius_km?: number;
    location?: string;
}

export interface CreateListingRequest {
    printing_id: string;
    price: number;
    currency?: string;
    card_condition: string;
    card_language?: string;
    is_foil?: boolean;
    quantity?: number;
    description?: string;
}

// ── Offers ──

export interface Offer {
    id: string;
    listing_id: string;
    buyer_id: string;
    buyer_username?: string;
    seller_id: string;
    seller_username?: string;
    amount: number;
    currency?: string;
    status: string;  // PENDING | ACCEPTED | REJECTED | COUNTERED | WITHDRAWN | EXPIRED
    message?: string;
    counter_amount?: number;
    created_at?: string;
    updated_at?: string;
    expires_at?: string;
}

export interface CreateOfferRequest {
    amount: number;
    message?: string;
}

// ── Checkout & Orders ──

export interface MarketplaceCheckout {
    id: string;
    listing_id: string;
    payment_method: "WEBPAY" | "MERCADOPAGO" | "TRANSFER";
    delivery_method: "SHIPPING" | "PICKUP" | "IN_PERSON";
    status: string;
    total: number;
    shipping_address?: ShippingAddress;
    payment_url?: string;
    created_at?: string;
}

export interface ShippingAddress {
    name: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    region: string;
    postal_code: string;
    country: string;
    phone?: string;
}

export type OrderStatus =
    | "PENDING"
    | "CONFIRMED"
    | "PAID"
    | "SHIPPED"
    | "DELIVERED"
    | "COMPLETED"
    | "CANCELLED"
    | "DISPUTED";

export interface MarketplaceOrder {
    id: string;
    listing_id: string;
    buyer_id: string;
    buyer_username?: string;
    seller_id: string;
    seller_username?: string;
    status: string;
    quantity?: number;
    total: number;
    total_price?: number;
    delivery_method?: "SHIPPING" | "IN_PERSON" | "PICKUP";
    shipping_address?: ShippingAddress | string;
    carrier?: string;
    tracking_number?: string;
    tracking_url?: string;
    listing?: Listing;
    review?: MarketplaceReview;
    created_at?: string;
    updated_at?: string;
}

// ── Reviews ──

export interface MarketplaceReview {
    id: string;
    order_id: string;
    reviewer_id: string;
    reviewer_username?: string;
    overall_rating: number;
    condition_accuracy?: number;
    shipping_speed?: number;
    communication?: number;
    packaging?: number;
    comment?: string;
    created_at?: string;
}

// ── Disputes ──

export interface Dispute {
    id: string;
    order_id?: string;
    listing_id?: string;
    reason: string;
    description?: string;
    status: string; // OPEN | UNDER_REVIEW | RESOLVED | CLOSED
    resolution?: string;
    evidence?: DisputeEvidence[];
    messages?: DisputeMessage[];
    created_at?: string;
    updated_at?: string;
}

export interface DisputeEvidence {
    id: string;
    type: string;
    url: string;
    description?: string;
    uploaded_by: string;
    created_at?: string;
}

export interface DisputeMessage {
    id: string;
    sender_id: string;
    sender_username?: string;
    content: string;
    created_at: string;
}

// ── Favorites, Price Alerts, Saved Searches ──

export interface Favorite {
    id: string;
    listing_id: string;
    listing?: Listing;
    created_at: string;
}

export interface PriceAlert {
    id: string;
    card_id?: string;
    card_name?: string;
    printing_id?: string;
    target_price: number;
    condition?: string;
    is_active: boolean;
    triggered?: boolean;
    created_at?: string;
}

export interface SavedSearch {
    id: string;
    name?: string;
    query: string;
    filters?: Record<string, unknown>;
    notify: boolean;
    created_at?: string;
}

// ── Seller ──

export interface SellerProfile {
    user_id: string;
    username: string;
    avatar_url?: string;
    display_name?: string;
    bio?: string;
    city?: string;
    region?: string;
    country?: string;
    rating?: number;
    review_count?: number;
    total_sales?: number;
    response_time?: string;
    is_verified?: boolean;
    created_at?: string;
}

export interface BankAccount {
    id: string;
    bank_name: string;
    account_type: string;
    account_number_last4: string;
    holder_name: string;
    is_primary: boolean;
    created_at?: string;
}

export interface Payout {
    id: string;
    amount: number;
    currency: string;
    status: string;
    bank_account_id: string;
    created_at?: string;
    processed_at?: string;
}
