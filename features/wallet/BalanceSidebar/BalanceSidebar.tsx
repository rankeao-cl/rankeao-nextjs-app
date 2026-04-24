"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ScrollShadow } from "@heroui/react/scroll-shadow";
import {
    Xmark,
    CreditCard,
    ArrowDown,
    ArrowUp,
    Plus,
    ArrowUpFromSquare,
} from "@gravity-ui/icons";

import { useBalance, useTransactions } from "@/lib/hooks/use-wallet";
import { useUIStore } from "@/lib/stores/ui-store";
import { pickAvailableCLP, labelForKind } from "@/features/wallet/shared";
import {
    formatCurrency,
    formatSignedCurrency,
    formatRelativeTime,
    isCreditTx,
} from "@/lib/utils/format";
import type { WalletTransaction } from "@/lib/types/wallet";

function TransactionRow({ tx }: { tx: WalletTransaction }) {
    const credit = isCreditTx(tx.kind);
    const label = labelForKind(tx.kind);
    const currency = tx.currency || "CLP";

    return (
        <div className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-foreground/5">
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                    backgroundColor: credit ? "rgba(0,178,75,0.12)" : "rgba(246,61,0,0.12)",
                    color: credit ? "#00b24b" : "#f63d00",
                }}
                aria-hidden="true"
            >
                {credit ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground m-0 truncate">{label}</p>
                <p className="text-[11px] m-0" style={{ color: "var(--muted)" }}>
                    {formatRelativeTime(tx.created_at)}
                </p>
            </div>
            <p
                className="text-[13px] font-bold tabular-nums m-0 shrink-0"
                style={{ color: credit ? "#00b24b" : "#f63d00" }}
            >
                {formatSignedCurrency(tx.amount, currency)}
            </p>
        </div>
    );
}

