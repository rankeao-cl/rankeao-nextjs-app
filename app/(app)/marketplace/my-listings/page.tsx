"use client";

import { useState } from "react";
import { Card, Chip, Button, Spinner, toast } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, Heart, Plus, CirclePlay, CirclePause, TrashBin, ArrowRotateRight } from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useMyListings,
  usePauseListing,
  useActivateListing,
  useRenewListing,
  useDeleteListing,
} from "@/lib/hooks/use-marketplace";
import type { Listing } from "@/lib/types/marketplace";

// ── Status helpers ──

type StatusKey = "ACTIVE" | "PAUSED" | "EXPIRED" | "SOLD" | "REMOVED";
type ChipColor = "success" | "warning" | "danger" | "default" | "accent";

const STATUS_CONFIG: Record<StatusKey, { label: string; chipColor: ChipColor }> = {
  ACTIVE:  { label: "Activo",   chipColor: "success" },
  PAUSED:  { label: "Pausado",  chipColor: "warning" },
  EXPIRED: { label: "Expirado", chipColor: "default" },
  SOLD:    { label: "Vendido",  chipColor: "accent" },
  REMOVED: { label: "Eliminado", chipColor: "danger" },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status.toUpperCase() as StatusKey] ?? STATUS_CONFIG.ACTIVE;
}

// ── Tabs ──

type Tab = "all" | "ACTIVE" | "PAUSED" | "EXPIRED";

const TABS: { key: Tab; label: string }[] = [
  { key: "all",     label: "Todos" },
  { key: "ACTIVE",  label: "Activos" },
  { key: "PAUSED",  label: "Pausados" },
  { key: "EXPIRED", label: "Expirados" },
];

// ── Date formatting ──

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

function formatCLP(amount: number | undefined): string {
  if (amount == null) return "$0";
  return amount.toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 });
}

// ── Listing Card ──

