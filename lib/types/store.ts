import type { PaginationMeta } from "./api";

// ── Store types ──

export interface Product {
    id: string;
    name?: string;
    title?: string;
    slug?: string;
    price?: number;
    compare_at_price?: number;
    currency?: string;
    card_condition?: string;
    is_foil?: boolean;
    game_id?: string;
    game_name?: string;
    category_id?: string;
    category_name?: string;
    tenant_id?: string;
    tenant_name?: string;
    tenant_slug?: string;
    images?: ProductImage[];
    variants?: ProductVariant[];
    city?: string;
    region?: string;
    stock?: number;
    is_active?: boolean;
    description?: string;
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
    id: string;
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
    tenant_slug: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    coupon?: AppliedCoupon;
    warnings?: CartWarning[];
}

export interface CartItem {
    id: string;
    product_id: string;
    variant_id?: string;
    name: string;
    image_url?: string;
    price: number;
    quantity: number;
    stock?: number;
}

export interface AppliedCoupon {
    code: string;
    discount_amount: number;
    discount_type: string;
}

export interface CartWarning {
    type: "PRICE_CHANGED" | "OUT_OF_STOCK" | "LOW_STOCK";
    item_id: string;
    message: string;
}

// ── Store Checkout & Orders ──

export interface StoreCheckoutRequest {
    delivery_method: "SHIPPING" | "PICKUP" | "IN_PERSON";
    payment_method: "WEBPAY" | "MERCADOPAGO" | "TRANSFER";
    shipping_address?: {
        name: string;
        address_line_1: string;
        address_line_2?: string;
        city: string;
        region: string;
        postal_code: string;
        country: string;
        phone?: string;
    };
}

export interface StoreOrder {
    id: string;
    tenant_id?: string;
    tenant_name?: string;
    status: string;
    items: StoreOrderItem[];
    subtotal: number;
    discount: number;
    shipping_cost?: number;
    total: number;
    payment_method?: string;
    delivery_method?: string;
    tracking_number?: string;
    tracking_url?: string;
    shipping_address?: Record<string, string>;
    review?: StoreOrderReview;
    created_at?: string;
    updated_at?: string;
}

export interface StoreOrderItem {
    product_id: string;
    product_name: string;
    variant_id?: string;
    variant_name?: string;
    price: number;
    quantity: number;
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
