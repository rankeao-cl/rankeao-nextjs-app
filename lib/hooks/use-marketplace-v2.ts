"use client";

// Hooks TanStack Query para el flujo v2 del marketplace
// (orders v2, pickup points, seller onboarding, /me).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    cancelOrderV2,
    confirmOrderDelivery,
    createOrderV2,
    getMarketplaceMe,
    getMarketplaceMeSummary,
    getOrderV2,
    listOrdersV2,
    listPickupPoints,
    markOrderPickedUp,
    markOrderShipped,
    startSellerOnboarding,
    updateMarketplaceMeSeller,
} from "@/lib/api/marketplace-v2";
import { useAuthStore } from "@/lib/stores/auth-store";
import type {
    CreateOrderPayload,
    SellerOnboardingPayload,
    UpdateMeSellerPayload,
} from "@/lib/types/marketplace-v2";

// ── Orders ──

export function useBuyerOrders() {
    const isAuthed = useAuthStore((s) => !!s.accessToken);
    return useQuery({
        queryKey: ["marketplace-v2", "orders", "buyer"],
        queryFn: () => listOrdersV2("buyer"),
        enabled: isAuthed,
    });
}

export function useSellerOrders() {
    const isAuthed = useAuthStore((s) => !!s.accessToken);
    return useQuery({
        queryKey: ["marketplace-v2", "orders", "seller"],
        queryFn: () => listOrdersV2("seller"),
        enabled: isAuthed,
    });
}

export function useOrder(publicId: string | undefined) {
    return useQuery({
        queryKey: ["marketplace-v2", "orders", publicId],
        queryFn: () => getOrderV2(publicId as string),
        enabled: !!publicId,
    });
}

export function useCreateOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateOrderPayload) => createOrderV2(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["marketplace-v2", "orders"] });
            qc.invalidateQueries({ queryKey: ["marketplace-v2", "me"] });
        },
    });
}

export function useMarkOrderShipped() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (publicId: string) => markOrderShipped(publicId),
        onSuccess: (_data, publicId) => {
            qc.invalidateQueries({ queryKey: ["marketplace-v2", "orders", publicId] });
            qc.invalidateQueries({ queryKey: ["marketplace-v2", "orders", "seller"] });
        },
    });
}

export function useMarkOrderPickedUp() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (publicId: string) => markOrderPickedUp(publicId),
        onSuccess: (_data, publicId) => {
            qc.invalidateQueries({ queryKey: ["marketplace-v2", "orders", publicId] });
            qc.invalidateQueries({ queryKey: ["marketplace-v2", "orders", "buyer"] });
        },
    });
}

export function useConfirmOrderDelivery() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (publicId: string) => confirmOrderDelivery(publicId),
        onSuccess: (_data, publicId) => {
            qc.invalidateQueries({ queryKey: ["marketplace-v2", "orders", publicId] });
            qc.invalidateQueries({ queryKey: ["marketplace-v2", "orders", "buyer"] });
        },
    });
}

export function useCancelOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (publicId: string) => cancelOrderV2(publicId),
        onSuccess: (_data, publicId) => {
            qc.invalidateQueries({ queryKey: ["marketplace-v2", "orders", publicId] });
            qc.invalidateQueries({ queryKey: ["marketplace-v2", "orders"] });
        },
    });
}

// ── Pickup points ──

export function usePickupPoints() {
    return useQuery({
        queryKey: ["marketplace-v2", "pickup-points"],
        queryFn: () => listPickupPoints(),
        staleTime: 60_000,
    });
}

// ── Me ──

export function useMe() {
    const isAuthed = useAuthStore((s) => !!s.accessToken);
    return useQuery({
        queryKey: ["marketplace-v2", "me"],
        queryFn: () => getMarketplaceMe(),
        enabled: isAuthed,
        staleTime: 30_000,
    });
}

export function useMeSummary() {
    const isAuthed = useAuthStore((s) => !!s.accessToken);
    return useQuery({
        queryKey: ["marketplace-v2", "me", "summary"],
        queryFn: () => getMarketplaceMeSummary(),
        enabled: isAuthed,
        staleTime: 30_000,
    });
}

// ── Seller onboarding / update ──

export function useStartSellerOnboarding() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: SellerOnboardingPayload) => startSellerOnboarding(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["marketplace-v2", "me"] });
            // also invalidate legacy seller hook
            qc.invalidateQueries({ queryKey: ["marketplace", "seller"] });
        },
    });
}

export function useUpdateMeSeller() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: UpdateMeSellerPayload) => updateMarketplaceMeSeller(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["marketplace-v2", "me"] });
        },
    });
}
