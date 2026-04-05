"use client";

import { useState } from "react";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { Spinner } from "@heroui/react/spinner";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCheckout, usePayCheckout } from "@/lib/hooks/use-marketplace";
import type { MarketplaceCheckout } from "@/lib/types/marketplace";
import {
  ArrowLeft,
  CircleCheck,
  Clock,
  TriangleExclamation,
  CreditCard,
} from "@gravity-ui/icons";

// ── Status helpers ──

type ChipColor = "warning" | "accent" | "success" | "danger" | "default";

const CHECKOUT_STATUS_CONFIG: Record<
  string,
  { label: string; chipColor: ChipColor }
> = {
  PENDING_PAYMENT: { label: "Pendiente de pago", chipColor: "warning" },
  PROCESSING:      { label: "Procesando",        chipColor: "accent" },
  PAID:            { label: "Pagado",             chipColor: "success" },
  CONFIRMED:       { label: "Confirmado",         chipColor: "success" },
  COMPLETED:       { label: "Completado",         chipColor: "success" },
  CANCELLED:       { label: "Cancelado",          chipColor: "danger" },
  FAILED:          { label: "Fallido",            chipColor: "danger" },
  EXPIRED:         { label: "Expirado",           chipColor: "danger" },
};

function getStatusConfig(status: string) {
  return (
    CHECKOUT_STATUS_CONFIG[status.toUpperCase()] ??
    CHECKOUT_STATUS_CONFIG.PENDING_PAYMENT
  );
}

const DELIVERY_LABELS: Record<string, string> = {
  SHIPPING:  "Envio por courier",
  IN_PERSON: "Entrega en persona",
  PICKUP:    "Retiro en tienda",
};

const PAYMENT_PROVIDERS = [
  { key: "WEBPAY", label: "Webpay" },
  { key: "MERCADOPAGO", label: "Mercado Pago" },
];

function formatCLP(amount: number | undefined): string {
  if (amount == null) return "$0";
  return amount.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Section Card ──

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass-sm border border-[var(--border)] mb-4">
      <Card.Header className="px-5 pt-4 pb-2">
        <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
          {title}
        </p>
      </Card.Header>
      <Card.Content className="px-5 pb-4 border-t border-[var(--border)] pt-3">
        {children}
      </Card.Content>
    </Card>
  );
}

// ── Main Page ──

