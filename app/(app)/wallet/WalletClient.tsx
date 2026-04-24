"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CreditCard, Plus, ArrowUpFromSquare } from "@gravity-ui/icons";
import { Button } from "@heroui/react/button";

import PageHero from "@/components/ui/PageHero";
import { AuthGuard } from "@/components/ui/AuthGuard/AuthGuard";
import {
    useBalance,
    useInfiniteTransactions,
    usePayouts,
} from "@/lib/hooks/use-wallet";
import { useIsSeller } from "@/lib/hooks/use-is-seller";
import { BUYER_WALLET_ENABLED } from "@/lib/flags";
import {
    groupByCurrency,
    labelForKind,
    labelForPayoutStatus,
    tonalStyleForPayoutStatus,
} from "@/features/wallet/shared";
import {
    formatCurrency,
    formatSignedCurrency,
    isCreditTx,
    timeAgo,
} from "@/lib/utils/format";
import { useUIStore } from "@/lib/stores/ui-store";
import type { WalletTransaction, WalletPayout } from "@/lib/types/wallet";

// ── Balance cards ──

function BalanceCards() {
    const { data, isLoading } = useBalance();
    const groups = useMemo(() => groupByCurrency(data?.accounts), [data]);

    if (isLoading && !data) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mx-4 lg:mx-6 mb-4">
                {[...Array(2)].map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl p-5 h-[128px] animate-pulse"
                        style={{ backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)" }}
                    />
                ))}
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className="mx-4 lg:mx-6 mb-4">
                <div
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)" }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-accent/15 text-accent">
                            <CreditCard className="size-5" />
                        </div>
                        <div>
                            <p className="text-[12px] uppercase font-bold tracking-wider m-0 text-muted">
                                Saldo disponible
                            </p>
                            <p className="text-[24px] font-extrabold tabular-nums m-0 text-foreground">
                                {formatCurrency(0, "CLP")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mx-4 lg:mx-6 mb-4">
            {groups.map((g) => (
                <div
                    key={g.currency}
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
                        <span className="text-[10px] font-extrabold opacity-80">{g.currency}</span>
                    </div>
                    <p className="text-[32px] font-extrabold leading-tight m-0 mb-3 tabular-nums">
                        {formatCurrency(g.available, g.currency)}
                    </p>
                    <div className="flex items-center justify-between text-[11px] opacity-90">
                        <div>
                            <p className="m-0 opacity-75">En reserva</p>
                            <p className="m-0 font-bold tabular-nums">
                                {formatCurrency(g.holds, g.currency)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="m-0 opacity-75">Total</p>
                            <p className="m-0 font-bold tabular-nums">
                                {formatCurrency(g.total, g.currency)}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Transaction row — desktop table ──

function TxDesktopRow({ tx }: { tx: WalletTransaction }) {
    const credit = isCreditTx(tx.kind);
    const currency = tx.currency || "CLP";
    return (
        <div
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
        >
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
            <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground m-0 truncate">
                    {labelForKind(tx.kind)}
                </p>
                <p className="text-[11px] m-0 truncate" style={{ color: "var(--muted)" }}>
                    {tx.reference_type ? `${tx.reference_type} · ` : ""}
                    {timeAgo(tx.created_at, { verbose: true, fallbackDays: 30 })}
                </p>
            </div>
            <p
                className="text-[13px] font-bold tabular-nums m-0 text-right"
                style={{ color: credit ? "#00b24b" : "#f63d00" }}
            >
                {formatSignedCurrency(tx.amount, currency)}
            </p>
            <p
                className="text-[12px] tabular-nums m-0 text-right hidden md:block"
                style={{ color: "var(--muted)" }}
            >
                Saldo: {formatCurrency(tx.balance_after, currency)}
            </p>
        </div>
    );
}

// ── Payout row ──

function PayoutRow({ payout }: { payout: WalletPayout }) {
    const currency = payout.currency || "CLP";
    const tone = tonalStyleForPayoutStatus(payout.status);
    const createdAt = payout.created_at
        ? new Date(payout.created_at).toLocaleDateString("es-CL", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : "—";
    const resolvedAt = payout.resolved_at
        ? new Date(payout.resolved_at).toLocaleDateString("es-CL", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : null;

    return (
        <div
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
        >
            <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground m-0">
                    Retiro · {createdAt}
                </p>
                {payout.rejection_reason && (
                    <p
                        className="text-[11px] m-0 truncate"
                        style={{ color: "#b53000" }}
                        title={payout.rejection_reason}
                    >
                        Motivo: {payout.rejection_reason}
                    </p>
                )}
                {!payout.rejection_reason && resolvedAt && (
                    <p className="text-[11px] m-0" style={{ color: "var(--muted)" }}>
                        Resuelto: {resolvedAt}
                    </p>
                )}
            </div>
            <p
                className="text-[13px] font-bold tabular-nums m-0 text-right"
                style={{ color: "var(--foreground)" }}
            >
                {formatCurrency(payout.amount, currency)}
            </p>
            <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ backgroundColor: tone.bg, color: tone.color }}
            >
                {labelForPayoutStatus(payout.status)}
            </span>
            <span aria-hidden="true" className="hidden md:inline-block w-4" />
        </div>
    );
}

// ── Payouts tab ──

function PayoutsPanel() {
    const { data, isLoading } = usePayouts();
    const payouts = data?.payouts ?? [];

    return (
        <div className="mx-4 lg:mx-6 mb-10">
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    backgroundColor: "var(--surface-solid)",
                    border: "1px solid var(--border)",
                }}
            >
                <div
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
                    style={{
                        color: "var(--muted)",
                        borderBottom: "1px solid var(--border)",
                    }}
                >
                    <span>Solicitud</span>
                    <span className="text-right">Monto</span>
                    <span className="text-right">Estado</span>
                    <span aria-hidden="true" className="hidden md:inline-block w-4" />
                </div>

                {isLoading && payouts.length === 0 ? (
                    <div>
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3 animate-pulse border-b"
                                style={{ borderColor: "var(--border)" }}
                            >
                                <div
                                    className="h-3 w-2/5 rounded"
                                    style={{ backgroundColor: "var(--surface)" }}
                                />
                                <div
                                    className="h-3 w-20 rounded"
                                    style={{ backgroundColor: "var(--surface)" }}
                                />
                                <div
                                    className="h-3 w-16 rounded"
                                    style={{ backgroundColor: "var(--surface)" }}
                                />
                                <span className="hidden md:inline-block w-4" />
                            </div>
                        ))}
                    </div>
                ) : payouts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ backgroundColor: "var(--surface)" }}
                        >
                            <ArrowUpFromSquare
                                style={{
                                    width: 26,
                                    height: 26,
                                    color: "var(--muted)",
                                    opacity: 0.4,
                                }}
                            />
                        </div>
                        <p className="text-sm font-semibold m-0" style={{ color: "var(--foreground)" }}>
                            Aún no tienes solicitudes de retiro
                        </p>
                        <p className="text-xs mt-1 mb-0" style={{ color: "var(--muted)" }}>
                            Cuando solicites un retiro aparecerá aquí con su estado.
                        </p>
                    </div>
                ) : (
                    <div>
                        {payouts.map((p) => (
                            <PayoutRow key={p.id} payout={p} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main wallet page (behind AuthGuard) ──

type WalletTab = "transactions" | "payouts";

function WalletContent() {
    const [kindFilter, setKindFilter] = useState<string>("ALL");
    const [rawActiveTab, setActiveTab] = useState<WalletTab>("transactions");
    const openDeposit = useUIStore((s) => s.openDepositModal);
    const openPayout = useUIStore((s) => s.openPayoutModal);
    const { isSeller } = useIsSeller();

    const showDepositCTA = BUYER_WALLET_ENABLED;
    const showPayoutCTA = isSeller;
    const tabs = useMemo(() => {
        const base: Array<{ key: WalletTab; label: string }> = [
            { key: "transactions", label: "Transacciones" },
        ];
        if (isSeller) base.push({ key: "payouts", label: "Retiros" });
        return base;
    }, [isSeller]);

    // Si el user no es seller pero el estado local quedó en "payouts",
    // forzamos la tab visible a "transactions" — sin tocar setState en
    // un effect (para evitar cascading renders).
    const activeTab: WalletTab =
        rawActiveTab === "payouts" && !isSeller ? "transactions" : rawActiveTab;

    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
        useInfiniteTransactions(20);

    const allTxs: WalletTransaction[] = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((p) => p.transactions);
    }, [data]);

    const availableKinds = useMemo(() => {
        const s = new Set<string>();
        for (const t of allTxs) s.add(t.kind);
        return Array.from(s);
    }, [allTxs]);

    const filtered = useMemo(() => {
        if (kindFilter === "ALL") return allTxs;
        return allTxs.filter((t) => t.kind === kindFilter);
    }, [allTxs, kindFilter]);

    const emptyFirstLoad = !isLoading && allTxs.length === 0;

    return (
        <div className="max-w-5xl mx-auto flex flex-col min-h-full">
            <PageHero
                badge="Wallet"
                title="Mi wallet"
                subtitle="Tu saldo disponible y el historial de movimientos en Rankeao."
                action={
                    showDepositCTA || showPayoutCTA ? (
                        <div className="hidden md:flex flex-col gap-2 min-w-[140px]">
                            {showDepositCTA && (
                                <Button
                                    size="sm"
                                    variant="primary"
                                    className="font-bold"
                                    aria-label="Recargar saldo"
                                    onPress={openDeposit}
                                >
                                    <Plus className="size-3.5 mr-1.5" />
                                    Recargar
                                </Button>
                            )}
                            {showPayoutCTA && (
                                <Button
                                    size="sm"
                                    variant="tertiary"
                                    className="font-bold"
                                    aria-label="Retirar saldo"
                                    onPress={openPayout}
                                >
                                    <ArrowUpFromSquare className="size-3.5 mr-1.5" />
                                    Retirar
                                </Button>
                            )}
                        </div>
                    ) : undefined
                }
            />

            <BalanceCards />

            {/* Tabs — sólo se renderiza la barra si hay más de una tab (ej: seller) */}
            {tabs.length > 1 && (
                <div
                    role="tablist"
                    aria-label="Secciones de wallet"
                    className="mx-4 lg:mx-6 mb-3 flex gap-2"
                >
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                role="tab"
                                type="button"
                                aria-selected={isActive}
                                onClick={() => setActiveTab(tab.key)}
                                className="px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap cursor-pointer transition-colors"
                                style={{
                                    backgroundColor: isActive ? "var(--foreground)" : "var(--surface-solid)",
                                    color: isActive ? "var(--background)" : "var(--muted)",
                                    border: isActive ? "1px solid transparent" : "1px solid var(--border)",
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {activeTab === "payouts" && isSeller && <PayoutsPanel />}
            {activeTab === "transactions" && <TransactionsPanel
                allTxs={allTxs}
                filtered={filtered}
                kindFilter={kindFilter}
                setKindFilter={setKindFilter}
                availableKinds={availableKinds}
                isLoading={isLoading}
                emptyFirstLoad={emptyFirstLoad}
                hasNextPage={!!hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
                openDeposit={openDeposit}
                showDepositCTA={showDepositCTA}
            />}
        </div>
    );
}

// ── Transactions panel (extracted so Tabs can switch cleanly) ──

interface TransactionsPanelProps {
    allTxs: WalletTransaction[];
    filtered: WalletTransaction[];
    kindFilter: string;
    setKindFilter: (k: string) => void;
    availableKinds: string[];
    isLoading: boolean;
    emptyFirstLoad: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    openDeposit: () => void;
    showDepositCTA: boolean;
}

function TransactionsPanel({
    allTxs,
    filtered,
    kindFilter,
    setKindFilter,
    availableKinds,
    isLoading,
    emptyFirstLoad,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    openDeposit,
    showDepositCTA,
}: TransactionsPanelProps) {
    return (
        <>
            {/* Filter chips */}
            {availableKinds.length > 1 && (
                <div className="mx-4 lg:mx-6 mb-3 flex flex-wrap gap-2">
                    {(["ALL", ...availableKinds] as const).map((k) => {
                        const active = kindFilter === k;
                        return (
                            <button
                                key={k}
                                type="button"
                                onClick={() => setKindFilter(k)}
                                className="px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap cursor-pointer transition-colors"
                                style={{
                                    backgroundColor: active ? "var(--foreground)" : "var(--surface-solid)",
                                    color: active ? "var(--background)" : "var(--muted)",
                                    border: active ? "none" : "1px solid var(--border)",
                                }}
                            >
                                {k === "ALL" ? "Todos" : labelForKind(k)}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Transactions list */}
            <div className="mx-4 lg:mx-6 mb-10">
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)" }}
                >
                    <div
                        className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}
                    >
                        <span className="w-9" aria-hidden="true" />
                        <span>Movimiento</span>
                        <span className="text-right">Monto</span>
                        <span className="text-right hidden md:block">Saldo resultante</span>
                    </div>

                    {isLoading && allTxs.length === 0 ? (
                        <div>
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-3 animate-pulse border-b"
                                    style={{ borderColor: "var(--border)" }}
                                >
                                    <div
                                        className="w-9 h-9 rounded-full"
                                        style={{ backgroundColor: "var(--surface)" }}
                                    />
                                    <div className="space-y-2">
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
                                        className="h-3 w-20 rounded"
                                        style={{ backgroundColor: "var(--surface)" }}
                                    />
                                    <div
                                        className="h-3 w-24 rounded hidden md:block"
                                        style={{ backgroundColor: "var(--surface)" }}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : emptyFirstLoad ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                style={{ backgroundColor: "var(--surface)" }}
                            >
                                <CreditCard
                                    style={{ width: 28, height: 28, color: "var(--muted)", opacity: 0.4 }}
                                />
                            </div>
                            <p className="text-sm font-semibold m-0" style={{ color: "var(--foreground)" }}>
                                Aún no tienes movimientos
                            </p>
                            <p className="text-xs mt-1 mb-4" style={{ color: "var(--muted)" }}>
                                Cuando recibas o gastes saldo aparecerá aquí.
                            </p>
                            {showDepositCTA && (
                                <Button
                                    size="sm"
                                    variant="primary"
                                    aria-label="Recargar saldo"
                                    onPress={openDeposit}
                                >
                                    Recargar saldo
                                </Button>
                            )}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <p className="text-sm font-semibold m-0" style={{ color: "var(--foreground)" }}>
                                Sin resultados para este filtro
                            </p>
                            <p className="text-xs mt-1 m-0" style={{ color: "var(--muted)" }}>
                                Prueba con otra categoría o con &quot;Todos&quot;.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {filtered.map((tx) => (
                                <TxDesktopRow key={tx.id} tx={tx} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Load more */}
                {hasNextPage && (
                    <div className="flex justify-center mt-6">
                        <Button
                            size="sm"
                            variant="tertiary"
                            onPress={() => fetchNextPage()}
                            isPending={isFetchingNextPage}
                            isDisabled={isFetchingNextPage}
                            className="font-semibold"
                        >
                            {isFetchingNextPage ? "Cargando..." : "Cargar más"}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

export default function WalletClient() {
    return (
        <AuthGuard>
            <WalletContent />
        </AuthGuard>
    );
}
