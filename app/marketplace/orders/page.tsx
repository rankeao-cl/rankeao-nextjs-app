"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Chip, Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMarketplaceOrders } from "@/lib/api/marketplace";
import type { MarketplaceOrder } from "@/lib/types/marketplace";
import {
  ShoppingCart,
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
  { label: string; chipColor: ChipColor; icon: typeof Clock }
> = {
  PENDING:   { label: "Pendiente",  chipColor: "warning", icon: Clock },
  CONFIRMED: { label: "Confirmado", chipColor: "accent",  icon: CircleCheck },
  PAID:      { label: "Pagado",     chipColor: "accent",  icon: CircleCheck },
  SHIPPED:   { label: "Enviado",    chipColor: "warning", icon: Plane },
  DELIVERED: { label: "Entregado",  chipColor: "success", icon: CircleCheck },
  COMPLETED: { label: "Completado", chipColor: "success", icon: CircleCheck },
  CANCELLED: { label: "Cancelado",  chipColor: "danger",  icon: CircleXmark },
  DISPUTED:  { label: "En disputa", chipColor: "danger",  icon: TriangleExclamation },
};

function getStatusConfig(status: string) {
  return ORDER_STATUS_CONFIG[status.toUpperCase()] ?? ORDER_STATUS_CONFIG.PENDING;
}

const DELIVERY_LABELS: Record<string, string> = {
  SHIPPING: "Envio",
  IN_PERSON: "En persona",
  PICKUP: "Retiro",
};

type Tab = "all" | "pending" | "active" | "completed";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "active", label: "Activos" },
  { key: "completed", label: "Completados" },
];

function filterOrders(orders: MarketplaceOrder[], tab: Tab): MarketplaceOrder[] {
  if (tab === "all") return orders;
  if (tab === "pending") return orders.filter((o) => ["PENDING"].includes(o.status.toUpperCase()));
  if (tab === "active") return orders.filter((o) => ["CONFIRMED", "PAID", "SHIPPED", "DELIVERED"].includes(o.status.toUpperCase()));
  if (tab === "completed") return orders.filter((o) => ["COMPLETED", "CANCELLED", "DISPUTED"].includes(o.status.toUpperCase()));
  return orders;
}

function formatCLP(amount: number | undefined): string {
  if (amount == null) return "$0";
  return amount.toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

// ── Order Card ──

function OrderCard({ order }: { order: MarketplaceOrder }) {
  const cfg = getStatusConfig(order.status);
  const StatusIcon = cfg.icon;
  const total = order.total_price ?? order.total ?? 0;

  return (
    <Link href={`/marketplace/orders/${order.id}`} className="block">
      <Card className="glass-sm border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
        <Card.Content className="p-4">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
              <StatusIcon className="w-5 h-5 text-[var(--muted)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                Orden #{order.id.slice(-8).toUpperCase()}
              </p>
              {order.created_at && (
                <p className="text-xs text-[var(--muted)]">{formatRelativeDate(order.created_at)}</p>
              )}
            </div>
            <Chip size="sm" variant="soft" color={cfg.chipColor}>
              {cfg.label}
            </Chip>
          </div>

          {/* Details */}
          <div className="border-t border-[var(--border)] pt-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-xs text-[var(--muted)]">Total</span>
              <span className="text-sm font-semibold text-[var(--foreground)]">{formatCLP(total)}</span>
            </div>
            {order.quantity != null && (
              <div className="flex justify-between">
                <span className="text-xs text-[var(--muted)]">Cantidad</span>
                <span className="text-sm text-[var(--foreground)]">{order.quantity}</span>
              </div>
            )}
            {order.delivery_method && (
              <div className="flex justify-between">
                <span className="text-xs text-[var(--muted)]">Entrega</span>
                <span className="text-sm text-[var(--foreground)]">
                  {DELIVERY_LABELS[order.delivery_method] ?? order.delivery_method}
                </span>
              </div>
            )}
            {order.buyer_username && (
              <div className="flex justify-between">
                <span className="text-xs text-[var(--muted)]">Comprador</span>
                <span className="text-sm text-[var(--accent)]">{order.buyer_username}</span>
              </div>
            )}
            {order.seller_username && (
              <div className="flex justify-between">
                <span className="text-xs text-[var(--muted)]">Vendedor</span>
                <span className="text-sm text-[var(--accent)]">{order.seller_username}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border)] mt-3 pt-3 flex items-center justify-center gap-1">
            <span className="text-sm font-semibold text-[var(--accent)]">Ver detalle</span>
          </div>
        </Card.Content>
      </Card>
    </Link>
  );
}

// ── Main Page ──

export default function OrdersPage() {
  const { session, status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";

  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("all");

  const fetchOrders = useCallback(async () => {
    if (!isAuth) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await getMarketplaceOrders();
      const raw = res?.data ?? res?.orders ?? [];
      const items = Array.isArray(raw) ? raw : [];
      setOrders(items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [isAuth]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = filterOrders(orders, tab);

  if (!isAuth) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="glass border border-[var(--border)]">
          <Card.Content className="py-16 text-center flex flex-col items-center">
            <ShoppingCart className="w-12 h-12 text-[var(--muted)] mb-4" />
            <p className="text-[var(--foreground)] font-semibold mb-1">Inicia sesion para ver tus ordenes</p>
            <p className="text-sm text-[var(--muted)]">
              Necesitas una cuenta para acceder a tus compras y ventas.
            </p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col pt-4 pb-12">
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
            <Chip color="accent" variant="soft" size="sm" className="px-3">
              Mis Ordenes
            </Chip>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">
            Ordenes del Marketplace
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Gestiona tus compras y ventas en un solo lugar.
          </p>
        </div>
      </section>

      {/* Status Tabs */}
      <section className="px-4 lg:px-6 mb-6">
        <div className="flex gap-2 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.key
                  ? "bg-[var(--surface-secondary)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="px-4 lg:px-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Card className="glass border border-[var(--border)]">
            <Card.Content className="py-16 text-center flex flex-col items-center">
              <TriangleExclamation className="w-12 h-12 text-[var(--muted)] mb-4" />
              <p className="text-[var(--foreground)] font-semibold mb-1">Error al cargar ordenes</p>
              <p className="text-sm text-[var(--muted)] mb-4">
                Revisa tu conexion e intenta nuevamente.
              </p>
              <Button variant="outline" onPress={fetchOrders}>
                Reintentar
              </Button>
            </Card.Content>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="border border-dashed border-[var(--border)] bg-transparent">
            <Card.Content className="py-16 text-center flex flex-col items-center">
              <ShoppingCart className="w-12 h-12 text-[var(--muted)] mb-4" />
              <p className="text-[var(--foreground)] font-semibold mb-1">
                {tab === "all" ? "No tienes ordenes" : `No hay ordenes ${TABS.find((t) => t.key === tab)?.label.toLowerCase()}`}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Cuando compres o vendas algo aparecera aqui.
              </p>
            </Card.Content>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
