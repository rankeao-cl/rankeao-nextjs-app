import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import type { ProductsResponse, Product, Cart, StoreOrder, StoreCheckoutRequest, ProductCategory } from "@/lib/types/store";
import type { Params, ApiResponse, ApiMessage } from "@/lib/types/api";

// ── Products ──

export async function getProducts(params?: Params): Promise<ProductsResponse> {
    const res = await apiFetch<ApiResponse<{ products: Product[] }>>("/store/products", params, { revalidate: 30 });
    const products = res.data?.products ?? res.products ?? [];
    const meta = res.meta;
    return { products, meta };
}

export async function getProductDetail(productId: string) {
    return apiFetch<ApiResponse<{ product: Product }>>(`/store/products/${encodeURIComponent(productId)}`);
}

export async function getTenantProducts(tenantSlug: string, params?: Params) {
    return apiFetch<ProductsResponse>(`/store/${encodeURIComponent(tenantSlug)}/products`, params, { revalidate: 30 });
}

// ── Categories ──

export async function getCategories() {
    return apiFetch<ApiResponse<{ categories: ProductCategory[] }>>("/store/categories", undefined, { revalidate: 300 });
}

// ── Cart ──

export async function getCart(tenantSlug: string) {
    return apiFetch<ApiResponse<Cart>>(`/store/${encodeURIComponent(tenantSlug)}/cart`, undefined, { cache: "no-store" });
}

export async function addCartItem(tenantSlug: string, productId: string, quantity: number = 1, variantId?: string) {
    return apiPost<ApiResponse<Cart>>(`/store/${encodeURIComponent(tenantSlug)}/cart/items`, {
        product_id: productId,
        quantity,
        ...(variantId ? { variant_id: variantId } : {}),
    });
}

export async function updateCartItem(tenantSlug: string, itemId: string, quantity: number) {
    return apiPatch<ApiResponse<Cart>>(`/store/${encodeURIComponent(tenantSlug)}/cart/items/${itemId}`, { quantity });
}

export async function removeCartItem(tenantSlug: string, itemId: string) {
    return apiDelete<ApiResponse<ApiMessage>>(`/store/${encodeURIComponent(tenantSlug)}/cart/items/${itemId}`);
}

export async function clearCart(tenantSlug: string) {
    return apiDelete<ApiResponse<ApiMessage>>(`/store/${encodeURIComponent(tenantSlug)}/cart`);
}

// ── Coupons ──

export async function applyCoupon(tenantSlug: string, code: string) {
    return apiPost<ApiResponse<Cart>>(`/store/${encodeURIComponent(tenantSlug)}/cart/coupon`, { code });
}

export async function removeCoupon(tenantSlug: string) {
    return apiDelete<ApiResponse<ApiMessage>>(`/store/${encodeURIComponent(tenantSlug)}/cart/coupon`);
}

// ── Checkout ──

export async function createCheckout(tenantSlug: string, payload: StoreCheckoutRequest) {
    return apiPost<ApiResponse<{ order: StoreOrder }>>(`/store/${encodeURIComponent(tenantSlug)}/checkout`, payload);
}

// ── Orders ──

export async function getMyOrders(params?: Params) {
    return apiFetch<ApiResponse<{ orders: StoreOrder[] }>>("/store/orders", params, { cache: "no-store" });
}

export async function getOrder(orderId: string) {
    return apiFetch<ApiResponse<{ order: StoreOrder }>>(`/store/orders/${encodeURIComponent(orderId)}`, undefined, { cache: "no-store" });
}

export async function cancelOrder(orderId: string, reason?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/store/orders/${encodeURIComponent(orderId)}/cancel`, reason ? { reason } : {});
}

export async function confirmOrderDelivery(orderId: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/store/orders/${encodeURIComponent(orderId)}/confirm-delivery`, {});
}

export async function reviewOrder(orderId: string, payload: Record<string, unknown>) {
    return apiPost<ApiResponse<ApiMessage>>(`/store/orders/${encodeURIComponent(orderId)}/review`, payload);
}

/**
 * NOTE: /store/checkouts/{id}/pay is not in the public OpenAPI spec.
 * Store checkout is handled by POST /store/{tenant_slug}/checkout which creates the order directly.
 * This may be an internal/undocumented endpoint.
 */
export async function payCheckout(checkoutId: string, payload: Record<string, unknown>) {
    return apiPost<ApiResponse<ApiMessage>>(`/store/checkouts/${encodeURIComponent(checkoutId)}/pay`, payload);
}