export default function BalanceSidebar() {
    const isOpen = useUIStore((s) => s.balanceSidebarOpen);
    const onClose = useUIStore((s) => s.closeBalanceSidebar);
    const panelRef = useRef<HTMLDivElement>(null);

    const { data: balanceData, isLoading: balanceLoading } = useBalance();
    const { data: txData, isLoading: txLoading } = useTransactions({ limit: 4 });

    const clp = useMemo(() => pickAvailableCLP(balanceData?.accounts), [balanceData]);
    const currency = clp?.currency ?? "CLP";
    const available = clp?.available ?? "0";
    const holds = clp?.holds_active ?? "0";
    const transactions = txData?.transactions ?? [];

    // ── Focus trap + Escape to close ──
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
                return;
            }
            if (e.key === "Tab" && panelRef.current) {
                const focusable = panelRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener("keydown", handler);
        requestAnimationFrame(() => {
            const closeBtn = panelRef.current?.querySelector<HTMLElement>('[aria-label="Cerrar"]');
            closeBtn?.focus();
        });
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    // ── Lock body scroll while open ──
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    return (
        <>
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Cerrar saldo"
                className={`fixed inset-0 z-[59] border-0 bg-black/50 p-0 transition-opacity duration-200 ${
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={onClose}
            />

            {/* Sidebar panel — slides from the RIGHT, opposite to NotificationSidebar */}
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Mi saldo"
                className="fixed top-0 right-0 h-full z-[60] w-[420px] max-w-[calc(100vw-48px)] flex flex-col"
                style={{
                    background: "var(--background)",
                    borderLeft: "1px solid var(--border)",
                    transform: isOpen ? "translateX(0)" : "translateX(100%)",
                    transition: "transform 250ms cubic-bezier(0.32,0.72,0,1)",
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4 shrink-0"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/15 text-accent">
                            <CreditCard className="size-4" />
                        </div>
                        <h2 className="text-[17px] font-bold m-0" style={{ color: "var(--foreground)" }}>
                            Mi saldo
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-foreground/5"
                        style={{ color: "var(--muted)" }}
                        aria-label="Cerrar"
                    >
                        <Xmark style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {/* Balance card */}
                <div className="px-5 pt-5 pb-4 shrink-0">
                    <div
                        className="rounded-2xl p-5 relative overflow-hidden"
                        style={{
                            background:
                                "linear-gradient(135deg, var(--accent) 0%, color-mix(in oklab, var(--accent) 60%, #000) 100%)",
                            color: "#fff",
                        }}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[11px] uppercase tracking-wider font-bold opacity-80 m-0">
                                Saldo disponible
                            </p>
                            <span className="text-[10px] font-extrabold opacity-80">{currency}</span>
                        </div>
                        {balanceLoading && !balanceData ? (
                            <div className="h-9 w-40 rounded bg-white/20 animate-pulse mb-3" />
                        ) : (
                            <p className="text-[28px] font-extrabold leading-tight m-0 mb-3 tabular-nums">
                                {formatCurrency(available, currency)}
                            </p>
                        )}
                        <div className="flex items-center justify-between text-[11px] opacity-90">
                            <div>
                                <p className="m-0 opacity-75">En reserva</p>
                                <p className="m-0 font-bold tabular-nums">
                                    {formatCurrency(holds, currency)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="m-0 opacity-75">Total</p>
                                <p className="m-0 font-bold tabular-nums">
                                    {formatCurrency(clp?.balance ?? "0", currency)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick actions — disabled until deposit/withdraw endpoints land */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <button
                            type="button"
                            disabled
                            className="h-10 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-semibold bg-surface-solid text-muted opacity-60 cursor-not-allowed"
                            aria-label="Recargar saldo (próximamente)"
                            title="Próximamente"
                        >
                            <Plus className="size-3.5" />
                            Recargar
                        </button>
                        <button
                            type="button"
                            disabled
                            className="h-10 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-semibold bg-surface-solid text-muted opacity-60 cursor-not-allowed"
                            aria-label="Retirar saldo (próximamente)"
                            title="Próximamente"
                        >
                            <ArrowUpFromSquare className="size-3.5" />
                            Retirar
                        </button>
                    </div>
                </div>

                {/* Recent movements */}
                <div
                    className="px-5 pt-2 pb-2 shrink-0 flex items-center justify-between"
                    style={{ borderTop: "1px solid var(--border)" }}
                >
                    <p className="text-[11px] font-bold uppercase tracking-wider m-0" style={{ color: "var(--muted)" }}>
                        Últimos movimientos
                    </p>
                </div>

                <ScrollShadow className="flex-1 overflow-y-auto">
                    {txLoading && !txData ? (
                        <div className="flex flex-col gap-0 py-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                                    <div
                                        className="w-9 h-9 rounded-full shrink-0"
                                        style={{ backgroundColor: "var(--surface)" }}
                                    />
                                    <div className="flex-1 space-y-2">
                                        <div
                                            className="h-3 rounded w-2/5"
                                            style={{ backgroundColor: "var(--surface)" }}
                                        />
                                        <div
                                            className="h-2.5 rounded w-1/4"
                                            style={{ backgroundColor: "var(--surface)" }}
                                        />
                                    </div>
                                    <div
                                        className="h-3 rounded w-16 shrink-0"
                                        style={{ backgroundColor: "var(--surface)" }}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                                style={{ backgroundColor: "var(--surface)" }}
                            >
                                <CreditCard
                                    style={{ width: 22, height: 22, color: "var(--muted)", opacity: 0.4 }}
                                />
                            </div>
                            <p className="text-sm font-semibold m-0" style={{ color: "var(--foreground)" }}>
                                Aún no tienes movimientos
                            </p>
                            <p className="text-xs mt-1 m-0" style={{ color: "var(--muted)" }}>
                                Tus transacciones aparecerán aquí.
                            </p>
                        </div>
                    ) : (
                        <div className="pb-2">
                            {transactions.map((tx) => (
                                <TransactionRow key={tx.id} tx={tx} />
                            ))}
                        </div>
                    )}
                </ScrollShadow>

                {/* Footer */}
                <div
                    className="px-4 py-3 shrink-0"
                    style={{ borderTop: "1px solid var(--border)" }}
                >
                    <Link
                        href="/wallet"
                        onClick={onClose}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-colors"
                        style={{ color: "var(--accent)" }}
                    >
                        Ver historial completo →
                    </Link>
                </div>
            </div>
        </>
    );
}
