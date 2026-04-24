// ── Wallet types ──
//
// Amounts are preserved as strings (NUMERIC(18,4) on the backend) to avoid
// float precision loss. UI layer should format via Intl.NumberFormat.

export type WalletAccountType = "AVAILABLE" | "PENDING_IN" | "PENDING_OUT" | "PROMO";

export interface WalletAccount {
    id: string;
    account_type: WalletAccountType;
    currency: string;
    balance: string;
    holds_active: string;
    available: string;
    updated_at: string;
}

export type WalletTxKind =
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "SALE_PROCEEDS"
    | "PURCHASE_DEBIT"
    | "AUCTION_HOLD"
    | "AUCTION_RELEASE"
    | "AUCTION_WIN"
    | "RAFFLE_ENTRY"
    | "RAFFLE_PRIZE"
    | "REFERRAL_REWARD"
    | "TIP"
    | "REFUND"
    | "FEE"
    | "MANUAL_ADJUST";

export interface WalletTransaction {
    id: string;
    account_id: string;
    kind: WalletTxKind;
    amount: string;              // signed string, e.g. "-10000.0000" or "50000.0000"
    balance_after: string;
    currency: string;
    reference_type: string;
    reference_id: string;
    metadata: string;            // JSON string — parse lazily in UI if needed
    created_at: string;
}

export interface BalanceResponse {
    accounts: WalletAccount[];
}

export interface TransactionsResponse {
    limit: number;
    next_before: number;
    transactions: WalletTransaction[];
}

export interface PayoutsResponse {
    payouts: unknown[];
}

export interface TransactionsParams {
    limit?: number;
    before?: number;
}
