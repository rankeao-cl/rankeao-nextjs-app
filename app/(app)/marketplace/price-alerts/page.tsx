"use client";

import { useState } from "react";
import { Card, Chip, Button, Spinner, Input, toast } from "@heroui/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  usePriceAlerts,
  useCreatePriceAlert,
  useUpdatePriceAlert,
  useDeletePriceAlert,
} from "@/lib/hooks/use-marketplace";
import {
  ArrowLeft,
  TriangleExclamation,
  Bell,
  TrashBin,
  Plus,
  CircleCheck,
  CircleXmark,
} from "@gravity-ui/icons";

// ── Types ──

interface PriceAlert {
  id: string;
  card_id: string;
  card_name: string;
  printing_id: string;
  target_price: number;
  max_price: number;
  condition: string;
  min_condition: string;
  language: string;
  foil_only: boolean;
  is_active: boolean;
  triggered_count: number;
  notify_email: boolean;
  notify_push: boolean;
  created_at: string;
}

// ── Helpers ──

const conditionLabels: Record<string, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
};

const conditionColors: Record<string, "success" | "warning" | "danger" | "default"> = {
  NM: "success",
  LP: "warning",
  MP: "warning",
  HP: "danger",
  DMG: "danger",
};

function formatCLP(amount: number | undefined): string {
  if (amount == null) return "$0";
  return amount.toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Create Alert Form ──

function CreateAlertForm({
  onSubmit,
  isPending,
  onCancel,
}: {
  onSubmit: (data: { card_name: string; max_price: number; condition: string; language: string }) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [cardName, setCardName] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [condition, setCondition] = useState("NM");
  const [language, setLanguage] = useState("es");

  function handleSubmit() {
    if (!cardName.trim()) {
      toast.danger("Ingresa el nombre de la carta");
      return;
    }
    const price = parseInt(maxPrice, 10);
    if (!price || price <= 0) {
      toast.danger("Ingresa un precio valido");
      return;
    }
    onSubmit({
      card_name: cardName.trim(),
      max_price: price,
      condition,
      language,
    });
  }

  return (
    <Card className="glass-sm border border-[var(--border)] mb-4">
      <Card.Header className="px-5 pt-4 pb-2">
        <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Nueva alerta</p>
      </Card.Header>
      <Card.Content className="px-5 pb-4 border-t border-[var(--border)] pt-3">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--muted)]">Nombre de la carta</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
              placeholder="Ej: Charizard ex, Pikachu VMAX"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--muted)]">Precio maximo (CLP)</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
              placeholder="Ej: 15000"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--muted)]">Condicion minima</label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="NM">Near Mint</option>
                <option value="LP">Lightly Played</option>
                <option value="MP">Moderately Played</option>
                <option value="HP">Heavily Played</option>
                <option value="DMG">Damaged</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--muted)]">Idioma</label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="es">Espanol</option>
                <option value="en">Ingles</option>
                <option value="ja">Japones</option>
                <option value="any">Cualquiera</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onPress={onCancel}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              isPending={isPending}
              onPress={handleSubmit}
            >
              Crear alerta
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

// ── Alert Card ──

