// Tipos de promociones (chapitas + sorteos, WS-I).
// Alineados con commerce.promotions y endpoints /marketplace/promotions/*.

export type PromotionStatus =
    | "DRAFT"
    | "ACTIVE"
    | "SALES_CLOSED"
    | "DRAWN"
    | "DELIVERED"
    | "CANCELLED";

export interface Promotion {
    id?: string;
    slug: string;
    title: string;
    description?: string;
    prize?: string;
    art_url?: string;
    image_url?: string;
    edition_size?: number;
    minted_count?: number;
    price?: number;
    status: PromotionStatus;
    activated_at?: string;
    sales_close_at?: string;
    draw_at?: string;
    bases_url?: string;
    created_at?: string;
}

export interface Chapita {
    id?: string;
    promotion_id?: string;
    promotion_slug?: string;
    promotion_title?: string;
    promotion_art_url?: string;
    serial_number?: number;
    chapita_hash: string;
    order_id?: string;
    order_public_id?: string;
    minted_at?: string;
    created_at?: string;
}

export interface FreeFormEntryPayload {
    rut: string;
    full_name: string;
    email?: string;
    comuna?: string;
    captcha_token: string;
}

export interface FreeFormEntryResponse {
    id?: string;
    created_at?: string;
    message?: string;
}

export interface MintChapitaPayload {
    order_id?: string;
    idempotency_key?: string;
}

export interface MintChapitaResponse {
    order_id?: string;
    order_public_id?: string;
    redirect_url?: string;
    chapita?: Chapita;
}

export interface Winner {
    id?: string;
    promotion_slug?: string;
    winner_index?: number;
    serial_number?: number;
    chapita_hash?: string;
    source?: "CHAPITA_PURCHASE" | "FREE_FORM";
    full_name?: string;
    username?: string;
    display_name?: string;
    draw_at?: string;
    drawn_at?: string;
    seed?: string;
    salt_revealed?: string;
}
