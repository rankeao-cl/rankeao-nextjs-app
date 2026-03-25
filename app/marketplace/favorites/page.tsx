"use client";

import { Card, Chip, Button, Spinner, toast } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, HeartFill, TrashBin } from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useMyFavorites, useToggleFavorite } from "@/lib/hooks/use-marketplace";
import type { Favorite, Listing } from "@/lib/types/marketplace";

// ── Condition helpers ──

const conditionLabels: Record<string, string> = {
  NM: "Near Mint", LP: "Lightly Played", MP: "Moderately Played",
  HP: "Heavily Played", DMG: "Damaged", M: "Mint",
};

const conditionColors: Record<string, "success" | "warning" | "danger" | "default"> = {
  NM: "success", M: "success", LP: "warning", MP: "warning", HP: "danger", DMG: "danger",
};

function formatCLP(amount: number | undefined): string {
  if (amount == null) return "$0";
  return amount.toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 });
}

// ── Favorite Card ──

function FavoriteCard({ favorite, onRemoved }: { favorite: Favorite; onRemoved: () => void }) {
  const listing = favorite.listing;
  const toggleFav = useToggleFavorite();

  if (!listing) return null;

  const imageUrl = listing.images?.[0]?.url || listing.card_image_url;
  const condition = listing.card_condition || "";

  async function handleRemove() {
    try {
      await toggleFav.mutateAsync({ listingId: favorite.listing_id, add: false });
      toast.success("Eliminado de favoritos");
      onRemoved();
    } catch {
      toast.danger("Error al quitar de favoritos");
    }
  }

  return (
    <Card className="glass-sm border border-[var(--border)] overflow-hidden group">
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
          </div>
        </Link>

        {/* Info */}
        <div className="p-3 space-y-2">
          <Link href={`/marketplace/${listing.id}`} className="block">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{listing.title}</p>
          </Link>

          {listing.set_name && (
            <p className="text-xs text-[var(--muted)] truncate">{listing.set_name}</p>
          )}

          <p className="text-base font-bold text-[var(--accent)]">{formatCLP(listing.price)}</p>

          {/* Condition badge */}
          {condition && (
            <Chip size="sm" variant="soft" color={conditionColors[condition] || "default"}>
              {conditionLabels[condition] || condition}
            </Chip>
          )}

          {/* Remove button */}
          <Button
            size="sm"
            variant="outline"
            color="danger"
            className="w-full text-xs mt-1"
            isDisabled={toggleFav.isPending}
            onPress={handleRemove}
          >
            <TrashBin className="w-3.5 h-3.5" />
            Quitar de favoritos
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}

// ── Main Page ──

export default function FavoritesPage() {
  const { session, status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";

  const { data, isLoading, refetch } = useMyFavorites();

  const rawFavorites = (data as any)?.favorites ?? (data as any)?.data ?? data;
  const favorites: Favorite[] = Array.isArray(rawFavorites) ? rawFavorites : [];

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
              <Heart className="w-7 h-7 text-[var(--muted)]" />
            </div>
            <p className="text-[var(--foreground)] font-semibold mb-1">Inicia sesion para ver tus favoritos</p>
            <p className="text-sm text-[var(--muted)]">
              Necesitas una cuenta para guardar tus cartas favoritas.
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
              Favoritos
            </Chip>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">
            Mis Favoritos
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Las cartas que has guardado como favoritas.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 lg:px-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : favorites.length === 0 ? (
          <Card className="border border-dashed border-[var(--border)] bg-transparent">
            <Card.Content className="py-16 text-center flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "var(--surface-secondary)" }}
              >
                <HeartFill className="w-7 h-7 text-[var(--muted)]" />
              </div>
              <p className="text-[var(--foreground)] font-semibold mb-1">No tienes favoritos</p>
              <p className="text-sm text-[var(--muted)] mb-4">
                Explora el marketplace y guarda las cartas que te interesen.
              </p>
              <Link href="/marketplace">
                <Button variant="primary" size="sm" className="font-semibold">
                  Explorar marketplace
                </Button>
              </Link>
            </Card.Content>
          </Card>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
          >
            {favorites.map((fav) => (
              <FavoriteCard key={fav.id} favorite={fav} onRemoved={() => refetch()} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
