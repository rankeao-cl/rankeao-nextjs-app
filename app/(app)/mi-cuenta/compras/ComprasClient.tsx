"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@heroui/react/card";
import { Spinner } from "@heroui/react/spinner";
import { ShoppingCart, TriangleExclamation } from "@gravity-ui/icons";

import OrderStatusBadge from "@/components/marketplace/OrderStatusBadge";
import { useBuyerOrders } from "@/lib/hooks/use-marketplace-v2";
import type { OrderV2, OrderV2Status } from "@/lib/types/marketplace-v2";

type Tab = "active" | "completed" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
    { key: "active", label: "Activas" },
    { key: "completed", label: "Completadas" },
    { key: "cancelled", label: "Canceladas" },
];

const ACTIVE_STATUSES: OrderV2Status[] = [
    "PENDING_PAYMENT",
    "PAID",
    "READY_FOR_PICKUP",
    "PICKED_UP",
    "DELIVERED",
    "DISPUTED",
];
const COMPLETED_STATUSES: OrderV2Status[] = ["COMPLETED"];
const CANCELLED_STATUSES: OrderV2Status[] = ["CANCELLED", "REFUNDED"];

function filterByTab(orders: OrderV2[], tab: Tab): OrderV2[] {
    const set =
        tab === "active"
            ? ACTIVE_STATUSES
            : tab === "completed"
              ? COMPLETED_STATUSES
              : CANCELLED_STATUSES;
    return orders.filter((o) => (set as string[]).includes(o.status));
}

function formatCLP(amount: number | undefined): string {
    if (amount == null) return "$0";
    return amount.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
    });
}

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "";
    try {
        return new Date(dateStr).toLocaleDateString("es-CL", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "";
    }
}

function OrderRow({ order }: { order: OrderV2 }) {
    const img = order.listing?.image_url ?? order.listing?.card_image_url ?? null;
    const title = order.listing?.title ?? "Publicacion";
    const sellerName = order.seller?.display_name ?? order.seller?.username ?? "Vendedor";

    return (
        <Link
            href={`/mi-cuenta/compras/${order.public_id}`}
            className="block"
            aria-label={`Ver orden ${order.public_id}`}
        >
            <Card className="border border-border bg-background hover:border-[var(--accent)] transition-colors">
                <Card.Content className="p-4">
                    <div className="flex items-center gap-4">
                        {img ? (
                            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
                                <Image src={img} alt={title} fill sizes="56px" className="object-cover" />
                            </div>
                        ) : (
                            <div className="h-16 w-14 shrink-0 rounded-lg bg-surface" aria-hidden />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{title}</p>
                            <p className="mt-0.5 text-xs text-muted truncate">
                                Vendedor: <span className="text-foreground">{sellerName}</span>
                            </p>
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <OrderStatusBadge status={order.status} />
                                {order.created_at && (
                                    <span className="text-[11px] text-muted">
                                        {formatDate(order.created_at)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-sm font-extrabold text-foreground">
                                {formatCLP(order.total)}
                            </p>
                            {order.quantity && order.quantity > 1 && (
                                <p className="text-[11px] text-muted">
                                    {order.quantity} unidades
                                </p>
                            )}
                        </div>
                    </div>
                </Card.Content>
            </Card>
        </Link>
    );
}

export default function ComprasClient() {
    const [tab, setTab] = useState<Tab>("active");
    const { data: orders, isLoading, isError, refetch } = useBuyerOrders();

    const filtered = useMemo(
        () => filterByTab(orders ?? [], tab),
        [orders, tab],
    );

    return (
        <div className="flex flex-col gap-4">
            <header className="rounded-2xl border border-border bg-background p-6 lg:p-8">
                <p className="text-[11px] uppercase tracking-wider font-bold text-muted m-0">
                    Mi cuenta
                </p>
                <h1 className="mt-2 text-2xl font-extrabold text-foreground">Mis compras</h1>
                <p className="mt-1 text-sm text-muted max-w-xl">
                    Gestiona las ordenes que compraste en el marketplace, confirma retiros y recepciones.
                </p>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 rounded-xl border border-border bg-background p-1">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        aria-pressed={tab === t.key}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                            tab === t.key
                                ? "bg-surface text-[var(--accent)]"
                                : "text-muted hover:text-foreground"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Spinner size="lg" />
                </div>
            ) : isError ? (
                <Card className="border border-border bg-background">
                    <Card.Content className="flex flex-col items-center py-14 text-center">
                        <TriangleExclamation className="mb-3 h-10 w-10 text-muted" />
                        <p className="font-semibold text-foreground">No pudimos cargar tus compras</p>
                        <p className="mt-1 text-sm text-muted">Revisa tu conexion e intenta nuevamente.</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-4 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-[var(--accent)]"
                        >
                            Reintentar
                        </button>
                    </Card.Content>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="border border-dashed border-border bg-transparent">
                    <Card.Content className="flex flex-col items-center py-14 text-center">
                        <ShoppingCart className="mb-3 h-10 w-10 text-muted" />
                        <p className="font-semibold text-foreground">
                            {tab === "active"
                                ? "Sin compras activas"
                                : tab === "completed"
                                  ? "Aun no hay compras completadas"
                                  : "Sin compras canceladas"}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                            Cuando compres algo en el marketplace aparecera aqui.
                        </p>
                        <Link
                            href="/marketplace"
                            className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                        >
                            Explorar marketplace
                        </Link>
                    </Card.Content>
                </Card>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map((order) => (
                        <OrderRow key={order.public_id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}
