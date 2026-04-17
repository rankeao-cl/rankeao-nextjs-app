import type { PaginationMeta } from "./api";

// ── Store types ──

export interface Product {
    id: string;
    name?: string;
    title?: string;
    slug?: string;
    short_description?: string;
    price?: number;
    compare_at_price?: number;
    compare_price?: number;
    currency?: string;
    card_condition?: string;
    is_foil?: boolean;
    is_first_edition?: boolean;
    game_id?: string;
    game_name?: string;
    category_id?: string;
    category_name?: string;
    category_slug?: string;
    tenant_id?: string;
    tenant_name?: string;
    tenant_slug?: string;
    tenant_city?: string;
    images?: ProductImage[];
    image_url?: string;
    variants?: ProductVariant[];
    city?: string;
    region?: string;
    stock?: number;
    in_stock?: boolean;
    is_featured?: boolean;
    is_active?: boolean;
    description?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
}

export interface ProductImage {
    url: string;
    thumbnail_url?: string;
    alt_text?: string;
    position?: number;
}

export interface ProductVariant {
    id: string | number;
    name: string;
    price?: number;
    stock?: number;
    sku?: string;
    attributes?: Record<string, string>;
}

export interface ProductsResponse {
    products: Product[];
    meta?: PaginationMeta;
    facets?: Record<string, unknown>;
}

export interface ProductCategory {
    id: string;
    name: string;
    slug?: string;
    parent_id?: string;
    children?: ProductCategory[];
}

// ── Cart ──

export interface Cart {
    tenant_slug?: string;
    items: CartItem[];
    item_count?: number;
    subtotal: number;
    discount: number;
    total: number;
    currency?: string;
    coupon?: AppliedCoupon;
    warnings?: CartWarning[];
}

export interface CartItem {
    id: string | number;
    product_id: string;
    variant_id?: string | number;
    name?: string;
    product_name?: string;
    image_url?: string;
    price?: number;
    unit_price?: number;
    quantity: number;
    total?: number;
    stock?: number;
    in_stock?: boolean;
    max_stock?: number;
}

export interface AppliedCoupon {
    code: string;
    discount_amount: number;
    discount_type: string;
}

export interface CartWarning {
    type: "PRICE_CHANGED" | "OUT_OF_STOCK" | "LOW_STOCK" | "PRODUCT_UNAVAILABLE";
    item_id: string;
    message: string;
}

// ── Store Checkout & Orders ──

export interface StoreCheckoutRequest {
    delivery_method: "SHIPPING" | "PICKUP" | "IN_PERSON";
    payment_method: "WEBPAY" | "MERCADOPAGO" | "TRANSFER";
    buyer_notes?: string;
    meetup_location?: string;
    meetup_date?: string;
    shipping_address?: {
        name: string;
        phone: string;
        address: string;
        city: string;
        region: string;
        postal_code?: string;
        country?: string;

        // Compatibilidad para payloads legados de frontend.
        address_line_1?: string;
        address_line_2?: string;
    };
}

export interface StoreCheckoutResponse {
    order: StoreOrder;
    payment_url?: string;
}

export interface StoreOrder {
    id: string;
    order_number?: string;
    order_type?: string;
    tenant_id?: string;
    tenant_name?: string;
    status: string;
    item_summary?: string;
    items?: StoreOrderItem[];
    subtotal: number;
    discount: number;
    shipping_cost?: number;
    total: number;
    currency?: string;
    payment_method?: string;
    delivery_method?: string;
    delivery_notes?: string;
    buyer_notes?: string;
    coupon_code?: string;
    coupon_discount?: number;
    tracking_number?: string;
    tracking_url?: string;
    shipping_address?: Record<string, string>;
    shipping?: {
        name?: string;
        phone?: string;
        address?: string;
        city?: string;
        region?: string;
        postal_code?: string;
        country?: string;
    };
    payment?: {
        id?: string;
        provider?: string;
        status?: string;
        amount?: number;
        currency?: string;
        provider_url?: string;
    };
    review?: StoreOrderReview;
    created_at?: string;
    updated_at?: string;
    paid_at?: string;
    shipped_at?: string;
    delivered_at?: string;
    completed_at?: string;
    cancelled_at?: string;
}

export interface StoreOrderItem {
    id?: string | number;
    product_id: string;
    product_name: string;
    variant_id?: string | number;
    variant_name?: string;
    product_sku?: string;
    unit_price?: number;
    price?: number;
    quantity: number;
    total?: number;
    image_url?: string;
}

export interface StoreOrderReview {
    overall_rating: number;
    condition_accuracy?: number;
    shipping_speed?: number;
    communication?: number;
    packaging?: number;
    comment?: string;
    created_at?: string;
}

// ── Payload types ──

export interface StoreReviewPayload {
    overall_rating: number;
    condition_accuracy?: number;
    shipping_speed?: number;
    communication?: number;
    packaging?: number;
    comment?: string;
}

export interface StorePayCheckoutPayload {
    provider?: string;
    payment_method?: string;
}
