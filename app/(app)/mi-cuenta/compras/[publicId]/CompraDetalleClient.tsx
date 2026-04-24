"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Spinner } from "@heroui/react/spinner";
import { toast } from "@heroui/react/toast";
import { ArrowLeft, TriangleExclamation } from "@gravity-ui/icons";

import OrderStatusBadge from "@/components/marketplace/OrderStatusBadge";
import OrderTimeline from "@/components/marketplace/OrderTimeline";
import {
    useCancelOrder,
    useConfirmOrderDelivery,
    useMarkOrderPickedUp,
    useOrder,
} from "@/lib/hooks/use-marketplace-v2";
import { mapErrorMessage } from "@/lib/api/errors";

function formatCLP(amount: number | undefined): string {
    if (amount == null) return "$0";
    return amount.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
    });
}

function formatDateTime(s: string | undefined): string {
    if (!s) return "";
    try {
        return new Date(s).toLocaleString("es-CL", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "";
    }
}

export interface CompraDetalleClientProps {
    publicId: string;
}

export default function CompraDetalleClient({ publicId }: CompraDetalleClientProps) {
    const { data: order, isLoading, isError, refetch } = useOrder(publicId);

    const pickedUpMutation = useMarkOrderPickedUp();
    const confirmMutation = useConfirmOrderDelivery();
    const cancelMutation = useCancelOrder();

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isError || !order) {
        return (
            <Card className="border border-border bg-background">
                <Card.Content className="flex flex-col items-center py-16 text-center">
                    <TriangleExclamation className="mb-3 h-10 w-10 text-muted" />
                    <p className="font-semibold text-foreground">No pudimos cargar la orden</p>
                    <p className="mt-1 text-sm text-muted">
                        Puede que no exista o tengas problemas de conexion.
                    </p>
                    <div className="mt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-[var(--accent)]"
                        >
                            Reintentar
                        </button>
                        <Link
                            href="/mi-cuenta/compras"
                            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                        >
                            Volver a mis compras
                        </Link>
                    </div>
                </Card.Content>
            </Card>
        );
    }

    const status = (order.status || "").toUpperCase();
    const img = order.listing?.image_url ?? order.listing?.card_image_url ?? null;
    const title = order.listing?.title ?? "Publicacion";
    const sellerName = order.seller?.display_name ?? order.seller?.username ?? "Vendedor";

    const canConfirmPickup = status === "READY_FOR_PICKUP";
    const canConfirmDelivery = status === "DELIVERED";
    const canCancel = status === "PENDING_PAYMENT";
    const canOpenDispute = status === "DELIVERED" || status === "DISPUTED";

    async function handlePickedUp() {
        try {
            await pickedUpMutation.mutateAsync(publicId);
            toast.success("¡Confirmado! Tu retiro quedo registrado.");
        } catch (err) {
            toast.danger("No se pudo confirmar", { description: mapErrorMessage(err) });
        }
    }

    async function handleConfirmDelivery() {
        try {
            await confirmMutation.mutateAsync(publicId);
            toast.success("Recepcion confirmada. ¡Gracias por comprar en Rankeao!");
        } catch (err) {
            toast.danger("No se pudo confirmar la recepcion", { description: mapErrorMessage(err) });
        }
    }

    async function handleCancel() {
        if (!confirm("¿Seguro que quieres cancelar esta orden?")) return;
        try {
            await cancelMutation.mutateAsync(publicId);
            toast.success("Orden cancelada");
        } catch (err) {
            toast.danger("No se pudo cancelar", { description: mapErrorMessage(err) });
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <header className="rounded-2xl border border-border bg-background p-6 lg:p-8">
                <div className="mb-3 flex items-center gap-2">
                    <Link
                        href="/mi-cuenta/compras"
                        aria-label="Volver a mis compras"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-border"
                    >
                        <ArrowLeft className="h-4 w-4 text-foreground" />
                    </Link>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-muted">
                        Orden #{order.public_id.slice(-8).toUpperCase()}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
                    <OrderStatusBadge status={order.status} />
                </div>
                {order.created_at && (
                    <p className="mt-1 text-sm text-muted">
                        Creada el {formatDateTime(order.created_at)}
                    </p>
                )}
            </header>

            {/* Item + seller */}
            <Card className="border border-border bg-background">
                <Card.Content className="p-5">
                    <div className="flex gap-4">
                        {img ? (
                            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-surface">
                                <Image src={img} alt={title} fill sizes="80px" className="object-cover" />
                            </div>
                        ) : (
                            <div className="h-24 w-20 shrink-0 rounded-lg bg-surface" aria-hidden />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{title}</p>
                            <p className="mt-0.5 text-xs text-muted">
                                Vendedor: <span className="text-foreground">{sellerName}</span>
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                                Cantidad: <span className="text-foreground">{order.quantity ?? 1}</span>
                            </p>
                            {order.pickup_point && (
                                <p className="mt-0.5 text-xs text-muted truncate">
                                    Retiro en:{" "}
                                    <span className="text-foreground">{order.pickup_point.name}</span>
                                </p>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[11px] uppercase tracking-wider text-muted">Total</p>
                            <p className="text-lg font-extrabold text-[var(--accent)]">
                                {formatCLP(order.total)}
                            </p>
                        </div>
                    </div>
                </Card.Content>
            </Card>

            {/* Timeline */}
            <Card className="border border-border bg-background">
                <Card.Header className="px-5 pt-4 pb-2">
                    <p className="text-xs font-bold text-muted uppercase tracking-wider">
                        Estado del pedido
                    </p>
                </Card.Header>
                <Card.Content className="px-5 pb-5 border-t border-border pt-4">
                    <OrderTimeline status={order.status} />
                </Card.Content>
            </Card>

            {/* Actions */}
            {(canConfirmPickup || canConfirmDelivery || canCancel || canOpenDispute) && (
                <Card className="border border-border bg-background">
                    <Card.Header className="px-5 pt-4 pb-2">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider">Acciones</p>
                    </Card.Header>
                    <Card.Content className="px-5 pb-5 border-t border-border pt-4">
                        <div className="flex flex-col gap-3">
                            {canConfirmPickup && (
                                <Button
                                    variant="primary"
                                    onPress={handlePickedUp}
                                    isPending={pickedUpMutation.isPending}
                                >
                                    Ya lo retire
                                </Button>
                            )}
                            {canConfirmDelivery && (
                                <Button
                                    variant="primary"
                                    onPress={handleConfirmDelivery}
                                    isPending={confirmMutation.isPending}
                                >
                                    Confirmar recepcion
                                </Button>
                            )}
                            {canCancel && (
                                <Button
                                    variant="outline"
                                    onPress={handleCancel}
                                    isPending={cancelMutation.isPending}
                                >
                                    Cancelar orden
                                </Button>
                            )}
                            {canOpenDispute && (
                                <Link
                                    href="#"
                                    aria-disabled="true"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toast.info("El modulo de disputas esta en camino.");
                                    }}
                                    className="text-center text-sm font-semibold text-[var(--danger,#ef4444)] underline-offset-2 hover:underline"
                                >
                                    Abrir disputa
                                </Link>
                            )}
                        </div>
                    </Card.Content>
                </Card>
            )}
        </div>
    );
}