function ListingCard({ listing, onAction }: { listing: Listing; onAction: () => void }) {
  const status = (listing.status || "ACTIVE").toUpperCase();
  const cfg = getStatusConfig(status);
  const imageUrl = listing.images?.[0]?.url || listing.card_image_url;

  const pauseMutation = usePauseListing();
  const activateMutation = useActivateListing();
  const renewMutation = useRenewListing();
  const deleteMutation = useDeleteListing();

  const isActioning =
    pauseMutation.isPending ||
    activateMutation.isPending ||
    renewMutation.isPending ||
    deleteMutation.isPending;

  async function handlePause() {
    try {
      await pauseMutation.mutateAsync(listing.id);
      toast.success("Publicacion pausada");
      onAction();
    } catch {
      toast.danger("Error al pausar la publicacion");
    }
  }

  async function handleActivate() {
    try {
      await activateMutation.mutateAsync(listing.id);
      toast.success("Publicacion activada");
      onAction();
    } catch {
      toast.danger("Error al activar la publicacion");
    }
  }

  async function handleRenew() {
    try {
      await renewMutation.mutateAsync(listing.id);
      toast.success("Publicacion renovada");
      onAction();
    } catch {
      toast.danger("Error al renovar la publicacion");
    }
  }

  async function handleDelete() {
    if (!confirm("Estas seguro de que quieres eliminar esta publicacion? Esta accion no se puede deshacer.")) return;
    try {
      await deleteMutation.mutateAsync(listing.id);
      toast.success("Publicacion eliminada");
      onAction();
    } catch {
      toast.danger("Error al eliminar la publicacion");
    }
  }

  return (
    <Card className="glass-sm border border-[var(--border)] overflow-hidden">
      <Card.Content className="p-0">
        {/* Image */}
        <Link href={`/marketplace/${listing.id}`}>
          <div className="relative aspect-[3/4] w-full" style={{ background: "var(--surface-secondary)" }}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={listing.title}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-3xl opacity-40">
                <span>&#x1F0CF;</span>
              </div>
            )}
            {/* Status badge overlay */}
            <div className="absolute top-2 left-2">
              <Chip size="sm" variant="soft" color={cfg.chipColor}>
                {cfg.label}
              </Chip>
            </div>
          </div>
        </Link>

        {/* Info */}
        <div className="p-3 space-y-2">
          <Link href={`/marketplace/${listing.id}`} className="block">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{listing.title}</p>
          </Link>

          <p className="text-base font-bold text-[var(--accent)]">{formatCLP(listing.price)}</p>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {listing.views_count ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {listing.favorites_count ?? 0}
            </span>
          </div>

          {listing.created_at && (
            <p className="text-[11px] text-[var(--muted)]">{formatRelativeDate(listing.created_at)}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-1.5 pt-1">
            {status === "ACTIVE" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  isDisabled={isActioning}
                  onPress={handlePause}
                >
                  <CirclePause className="w-3.5 h-3.5" />
                  Pausar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  isDisabled={isActioning}
                  onPress={handleRenew}
                >
                  <ArrowRotateRight className="w-3.5 h-3.5" />
                  Renovar
                </Button>
              </>
            )}
            {status === "PAUSED" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  isDisabled={isActioning}
                  onPress={handleActivate}
                >
                  <CirclePlay className="w-3.5 h-3.5" />
                  Activar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="flex-1 text-xs"
                  isDisabled={isActioning}
                  onPress={handleDelete}
                >
                  <TrashBin className="w-3.5 h-3.5" />
                  Eliminar
                </Button>
              </>
            )}
            {status === "EXPIRED" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  isDisabled={isActioning}
                  onPress={handleRenew}
                >
                  <ArrowRotateRight className="w-3.5 h-3.5" />
                  Renovar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="flex-1 text-xs"
                  isDisabled={isActioning}
                  onPress={handleDelete}
                >
                  <TrashBin className="w-3.5 h-3.5" />
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

// ── Main Page ──

export default function MyListingsPage() {
  const { status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";

  const [tab, setTab] = useState<Tab>("all");

  const queryParams = tab === "all" ? undefined : { status: tab };
  const { data, isLoading, refetch } = useMyListings(queryParams);

  const rawListings = (data as { listings?: Listing[]; data?: Listing[] })?.listings ?? (data as { data?: Listing[] })?.data ?? data;
  const listings: Listing[] = Array.isArray(rawListings) ? rawListings : [];

  // ── Auth guard ──
  if (!isAuth) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="glass border border-[var(--border)]">
          <Card.Content className="py-16 text-center flex flex-col items-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--surface-secondary)" }}
            >
              <Plus className="w-7 h-7 text-[var(--muted)]" />
            </div>
            <p className="text-[var(--foreground)] font-semibold mb-1">Inicia sesion para ver tus publicaciones</p>
            <p className="text-sm text-[var(--muted)]">
              Necesitas una cuenta para gestionar tus publicaciones del marketplace.
            </p>
          </Card.Content>
        </Card>
      </div>
    );
  }

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
                Vendedor
              </span>
            </div>
            <h1 style={{ color: "var(--foreground)", fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 4 }}>
              Mis Publicaciones
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: "18px", margin: 0 }}>
              Gestiona todas tus publicaciones del marketplace.
            </p>
          </div>
          <Link
            href="/marketplace/new"
            style={{
              display: "flex", flexDirection: "row", alignItems: "center", gap: 4,
              backgroundColor: "var(--accent)", borderRadius: 12,
              paddingLeft: 14, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
              marginLeft: 12, alignSelf: "center", textDecoration: "none", flexShrink: 0,
            }}
          >
            <Plus style={{ width: 16, height: 16, color: "white" }} />
            <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>Crear</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
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
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : listings.length === 0 ? (
          <Card className="border border-dashed border-[var(--border)] bg-transparent">
            <Card.Content className="py-16 text-center flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "var(--surface-secondary)" }}
              >
                <Plus className="w-7 h-7 text-[var(--muted)]" />
              </div>
              <p className="text-[var(--foreground)] font-semibold mb-1">
                {tab === "all"
                  ? "No tienes publicaciones"
                  : `No hay publicaciones ${TABS.find((t) => t.key === tab)?.label.toLowerCase()}`}
              </p>
              <p className="text-sm text-[var(--muted)] mb-4">
                Publica tu primera carta y comienza a vender.
              </p>
              <Link href="/marketplace/new">
                <Button variant="primary" size="sm" className="font-semibold">
                  <Plus className="w-4 h-4" />
                  Crear publicacion
                </Button>
              </Link>
            </Card.Content>
          </Card>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
          >
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onAction={() => refetch()} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
