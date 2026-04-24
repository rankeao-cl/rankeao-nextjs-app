// API client para el flujo v2 del marketplace (post WS-B+NEW-2):
// /marketplace/v2/orders, /marketplace/pickup-points, /marketplace/me y /marketplace/seller/onboarding/start.

import { apiFetch, apiPost, apiPatch } from "./client";
import type {
    CreateOrderPayload,
    MarketplaceMe,
    MarketplaceMeSummary,
    OrderV2,
    OrderV2Listing,
    OrderV2Party,
    OrderV2PickupPoint,
    OrderV2Role,
    OrderV2Status,
    PickupPoint,
    PickupPointStatus,
    SellerOnboardingPayload,
    UpdateMeSellerPayload,
} from "@/lib/types/marketplace-v2";

// ── Helpers ──

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

function asBoolean(value: unknown): boolean {
    return typeof value === "boolean" ? value : false;
}

function asStatus(value: unknown): OrderV2Status {
    const s = typeof value === "string" ? value.toUpperCase() : "";
    const allowed: OrderV2Status[] = [
        "PENDING_PAYMENT", "PAID", "READY_FOR_PICKUP", "PICKED_UP",
        "DELIVERED", "COMPLETED", "DISPUTED", "CANCELLED", "REFUNDED",
    ];
    return (allowed as string[]).includes(s) ? (s as OrderV2Status) : "PENDING_PAYMENT";
}

function asPickupStatus(value: unknown): PickupPointStatus {
    const s = typeof value === "string" ? value.toUpperCase() : "";
    if (s === "ACTIVE" || s === "COMING_SOON" || s === "INACTIVE") return s;
    return "INACTIVE";
}

function asParty(value: unknown): OrderV2Party | undefined {
    const r = asRecord(value);
    if (!r) return undefined;
    const out: OrderV2Party = {};
    out.id = asString(r.id) ?? asString(r.user_id) ?? asString(r.public_id);
    out.display_name = asString(r.display_name) ?? asString(r.name);
    out.username = asString(r.username);
    out.avatar_url = asString(r.avatar_url);
    out.phone = asString(r.phone);
    return out;
}

function asListingInfo(value: unknown): OrderV2Listing | undefined {
    const r = asRecord(value);
    if (!r) return undefined;
    const out: OrderV2Listing = {};
    out.id = asString(r.id);
    out.public_id = asString(r.public_id);
    out.title = asString(r.title) ?? asString(r.card_name);
    out.image_url = asString(r.image_url) ?? asString(r.card_image_url);
    out.card_image_url = asString(r.card_image_url);
    out.price = asNumber(r.price);
    return out;
}

function asOrderPickupPoint(value: unknown): OrderV2PickupPoint | undefined {
    const r = asRecord(value);
    if (!r) return undefined;
    const out: OrderV2PickupPoint = {};
    out.id = asString(r.id);
    out.public_id = asString(r.public_id);
    out.name = asString(r.name);
    out.address = asString(r.address);
    out.city = asString(r.city);
    out.region = asString(r.region);
    if (r.status !== undefined) out.status = asPickupStatus(r.status);
    return out;
}

function normalizeOrder(value: unknown): OrderV2 | null {
    const r = asRecord(value);
    if (!r) return null;
    const publicId = asString(r.public_id) ?? asString(r.id);
    if (!publicId) return null;

    const order: OrderV2 = {
        public_id: publicId,
        status: asStatus(r.status),
    };

    order.id = asString(r.id);
    order.quantity = asNumber(r.quantity);
    order.unit_price = asNumber(r.unit_price) ?? asNumber(r.price);
    order.total = asNumber(r.total) ?? asNumber(r.total_price);
    order.commission = asNumber(r.commission) ?? asNumber(r.platform_fee);
    order.seller_net = asNumber(r.seller_net);
    order.listing_id = asString(r.listing_id);
    order.listing = asListingInfo(r.listing);
    order.buyer = asParty(r.buyer);
    order.seller = asParty(r.seller);
    order.pickup_point = asOrderPickupPoint(r.pickup_point);
    order.pickup_point_id = asString(r.pickup_point_id);
    order.created_at = asString(r.created_at);
    order.updated_at = asString(r.updated_at);
    order.paid_at = asString(r.paid_at);
    order.ready_at = asString(r.ready_at);
    order.picked_up_at = asString(r.picked_up_at);
    order.delivered_at = asString(r.delivered_at);
    order.completed_at = asString(r.completed_at);
    order.cancelled_at = asString(r.cancelled_at);

    return order;
}

function extractOrders(raw: unknown): OrderV2[] {
    const root = asRecord(raw);
    if (!root) return [];
    const data = asRecord(root.data);
    const candidates: unknown[] = [
        data?.orders, data?.items, data, root.orders, root.items, root,
    ];
    for (const candidate of candidates) {
        if (!Array.isArray(candidate)) continue;
        return candidate
            .map(normalizeOrder)
            .filter((o): o is OrderV2 => o !== null);
    }
    return [];
}

function extractOrder(raw: unknown): OrderV2 | null {
    const root = asRecord(raw);
    if (!root) return null;
    const data = asRecord(root.data);
    const candidates = [data?.order, data, root.order, root];
    for (const c of candidates) {
        const o = normalizeOrder(c);
        if (o) return o;
    }
    return null;
}

function normalizePickupPoint(value: unknown): PickupPoint | null {
    const r = asRecord(value);
    if (!r) return null;
    const id = asString(r.id) ?? asString(r.public_id);
    const name = asString(r.name);
    if (!id || !name) return null;
    return {
        id,
        public_id: asString(r.public_id),
        name,
        address: asString(r.address),
        city: asString(r.city),
        region: asString(r.region),
        status: asPickupStatus(r.status),
        opening_hours: asString(r.opening_hours),
        notes: asString(r.notes),
    };
}

