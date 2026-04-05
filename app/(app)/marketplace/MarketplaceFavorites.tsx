"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { toast } from "@heroui/react/toast";
import { Heart, HeartFill, TrashBin } from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { useMyFavorites, useToggleFavorite } from "@/lib/hooks/use-marketplace";
import type { Favorite } from "@/lib/types/marketplace";

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
        <div className="p-3 space-y-2">
          <Link href={`/marketplace/${listing.id}`} className="block">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{listing.title}</p>
          </Link>
          {listing.set_name && (
            <p className="text-xs text-[var(--muted)] truncate">{listing.set_name}</p>
          )}
          <p className="text-base font-bold text-[var(--accent)]">{formatCLP(listing.price)}</p>
          {condition && (
            <Chip size="sm" variant="soft" color={conditionColors[condition] || "default"}>
              {conditionLabels[condition] || condition}
            </Chip>
          )}
          <Button
            size="sm"
            variant="danger"
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

export default function MarketplaceFavorites() {
  const { status: authStatus } = useAuth();
  const isAuth = authStatus === "authenticated";
  const { data, isLoading, refetch } = useMyFavorites();

  const rawFavorites = (data as { favorites?: Favorite[] })?.favorites ?? data?.data ?? data;
  const favorites: Favorite[] = Array.isArray(rawFavorites) ? rawFavorites : [];

  if (!isAuth) {
    return (
      <div className="mx-4 lg:mx-6 mb-12">
        <div className="flex flex-col items-center py-16">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "var(--surface-secondary)" }}>
            <Heart className="w-7 h-7 text-[var(--muted)]" />
          </div>
          <p className="text-[var(--foreground)] font-semibold mb-1">Inicia sesion para ver tus favoritos</p>
          <p className="text-sm text-[var(--muted)]">Necesitas una cuenta para guardar tus cartas favoritas.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-4 lg:mx-6 mb-12 flex justify-center py-20">
        <div style={{ width: 24, height: 24, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="mx-4 lg:mx-6 mb-12">
        <div className="flex flex-col items-center py-16">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "var(--surface-secondary)" }}>
            <HeartFill className="w-7 h-7 text-[var(--muted)]" />
          </div>
          <p className="text-[var(--foreground)] font-semibold mb-1">No tienes favoritos</p>
          <p className="text-sm text-[var(--muted)]">Explora el marketplace y guarda las cartas que te interesen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 lg:mx-6 mb-12">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {favorites.map((fav) => (
          <FavoriteCard key={fav.id} favorite={fav} onRemoved={() => refetch()} />
        ))}
      </div>
    </div>
  );
}
