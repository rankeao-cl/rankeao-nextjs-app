"use client";

import { useState } from "react";
import { Card, Chip, Button, Spinner, Input } from "@heroui/react";
import { toast } from "@heroui/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useMyOffers,
  useAcceptOffer,
  useRejectOffer,
  useCounterOffer,
  useWithdrawOffer,
  useAcceptCounterOffer,
} from "@/lib/hooks/use-marketplace";
import {
  ArrowLeft,
  TriangleExclamation,
  Tag,
  Comment,
} from "@gravity-ui/icons";

// ── Types ──

interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  buyer_username?: string;
  seller_id: string;
  seller_username?: string;
  amount: number;
  currency?: string;
  status: string;
  message?: string;
  counter_amount?: number;
  listing_title?: string;
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
}

// ── Helpers ──

type ChipColor = "warning" | "success" | "danger" | "accent" | "default";

const OFFER_STATUS_CONFIG: Record<
  string,
  { label: string; chipColor: ChipColor }
> = {
  PENDING:   { label: "Pendiente",    chipColor: "warning" },
  ACCEPTED:  { label: "Aceptada",     chipColor: "success" },
  REJECTED:  { label: "Rechazada",    chipColor: "danger" },
  COUNTERED: { label: "Contraoferta", chipColor: "accent" },
  WITHDRAWN: { label: "Retirada",     chipColor: "default" },
  EXPIRED:   { label: "Expirada",     chipColor: "default" },
};

function getStatusConfig(status: string) {
  return (
    OFFER_STATUS_CONFIG[status.toUpperCase()] ?? OFFER_STATUS_CONFIG.PENDING
  );
}

