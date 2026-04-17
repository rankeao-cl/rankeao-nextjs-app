"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { Input } from "@heroui/react/input";
import { Spinner } from "@heroui/react/spinner";
import { toast } from "@heroui/react/toast";
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
import { getMyListings, getListingOffers } from "@/lib/api/marketplace";
import type { Offer } from "@/lib/types/marketplace";
import {
  ArrowLeft,
  TriangleExclamation,
  Tag,
  Comment,
} from "@gravity-ui/icons";

type ChipColor = "warning" | "success" | "danger" | "accent" | "default";
type Tab = "received" | "sent";
type ConfirmAction = "reject" | "withdraw" | "decline-counter";

const OFFER_STATUS_CONFIG: Record<
  string,
  { label: string; chipColor: ChipColor }
> = {
  PENDING: { label: "Pendiente", chipColor: "warning" },
  ACCEPTED: { label: "Aceptada", chipColor: "success" },
  REJECTED: { label: "Rechazada", chipColor: "danger" },
  COUNTERED: { label: "Contraoferta", chipColor: "accent" },
  WITHDRAWN: { label: "Retirada", chipColor: "default" },
  EXPIRED: { label: "Expirada", chipColor: "default" },
};

function getStatusConfig(status: string) {
  return OFFER_STATUS_CONFIG[status.toUpperCase()] ?? OFFER_STATUS_CONFIG.PENDING;
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
  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sortOffersByDate(items: Offer[]): Offer[] {
  return [...items].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0;
    const bTime = b.created_at ? Date.parse(b.created_at) : 0;
    return bTime - aTime;
  });
}

