// Tipos del flujo v2 del marketplace (post WS-B+NEW-2):
// orders v2, pickup points, seller onboarding y /me endpoints.

export type OrderV2Status =
    | "PENDING_PAYMENT"
    | "PAID"
    | "READY_FOR_PICKUP"
    | "PICKED_UP"
    | "DELIVERED"
    | "COMPLETED"
    | "DISPUTED"
    | "CANCELLED"
    | "REFUNDED";

export type OrderV2Role = "buyer" | "seller";

export interface OrderV2Listing {
    id?: string;
    public_id?: string;
    title?: string;
    image_url?: string;
    card_image_url?: string;
    price?: number;
}

export interface OrderV2Party {
    id?: string;
    display_name?: string;
    username?: string;
    avatar_url?: string;
    phone?: string;
}

export interface OrderV2PickupPoint {
    id?: string;
    public_id?: string;
    name?: string;
    address?: string;
    city?: string;
    region?: string;
    status?: PickupPointStatus;
}

export interface OrderV2 {
    id?: string;
    public_id: string;
    status: OrderV2Status;
    quantity?: number;
    unit_price?: number;
    total?: number;
    commission?: number;
    seller_net?: number;
    listing_id?: string;
    listing?: OrderV2Listing;
    buyer?: OrderV2Party;
    seller?: OrderV2Party;
    pickup_point?: OrderV2PickupPoint;
    pickup_point_id?: string;
    created_at?: string;
    updated_at?: string;
    paid_at?: string;
    ready_at?: string;
    picked_up_at?: string;
    delivered_at?: string;
    completed_at?: string;
    cancelled_at?: string;
}

export type PickupPointStatus = "ACTIVE" | "COMING_SOON" | "INACTIVE";

export interface PickupPoint {
    id: string;
    public_id?: string;
    name: string;
    address?: string;
    city?: string;
    region?: string;
    status: PickupPointStatus;
    opening_hours?: string;
    notes?: string;
}

export interface CreateOrderPayload {
    listing_id: string;
    pickup_point_id: string;
    quantity: number;
}

// ── /marketplace/me ──

export interface MarketplaceMe {
    user_id?: string;
    username?: string;
    display_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    is_seller: boolean;
    seller?: {
        display_name?: string;
        phone?: string;
        rut?: string;
        created_at?: string;
    };
}

export interface MarketplaceMeSummary {
    orders_buyer_count: number;
    orders_seller_count: number;
    wallet_balance_clp: number;
}

// ── Seller onboarding ──

export interface SellerOnboardingPayload {
    display_name: string;
    rut: string;
    phone?: string;
}

export interface UpdateMeSellerPayload {
    display_name?: string;
    phone?: string;
}
