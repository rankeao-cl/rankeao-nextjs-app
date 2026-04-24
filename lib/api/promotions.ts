// API client para promociones (chapitas + sorteos, WS-I).
// Endpoints bajo /marketplace/promotions/* y /marketplace/me/chapitas.

import { apiFetch, apiPost } from "./client";
import type {
    Chapita,
    FreeFormEntryPayload,
    FreeFormEntryResponse,
    MintChapitaPayload,
    MintChapitaResponse,
    Promotion,
    PromotionStatus,
    Winner,
} from "@/lib/types/promotions";

// ── Helpers de normalizacion (defensivos: el backend puede evolucionar
//    devolviendo campos con nombres alternativos, ver patron marketplace-v2). ──

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

function asPromotionStatus(value: unknown): PromotionStatus {
    const s = typeof value === "string" ? value.toUpperCase() : "";
    const allowed: PromotionStatus[] = [
        "DRAFT", "ACTIVE", "SALES_CLOSED", "DRAWN", "DELIVERED", "CANCELLED",
    ];
    return (allowed as string[]).includes(s) ? (s as PromotionStatus) : "ACTIVE";
}

function normalizePromotion(raw: unknown): Promotion | null {
    const r = asRecord(raw);
    if (!r) return null;
    const slug = asString(r.slug);
    const title = asString(r.title) ?? asString(r.name);
    if (!slug || !title) return null;
    return {
        id: asString(r.id),
        slug,
        title,
        description: asString(r.description),
        prize: asString(r.prize),
        art_url: asString(r.art_url) ?? asString(r.image_url),
        image_url: asString(r.image_url) ?? asString(r.art_url),
        edition_size: asNumber(r.edition_size),
        minted_count: asNumber(r.minted_count),
        price: asNumber(r.price),
        status: asPromotionStatus(r.status),
        activated_at: asString(r.activated_at),
        sales_close_at: asString(r.sales_close_at),
        draw_at: asString(r.draw_at),
        bases_url: asString(r.bases_url),
        created_at: asString(r.created_at),
    };
}

function normalizeChapita(raw: unknown): Chapita | null {
    const r = asRecord(raw);
    if (!r) return null;
    const hash = asString(r.chapita_hash) ?? asString(r.hash);
    if (!hash) return null;
    return {
        id: asString(r.id),
        promotion_id: asString(r.promotion_id),
        promotion_slug: asString(r.promotion_slug),
        promotion_title: asString(r.promotion_title),
        promotion_art_url: asString(r.promotion_art_url) ?? asString(r.promotion_image_url),
        serial_number: asNumber(r.serial_number),
        chapita_hash: hash,
        order_id: asString(r.order_id),
        order_public_id: asString(r.order_public_id),
        minted_at: asString(r.minted_at),
        created_at: asString(r.created_at) ?? asString(r.minted_at),
    };
}

function normalizeWinner(raw: unknown): Winner | null {
    const r = asRecord(raw);
    if (!r) return null;
    const source = asString(r.source);
    const typedSource: Winner["source"] =
        source === "CHAPITA_PURCHASE" || source === "FREE_FORM" ? source : undefined;
    return {
        id: asString(r.id),
        promotion_slug: asString(r.promotion_slug),
        winner_index: asNumber(r.winner_index),
        serial_number: asNumber(r.serial_number),
        chapita_hash: asString(r.chapita_hash),
        source: typedSource,
        full_name: asString(r.full_name),
        username: asString(r.username),
        display_name: asString(r.display_name),
        draw_at: asString(r.draw_at),
        drawn_at: asString(r.drawn_at),
        seed: asString(r.seed),
        salt_revealed: asString(r.salt_revealed),
    };
}

// Extrae el array de `data`/`promotions`/`chapitas`/`winners` segun el caso.
function extractArray<T>(res: unknown, keys: string[]): T[] {
    const r = asRecord(res);
    if (!r) return [];
    if (Array.isArray(r.data)) return r.data as T[];
    for (const k of keys) {
        if (Array.isArray(r[k])) return r[k] as T[];
    }
    const data = asRecord(r.data);
    if (data) {
        for (const k of keys) {
            if (Array.isArray(data[k])) return data[k] as T[];
        }
    }
    return [];
}

function extractObject(res: unknown): unknown {
    const r = asRecord(res);
    if (!r) return null;
    if (r.data !== undefined) return r.data;
    return r;
}

// ── Endpoints ──

export async function fetchPromotions(): Promise<Promotion[]> {
    const res = await apiFetch<unknown>("/marketplace/promotions", undefined, { revalidate: 60 });
    const arr = extractArray<unknown>(res, ["promotions"]);
    return arr.map(normalizePromotion).filter((p): p is Promotion => p !== null);
}

export async function fetchPromotion(slug: string): Promise<Promotion | null> {
    const res = await apiFetch<unknown>(`/marketplace/promotions/${encodeURIComponent(slug)}`, undefined, { revalidate: 60 });
    const raw = extractObject(res);
    const r = asRecord(raw);
    if (r && r.promotion) return normalizePromotion(r.promotion);
    return normalizePromotion(raw);
}

export async function mintChapita(
    slug: string,
    payload: MintChapitaPayload = {}
): Promise<MintChapitaResponse> {
    const res = await apiPost<unknown>(
        `/marketplace/promotions/${encodeURIComponent(slug)}/chapitas/mint`,
        payload
    );
    const raw = extractObject(res);
    const r = asRecord(raw);
    if (!r) return {};
    return {
        order_id: asString(r.order_id),
        order_public_id: asString(r.order_public_id),
        redirect_url: asString(r.redirect_url),
        chapita: normalizeChapita(r.chapita) ?? undefined,
    };
}

export async function submitFreeFormEntry(
    slug: string,
    payload: FreeFormEntryPayload
): Promise<FreeFormEntryResponse> {
    const res = await apiPost<unknown>(
        `/marketplace/promotions/${encodeURIComponent(slug)}/entries/free-form`,
        payload
    );
    const raw = extractObject(res);
    const r = asRecord(raw);
    if (!r) return {};
    return {
        id: asString(r.id),
        created_at: asString(r.created_at),
        message: asString(r.message),
    };
}

export async function fetchMyChapitas(): Promise<Chapita[]> {
    const res = await apiFetch<unknown>("/marketplace/me/chapitas", undefined, {
        revalidate: 30,
    });
    const arr = extractArray<unknown>(res, ["chapitas", "entries"]);
    return arr.map(normalizeChapita).filter((c): c is Chapita => c !== null);
}

export async function fetchWinners(slug: string): Promise<Winner[]> {
    const res = await apiFetch<unknown>(
        `/marketplace/promotions/${encodeURIComponent(slug)}/winners`,
        undefined,
        { revalidate: 60 }
    );
    const arr = extractArray<unknown>(res, ["winners"]);
    return arr.map(normalizeWinner).filter((w): w is Winner => w !== null);
}
