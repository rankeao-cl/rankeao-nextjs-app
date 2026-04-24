import type { WalletAccount, WalletTxKind } from "@/lib/types/wallet";

// ── Spanish labels per transaction kind ──

export const WALLET_KIND_LABELS: Record<WalletTxKind, string> = {
    DEPOSIT: "Recarga",
    WITHDRAWAL: "Retiro",
    SALE_PROCEEDS: "Venta cobrada",
    PURCHASE_DEBIT: "Compra",
    AUCTION_HOLD: "Reserva subasta",
    AUCTION_RELEASE: "Reserva liberada",
    AUCTION_WIN: "Subasta ganada",
    RAFFLE_ENTRY: "Ticket rifa",
    RAFFLE_PRIZE: "Premio rifa",
    REFERRAL_REWARD: "Recompensa referido",
    TIP: "Propina",
    REFUND: "Devolución",
    FEE: "Comisión",
    MANUAL_ADJUST: "Ajuste",
};

export function labelForKind(kind: string): string {
    return (WALLET_KIND_LABELS as Record<string, string>)[kind] ?? kind;
}

// ── Account pickers ──

/** Returns the AVAILABLE CLP account if the user has one. */
export function pickAvailableCLP(accounts: WalletAccount[] | undefined): WalletAccount | undefined {
    if (!accounts) return undefined;
    return accounts.find((a) => a.currency === "CLP" && a.account_type === "AVAILABLE");
}

/**
 * Aggregates balances grouped by currency — currently only CLP is shown,
 * but this keeps the door open for multi-currency without refactors.
 */
export interface CurrencyGroup {
    currency: string;
    available: string;
    holds: string;
    total: string;
}

export function groupByCurrency(accounts: WalletAccount[] | undefined): CurrencyGroup[] {
    if (!accounts || accounts.length === 0) return [];
    const map = new Map<string, { available: number; holds: number; total: number }>();
    for (const a of accounts) {
        const entry = map.get(a.currency) ?? { available: 0, holds: 0, total: 0 };
        const available = parseFloat(a.available || "0") || 0;
        const holds = parseFloat(a.holds_active || "0") || 0;
        const balance = parseFloat(a.balance || "0") || 0;

        if (a.account_type === "AVAILABLE") {
            entry.available += available;
            entry.holds += holds;
            entry.total += balance;
        } else if (a.account_type === "PROMO") {
            entry.available += available;
            entry.total += balance;
        } else {
            // PENDING_IN / PENDING_OUT — surface in holds so the "reservado" figure stays meaningful
            entry.holds += balance;
            entry.total += balance;
        }
        map.set(a.currency, entry);
    }
    return Array.from(map.entries()).map(([currency, v]) => ({
        currency,
        available: String(v.available),
        holds: String(v.holds),
        total: String(v.total),
    }));
}
