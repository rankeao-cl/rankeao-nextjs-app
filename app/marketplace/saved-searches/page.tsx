"use client";

import { useState } from "react";
import { Card, Chip, Button, Spinner, toast } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  useSavedSearches,
  useDeleteSavedSearch,
} from "@/lib/hooks/use-marketplace";
import {
  ArrowLeft,
  TriangleExclamation,
  Magnifier,
  TrashBin,
  ArrowShapeRight,
} from "@gravity-ui/icons";

// ── Types ──

interface SavedSearch {
  id: string;
  name: string;
  search_type: string;
  filters: any;
  notify: boolean;
  last_checked_at: string;
  created_at: string;
}

// ── Helpers ──

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const FILTER_LABELS: Record<string, string> = {
  query: "Busqueda",
  q: "Busqueda",
  card_name: "Carta",
  set_name: "Set",
  condition: "Condicion",
  min_condition: "Condicion min.",
  language: "Idioma",
  min_price: "Precio min.",
  max_price: "Precio max.",
  foil_only: "Solo foil",
  sort_by: "Ordenar por",
  category: "Categoria",
  seller: "Vendedor",
  game: "Juego",
};

function buildFiltersSummary(filters: any): string {
  if (!filters || typeof filters !== "object") return "Sin filtros";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === "" || value === false) continue;
    const label = FILTER_LABELS[key] ?? key;
    if (typeof value === "boolean") {
      parts.push(label);
    } else {
      parts.push(`${label}: ${String(value)}`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : "Sin filtros";
}

function buildQueryParams(filters: any): string {
  if (!filters || typeof filters !== "object") return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === "" || value === false) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

// ── Search Card ──

function SearchCard({
  search,
  onDelete,
  onExecute,
  isDeleting,
}: {
  search: SavedSearch;
  onDelete: (id: string) => void;
  onExecute: (search: SavedSearch) => void;
  isDeleting: boolean;
}) {
  const filtersSummary = buildFiltersSummary(search.filters);

  return (
    <Card className="glass-sm border border-[var(--border)]">
      <Card.Content className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--surface-secondary)" }}
          >
            <Magnifier className="w-5 h-5 text-[var(--muted)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
              {search.name || "Busqueda sin nombre"}
            </p>
            <p className="text-xs text-[var(--muted)]">
              Creada el {formatDate(search.created_at)}
            </p>
          </div>
          {search.notify && (
            <Chip size="sm" variant="soft" color="accent">
              Notificar
            </Chip>
          )}
        </div>

        {/* Filters summary */}
        <div className="border-t border-[var(--border)] pt-3 mb-3">
          <p className="text-xs text-[var(--muted)] leading-relaxed break-words">
            {filtersSummary}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            className="flex-1 font-semibold"
            onPress={() => onExecute(search)}
          >
            <ArrowShapeRight className="w-3.5 h-3.5 mr-1" />
            Ejecutar
          </Button>
          <Button
            size="sm"
            variant="danger"
            className="font-semibold"
            isDisabled={isDeleting}
            onPress={() => {
              if (window.confirm("Eliminar esta busqueda guardada?")) {
                onDelete(search.id);
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

export default function SavedSearchesPage() {
  const { session, status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";
  const router = useRouter();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useSavedSearches();
  const deleteSearch = useDeleteSavedSearch();

  const searches: SavedSearch[] = (() => {
    if (!data) return [];
    const raw = (data as any)?.data ?? (data as any)?.saved_searches ?? (data as any)?.searches ?? data;
    return Array.isArray(raw) ? raw : [];
  })();

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteSearch.mutateAsync(id);
      toast.success("Busqueda eliminada");
      refetch();
    } catch (e: any) {
      toast.danger(e?.message || "Error al eliminar busqueda");
    } finally {
      setDeletingId(null);
    }
  }

  function handleExecute(search: SavedSearch) {
    const queryString = buildQueryParams(search.filters);
    router.push(`/marketplace${queryString ? `?${queryString}` : ""}`);
  }

  // ── Auth guard ──

  if (!isAuth) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="glass border border-[var(--border)]">
          <Card.Content className="py-16 text-center flex flex-col items-center">
            <Magnifier className="w-12 h-12 text-[var(--muted)] mb-4" />
            <p className="text-[var(--foreground)] font-semibold mb-1">
              Inicia sesion para ver tus busquedas guardadas
            </p>
            <p className="text-sm text-[var(--muted)]">
              Necesitas una cuenta para guardar y gestionar busquedas.
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
              Busquedas
            </Chip>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">
            Busquedas Guardadas
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Tus busquedas favoritas para encontrar cartas rapidamente.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 lg:px-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <Card className="glass border border-[var(--border)]">
            <Card.Content className="py-16 text-center flex flex-col items-center">
              <TriangleExclamation className="w-12 h-12 text-[var(--muted)] mb-4" />
              <p className="text-[var(--foreground)] font-semibold mb-1">
                Error al cargar busquedas
              </p>
              <p className="text-sm text-[var(--muted)] mb-4">
                Revisa tu conexion e intenta nuevamente.
              </p>
              <Button variant="outline" onPress={() => refetch()}>
                Reintentar
              </Button>
            </Card.Content>
          </Card>
        ) : searches.length === 0 ? (
          <Card className="border border-dashed border-[var(--border)] bg-transparent">
            <Card.Content className="py-16 text-center flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "var(--surface-secondary)" }}
              >
                <Magnifier className="w-7 h-7 text-[var(--muted)]" />
              </div>
              <p className="text-[var(--foreground)] font-semibold mb-1">
                No tienes busquedas guardadas
              </p>
              <p className="text-sm text-[var(--muted)] mb-4">
                Cuando guardes una busqueda en el marketplace aparecera aqui.
              </p>
              <Link href="/marketplace">
                <Button variant="primary" size="sm" className="font-semibold">
                  Explorar marketplace
                </Button>
              </Link>
            </Card.Content>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {searches.map((search) => (
              <SearchCard
                key={search.id}
                search={search}
                onDelete={handleDelete}
                onExecute={handleExecute}
                isDeleting={deletingId === search.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
