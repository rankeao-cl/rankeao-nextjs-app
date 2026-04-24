"use client";

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as walletApi from "@/lib/api/wallet";
import { useAuthStore } from "@/lib/stores/auth-store";
import type {
    TransactionsParams,
    TransactionsResponse,
    CreateDepositRequest,
    CreatePayoutRequest,
} from "@/lib/types/wallet";

// ── Balance ──
// Polls every 30s while the page/tab is focused, matching the reference b1tcore UX.

export function useBalance() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const isAuthenticated = !!accessToken;
    return useQuery({
        queryKey: ["wallet", "balance"],
        queryFn: () => walletApi.getBalance(),
        enabled: isAuthenticated,
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
        staleTime: 10_000,
    });
}

// ── Transactions (single page) ──

export function useTransactions(params?: TransactionsParams) {
    const accessToken = useAuthStore((s) => s.accessToken);
    const isAuthenticated = !!accessToken;
    return useQuery({
        queryKey: ["wallet", "transactions", params ?? {}],
        queryFn: () => walletApi.getTransactions(params),
        enabled: isAuthenticated,
    });
}

// ── Transactions (infinite / keyset pagination) ──

export function useInfiniteTransactions(limit = 20) {
    const accessToken = useAuthStore((s) => s.accessToken);
    const isAuthenticated = !!accessToken;
    return useInfiniteQuery({
        queryKey: ["wallet", "transactions", "infinite", { limit }] as const,
        queryFn: ({ pageParam }: { pageParam: number | undefined }) =>
            walletApi.getTransactions({ limit, before: pageParam }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage: TransactionsResponse): number | undefined => {
            // next_before === 0 means "no more"
            if (!lastPage?.next_before || lastPage.next_before <= 0) return undefined;
            if (!lastPage.transactions || lastPage.transactions.length < limit) return undefined;
            return lastPage.next_before;
        },
        enabled: isAuthenticated,
    });
}

// ── Payouts (stub) ──

export function usePayouts() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const isAuthenticated = !!accessToken;
    return useQuery({
        queryKey: ["wallet", "payouts"],
        queryFn: () => walletApi.getPayouts(),
        enabled: isAuthenticated,
    });
}

// ── Mutations ──

export function useCreateDeposit() {
    return useMutation({
        mutationFn: (body: CreateDepositRequest) => walletApi.createDeposit(body),
    });
}

export function useCreatePayout() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreatePayoutRequest) => walletApi.createPayout(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wallet", "payouts"] });
            queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
        },
    });
}
