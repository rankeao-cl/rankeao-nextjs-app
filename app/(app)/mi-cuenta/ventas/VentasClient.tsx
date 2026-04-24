"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@heroui/react/card";
import { Spinner } from "@heroui/react/spinner";
import { Button } from "@heroui/react/button";
import { Tag, TriangleExclamation } from "@gravity-ui/icons";

import OrderStatusBadge from "@/components/marketplace/OrderStatusBadge";
import SellerOnboardingModal from "@/components/seller/SellerOnboardingModal";
import { useMe, useSellerOrders } from "@/lib/hooks/use-marketplace-v2";
import type { OrderV2, OrderV2Status } from "@/lib/types/marketplace-v2";

type Tab = "pending" | "completed" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
    { key: "pending", label: "Pendientes" },
    { key: "completed", label: "Completadas" },
    { key: "cancelled", label: "Canceladas" },
];

// Para el seller: pendiente = order en camino al completado.
const PENDING_STATUSES: OrderV2Status[] = [
    "PAID",
    "READY_FOR_PICKUP",
    "PICKED_UP",
    "DELIVERED",
    "DISPUTED",
];
const COMPLETED_STATUSES: OrderV2Status[] = ["COMPLETED"];
const CANCELLED_STATUSES: OrderV2Status[] = ["CANCELLED", "REFUNDED"];

const COMMISSION_RATE = 0.1; // 10% flat (ver project_flows_mds_in_progress.md)

function sellerNet(total: number | undefined): number {
    if (!total) return 0;
    // Floor: no redondear a favor del vendedor.
    return Math.floor(total * (1 - COMMISSION_RATE));
}

function filterByTab(orders: OrderV2[], tab: Tab): OrderV2[] {
    const set =
        tab === "pending" ? PENDING_STATUSES : tab === "completed" ? COMPLETED_STATUSES : CANCELLED_STATUSES;
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

function SaleRow({ order }: { order: OrderV2 }) {
    const img = order.listing?.image_url ?? order.listing?.card_image_url ?? null;
    const title = order.listing?.title ?? "Publicacion";
    const buyerName = order.buyer?.display_name ?? order.buyer?.username ?? "Comprador";
    const netToSeller = order.seller_net ?? sellerNet(order.total);

    return (
        <Link
            href={`/mi-cuenta/ventas/${order.public_id}`}
            className="block"
            aria-label={`Ver venta ${order.public_id}`}
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
                                Comprador: <span className="text-foreground">{buyerName}</span>
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
                            <p className="text-[11px] uppercase tracking-wider text-muted">Recibes</p>
                            <p className="text-sm font-extrabold text-foreground">
                                {formatCLP(netToSeller)}
                            </p>
                            {order.total != null && (
                                <p className="text-[11px] text-muted">
                                    Total: {formatCLP(order.total)}
                                </p>
                            )}
                        </div>
                    </div>
                </Card.Content>
            </Card>
        </Link>
    );
}

export default function VentasClient() {
    const [tab, setTab] = useState<Tab>("pending");
    const [onboardingOpen, setOnboardingOpen] = useState(false);

    const me = useMe();
    const isSeller = me.data?.is_seller ?? false;

    const sellerOrders = useSellerOrders();
    const filtered = useMemo(
        () => filterByTab(sellerOrders.data ?? [], tab),
        [sellerOrders.data, tab],
    );

    // Empty state si el user no es seller.
    if (!me.isLoading && me.data && !isSeller) {
        return (
            <>
                <div className="flex flex-col gap-4">
                    <header className="rounded-2xl border border-border bg-background p-6 lg:p-8">
                        <p className="text-[11px] uppercase tracking-wider font-bold text-muted m-0">
                            Mi cuenta
                        </p>
                        <h1 className="mt-2 text-2xl font-extrabold text-foreground">Mis ventas</h1>
                    </header>

                    <Card className="border border-dashed border-border bg-transparent">
                        <Card.Content className="flex flex-col items-center py-14 text-center px-6">
                            <Tag className="mb-3 h-10 w-10 text-muted" />
                            <p className="font-semibold text-foreground">Aun no eres vendedor</p>
                            <p className="mt-1 max-w-md text-sm text-muted">
                                Activa tu cuenta de vendedor para publicar cartas, recibir ordenes y cobrar
                                en tu billetera de Rankeao.
                            </p>
                            <Button
                                variant="primary"
                                className="mt-4"
                                onPress={() => setOnboardingOpen(true)}
                            >
                                Conviertete en vendedor
                            </Button>
                        </Card.Content>
                    </Card>
                </div>

                <SellerOnboardingModal
                    isOpen={onboardingOpen}
                    onOpenChange={setOnboardingOpen}
                    onSuccess={() => me.refetch()}
                />
            </>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <header className="rounded-2xl border border-border bg-background p-6 lg:p-8">
                <p className="text-[11px] uppercase tracking-wider font-bold text-muted m-0">
                    Mi cuenta
                </p>
                <h1 className="mt-2 text-2xl font-extrabold text-foreground">Mis ventas</h1>
                <p className="mt-1 text-sm text-muted max-w-xl">
                    Administra las ventas que tienes en curso. Comision de plataforma: 10%.
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

            {me.isLoading || sellerOrders.isLoading ? (
                <div className="flex justify-center py-16">
                    <Spinner size="lg" />
                </div>
            ) : sellerOrders.isError ? (
                <Card className="border border-border bg-background">
                    <Card.Content className="flex flex-col items-center py-14 text-center">
                        <TriangleExclamation className="mb-3 h-10 w-10 text-muted" />
                        <p className="font-semibold text-foreground">No pudimos cargar tus ventas</p>
                        <p className="mt-1 text-sm text-muted">Revisa tu conexion e intenta nuevamente.</p>
                        <button
                            type="button"
                            onClick={() => sellerOrders.refetch()}
                            className="mt-4 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-[var(--accent)]"
                        >
                            Reintentar
                        </button>
                    </Card.Content>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="border border-dashed border-border bg-transparent">
                    <Card.Content className="flex flex-col items-center py-14 text-center">
                        <Tag className="mb-3 h-10 w-10 text-muted" />
                        <p className="font-semibold text-foreground">
                            {tab === "pending"
                                ? "Sin ventas pendientes"
                                : tab === "completed"
                                  ? "Aun no tienes ventas completadas"
                                  : "Sin ventas canceladas"}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                            Cuando alguien compre tus publicaciones aparecera aqui.
                        </p>
                    </Card.Content>
                </Card>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map((order) => (
                        <SaleRow key={order.public_id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}
