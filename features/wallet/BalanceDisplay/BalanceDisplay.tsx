"use client";

import { CreditCard } from "@gravity-ui/icons";
import { useBalance } from "@/lib/hooks/use-wallet";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { pickAvailableCLP } from "@/features/wallet/shared";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
    variant?: "desktop" | "mobile";
}

/**
 * Compact balance pill for the navbar. Clicking it opens the BalanceSidebar.
 * Renders nothing if the user is not authenticated.
 */
export default function BalanceDisplay({ variant = "desktop" }: Props) {
    const accessToken = useAuthStore((s) => s.accessToken);
    const isAuthenticated = !!accessToken;
    const openBalanceSidebar = useUIStore((s) => s.openBalanceSidebar);
    const { data, isLoading } = useBalance();

    if (!isAuthenticated) return null;

    const clp = pickAvailableCLP(data?.accounts);
    const amount = clp?.available ?? "0";

    if (variant === "mobile") {
        // Compact icon-only tile, matching the other navbar mobile buttons.
        return (
            <button
                type="button"
                onClick={() => openBalanceSidebar()}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer bg-surface-solid"
                aria-label={
                    isLoading
                        ? "Cargando saldo"
                        : `Mi saldo: ${formatCurrency(amount, clp?.currency ?? "CLP")}`
                }
            >
                <CreditCard className="size-4 text-muted" />
            </button>
        );
    }

    if (isLoading && !data) {
        return (
            <div
                className="h-9 min-w-[88px] rounded-full px-3 flex items-center gap-2 bg-surface-solid animate-pulse"
                aria-label="Cargando saldo"
            >
                <div className="size-4 rounded-full bg-foreground/10" />
                <div className="h-3 w-14 rounded bg-foreground/10" />
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => openBalanceSidebar()}
            className="group h-9 px-3 rounded-full flex items-center gap-2 bg-surface-solid hover:bg-foreground/5 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label={`Mi saldo: ${formatCurrency(amount, clp?.currency ?? "CLP")}`}
        >
            <span className="flex items-center justify-center size-5 rounded-full bg-accent/15 text-accent">
                <CreditCard className="size-3.5" />
            </span>
            <span className="text-[13px] font-bold text-foreground tabular-nums">
                {formatCurrency(amount, clp?.currency ?? "CLP")}
            </span>
        </button>
    );
}
