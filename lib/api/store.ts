import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import type { ProductsResponse, StoreCheckoutRequest } from "@/lib/types/store";
import type { Params } from "@/lib/types/api";

// ── Products ──

export async function getProducts(params?: Params): Promise<ProductsResponse> {
    const res = await apiFetch<any>("/store/products", params, { revalidate: 30 });
    const products = res.data || res.products || [];
    const meta = res.meta;
    return { products, meta };
}

export async function getProductDetail(productId: string) {
    return apiFetch<any>(`/store/products/${encodeURIComponent(productId)}`);
}

export async function getTenantProducts(tenantSlug: string, params?: Params) {
    return apiFetch<ProductsResponse>(`/store/${encodeURIComponent(tenantSlug)}/products`, params, { revalidate: 30 });
}

// ── Categories ──

export async function getCategories() {
    return apiFetch<any>("/store/categories", undefined, { revalidate: 300 });
}

// ── Cart ──

export async function getCart(tenantSlug: string) {
    return apiFetch<any>(`/store/${encodeURIComponent(tenantSlug)}/cart`, undefined, { cache: "no-store" });
}

export async function addCartItem(tenantSlug: string, productId: string, quantity: number = 1, variantId?: string) {
    return apiPost<any>(`/store/${encodeURIComponent(tenantSlug)}/cart/items`, {
        product_id: productId,
        quantity,
        ...(variantId ? { variant_id: variantId } : {}),
    });
}

export async function updateCartItem(tenantSlug: string, itemId: string, quantity: number) {
    return apiPatch<any>(`/store/${encodeURIComponent(tenantSlug)}/cart/items/${itemId}`, { quantity });
}

export async function removeCartItem(tenantSlug: string, itemId: string) {
    return apiDelete<any>(`/store/${encodeURIComponent(tenantSlug)}/cart/items/${itemId}`);
}

export async function clearCart(tenantSlug: string) {
    return apiDelete<any>(`/store/${encodeURIComponent(tenantSlug)}/cart`);
}

// ── Coupons ──

export async function applyCoupon(tenantSlug: string, code: string) {
    return apiPost<any>(`/store/${encodeURIComponent(tenantSlug)}/cart/coupon`, { code });
}

export async function removeCoupon(tenantSlug: string) {
    return apiDelete<any>(`/store/${encodeURIComponent(tenantSlug)}/cart/coupon`);
}

// ── Checkout ──

export async function createCheckout(tenantSlug: string, payload: StoreCheckoutRequest) {
    return apiPost<any>(`/store/${encodeURIComponent(tenantSlug)}/checkout`, payload);
}

// ── Orders ──

export async function getMyOrders(params?: Params) {
    return apiFetch<any>("/store/orders", params, { cache: "no-store" });
}

export async function getOrder(orderId: string) {
    return apiFetch<any>(`/store/orders/${encodeURIComponent(orderId)}`, undefined, { cache: "no-store" });
}

export async function cancelOrder(orderId: string, reason?: string) {
    return apiPost<any>(`/store/orders/${encodeURIComponent(orderId)}/cancel`, reason ? { reason } : {});
}

export async function confirmOrderDelivery(orderId: string) {
    return apiPost<any>(`/store/orders/${encodeURIComponent(orderId)}/confirm-delivery`, {});
}

export async function reviewOrder(orderId: string, payload: any) {
    return apiPost<any>(`/store/orders/${encodeURIComponent(orderId)}/review`, payload);
}

/**
 * NOTE: /store/checkouts/{id}/pay is not in the public OpenAPI spec.
 * Store checkout is handled by POST /store/{tenant_slug}/checkout which creates the order directly.
 * This may be an internal/undocumented endpoint.
 */
export async function payCheckout(checkoutId: string, payload: Record<string, any>) {
    return apiPost<any>(`/store/checkouts/${encodeURIComponent(checkoutId)}/pay`, payload);
}
