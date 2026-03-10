// ── Catalog types ──

export interface CatalogGame {
    id: string;
    slug: string;
    name: string;
    short_name?: string;
    publisher?: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    is_active?: boolean;
    sort_order?: number;
    formats_count?: number;
    formats?: CatalogFormat[];
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
}

export interface CatalogFormat {
    id: string;
    slug: string;
    name: string;
    description?: string;
    is_ranked?: boolean;
    is_active?: boolean;
    sort_order?: number;
    rules_url?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
}

export interface CardSet {
    id: string;
    code: string;
    name: string;
    game_id?: string;
    release_date?: string | null;
    set_type?: string;
    total_cards?: number | null;
    logo_url?: string;
    icon_url?: string;
    is_active?: boolean;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
}

export interface Card {
    id: string;
    name: string;
    game_id?: string;
    type_line?: string;
    oracle_text?: string;
    flavor_text?: string;
    is_token?: boolean;
    metadata?: Record<string, unknown>;
    printings?: Printing[];
    created_at?: string;
    updated_at?: string;
}

export interface Printing {
    id: string;
    card_id?: string;
    set_id?: string;
    set_code?: string;
    set_name?: string;
    collector_number?: string;
    rarity?: string;
    image_url?: string;
    image_url_small?: string;
    image_url_art?: string;
    is_foil_available?: boolean;
    is_nonfoil_available?: boolean;
    is_first_edition?: boolean;
    artist?: string;
    frame_effects?: string[];
    promo_types?: string[];
    price_usd?: string;
    price_clp?: number;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
}

export interface LegalityEntry {
    format_id: string;
    format_slug?: string;
    format_name?: string;
    legality: "LEGAL" | "BANNED" | "RESTRICTED" | "NOT_LEGAL";
}

export interface AutocompleteResult {
    id: string;
    name: string;
    set_code?: string;
    collector_number?: string;
    image_url?: string;
}

export interface PricePoint {
    date: string;
    price_usd?: string;
    price_clp?: number;
}

export interface GamesResponse {
    success?: boolean;
    data?: CatalogGame[];
    games?: CatalogGame[];
}