function extractPickupPoints(raw: unknown): PickupPoint[] {
    const root = asRecord(raw);
    if (!root) return [];
    const data = asRecord(root.data);
    const candidates: unknown[] = [
        data?.pickup_points, data?.items, data, root.pickup_points, root.items, root,
    ];
    for (const candidate of candidates) {
        if (!Array.isArray(candidate)) continue;
        return candidate
            .map(normalizePickupPoint)
            .filter((p): p is PickupPoint => p !== null);
    }
    return [];
}

function normalizeMe(raw: unknown): MarketplaceMe {
    const root = asRecord(raw);
    const data = asRecord(root?.data) ?? root ?? {};
    const userNode = asRecord(data.user) ?? data;
    const sellerNode = asRecord(data.seller);

    return {
        user_id: asString(userNode.id) ?? asString(userNode.user_id) ?? asString(userNode.public_id),
        username: asString(userNode.username),
        display_name: asString(userNode.display_name) ?? asString(userNode.name),
        email: asString(userNode.email),
        phone: asString(userNode.phone),
        avatar_url: asString(userNode.avatar_url),
        is_seller: asBoolean(data.is_seller) || !!sellerNode,
        seller: sellerNode
            ? {
                display_name: asString(sellerNode.display_name),
                phone: asString(sellerNode.phone),
                rut: asString(sellerNode.rut),
                created_at: asString(sellerNode.created_at),
            }
            : undefined,
    };
}

function normalizeMeSummary(raw: unknown): MarketplaceMeSummary {
    const root = asRecord(raw);
    const data = asRecord(root?.data) ?? root ?? {};
    return {
        orders_buyer_count: asNumber(data.orders_buyer_count) ?? 0,
        orders_seller_count: asNumber(data.orders_seller_count) ?? 0,
        wallet_balance_clp: asNumber(data.wallet_balance_clp) ?? 0,
    };
}

// ── Orders v2 ──

export async function listOrdersV2(role: OrderV2Role): Promise<OrderV2[]> {
    const raw = await apiFetch<Record<string, unknown>>(
        "/marketplace/v2/orders",
        { role },
        { cache: "no-store" },
    );
    return extractOrders(raw);
}

export async function getOrderV2(publicId: string): Promise<OrderV2> {
    const raw = await apiFetch<Record<string, unknown>>(
        `/marketplace/v2/orders/${encodeURIComponent(publicId)}`,
        undefined,
        { cache: "no-store" },
    );
    const order = extractOrder(raw);
    if (!order) throw new Error("Orden no encontrada");
    return order;
}

export async function createOrderV2(payload: CreateOrderPayload): Promise<OrderV2> {
    const raw = await apiPost<Record<string, unknown>>("/marketplace/v2/orders", payload);
    const order = extractOrder(raw);
    if (!order) throw new Error("No se pudo crear la orden");
    return order;
}

export async function markOrderShipped(publicId: string): Promise<OrderV2> {
    const raw = await apiPost<Record<string, unknown>>(
        `/marketplace/v2/orders/${encodeURIComponent(publicId)}/shipped`, {});
    const order = extractOrder(raw);
    if (!order) throw new Error("No se pudo actualizar la orden");
    return order;
}

export async function markOrderPickedUp(publicId: string): Promise<OrderV2> {
    const raw = await apiPost<Record<string, unknown>>(
        `/marketplace/v2/orders/${encodeURIComponent(publicId)}/picked-up`, {});
    const order = extractOrder(raw);
    if (!order) throw new Error("No se pudo actualizar la orden");
    return order;
}

export async function confirmOrderDelivery(publicId: string): Promise<OrderV2> {
    const raw = await apiPost<Record<string, unknown>>(
        `/marketplace/v2/orders/${encodeURIComponent(publicId)}/confirm-delivery`, {});
    const order = extractOrder(raw);
    if (!order) throw new Error("No se pudo confirmar la entrega");
    return order;
}

export async function cancelOrderV2(publicId: string): Promise<OrderV2> {
    const raw = await apiPost<Record<string, unknown>>(
        `/marketplace/v2/orders/${encodeURIComponent(publicId)}/cancel`, {});
    const order = extractOrder(raw);
    if (!order) throw new Error("No se pudo cancelar la orden");
    return order;
}

// ── Pickup points ──

export async function listPickupPoints(): Promise<PickupPoint[]> {
    const raw = await apiFetch<Record<string, unknown>>(
        "/marketplace/pickup-points",
        undefined,
        { revalidate: 60 },
    );
    return extractPickupPoints(raw);
}

// ── Seller onboarding ──

export async function startSellerOnboarding(payload: SellerOnboardingPayload): Promise<Record<string, unknown>> {
    return apiPost<Record<string, unknown>>("/marketplace/seller/onboarding/start", payload);
}

// ── /marketplace/me ──

export async function getMarketplaceMe(): Promise<MarketplaceMe> {
    const raw = await apiFetch<Record<string, unknown>>(
        "/marketplace/me",
        undefined,
        { cache: "no-store" },
    );
    return normalizeMe(raw);
}

export async function getMarketplaceMeSummary(): Promise<MarketplaceMeSummary> {
    const raw = await apiFetch<Record<string, unknown>>(
        "/marketplace/me/summary",
        undefined,
        { cache: "no-store" },
    );
    return normalizeMeSummary(raw);
}

export async function updateMarketplaceMeSeller(payload: UpdateMeSellerPayload): Promise<MarketplaceMe> {
    const raw = await apiPatch<Record<string, unknown>>("/marketplace/me/seller", payload);
    return normalizeMe(raw);
}
