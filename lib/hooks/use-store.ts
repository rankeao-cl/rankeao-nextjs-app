"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as storeApi from "@/lib/api/store";
import type { Params } from "@/lib/types/api";

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

export function useCart(tenantSlug: string) {
    return useQuery({
        queryKey: ["store", "cart", tenantSlug],
        queryFn: () => storeApi.getCart(tenantSlug),
        enabled: !!tenantSlug,
    });
}

export function useAddCartItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantSlug, productId, quantity, variantId }: { tenantSlug: string; productId: string; quantity?: number; variantId?: string }) =>
            storeApi.addCartItem(tenantSlug, productId, quantity, variantId),
        onSuccess: (_, { tenantSlug }) => qc.invalidateQueries({ queryKey: ["store", "cart", tenantSlug] }),
    });
}

export function useRemoveCartItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantSlug, itemId }: { tenantSlug: string; itemId: string }) =>
            storeApi.removeCartItem(tenantSlug, itemId),
        onSuccess: (_, { tenantSlug }) => qc.invalidateQueries({ queryKey: ["store", "cart", tenantSlug] }),
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
