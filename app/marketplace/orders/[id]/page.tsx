"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Chip, Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getMarketplaceOrderDetail,
  shipOrder,
  confirmDelivery,
  cancelOrder,
  openDispute,
  reviewOrder,
} from "@/lib/api/marketplace";
import type { MarketplaceOrder } from "@/lib/types/marketplace";
import {
  ArrowLeft,
  Clock,
  CircleCheck,
  Plane,
  CircleXmark,
  TriangleExclamation,
} from "@gravity-ui/icons";

// ── Status helpers ──

type ChipColor = "warning" | "accent" | "success" | "danger" | "default";

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; chipColor: ChipColor }
> = {
  PENDING:   { label: "Pendiente",  chipColor: "warning" },
  CONFIRMED: { label: "Confirmado", chipColor: "accent" },
  PAID:      { label: "Pagado",     chipColor: "accent" },
  SHIPPED:   { label: "Enviado",    chipColor: "warning" },
  DELIVERED: { label: "Entregado",  chipColor: "success" },
  COMPLETED: { label: "Completado", chipColor: "success" },
  CANCELLED: { label: "Cancelado",  chipColor: "danger" },
  DISPUTED:  { label: "En disputa", chipColor: "danger" },
};

function getStatusConfig(status: string) {
  return ORDER_STATUS_CONFIG[status.toUpperCase()] ?? ORDER_STATUS_CONFIG.PENDING;
}

const DELIVERY_LABELS: Record<string, string> = {
  SHIPPING: "Envio por courier",
  IN_PERSON: "Entrega en persona",
  PICKUP: "Retiro en tienda",
};

const TIMELINE_STEPS = ["PENDING", "CONFIRMED", "PAID", "SHIPPED", "DELIVERED", "COMPLETED"];

function getTimelineIndex(status: string): number {
  const idx = TIMELINE_STEPS.indexOf(status.toUpperCase());
  return idx >= 0 ? idx : 0;
}

function formatCLP(amount: number | undefined): string {
  if (amount == null) return "$0";
  return amount.toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 });
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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="glass-sm border border-[var(--border)] mb-4">
      <Card.Header className="px-5 pt-4 pb-2">
        <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">{title}</p>
      </Card.Header>
      <Card.Content className="px-5 pb-4 border-t border-[var(--border)] pt-3">
        {children}
      </Card.Content>
    </Card>
  );
}

// ── Ship Form ──

function ShipForm({
  onSubmit,
  isPending,
  onCancel,
}: {
  onSubmit: (carrier: string, tracking: string) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  return (
    <SectionCard title="Marcar como enviado">
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--muted)]">Courier / Empresa</label>
          <input
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
            placeholder="Ej: Chilexpress, Starken, Correos"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--muted)]">Numero de seguimiento</label>
          <input
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
            placeholder="Ej: CL12345678"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onPress={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            isPending={isPending}
            onPress={() => {
              if (carrier.trim() && tracking.trim()) {
                onSubmit(carrier.trim(), tracking.trim());
              }
            }}
          >
            Confirmar envio
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

// ── Dispute Form ──

function DisputeForm({
  onSubmit,
  isPending,
  onCancel,
}: {
  onSubmit: (reason: string, description: string) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  return (
    <SectionCard title="Abrir disputa">
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--muted)]">Motivo</label>
          <input
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
            placeholder="Ej: Producto no recibido, estado incorrecto"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--muted)]">Descripcion</label>
          <textarea
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] min-h-[80px] resize-none"
            placeholder="Describe el problema en detalle..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onPress={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            isPending={isPending}
            onPress={() => {
              if (reason.trim() && description.trim()) {
                onSubmit(reason.trim(), description.trim());
              }
            }}
          >
            Enviar disputa
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

// ── Review Form ──