export default function CheckoutPage() {
  const params = useParams();
  const checkoutId = params?.id as string;
  const { status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";

  const {
    data: rawCheckout,
    isLoading,
    isError,
  } = useCheckout(checkoutId);

  const payMutation = usePayCheckout();
  const [payingProvider, setPayingProvider] = useState<string | null>(null);

  // Normalize the checkout data — API may nest under .data or .checkout
  const checkout: MarketplaceCheckout | null =
    rawCheckout?.data ??
    rawCheckout?.checkout ??
    (rawCheckout as MarketplaceCheckout) ??
    null;

  // ── Pay handler ──

  async function handlePay(provider: string) {
    if (!checkoutId) return;
    setPayingProvider(provider);
    try {
      const result = await payMutation.mutateAsync({
        checkoutId,
        payload: { provider },
      });
      const paymentUrl =
        (result as { payment_url?: string })?.payment_url ??
        (result as { checkout?: { payment_url?: string } })?.checkout?.payment_url ??
        (result as { data?: { payment_url?: string } })?.data?.payment_url;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } catch {
      // mutation error is handled by react-query
    } finally {
      setPayingProvider(null);
    }
  }

  // ── Loading state ──

  if (!isAuth || isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Error state ──

  if (isError || !checkout) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="glass border border-[var(--border)]">
          <Card.Content className="py-16 text-center flex flex-col items-center">
            <TriangleExclamation className="w-12 h-12 text-[var(--muted)] mb-4" />
            <p className="text-[var(--foreground)] font-semibold mb-1">
              Checkout no encontrado
            </p>
            <p className="text-sm text-[var(--muted)] mb-4">
              Es posible que haya expirado o el enlace sea incorrecto.
            </p>
            <Link href="/marketplace">
              <Button variant="outline">Volver al marketplace</Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const status = checkout.status?.toUpperCase() ?? "PENDING_PAYMENT";
  const cfg = getStatusConfig(status);
  const isPendingPayment = status === "PENDING_PAYMENT";
  const isPaid =
    status === "PAID" ||
    status === "CONFIRMED" ||
    status === "COMPLETED";

  // Extract financial details — the API may provide these or we fall back to total
  const subtotal = checkout.subtotal ?? checkout.total ?? 0;
  const shippingCost = checkout.shipping_cost ?? 0;
  const platformFee = checkout.platform_fee ?? 0;
  const total = checkout.total ?? 0;
  const itemName = checkout.item_summary ?? checkout.item_name ?? `Listing #${checkout.listing_id?.slice(-8) ?? ""}`;
  const quantity = checkout.quantity ?? 1;
  const orderNumber = checkout.order_number ?? checkout.id.slice(-8).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto flex flex-col pt-4 pb-12">
      {/* Header */}
      <section className="px-4 lg:px-6 mb-6">
        <div className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/marketplace"
              className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--foreground)]" />
            </Link>
            <Chip color={cfg.chipColor} variant="soft" size="sm">
              {cfg.label}
            </Chip>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-1">
            Checkout #{orderNumber}
          </h1>
          {checkout.created_at && (
            <p className="text-sm text-[var(--muted)]">
              Creado: {formatDate(checkout.created_at)}
            </p>
          )}
        </div>
      </section>

      <div className="px-4 lg:px-6">
        {/* ── Success Banner ── */}
        {isPaid && (
          <div
            className="glass-sm border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 mb-4 border-l-4"
            style={{ borderLeftColor: "var(--success, #22c55e)" }}
          >
            <CircleCheck className="w-6 h-6 text-green-500 shrink-0" />
            <div className="flex-1">
              <p className="text-base font-bold text-[var(--foreground)]">
                Pago confirmado
              </p>
              <p className="text-xs text-[var(--muted)]">
                Tu orden ha sido procesada correctamente.
              </p>
            </div>
          </div>
        )}

        {/* ── Pending Payment Banner ── */}
        {isPendingPayment && (
          <div
            className="glass-sm border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 mb-4 border-l-4"
            style={{ borderLeftColor: "var(--warning, #eab308)" }}
          >
            <Clock className="w-6 h-6 text-yellow-500 shrink-0" />
            <div className="flex-1">
              <p className="text-base font-bold text-[var(--foreground)]">
                Pago pendiente
              </p>
              <p className="text-xs text-[var(--muted)]">
                Selecciona un metodo de pago para completar tu compra.
              </p>
            </div>
          </div>
        )}

        {/* ── Failed / Cancelled Banner ── */}
        {(status === "FAILED" || status === "CANCELLED" || status === "EXPIRED") && (
          <div
            className="glass-sm border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 mb-4 border-l-4"
            style={{ borderLeftColor: "var(--danger, #ef4444)" }}
          >
            <TriangleExclamation className="w-6 h-6 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-base font-bold text-[var(--foreground)]">
                {status === "CANCELLED"
                  ? "Checkout cancelado"
                  : status === "EXPIRED"
                    ? "Checkout expirado"
                    : "Error en el pago"}
              </p>
              <p className="text-xs text-[var(--muted)]">
                Puedes intentar comprar nuevamente desde el marketplace.
              </p>
            </div>
          </div>
        )}

        {/* ── Order Summary ── */}
        <SectionCard title="Resumen del pedido">
          <div className="space-y-2">
            {/* Item */}
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--muted)]">Articulo</span>
              <span className="text-sm font-semibold text-[var(--foreground)] text-right max-w-[60%] truncate">
                {itemName}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--muted)]">Cantidad</span>
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {quantity}
              </span>
            </div>

            {/* Subtotal */}
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--muted)]">Subtotal</span>
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {formatCLP(subtotal)}
              </span>
            </div>

            {/* Platform fee */}
            {platformFee > 0 && (
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-sm text-[var(--muted)]">
                  Comision de plataforma
                </span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {formatCLP(platformFee)}
                </span>
              </div>
            )}

            {/* Shipping */}
            {shippingCost > 0 && (
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-sm text-[var(--muted)]">Envio</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {formatCLP(shippingCost)}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between py-2">
              <span className="text-sm font-bold text-[var(--foreground)]">
                Total
              </span>
              <span className="text-lg font-extrabold text-[var(--accent)]">
                {formatCLP(total)}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* ── Delivery Method ── */}
        <SectionCard title="Metodo de entrega">
          <div className="flex items-center gap-2">
            <Chip color="default" variant="soft" size="sm">
              {DELIVERY_LABELS[checkout.delivery_method?.toUpperCase()] ??
                checkout.delivery_method ??
                "-"}
            </Chip>
          </div>
          {checkout.shipping_address && (
            <div className="mt-3 text-sm text-[var(--muted)]">
              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">
                Direccion de envio
              </p>
              <p className="text-sm text-[var(--foreground)]">
                {typeof checkout.shipping_address === "string"
                  ? checkout.shipping_address
                  : `${checkout.shipping_address.address_line_1}, ${checkout.shipping_address.city}, ${checkout.shipping_address.region}`}
              </p>
            </div>
          )}
        </SectionCard>

        {/* ── Payment Status ── */}
        <SectionCard title="Estado del pago">
          <div className="flex items-center gap-3">
            <Chip color={cfg.chipColor} variant="soft" size="sm">
              {cfg.label}
            </Chip>
            {(checkout.status || checkout.payment_method) && (
              <span className="text-xs text-[var(--muted)]">
                {checkout.payment_method
                  ? `via ${checkout.payment_method}`
                  : ""}
              </span>
            )}
          </div>
        </SectionCard>

        {/* ── Payment Buttons (Pending) ── */}
        {isPendingPayment && (
          <SectionCard title="Selecciona metodo de pago">
            <div className="flex flex-col gap-3">
              {PAYMENT_PROVIDERS.map((prov) => (
                <Button
                  key={prov.key}
                  variant="primary"
                  className="w-full"
                  isPending={payingProvider === prov.key}
                  isDisabled={payingProvider !== null && payingProvider !== prov.key}
                  onPress={() => handlePay(prov.key)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagar con {prov.label}
                </Button>
              ))}
            </div>
            {payMutation.isError && (
              <p className="text-xs text-red-500 mt-3">
                Error al iniciar el pago. Intenta nuevamente.
              </p>
            )}
          </SectionCard>
        )}

        {/* ── Success Actions ── */}
        {isPaid && (
          <div className="flex flex-col gap-3 mt-2">
            <Link href="/marketplace/orders" className="w-full">
              <Button variant="primary" className="w-full">
                Ver mis ordenes
              </Button>
            </Link>
            <Link href="/marketplace" className="w-full">
              <Button variant="outline" className="w-full">
                Volver al marketplace
              </Button>
            </Link>
          </div>
        )}

        {/* ── Failed / Cancelled Actions ── */}
        {(status === "FAILED" || status === "CANCELLED" || status === "EXPIRED") && (
          <div className="flex flex-col gap-3 mt-2">
            <Link href="/marketplace" className="w-full">
              <Button variant="primary" className="w-full">
                Volver al marketplace
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