function formatCLP(amount: number | undefined): string {
  if (amount == null) return "$0";
  return amount.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  return date.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

// ── Tab type ──

type Tab = "received" | "sent";

// ── Offer Card ──

function OfferCard({
  offer,
  tab,
  onAccept,
  onReject,
  onCounter,
  onWithdraw,
  onAcceptCounter,
  loadingAction,
}: {
  offer: Offer;
  tab: Tab;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onCounter: (id: string, amount: number, message?: string) => void;
  onWithdraw: (id: string) => void;
  onAcceptCounter: (id: string) => void;
  loadingAction: string | null;
}) {
  const cfg = getStatusConfig(offer.status);
  const isPending = offer.status.toUpperCase() === "PENDING";
  const isCountered = offer.status.toUpperCase() === "COUNTERED";
  const isLoading = loadingAction === offer.id;

  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");

  function handleCounterSubmit() {
    const num = parseInt(counterAmount, 10);
    if (!num || num <= 0) {
      toast.danger("Ingresa un monto valido");
      return;
    }
    onCounter(offer.id, num, counterMessage || undefined);
    setShowCounterForm(false);
    setCounterAmount("");
    setCounterMessage("");
  }

  return (
    <Card className="glass-sm border border-[var(--border)]">
      <Card.Content className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5 text-[var(--muted)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
              {offer.listing_title || `Publicacion #${offer.listing_id.slice(-8).toUpperCase()}`}
            </p>
            {offer.created_at && (
              <p className="text-xs text-[var(--muted)]">
                {formatRelativeDate(offer.created_at)}
              </p>
            )}
          </div>
          <Chip size="sm" variant="soft" color={cfg.chipColor}>
            {cfg.label}
          </Chip>
        </div>

        {/* Details */}
        <div className="border-t border-[var(--border)] pt-3 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-xs text-[var(--muted)]">Monto ofertado</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {formatCLP(offer.amount)}
            </span>
          </div>

          {isCountered && offer.counter_amount != null && (
            <div className="flex justify-between">
              <span className="text-xs text-[var(--muted)]">Contraoferta</span>
              <span className="text-sm font-semibold text-[var(--accent)]">
                {formatCLP(offer.counter_amount)}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-xs text-[var(--muted)]">
              {tab === "received" ? "Comprador" : "Vendedor"}
            </span>
            <span className="text-sm text-[var(--accent)]">
              {tab === "received" ? offer.buyer_username : offer.seller_username}
            </span>
          </div>

          {offer.message && (
            <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-[var(--surface-secondary)]">
              <Comment className="w-4 h-4 text-[var(--muted)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--muted)] break-words">
                {offer.message}
              </p>
            </div>
          )}
        </div>

        {/* Actions for received PENDING offers */}
        {tab === "received" && isPending && (
          <div className="border-t border-[var(--border)] mt-3 pt-3">
            {!showCounterForm ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 font-semibold"
                  style={{ background: "var(--success)", color: "#fff" }}
                  isPending={isLoading}
                  onPress={() => onAccept(offer.id)}
                >
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-semibold text-[var(--accent)]"
                  onPress={() => setShowCounterForm(true)}
                >
                  Contraoferta
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 font-semibold"
                  style={{ background: "var(--danger)", color: "#fff" }}
                  isPending={isLoading}
                  onPress={() => {
                    if (window.confirm("Rechazar esta oferta?")) {
                      onReject(offer.id);
                    }
                  }}
                >
                  Rechazar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  aria-label="Monto contraoferta (CLP)"
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="Monto contraoferta (CLP) Ej: 8000"
                />
                <Input
                  aria-label="Mensaje (opcional)"
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Mensaje (opcional) Puedo dejarlo en..."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="tertiary"
                    className="flex-1"
                    onPress={() => {
                      setShowCounterForm(false);
                      setCounterAmount("");
                      setCounterMessage("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1 font-semibold"
                    isPending={isLoading}
                    onPress={handleCounterSubmit}
                  >
                    Enviar contraoferta
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions for sent PENDING offers */}
        {tab === "sent" && isPending && (
          <div className="border-t border-[var(--border)] mt-3 pt-3">
            <Button
              size="sm"
              variant="outline"
              className="w-full font-semibold"
              isPending={isLoading}
              onPress={() => {
                if (window.confirm("Retirar esta oferta?")) {
                  onWithdraw(offer.id);
                }
              }}
            >
              Retirar oferta
            </Button>
          </div>
        )}

        {/* Actions for sent COUNTERED offers */}
        {tab === "sent" && isCountered && (
          <div className="border-t border-[var(--border)] mt-3 pt-3 flex gap-2">
            <Button
              size="sm"
              variant="primary"
              className="flex-1 font-semibold"
              style={{ background: "var(--success)", color: "#fff" }}
              isPending={isLoading}
              onPress={() => onAcceptCounter(offer.id)}
            >
              Aceptar contraoferta
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="flex-1 font-semibold"
              style={{ background: "var(--danger)", color: "#fff" }}
              isPending={isLoading}
              onPress={() => {
                if (window.confirm("Rechazar esta contraoferta?")) {
                  onReject(offer.id);
                }
              }}
            >
              Rechazar
            </Button>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

// ── Main Page ──

export default function OffersPage() {
  const { session, status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";

  const [tab, setTab] = useState<Tab>("received");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Fetch offers by role
  const receivedQuery = useMyOffers({ role: "seller" });
  const sentQuery = useMyOffers({ role: "buyer" });

  const activeQuery = tab === "received" ? receivedQuery : sentQuery;

  const offers: Offer[] = (() => {
    const raw = activeQuery.data?.data ?? activeQuery.data?.offers ?? activeQuery.data ?? [];
    return Array.isArray(raw) ? raw : [];
  })();

  // Mutations
  const acceptOffer = useAcceptOffer();
  const rejectOffer = useRejectOffer();
  const counterOffer = useCounterOffer();
  const withdrawOffer = useWithdrawOffer();
  const acceptCounterOffer = useAcceptCounterOffer();

  async function handleAccept(offerId: string) {
    setLoadingAction(offerId);
    try {
      await acceptOffer.mutateAsync(offerId);
      toast.success("Oferta aceptada");
    } catch (e: any) {
      toast.danger(e?.message || "Error al aceptar oferta");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleReject(offerId: string) {
    setLoadingAction(offerId);
    try {
      await rejectOffer.mutateAsync(offerId);
      toast.success("Oferta rechazada");
    } catch (e: any) {
      toast.danger(e?.message || "Error al rechazar oferta");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCounter(offerId: string, amount: number, message?: string) {
    setLoadingAction(offerId);
    try {
      await counterOffer.mutateAsync({
        offerId,
        payload: { amount, message },
      });
      toast.success("Contraoferta enviada");
    } catch (e: any) {
      toast.danger(e?.message || "Error al enviar contraoferta");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleWithdraw(offerId: string) {
    setLoadingAction(offerId);
    try {
      await withdrawOffer.mutateAsync(offerId);
      toast.success("Oferta retirada");
    } catch (e: any) {
      toast.danger(e?.message || "Error al retirar oferta");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleAcceptCounter(offerId: string) {
    setLoadingAction(offerId);
    try {
      await acceptCounterOffer.mutateAsync(offerId);
      toast.success("Contraoferta aceptada");
    } catch (e: any) {
      toast.danger(e?.message || "Error al aceptar contraoferta");
    } finally {
      setLoadingAction(null);
    }
  }

  // ── Auth guard ──

  if (!isAuth) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="glass border border-[var(--border)]">
          <Card.Content className="py-16 text-center flex flex-col items-center">
            <Tag className="w-12 h-12 text-[var(--muted)] mb-4" />
            <p className="text-[var(--foreground)] font-semibold mb-1">
              Inicia sesion para ver tus ofertas
            </p>
            <p className="text-sm text-[var(--muted)]">
              Necesitas una cuenta para gestionar tus ofertas recibidas y enviadas.
            </p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="max-w-7xl mx-auto flex flex-col pb-12">
      {/* Header */}
      <div className="mx-4 lg:mx-6 mt-3 mb-[14px]">
        <div
          style={{
            backgroundColor: "var(--surface-solid)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 18,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 120,
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Link
                href="/marketplace"
                style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: "var(--surface)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  textDecoration: "none", flexShrink: 0,
                }}
              >
                <ArrowLeft style={{ width: 14, height: 14, color: "var(--foreground)" }} />
              </Link>
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "var(--surface)",
                  paddingLeft: 10, paddingRight: 10, paddingTop: 4, paddingBottom: 4,
                  borderRadius: 999, color: "var(--muted)", fontSize: 11, fontWeight: 600,
                }}
              >
                Mis Ofertas
              </span>
            </div>
            <h1 style={{ color: "var(--foreground)", fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 4 }}>
              Ofertas del Marketplace
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: "18px", margin: 0 }}>
              Gestiona las ofertas recibidas y enviadas en tus publicaciones.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <section className="px-4 lg:px-6 mb-6">
        <div className="flex gap-2 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <button
            onClick={() => setTab("received")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              tab === "received"
                ? "bg-[var(--surface-secondary)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Recibidas
          </button>
          <button
            onClick={() => setTab("sent")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              tab === "sent"
                ? "bg-[var(--surface-secondary)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Enviadas
          </button>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 lg:px-6">
        {activeQuery.isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : activeQuery.isError ? (
          <Card className="glass border border-[var(--border)]">
            <Card.Content className="py-16 text-center flex flex-col items-center">
              <TriangleExclamation className="w-12 h-12 text-[var(--muted)] mb-4" />
              <p className="text-[var(--foreground)] font-semibold mb-1">
                Error al cargar ofertas
              </p>
              <p className="text-sm text-[var(--muted)] mb-4">
                Revisa tu conexion e intenta nuevamente.
              </p>
              <Button variant="outline" onPress={() => activeQuery.refetch()}>
                Reintentar
              </Button>
            </Card.Content>
          </Card>
        ) : offers.length === 0 ? (
          <Card className="border border-dashed border-[var(--border)] bg-transparent">
            <Card.Content className="py-16 text-center flex flex-col items-center">
              <Tag className="w-12 h-12 text-[var(--muted)] mb-4" />
              <p className="text-[var(--foreground)] font-semibold mb-1">
                {tab === "received"
                  ? "No tienes ofertas recibidas"
                  : "No tienes ofertas enviadas"}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {tab === "received"
                  ? "Cuando alguien haga una oferta en tus publicaciones aparecera aqui."
                  : "Cuando hagas una oferta en una publicacion aparecera aqui."}
              </p>
            </Card.Content>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                tab={tab}
                onAccept={handleAccept}
                onReject={handleReject}
                onCounter={handleCounter}
                onWithdraw={handleWithdraw}
                onAcceptCounter={handleAcceptCounter}
                loadingAction={loadingAction}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