function ReviewForm({
  onSubmit,
  isPending,
  onCancel,
}: {
  onSubmit: (rating: number, comment: string) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  return (
    <SectionCard title="Dejar resena">
      <div className="space-y-3">
        <div>
          <p className="text-xs text-[var(--muted)] font-semibold mb-2">Calificacion</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl transition-colors ${
                  star <= rating ? "text-yellow-400" : "text-[var(--border)]"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--muted)]">Comentario (opcional)</label>
          <textarea
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] min-h-[60px] resize-none"
            placeholder="Cuenta tu experiencia..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onPress={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            isPending={isPending}
            onPress={() => onSubmit(rating, comment)}
          >
            Enviar resena
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

// ── Main Page ──

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { session, status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";

  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Form visibility
  const [showShipForm, setShowShipForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Action states
  const [shipPending, setShipPending] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);
  const [disputePending, setDisputePending] = useState(false);
  const [reviewPending, setReviewPending] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId || !isAuth) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await getMarketplaceOrderDetail(orderId);
      const item = (res?.data ?? res?.order ?? res) as MarketplaceOrder;
      setOrder(item);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orderId, isAuth]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleShip = async (carrier: string, tracking: string) => {
    setShipPending(true);
    try {
      await shipOrder(orderId, { carrier, tracking_number: tracking });
      setShowShipForm(false);
      fetchOrder();
    } catch { /* handled by client */ }
    setShipPending(false);
  };

  const handleConfirmDelivery = async () => {
    setConfirmPending(true);
    try {
      await confirmDelivery(orderId);
      fetchOrder();
    } catch { /* handled by client */ }
    setConfirmPending(false);
  };

  const handleCancel = async () => {
    setCancelPending(true);
    try {
      await cancelOrder(orderId);
      fetchOrder();
    } catch { /* handled by client */ }
    setCancelPending(false);
  };

  const handleDispute = async (reason: string, description: string) => {
    setDisputePending(true);
    try {
      await openDispute(orderId, { reason, description });
      setShowDisputeForm(false);
      fetchOrder();
    } catch { /* handled by client */ }
    setDisputePending(false);
  };

  const handleReview = async (rating: number, comment: string) => {
    setReviewPending(true);
    try {
      await reviewOrder(orderId, { overall_rating: rating, comment });
      setShowReviewForm(false);
      fetchOrder();
    } catch { /* handled by client */ }
    setReviewPending(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="glass border border-[var(--border)]">
          <Card.Content className="py-16 text-center flex flex-col items-center">
            <TriangleExclamation className="w-12 h-12 text-[var(--muted)] mb-4" />
            <p className="text-[var(--foreground)] font-semibold mb-1">Orden no encontrada</p>
            <p className="text-sm text-[var(--muted)] mb-4">
              Es posible que haya sido eliminada o el enlace sea incorrecto.
            </p>
            <Link href="/marketplace/orders">
              <Button variant="outline">Volver a ordenes</Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const cfg = getStatusConfig(order.status);
  const status = order.status.toUpperCase();
  const timelineIdx = getTimelineIndex(order.status);
  const total = order.total_price ?? order.total ?? 0;

  // Determine user role
  const currentUsername = session?.username ?? "";
  const isBuyer = order.buyer_username === currentUsername || order.buyer_id === currentUsername;
  const isSeller = order.seller_username === currentUsername || order.seller_id === currentUsername;

  // Determine available actions
  const canShip = isSeller && (status === "PAID" || status === "CONFIRMED");
  const canConfirmDelivery = isBuyer && status === "SHIPPED";
  const canCancel = (isBuyer || isSeller) && status === "PENDING";
  const canDispute = (isBuyer || isSeller) && ["SHIPPED", "DELIVERED"].includes(status);
  const canReview = isBuyer && (status === "DELIVERED" || status === "COMPLETED") && !order.review;

  return (
    <div className="max-w-3xl mx-auto flex flex-col pt-4 pb-12">
      {/* Header */}
      <section className="px-4 lg:px-6 mb-6">
        <div className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/marketplace/orders"
              className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--foreground)]" />
            </Link>
            <Chip color={cfg.chipColor} variant="soft" size="sm">
              {cfg.label}
            </Chip>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-1">
            Orden #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {isBuyer ? "Eres el comprador" : isSeller ? "Eres el vendedor" : ""}
          </p>
        </div>
      </section>

      <div className="px-4 lg:px-6">
        {/* Status Banner */}
        <div className="glass-sm border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 mb-4 border-l-4" style={{ borderLeftColor: status === "CANCELLED" || status === "DISPUTED" ? "var(--danger, #ef4444)" : status === "COMPLETED" || status === "DELIVERED" ? "var(--success, #22c55e)" : "var(--accent)" }}>
          {status === "CANCELLED" || status === "DISPUTED" ? (
            <CircleXmark className="w-6 h-6 text-red-500 shrink-0" />
          ) : status === "SHIPPED" ? (
            <Plane className="w-6 h-6 text-yellow-500 shrink-0" />
          ) : status === "COMPLETED" || status === "DELIVERED" ? (
            <CircleCheck className="w-6 h-6 text-green-500 shrink-0" />
          ) : (
            <Clock className="w-6 h-6 text-yellow-500 shrink-0" />
          )}
          <div>
            <p className="text-base font-bold text-[var(--foreground)]">{cfg.label}</p>
            {order.updated_at && (
              <p className="text-xs text-[var(--muted)]">Actualizado: {formatDate(order.updated_at)}</p>
            )}
          </div>
        </div>

        {/* Timeline */}
        {!["CANCELLED", "DISPUTED"].includes(status) && (
          <SectionCard title="Progreso">
            <div className="flex flex-col gap-0">
              {TIMELINE_STEPS.map((step, i) => {
                const stepCfg = ORDER_STATUS_CONFIG[step] ?? ORDER_STATUS_CONFIG.PENDING;
                const isActive = i <= timelineIdx;
                const isCurrent = i === timelineIdx;
                return (
                  <div key={step} className="flex items-start gap-3 min-h-[36px]">
                    <div className="flex flex-col items-center w-4">
                      <div
                        className={`w-3 h-3 rounded-full mt-0.5 ${
                          isActive
                            ? isCurrent
                              ? "ring-2 ring-[var(--accent)] bg-[var(--accent)]"
                              : "bg-green-500"
                            : "bg-[var(--border)]"
                        }`}
                      />
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div
                          className={`flex-1 w-0.5 my-0.5 ${
                            isActive && i < timelineIdx ? "bg-green-500" : "bg-[var(--border)]"
                          }`}
                          style={{ minHeight: 16 }}
                        />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        isActive ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                      } ${isCurrent ? "font-bold" : ""}`}
                    >
                      {stepCfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Order Details */}
        <SectionCard title="Detalles de la orden">
          <div className="space-y-2">
            {[
              { label: "Total", value: formatCLP(total) },
              { label: "Cantidad", value: order.quantity != null ? String(order.quantity) : "1" },
              { label: "Entrega", value: order.delivery_method ? (DELIVERY_LABELS[order.delivery_method] ?? order.delivery_method) : "-" },
              { label: "Fecha", value: order.created_at ? formatDate(order.created_at) : "-" },
              { label: "Comprador", value: order.buyer_username ?? order.buyer_id.slice(-8) },
              { label: "Vendedor", value: order.seller_username ?? order.seller_id.slice(-8) },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={`flex justify-between py-2 ${i < arr.length - 1 ? "border-b border-[var(--border)]" : ""}`}
              >
                <span className="text-sm text-[var(--muted)]">{row.label}</span>
                <span className="text-sm font-semibold text-[var(--foreground)] text-right max-w-[60%]">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Shipping Info */}
        {(order.carrier || order.tracking_number || order.shipping_address) && (
          <SectionCard title="Informacion de envio">
            <div className="space-y-2">
              {order.carrier && (
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--muted)]">Courier</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{order.carrier}</span>
                </div>
              )}
              {order.tracking_number && (
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--muted)]">Seguimiento</span>
                  {order.tracking_url ? (
                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[var(--accent)] underline">
                      {order.tracking_number}
                    </a>
                  ) : (
                    <span className="text-sm font-semibold text-[var(--accent)]">{order.tracking_number}</span>
                  )}
                </div>
              )}
              {order.shipping_address && (
                <div className="flex justify-between py-2">
                  <span className="text-sm text-[var(--muted)]">Direccion</span>
                  <span className="text-sm font-semibold text-[var(--foreground)] text-right max-w-[60%]">
                    {typeof order.shipping_address === "string"
                      ? order.shipping_address
                      : `${order.shipping_address.address_line_1}, ${order.shipping_address.city}`}
                  </span>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Inline Forms */}
        {showShipForm && (
          <ShipForm onSubmit={handleShip} isPending={shipPending} onCancel={() => setShowShipForm(false)} />
        )}
        {showDisputeForm && (
          <DisputeForm onSubmit={handleDispute} isPending={disputePending} onCancel={() => setShowDisputeForm(false)} />
        )}
        {showReviewForm && (
          <ReviewForm onSubmit={handleReview} isPending={reviewPending} onCancel={() => setShowReviewForm(false)} />
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-2">
          {canShip && !showShipForm && (
            <Button variant="primary" className="w-full" onPress={() => setShowShipForm(true)}>
              <Plane className="w-4 h-4 mr-2" />
              Marcar como enviado
            </Button>
          )}

          {canConfirmDelivery && (
            <Button variant="primary" className="w-full" isPending={confirmPending} onPress={handleConfirmDelivery}>
              <CircleCheck className="w-4 h-4 mr-2" />
              Confirmar entrega
            </Button>
          )}

          {canCancel && (
            <Button variant="danger-soft" className="w-full" isPending={cancelPending} onPress={handleCancel}>
              <CircleXmark className="w-4 h-4 mr-2" />
              Cancelar orden
            </Button>
          )}

          {canReview && !showReviewForm && (
            <Button variant="outline" className="w-full" onPress={() => setShowReviewForm(true)}>
              Dejar resena
            </Button>
          )}

          {canDispute && !showDisputeForm && (
            <Button variant="ghost" className="w-full text-red-500" onPress={() => setShowDisputeForm(true)}>
              <TriangleExclamation className="w-4 h-4 mr-2" />
              Abrir disputa
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
