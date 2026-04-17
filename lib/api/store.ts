import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import { ApiError } from "./errors";
import type {
    ProductsResponse,
    Product,
    ProductCategory,
    Cart,
    CartItem,
    AppliedCoupon,
    StoreOrder,
    StoreCheckoutRequest,
    StoreCheckoutResponse,
    StoreReviewPayload,
    StorePayCheckoutPayload,
    StoreOrderReview,
} from "@/lib/types/store";
import type { Params, PaginationMeta } from "@/lib/types/api";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
    return value !== null && typeof value === "object" ? (value as UnknownRecord) : null;
}

function asArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

function getData(raw: unknown): unknown {
    const root = asRecord(raw);
    return root && "data" in root ? root.data : raw;
}

function toNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function normalizeMeta(raw: unknown): PaginationMeta | undefined {
    const root = asRecord(raw);
    const data = asRecord(getData(raw));
    const meta = asRecord(root?.meta ?? data?.meta);
    if (!meta) return undefined;

    const page = toNumber(meta.page);
    const perPage = toNumber(meta.per_page ?? meta.page_size);
    const total = toNumber(meta.total);
    const totalPages = toNumber(meta.total_pages);

    if (page === undefined || perPage === undefined || total === undefined || totalPages === undefined) {
        return undefined;
    }

    return {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
    };
}

function normalizeProducts(raw: unknown): ProductsResponse {
    const root = asRecord(raw);
    const data = getData(raw);
    const dataRecord = asRecord(data);

    const products = asArray<Product>(
        dataRecord?.products ?? root?.products ?? data,
    );
    const facets = asRecord(root?.facets ?? dataRecord?.facets) ?? undefined;

    return {
        products,
        meta: normalizeMeta(raw),
        facets,
    };
}

function requireRecord<T>(value: unknown, code: string, message: string): T {
    const record = asRecord(value);
    if (!record) throw new ApiError(code, message, 502);
    return record as unknown as T;
}

const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
    chile: "CL",
    "chile, republica de": "CL",
    "chile republica de": "CL",
    cl: "CL",
};

function normalizeCountryCode(value: string | undefined): string {
    const raw = (value ?? "").trim();
    if (!raw) return "CL";

    return COUNTRY_NAME_TO_ISO2[raw.toLowerCase()] ?? "CL";
}

function normalizeCheckoutPayload(payload: StoreCheckoutRequest): StoreCheckoutRequest {
    if (!payload.shipping_address) return payload;

    const normalizedAddress = payload.shipping_address.address
        ?? payload.shipping_address.address_line_1;

    return {
        ...payload,
        shipping_address: {
            ...payload.shipping_address,
            address: normalizedAddress ?? payload.shipping_address.address ?? "",
            country: normalizeCountryCode(payload.shipping_address.country),
        },
    };
}

// ── Products ──

export async function getProducts(params?: Params): Promise<ProductsResponse> {
    const raw = await apiFetch<Record<string, unknown>>("/store/products", params, { revalidate: 30 });
    return normalizeProducts(raw);
}

export async function getProductDetail(productId: string): Promise<{ product: Product }> {
    const raw = await apiFetch<Record<string, unknown>>(
        `/store/products/${encodeURIComponent(productId)}`,
        undefined,
        { revalidate: 30 },
    );
    const data = getData(raw);
    const product = asRecord(data)?.product ?? data;
    return { product: requireRecord<Product>(product, "INVALID_RESPONSE", "Respuesta inválida al obtener producto") };
}

export async function getTenantProducts(tenantSlug: string, params?: Params): Promise<ProductsResponse> {
    const raw = await apiFetch<Record<string, unknown>>(
        `/store/${encodeURIComponent(tenantSlug)}/products`,
        params,
        { revalidate: 30 },
    );
    return normalizeProducts(raw);
}

// ── Categories ──

export async function getCategories(): Promise<{ categories: ProductCategory[] }> {
    const raw = await apiFetch<Record<string, unknown>>("/store/categories", undefined, { revalidate: 300 });
    const data = getData(raw);
    const categories = asArray<ProductCategory>(asRecord(data)?.categories ?? data);
    return { categories };
}

// ── Cart ──

export async function getCart(tenantSlug: string): Promise<{ cart: Cart }> {
    const raw = await apiFetch<Record<string, unknown>>(
        `/store/${encodeURIComponent(tenantSlug)}/cart`,
        undefined,
        { cache: "no-store" },
    );
    const data = getData(raw);
    return { cart: requireRecord<Cart>(asRecord(data)?.cart ?? data, "INVALID_RESPONSE", "Respuesta inválida al obtener carrito") };
}

export async function addCartItem(
    tenantSlug: string,
    productId: string,
    quantity: number = 1,
    variantId?: string | number,
): Promise<{ item: CartItem }> {
    const normalizedVariantId =
        typeof variantId === "string" && /^\d+$/.test(variantId) ? Number(variantId) : variantId;

    const raw = await apiPost<Record<string, unknown>>(`/store/${encodeURIComponent(tenantSlug)}/cart/items`, {
        product_id: productId,
        quantity,
        ...(normalizedVariantId !== undefined ? { variant_id: normalizedVariantId } : {}),
    });
    const data = getData(raw);
    return { item: requireRecord<CartItem>(asRecord(data)?.item ?? data, "INVALID_RESPONSE", "Respuesta inválida al agregar ítem") };
}

