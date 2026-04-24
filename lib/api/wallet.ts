import { apiFetch } from "./client";
import type { ApiResponse } from "@/lib/types/api";
import type {
    BalanceResponse,
    TransactionsResponse,
    PayoutsResponse,
    TransactionsParams,
} from "@/lib/types/wallet";

// ── Balance ──

export async function getBalance(token?: string): Promise<BalanceResponse> {
    const res = await apiFetch<ApiResponse<BalanceResponse>>("/wallet/balance", undefined, {
        cache: "no-store",
        token,
    });
    const data = res?.data ?? res;
    const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
    return { accounts };
}

// ── Transactions (keyset pagination) ──

export async function getTransactions(
    params?: TransactionsParams,
    token?: string,
): Promise<TransactionsResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    if (params?.before !== undefined) queryParams.before = params.before;

    const res = await apiFetch<ApiResponse<TransactionsResponse>>(
        "/wallet/transactions",
        queryParams,
        { cache: "no-store", token },
    );
    const data = res?.data ?? res;
    return {
        limit: data?.limit ?? params?.limit ?? 20,
        next_before: data?.next_before ?? 0,
        transactions: Array.isArray(data?.transactions) ? data.transactions : [],
    };
}

// ── Payouts (stubbed for MVP read-only — no UI yet) ──

export async function getPayouts(token?: string): Promise<PayoutsResponse> {
    const res = await apiFetch<ApiResponse<PayoutsResponse>>("/wallet/payouts", undefined, {
        cache: "no-store",
        token,
    });
    const data = res?.data ?? res;
    return { payouts: Array.isArray(data?.payouts) ? data.payouts : [] };
}