async function fetchReceivedOffers(): Promise<Offer[]> {
  const listingsRes = await getMyListings({ page: 1, per_page: 100 });
  const listingsRaw = Array.isArray(listingsRes?.data)
    ? listingsRes.data
    : Array.isArray(listingsRes?.listings)
      ? listingsRes.listings
      : [];
  const listingIds = listingsRaw
    .map((listing) => listing.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (listingIds.length === 0) return [];

  const offersById = new Map<string, Offer>();
  const requests = await Promise.allSettled(
    listingIds.map((listingId) => getListingOffers(listingId)),
  );

  for (const result of requests) {
    if (result.status !== "fulfilled") continue;
    for (const offer of result.value.data) {
      offersById.set(offer.id, offer);
    }
  }

  return sortOffersByDate(Array.from(offersById.values()));
}

function OfferCard({
  offer,
  tab,
  onAccept,
  onReject,
  onCounter,
  onWithdraw,
  onAcceptCounter,
  onDeclineCounter,
  loadingAction,
}: {
  offer: Offer;
  tab: Tab;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onCounter: (id: string, amount: number, message?: string) => void;
  onWithdraw: (id: string) => void;
  onAcceptCounter: (id: string) => void;
  onDeclineCounter: (id: string) => void;
  loadingAction: string | null;
}) {
  const cfg = getStatusConfig(offer.status);
  const status = offer.status.toUpperCase();
  const isPending = status === "PENDING";
  const isCountered = status === "COUNTERED";
  const isCounterProposal = isPending && !!offer.parent_offer_id;
  const isLoading = loadingAction === offer.id;

  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  function handleCounterSubmit() {
    const amount = Number(counterAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.danger("Ingresa un monto válido");
      return;
    }
    onCounter(offer.id, Math.round(amount), counterMessage.trim() || undefined);
    setShowCounterForm(false);
    setCounterAmount("");
    setCounterMessage("");
  }

  const counterParty =
    tab === "received"
      ? (offer.buyer_username ?? `#${offer.buyer_id.slice(-8).toUpperCase()}`)
      : (offer.seller_username ?? `#${offer.seller_id.slice(-8).toUpperCase()}`);

  const confirmMessage =
    confirmAction === "reject"
      ? "¿Rechazar esta oferta?"
      : confirmAction === "withdraw"
        ? "¿Retirar esta oferta?"
        : "¿Rechazar esta contraoferta?";

  return (
    <Card className="glass-sm border border-[var(--border)]">
      <Card.Content className="p-4">
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

        <div className="border-t border-[var(--border)] pt-3 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-xs text-[var(--muted)]">Monto ofertado</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {formatCLP(offer.amount)}
            </span>
          </div>

          {offer.quantity != null && (
            <div className="flex justify-between">
              <span className="text-xs text-[var(--muted)]">Cantidad</span>
              <span className="text-sm text-[var(--foreground)]">{offer.quantity}</span>
            </div>
          )}

          {offer.counter_amount != null && (
            <div className="flex justify-between">
              <span className="text-xs text-[var(--muted)]">Monto contraoferta</span>
              <span className="text-sm font-semibold text-[var(--accent)]">
                {formatCLP(offer.counter_amount)}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-xs text-[var(--muted)]">
              {tab === "received" ? "Comprador" : "Vendedor"}
            </span>
            <span className="text-sm text-[var(--accent)] truncate max-w-[60%] text-right">
              {counterParty}
            </span>
          </div>

          {offer.message && (
            <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-[var(--surface-secondary)]">
              <Comment className="w-4 h-4 text-[var(--muted)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--muted)] break-words">{offer.message}</p>
            </div>
          )}
        </div>

        {confirmAction && (
          <div className="border-t border-[var(--border)] mt-3 pt-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2">
              <p className="text-xs text-[var(--foreground)] mb-2">{confirmMessage}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="tertiary"
                  className="flex-1"
                  onPress={() => setConfirmAction(null)}
                >
                  Volver
                </Button>
                <Button
                  size="sm"
                  variant="danger-soft"
                  className="flex-1"
                  isPending={isLoading}
                  onPress={() => {
                    if (confirmAction === "reject") onReject(offer.id);
                    if (confirmAction === "withdraw") onWithdraw(offer.id);
                    if (confirmAction === "decline-counter") onDeclineCounter(offer.id);
                    setConfirmAction(null);
                  }}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {tab === "received" && isPending && !confirmAction && (
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
                  variant="danger-soft"
                  className="flex-1 font-semibold"
                  onPress={() => setConfirmAction("reject")}
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
                  placeholder="Monto contraoferta (CLP)"
                />
                <Input
                  aria-label="Mensaje (opcional)"
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Mensaje (opcional)"
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

        {tab === "sent" && isCounterProposal && !confirmAction && (
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
              variant="danger-soft"
              className="flex-1 font-semibold"
              onPress={() => setConfirmAction("decline-counter")}
            >
              Rechazar contraoferta
            </Button>
          </div>
        )}

        {tab === "sent" && isPending && !isCounterProposal && !confirmAction && (
          <div className="border-t border-[var(--border)] mt-3 pt-3">
            <Button
              size="sm"
              variant="outline"
              className="w-full font-semibold"
              isPending={isLoading}
              onPress={() => setConfirmAction("withdraw")}
            >
              Retirar oferta
            </Button>
          </div>
        )}

        {tab === "sent" && isCountered && (
          <div className="border-t border-[var(--border)] mt-3 pt-3">
            <p className="text-xs text-[var(--muted)]">
              El vendedor propuso una contraoferta. Veras una entrada pendiente para aceptarla o rechazarla.
            </p>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

export default function OffersPage() {
  const { status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";

  const [tab, setTab] = useState<Tab>("received");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const receivedQuery = useQuery({
    queryKey: ["marketplace", "offers", "received"],
    queryFn: fetchReceivedOffers,
    enabled: isAuth,
  });
  const sentQuery = useMyOffers(undefined, isAuth);

  const activeQuery = tab === "received" ? receivedQuery : sentQuery;

  const offers = useMemo(() => {
    const raw = tab === "received" ? receivedQuery.data ?? [] : sentQuery.data?.data ?? [];
    return sortOffersByDate(raw);
  }, [tab, receivedQuery.data, sentQuery.data?.data]);

  const acceptOffer = useAcceptOffer();
  const rejectOffer = useRejectOffer();
  const counterOffer = useCounterOffer();
  const withdrawOffer = useWithdrawOffer();
  const acceptCounterOffer = useAcceptCounterOffer();

  async function refreshOffers() {
    await Promise.all([receivedQuery.refetch(), sentQuery.refetch()]);
  }

  async function handleAccept(offerId: string) {
    setLoadingAction(offerId);
    try {
      await acceptOffer.mutateAsync(offerId);
      toast.success("Oferta aceptada");
      await refreshOffers();
    } catch (e: unknown) {
      toast.danger(e instanceof Error ? e.message : "Error al aceptar oferta");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleReject(offerId: string) {
    setLoadingAction(offerId);
    try {
      await rejectOffer.mutateAsync(offerId);
      toast.success("Oferta rechazada");
      await refreshOffers();
    } catch (e: unknown) {
      toast.danger(e instanceof Error ? e.message : "Error al rechazar oferta");
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
      await refreshOffers();
    } catch (e: unknown) {
      toast.danger(e instanceof Error ? e.message : "Error al enviar contraoferta");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleWithdraw(offerId: string) {
    setLoadingAction(offerId);
    try {
      await withdrawOffer.mutateAsync(offerId);
      toast.success("Oferta retirada");
      await refreshOffers();
    } catch (e: unknown) {
      toast.danger(e instanceof Error ? e.message : "Error al retirar oferta");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleAcceptCounter(offerId: string) {
    setLoadingAction(offerId);
    try {
      await acceptCounterOffer.mutateAsync(offerId);
      toast.success("Contraoferta aceptada");
      await refreshOffers();
    } catch (e: unknown) {
      toast.danger(e instanceof Error ? e.message : "Error al aceptar contraoferta");
    } finally {
      setLoadingAction(null);
    }
  }

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

  return (
    <div className="max-w-7xl mx-auto flex flex-col pb-12">
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
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                <ArrowLeft style={{ width: 14, height: 14, color: "var(--foreground)" }} />
              </Link>
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "var(--surface)",
                  paddingLeft: 10,
                  paddingRight: 10,
                  paddingTop: 4,
                  paddingBottom: 4,
                  borderRadius: 999,
                  color: "var(--muted)",
                  fontSize: 11,
                  fontWeight: 600,
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

      <section className="px-4 lg:px-6 mb-6">
        <div className="flex gap-2 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <button
            onClick={() => setTab("received")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${tab === "received"
              ? "bg-[var(--surface-secondary)] text-[var(--accent)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
          >
            Recibidas
          </button>
          <button
            onClick={() => setTab("sent")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${tab === "sent"
              ? "bg-[var(--surface-secondary)] text-[var(--accent)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
          >
            Enviadas
          </button>
        </div>
      </section>

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
                onDeclineCounter={handleWithdraw}
                loadingAction={loadingAction}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