export async function updateCartItem(
    tenantSlug: string,
    itemId: string | number,
    quantity: number,
): Promise<{ item: CartItem }> {
    const raw = await apiPatch<Record<string, unknown>>(
        `/store/${encodeURIComponent(tenantSlug)}/cart/items/${encodeURIComponent(String(itemId))}`,
        { quantity },
    );
    const data = getData(raw);
    return { item: requireRecord<CartItem>(asRecord(data)?.item ?? data, "INVALID_RESPONSE", "Respuesta inválida al actualizar ítem") };
}

export async function removeCartItem(
    tenantSlug: string,
    itemId: string | number,
): Promise<{ deleted: boolean }> {
    const raw = await apiDelete<Record<string, unknown>>(
        `/store/${encodeURIComponent(tenantSlug)}/cart/items/${encodeURIComponent(String(itemId))}`,
    );
    const data = asRecord(getData(raw));
    return { deleted: Boolean(data?.deleted) };
}

export async function clearCart(tenantSlug: string): Promise<{ cleared: boolean }> {
    const raw = await apiDelete<Record<string, unknown>>(`/store/${encodeURIComponent(tenantSlug)}/cart`);
    const data = asRecord(getData(raw));
    return { cleared: Boolean(data?.cleared) };
}

// ── Coupons ──

export async function applyCoupon(tenantSlug: string, code: string): Promise<{ coupon: AppliedCoupon }> {
    const raw = await apiPost<Record<string, unknown>>(
        `/store/${encodeURIComponent(tenantSlug)}/cart/coupon`,
        { code },
    );
    const data = getData(raw);
    return { coupon: requireRecord<AppliedCoupon>(asRecord(data)?.coupon ?? data, "INVALID_RESPONSE", "Respuesta inválida al aplicar cupón") };
}

export async function removeCoupon(tenantSlug: string): Promise<{ removed: boolean }> {
    const raw = await apiDelete<Record<string, unknown>>(`/store/${encodeURIComponent(tenantSlug)}/cart/coupon`);
    const data = asRecord(getData(raw));
    return { removed: Boolean(data?.removed) };
}

// ── Checkout ──

export async function createCheckout(
    tenantSlug: string,
    payload: StoreCheckoutRequest,
): Promise<StoreCheckoutResponse> {
    const raw = await apiPost<Record<string, unknown>>(
        `/store/${encodeURIComponent(tenantSlug)}/checkout`,
        normalizeCheckoutPayload(payload),
    );
    const data = requireRecord<UnknownRecord>(getData(raw), "INVALID_RESPONSE", "Respuesta inválida al crear checkout");
    const order = requireRecord<StoreOrder>(data.order, "INVALID_RESPONSE", "La respuesta de checkout no incluye orden");
    return {
        order,
        payment_url: typeof data.payment_url === "string" && data.payment_url.trim().length > 0
            ? data.payment_url
            : undefined,
    };
}

// ── Orders ──

export async function getMyOrders(params?: Params): Promise<{ orders: StoreOrder[]; meta?: PaginationMeta }> {
    const raw = await apiFetch<Record<string, unknown>>("/store/orders", params, { cache: "no-store" });
    const data = getData(raw);
    const orders = asArray<StoreOrder>(asRecord(data)?.orders ?? data);
    return { orders, meta: normalizeMeta(raw) };
}

export async function getOrder(orderId: string): Promise<{ order: StoreOrder }> {
    const raw = await apiFetch<Record<string, unknown>>(
        `/store/orders/${encodeURIComponent(orderId)}`,
        undefined,
        { cache: "no-store" },
    );
    const data = getData(raw);
    return { order: requireRecord<StoreOrder>(asRecord(data)?.order ?? data, "INVALID_RESPONSE", "Respuesta inválida al obtener orden") };
}

export async function cancelOrder(orderId: string, reason?: string): Promise<{ order: StoreOrder }> {
    const raw = await apiPost<Record<string, unknown>>(
        `/store/orders/${encodeURIComponent(orderId)}/cancel`,
        reason ? { reason } : {},
    );
    const data = getData(raw);
    return { order: requireRecord<StoreOrder>(asRecord(data)?.order ?? data, "INVALID_RESPONSE", "Respuesta inválida al cancelar orden") };
}

export async function confirmOrderDelivery(orderId: string): Promise<{ order: StoreOrder }> {
    const raw = await apiPost<Record<string, unknown>>(
        `/store/orders/${encodeURIComponent(orderId)}/confirm-delivery`,
        {},
    );
    const data = getData(raw);
    return { order: requireRecord<StoreOrder>(asRecord(data)?.order ?? data, "INVALID_RESPONSE", "Respuesta inválida al confirmar entrega") };
}

export async function reviewOrder(orderId: string, payload: StoreReviewPayload): Promise<{ review: StoreOrderReview }> {
    const raw = await apiPost<Record<string, unknown>>(
        `/store/orders/${encodeURIComponent(orderId)}/review`,
        payload,
    );
    const data = getData(raw);
    return { review: requireRecord<StoreOrderReview>(asRecord(data)?.review ?? data, "INVALID_RESPONSE", "Respuesta inválida al crear reseña") };
}

/**
 * Store checkout is handled by POST /store/{tenant_slug}/checkout.
 * The backend does not expose /store/checkouts/{id}/pay.
 */
export async function payCheckout(checkoutId: string, payload: StorePayCheckoutPayload): Promise<never> {
    void checkoutId;
    void payload;
    throw new ApiError("NOT_FOUND", "El backend no expone /store/checkouts/{id}/pay", 404);
}
