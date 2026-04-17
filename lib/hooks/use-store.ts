"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as storeApi from "@/lib/api/store";
import type { Params } from "@/lib/types/api";
import type { StoreCheckoutRequest } from "@/lib/types/store";

export function useProducts(params?: Params) {
    return useQuery({
        queryKey: ["store", "products", params],
        queryFn: () => storeApi.getProducts(params),
    });
}

export function useProductDetail(productId: string) {
    return useQuery({
        queryKey: ["store", "products", productId],
        queryFn: () => storeApi.getProductDetail(productId),
        enabled: !!productId,
    });
}

export function useTenantProducts(tenantSlug: string, params?: Params) {
    return useQuery({
        queryKey: ["store", "tenant-products", tenantSlug, params],
        queryFn: () => storeApi.getTenantProducts(tenantSlug, params),
        enabled: !!tenantSlug,
    });
}

export function useCart(tenantSlug: string, enabled = true) {
    return useQuery({
        queryKey: ["store", "cart", tenantSlug],
        queryFn: () => storeApi.getCart(tenantSlug),
        enabled: !!tenantSlug && enabled,
    });
}

export function useAddCartItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantSlug, productId, quantity, variantId }: { tenantSlug: string; productId: string; quantity?: number; variantId?: string | number }) =>
            storeApi.addCartItem(tenantSlug, productId, quantity, variantId),
        onSuccess: (_, { tenantSlug }) => qc.invalidateQueries({ queryKey: ["store", "cart", tenantSlug] }),
    });
}

export function useRemoveCartItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantSlug, itemId }: { tenantSlug: string; itemId: string | number }) =>
            storeApi.removeCartItem(tenantSlug, itemId),
        onSuccess: (_, { tenantSlug }) => qc.invalidateQueries({ queryKey: ["store", "cart", tenantSlug] }),
    });
}

export function useUpdateCartItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantSlug, itemId, quantity }: { tenantSlug: string; itemId: string | number; quantity: number }) =>
            storeApi.updateCartItem(tenantSlug, itemId, quantity),
        onSuccess: (_, { tenantSlug }) => qc.invalidateQueries({ queryKey: ["store", "cart", tenantSlug] }),
    });
}

export function useClearCart() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantSlug }: { tenantSlug: string }) =>
            storeApi.clearCart(tenantSlug),
        onSuccess: (_, { tenantSlug }) => qc.invalidateQueries({ queryKey: ["store", "cart", tenantSlug] }),
    });
}

export function useApplyCoupon() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantSlug, code }: { tenantSlug: string; code: string }) =>
            storeApi.applyCoupon(tenantSlug, code),
        onSuccess: (_, { tenantSlug }) => qc.invalidateQueries({ queryKey: ["store", "cart", tenantSlug] }),
    });
}

export function useRemoveCoupon() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantSlug }: { tenantSlug: string }) =>
            storeApi.removeCoupon(tenantSlug),
        onSuccess: (_, { tenantSlug }) => qc.invalidateQueries({ queryKey: ["store", "cart", tenantSlug] }),
    });
}

export function useCreateCheckout() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantSlug, payload }: { tenantSlug: string; payload: StoreCheckoutRequest }) =>
            storeApi.createCheckout(tenantSlug, payload),
        onSuccess: (_, { tenantSlug }) => {
            qc.invalidateQueries({ queryKey: ["store", "cart", tenantSlug] });
            qc.invalidateQueries({ queryKey: ["store", "orders"] });
        },
    });
}

export function useMyOrders(params?: Params) {
    return useQuery({
        queryKey: ["store", "orders", params],
        queryFn: () => storeApi.getMyOrders(params),
    });
}

export function useOrderDetail(orderId: string) {
    return useQuery({
        queryKey: ["store", "orders", orderId],
        queryFn: () => storeApi.getOrder(orderId),
        enabled: !!orderId,
    });
}
