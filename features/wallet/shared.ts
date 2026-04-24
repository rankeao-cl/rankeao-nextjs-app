import type {
    WalletAccount,
    WalletTxKind,
    PayoutStatus,
    PaymentProviderCode,
} from "@/lib/types/wallet";

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

// ── Payout status labels (ES) ──

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
    REQUESTED: "Solicitado",
    PENDING_REVIEW: "En revisión",
    APPROVED: "Aprobado",
    PROCESSING: "Procesando",
    COMPLETED: "Completado",
    FAILED: "Fallido",
    CANCELLED: "Cancelado",
    REJECTED: "Rechazado",
};

/** HeroUI-like color tokens for status chips. */
export type StatusTone =
    | "default"
    | "warning"
    | "primary"
    | "secondary"
    | "success"
    | "danger";

export const PAYOUT_STATUS_TONE: Record<PayoutStatus, StatusTone> = {
    REQUESTED: "default",
    PENDING_REVIEW: "warning",
    APPROVED: "primary",
    PROCESSING: "secondary",
    COMPLETED: "success",
    FAILED: "danger",
    CANCELLED: "default",
    REJECTED: "danger",
};

export function labelForPayoutStatus(status: string): string {
    return (PAYOUT_STATUS_LABELS as Record<string, string>)[status] ?? status;
}

export function tonalStyleForPayoutStatus(status: string): {
    bg: string;
    color: string;
} {
    const tone = (PAYOUT_STATUS_TONE as Record<string, StatusTone>)[status] ?? "default";
    switch (tone) {
        case "warning":
            return { bg: "rgba(245,158,11,0.15)", color: "#b45309" };
        case "primary":
            return { bg: "rgba(99,102,241,0.15)", color: "#4338ca" };
        case "secondary":
            return { bg: "rgba(139,92,246,0.15)", color: "#6d28d9" };
        case "success":
            return { bg: "rgba(0,178,75,0.15)", color: "#00733c" };
        case "danger":
            return { bg: "rgba(246,61,0,0.15)", color: "#b53000" };
        case "default":
        default:
            return { bg: "var(--surface)", color: "var(--muted)" };
    }
}

// ── Payment providers ──

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProviderCode, string> = {
    flow: "Flow",
    webpay: "Webpay",
    mercadopago: "Mercado Pago",
};

export function labelForProvider(code: string): string {
    return (PAYMENT_PROVIDER_LABELS as Record<string, string>)[code] ?? code;
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
