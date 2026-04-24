"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { toast } from "@heroui/react/toast";
import { ArrowLeft, CreditCard } from "@gravity-ui/icons";

import PickupPointSelector from "@/components/marketplace/PickupPointSelector";
import { useCreateOrder, usePickupPoints } from "@/lib/hooks/use-marketplace-v2";
import { mapErrorMessage } from "@/lib/api/errors";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { ListingDetail } from "@/lib/types/marketplace";

export interface CheckoutClientProps {
    listingId: string;
    listing: ListingDetail & Record<string, unknown>;
}

function formatCLP(amount: number): string {
    return amount.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
    });
}

export default function CheckoutClient({ listingId, listing }: CheckoutClientProps) {
    const router = useRouter();
    const isAuthed = useAuthStore((s) => !!s.accessToken);

    const unitPrice = typeof listing.price === "number" ? listing.price : 0;
    const maxQty = typeof listing.quantity === "number" && listing.quantity > 0 ? listing.quantity : 99;

    const [quantity, setQuantity] = useState(1);
    const [pickupPointId, setPickupPointId] = useState<string | undefined>(undefined);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const pickupPoints = usePickupPoints();
    const createOrder = useCreateOrder();

    const total = useMemo(() => Math.floor(unitPrice * quantity), [unitPrice, quantity]);
    const primaryImage = useMemo(() => {
        const first = listing.images?.[0]?.url;
        return first ?? listing.card_image_url ?? listing.image_url ?? null;
    }, [listing]);

    const sellerName = listing.seller_username ?? listing.seller?.username ?? "Vendedor";

    async function handleCheckout() {
        setSubmitError(null);

        if (!isAuthed) {
            router.push(`/login?redirect=/marketplace/buy/${listingId}`);
            return;
        }
        if (!pickupPointId) {
            setSubmitError("Selecciona un punto de retiro para continuar.");
            return;
        }
        if (quantity < 1) {
            setSubmitError("La cantidad debe ser al menos 1.");
            return;
        }

        try {
            const order = await createOrder.mutateAsync({
                listing_id: listingId,
                pickup_point_id: pickupPointId,
                quantity,
            });
            toast.success("Orden creada. ¡Gracias por tu compra!");
            router.push(`/mi-cuenta/compras/${order.public_id}`);
        } catch (err) {
            const msg = mapErrorMessage(err);
            setSubmitError(msg);
            toast.danger("No se pudo crear la orden", { description: msg });
        }
    }

    return (
        <div className="max-w-3xl mx-auto flex flex-col pt-4 pb-12">
            {/* Header */}
            <section className="px-4 lg:px-6 mb-6">
                <div className="rounded-2xl border border-border bg-background p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Link
                            href={`/marketplace/${listingId}`}
                            aria-label="Volver al detalle de la publicacion"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-border transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 text-foreground" />
                        </Link>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-muted">
                            Checkout
                        </p>
                    </div>
                    <h1 className="text-xl font-extrabold text-foreground mb-1">Finaliza tu compra</h1>
                    <p className="text-sm text-muted">
                        Revisa los detalles y selecciona el punto donde quieres retirar.
                    </p>
                </div>
            </section>

            <div className="px-4 lg:px-6 space-y-4">
                {/* Resumen del listing */}
                <Card className="border border-border bg-background">
                    <Card.Header className="px-5 pt-4 pb-2">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider">
                            Publicacion
                        </p>
                    </Card.Header>
                    <Card.Content className="px-5 pb-4 border-t border-border pt-3">
                        <div className="flex gap-4">
                            {primaryImage ? (
                                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-surface">
                                    <Image
                                        src={primaryImage}
                                        alt={listing.title}
                                        fill
                                        sizes="80px"
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="h-24 w-20 shrink-0 rounded-lg bg-surface" aria-hidden />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground line-clamp-2">
                                    {listing.title}
                                </p>
                                <p className="mt-0.5 text-xs text-muted truncate">
                                    Vendedor:{" "}
                                    <span className="font-semibold text-foreground">{sellerName}</span>
                                </p>
                                <p className="mt-2 text-base font-extrabold text-[var(--accent)]">
                                    {formatCLP(unitPrice)}
                                </p>
                            </div>
                        </div>
                    </Card.Content>
                </Card>

                {/* Cantidad */}
                <Card className="border border-border bg-background">
                    <Card.Header className="px-5 pt-4 pb-2">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider">Cantidad</p>
                    </Card.Header>
                    <Card.Content className="px-5 pb-4 border-t border-border pt-3">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg font-bold text-foreground hover:border-[var(--accent)]"
                                aria-label="Disminuir cantidad"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                min={1}
                                max={maxQty}
                                value={quantity}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value, 10);
                                    if (Number.isNaN(v)) return;
                                    setQuantity(Math.max(1, Math.min(maxQty, v)));
                                }}
                                className="w-20 rounded-lg border border-border bg-surface px-3 py-2 text-center text-sm font-semibold text-foreground focus:border-[var(--accent)] focus:outline-none"
                                aria-label="Cantidad"
                            />
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg font-bold text-foreground hover:border-[var(--accent)]"
                                aria-label="Aumentar cantidad"
                            >
                                +
                            </button>
                            <span className="ml-auto text-xs text-muted">
                                Disponible: {maxQty}
                            </span>
                        </div>
                    </Card.Content>
                </Card>

                {/* Punto de retiro */}
                <Card className="border border-border bg-background">
                    <Card.Header className="px-5 pt-4 pb-2">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider">
                            Punto de retiro
                        </p>
                    </Card.Header>
                    <Card.Content className="px-5 pb-4 border-t border-border pt-3">
                        <PickupPointSelector
                            points={pickupPoints.data ?? []}
                            value={pickupPointId}
                            onChange={setPickupPointId}
                            isLoading={pickupPoints.isLoading}
                            isError={pickupPoints.isError}
                        />
                    </Card.Content>
                </Card>

                {/* Total */}
                <Card className="border border-border bg-background">
                    <Card.Header className="px-5 pt-4 pb-2">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider">Total</p>
                    </Card.Header>
                    <Card.Content className="px-5 pb-4 border-t border-border pt-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted">
                                {quantity} x {formatCLP(unitPrice)}
                            </span>
                            <span className="text-2xl font-extrabold text-[var(--accent)]">
                                {formatCLP(total)}
                            </span>
                        </div>
                    </Card.Content>
                </Card>

                {submitError && (
                    <div
                        role="alert"
                        className="rounded-xl border border-[var(--danger,#ef4444)]/40 bg-[var(--danger,#ef4444)]/10 px-4 py-3 text-sm text-[var(--danger,#ef4444)]"
                    >
                        {submitError}
                    </div>
                )}

                <div className="pt-2">
                    <Button
                        variant="primary"
                        className="w-full"
                        isPending={createOrder.isPending}
                        onPress={handleCheckout}
                        isDisabled={!pickupPointId}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pagar con Flow · {formatCLP(total)}
                    </Button>
                    <p className="mt-2 text-center text-[11px] text-muted">
                        La integracion de Flow esta en proceso. Al confirmar, se crea la orden
                        y luego podras completar el pago desde tu cuenta.
                    </p>
                </div>
            </div>
        </div>
    );
}