function AlertCard({
  alert,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
}: {
  alert: PriceAlert;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  return (
    <Card className="glass-sm border border-[var(--border)]">
      <Card.Content className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--surface-secondary)" }}
          >
            <Bell className="w-5 h-5 text-[var(--muted)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
              {alert.card_name}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {formatDate(alert.created_at)}
            </p>
          </div>
          <Chip
            size="sm"
            variant="soft"
            color={alert.is_active ? "success" : "default"}
          >
            {alert.is_active ? "Activa" : "Inactiva"}
          </Chip>
        </div>

        {/* Details */}
        <div className="border-t border-[var(--border)] pt-3 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-xs text-[var(--muted)]">Precio maximo</span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {formatCLP(alert.max_price || alert.target_price)}
            </span>
          </div>
          {alert.condition && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--muted)]">Condicion</span>
              <Chip size="sm" variant="soft" color={conditionColors[alert.condition] ?? "default"}>
                {conditionLabels[alert.condition] ?? alert.condition}
              </Chip>
            </div>
          )}
          {alert.language && (
            <div className="flex justify-between">
              <span className="text-xs text-[var(--muted)]">Idioma</span>
              <span className="text-sm text-[var(--foreground)]">
                {alert.language === "es" ? "Espanol" : alert.language === "en" ? "Ingles" : alert.language === "ja" ? "Japones" : alert.language}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-xs text-[var(--muted)]">Veces activada</span>
            <span className="text-sm font-semibold text-[var(--accent)]">
              {alert.triggered_count ?? 0}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-[var(--border)] mt-3 pt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 font-semibold"
            isDisabled={isToggling}
            onPress={() => onToggle(alert.id, !alert.is_active)}
          >
            {alert.is_active ? (
              <>
                <CircleXmark className="w-3.5 h-3.5 mr-1" />
                Desactivar
              </>
            ) : (
              <>
                <CircleCheck className="w-3.5 h-3.5 mr-1" />
                Activar
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="danger"
            className="font-semibold"
            isDisabled={isDeleting}
            onPress={() => {
              if (window.confirm("Eliminar esta alerta de precio?")) {
                onDelete(alert.id);
              }
            }}
          >
            <TrashBin className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}

// ── Main Page ──

export default function PriceAlertsPage() {
  const { session, status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = usePriceAlerts();
  const createAlert = useCreatePriceAlert();
  const updateAlert = useUpdatePriceAlert();
  const deleteAlert = useDeletePriceAlert();

  const alerts: PriceAlert[] = (() => {
    if (!data) return [];
    const raw = (data as any)?.data ?? (data as any)?.price_alerts ?? (data as any)?.alerts ?? data;
    return Array.isArray(raw) ? raw : [];
  })();

  async function handleCreate(payload: { card_name: string; max_price: number; condition: string; language: string }) {
    try {
      await createAlert.mutateAsync(payload);
      toast.success("Alerta creada");
      setShowCreateForm(false);
      refetch();
    } catch (e: any) {
      toast.danger(e?.message || "Error al crear alerta");
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    setTogglingId(id);
    try {
      await updateAlert.mutateAsync({ id, payload: { is_active: isActive } });
      toast.success(isActive ? "Alerta activada" : "Alerta desactivada");
      refetch();
    } catch (e: any) {
      toast.danger(e?.message || "Error al actualizar alerta");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteAlert.mutateAsync(id);
      toast.success("Alerta eliminada");
      refetch();
    } catch (e: any) {
      toast.danger(e?.message || "Error al eliminar alerta");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Auth guard ──

  if (!isAuth) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="glass border border-[var(--border)]">
          <Card.Content className="py-16 text-center flex flex-col items-center">
            <Bell className="w-12 h-12 text-[var(--muted)] mb-4" />
            <p className="text-[var(--foreground)] font-semibold mb-1">
              Inicia sesion para ver tus alertas de precio
            </p>
            <p className="text-sm text-[var(--muted)]">
              Necesitas una cuenta para crear y gestionar alertas de precio.
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
              Alertas
            </Chip>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">
                Alertas de Precio
              </h1>
              <p className="text-sm text-[var(--muted)]">
                Recibe notificaciones cuando una carta baje al precio que buscas.
              </p>
            </div>
            {!showCreateForm && (
              <Button
                variant="primary"
                size="sm"
                className="font-semibold shrink-0"
                onPress={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Crear alerta
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 lg:px-6">
        {/* Create Form */}
        {showCreateForm && (
          <CreateAlertForm
            onSubmit={handleCreate}
            isPending={createAlert.isPending}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <Card className="glass border border-[var(--border)]">
            <Card.Content className="py-16 text-center flex flex-col items-center">
              <TriangleExclamation className="w-12 h-12 text-[var(--muted)] mb-4" />
              <p className="text-[var(--foreground)] font-semibold mb-1">
                Error al cargar alertas
              </p>
              <p className="text-sm text-[var(--muted)] mb-4">
                Revisa tu conexion e intenta nuevamente.
              </p>
              <Button variant="outline" onPress={() => refetch()}>
                Reintentar
              </Button>
            </Card.Content>
          </Card>
        ) : alerts.length === 0 ? (
          <Card className="border border-dashed border-[var(--border)] bg-transparent">
            <Card.Content className="py-16 text-center flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "var(--surface-secondary)" }}
              >
                <Bell className="w-7 h-7 text-[var(--muted)]" />
              </div>
              <p className="text-[var(--foreground)] font-semibold mb-1">
                No tienes alertas de precio
              </p>
              <p className="text-sm text-[var(--muted)] mb-4">
                Crea una alerta para recibir notificaciones cuando una carta este al precio que buscas.
              </p>
              {!showCreateForm && (
                <Button
                  variant="primary"
                  size="sm"
                  className="font-semibold"
                  onPress={() => setShowCreateForm(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Crear primera alerta
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isToggling={togglingId === alert.id}
                isDeleting={deletingId === alert.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
