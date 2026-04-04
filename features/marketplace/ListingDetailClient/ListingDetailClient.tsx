"use client";

import { useState } from "react";
import { Card, Chip, Avatar, Button } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Heart, HeartFill } from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { useToggleFavorite, useMyFavorites } from "@/lib/hooks/use-marketplace";
import ContactSellerButton from "@/features/marketplace/ContactSellerButton";
import BuyModal from "@/features/marketplace/BuyModal";
import OfferModal from "@/features/marketplace/OfferModal";
import type { Listing, ListingDetail } from "@/lib/types/marketplace";

const conditionLabels: Record<string, string> = {
  NM: "Near Mint", LP: "Lightly Played", MP: "Moderately Played",
  HP: "Heavily Played", DMG: "Damaged", M: "Mint",
};

const conditionColors: Record<string, "success" | "warning" | "danger" | "default"> = {
  NM: "success", M: "success", LP: "warning", MP: "warning", HP: "danger", DMG: "danger",
};

interface Props {
  listing: ListingDetail & Record<string, any>;
  id: string;
}

export default function ListingDetailClient({ listing, id }: Props) {
  const { session } = useAuth();
  const isLoggedIn = !!session?.accessToken;

  const [buyOpen, setBuyOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

  const toggleFav = useToggleFavorite();
  const { data: favorites } = useMyFavorites();

  const favList = Array.isArray(favorites) ? favorites : (favorites as any)?.favorites || [];
  const isFav = favList.some((f: any) => f.listing_id === listing.id || f.listing?.id === listing.id);

  const imageUrl = listing.images?.[0]?.url || listing.card_image_url;
  const condition = listing.card_condition || "";
  const sellerName = listing.seller_username || listing.tenant_name || "Vendedor";

  const priceCtx = (listing as any).price_context;
  const similar = (listing as any).similar_listings;

  function handleFavToggle() {
    if (!isLoggedIn) return;
    toggleFav.mutate({ listingId: listing.id, add: !isFav });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <Link href="/marketplace" className="hover:text-[var(--foreground)] transition-colors">Marketplace</Link>
        <span>/</span>
        <span className="text-[var(--foreground)] truncate max-w-[200px]">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Image */}
        <Card className="surface-card rounded-2xl overflow-hidden">
          <Card.Content className="p-0 relative">
            <div className="relative aspect-[3/4] w-full" style={{ background: "var(--surface-secondary)" }}>
              {imageUrl ? (
                <Image src={imageUrl} alt={listing.title} fill className="object-contain" sizes="(max-width: 768px) 100vw, 50vw" priority />
              ) : (
                <div className="flex items-center justify-center h-full text-5xl">🃏</div>
              )}
            </div>
            {/* Favorite button */}
            {isLoggedIn && (
              <button
                onClick={handleFavToggle}
                className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ background: isFav ? "var(--danger)" : "rgba(0,0,0,0.4)" }}
              >
                {isFav ? (
                  <HeartFill className="size-4 text-white" />
                ) : (
                  <Heart className="size-4 text-white" />
                )}
              </button>
            )}
          </Card.Content>
        </Card>

        {/* Right: Info */}
        <div className="space-y-4">
          {/* Title & Price */}
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">{listing.title}</h1>
            {listing.price != null && (
              <p className="text-3xl font-extrabold text-[var(--accent)]">
                ${listing.price.toLocaleString("es-CL")}
                <span className="text-sm font-normal text-[var(--muted)] ml-2">{listing.currency || "CLP"}</span>
              </p>
            )}
            {listing.quantity != null && listing.quantity > 1 && (
              <p className="text-xs text-[var(--muted)] mt-1">{listing.quantity} disponibles</p>
            )}
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-1.5">
            {condition && (
              <Chip color={conditionColors[condition] || "default"} variant="soft" size="sm">
                {conditionLabels[condition] || condition}
              </Chip>
            )}
            {listing.set_name && <Chip variant="secondary" size="sm">{listing.set_name}</Chip>}
            {listing.rarity && <Chip variant="soft" size="sm">{listing.rarity}</Chip>}
            {listing.is_foil && <Chip color="warning" variant="soft" size="sm">Foil</Chip>}
            {listing.card_language && <Chip variant="secondary" size="sm">{listing.card_language.toUpperCase()}</Chip>}
            {listing.accepts_offers && <Chip color="accent" variant="soft" size="sm">Acepta ofertas</Chip>}
          </div>

          {/* Price context */}
          {priceCtx && priceCtx.listings_count > 0 && (
            <Card className="surface-card rounded-xl">
              <Card.Content className="p-4">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Precio de referencia</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-[var(--muted)]">Minimo</p>
                    <p className="text-sm font-bold text-[var(--foreground)]">${priceCtx.min_price?.toLocaleString("es-CL")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted)]">Promedio</p>
                    <p className="text-sm font-bold text-[var(--accent)]">${priceCtx.avg_price?.toLocaleString("es-CL")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted)]">Maximo</p>
                    <p className="text-sm font-bold text-[var(--foreground)]">${priceCtx.max_price?.toLocaleString("es-CL")}</p>
                  </div>
                </div>
                <p className="text-[10px] text-[var(--muted)] text-center mt-2">Basado en {priceCtx.listings_count} publicaciones</p>
              </Card.Content>
            </Card>
          )}

          {/* Description */}
          {listing.description && (
            <Card className="surface-card rounded-xl">
              <Card.Content className="p-4">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Descripcion</p>
                <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{listing.description}</p>
              </Card.Content>
            </Card>
          )}

          {/* Shipping info */}
          <Card className="surface-card rounded-xl">
            <Card.Content className="p-4 space-y-2">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Entrega</p>
              <div className="flex flex-wrap gap-2 text-xs text-[var(--foreground)]">
                {listing.accepts_shipping && (
                  <span className="px-2 py-1 rounded-lg bg-[var(--surface-secondary)]">📦 Envio disponible</span>
                )}
                {listing.accepts_in_person && (
                  <span className="px-2 py-1 rounded-lg bg-[var(--surface-secondary)]">🤝 Entrega en persona</span>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Seller */}
          <Card className="surface-card rounded-xl">
            <Card.Content className="p-4">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Vendedor</p>
              <div className="flex items-center gap-3">
                <Avatar size="md">
                  {listing.seller_avatar_url ? <Avatar.Image src={listing.seller_avatar_url} /> : null}
                  <Avatar.Fallback>{sellerName[0]?.toUpperCase()}</Avatar.Fallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">{sellerName}</p>
                  {(listing.city || listing.region) && (
                    <p className="flex items-center gap-1 text-xs text-[var(--muted)]">
                      <MapPin className="size-3" />
                      {[listing.city, listing.region].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                {(listing.is_verified_seller || listing.is_verified_store) && (
                  <span className="px-2 py-1 rounded text-[10px] font-bold uppercase" style={{ background: "var(--success)", color: "var(--success-foreground)" }}>
                    Verificado
                  </span>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* CTAs */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-3">
              <Button variant="primary" className="flex-1 font-semibold" onPress={() => isLoggedIn ? setBuyOpen(true) : undefined}>
                Comprar
              </Button>
              {listing.accepts_offers && (
                <Button variant="secondary" className="flex-1 font-semibold" onPress={() => isLoggedIn ? setOfferOpen(true) : undefined}>
                  Hacer oferta
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <ContactSellerButton sellerUsername={listing.seller_username ?? ""} listingTitle={listing.title} listingId={listing.id || id} />
              <Link href="/marketplace" className="flex-1">
                <Button type="button" variant="tertiary" className="w-full font-semibold">Volver</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* All sellers for this card */}
      {(() => {
        const allSellers = [listing, ...(similar || [])];
        return allSellers.length > 1 ? (
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Vendedores de esta carta ({allSellers.length})</h2>
          <div className="flex flex-col gap-2">
            {allSellers.slice(0, 10).map((item: any) => {
              const itemSeller = item.seller_username || item.tenant_name || "Vendedor";
              const itemCondition = item.card_condition;
              const itemImage = item.images?.[0]?.url || item.card_image_url;
              return (
                <Link key={item.id} href={`/marketplace/${item.slug || item.id}`} className="block">
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:brightness-110"
                    style={{ backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)" }}
                  >
                    {/* Mini image */}
                    <div className="shrink-0 relative overflow-hidden" style={{ width: 40, height: 56, borderRadius: 3, backgroundColor: "#0a0a0a" }}>
                      {itemImage ? (
                        <Image src={itemImage} alt={item.title} fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span style={{ fontSize: 12, color: "var(--muted)", opacity: 0.3 }}>?</span>
                        </div>
                      )}
                    </div>

                    {/* Seller info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.seller_avatar_url ? (
                          <img src={item.seller_avatar_url} alt="" style={{ width: 18, height: 18, borderRadius: 9 }} />
                        ) : (
                          <div className="flex items-center justify-center" style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "var(--surface)" }}>
                            <span style={{ fontSize: 9, color: "var(--muted)" }}>{itemSeller[0]?.toUpperCase()}</span>
                          </div>
                        )}
                        <span className="text-xs font-semibold text-[var(--foreground)] truncate">{itemSeller}</span>
                        {item.city && <span className="text-[10px]" style={{ color: "var(--muted)" }}>· {item.city}</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {itemCondition && (
                          <span className="uppercase text-[9px] font-semibold px-1.5 py-0.5" style={{ borderRadius: 4, color: "var(--muted)", backgroundColor: "var(--surface)" }}>
                            {conditionLabels[itemCondition] || itemCondition}
                          </span>
                        )}
                        {item.is_foil && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5" style={{ borderRadius: 4, color: "var(--yellow, #eab308)", backgroundColor: "var(--surface)" }}>
                            Foil
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <span className="text-sm font-bold text-[var(--foreground)] shrink-0">
                      ${(item.price ?? 0).toLocaleString("es-CL")}
                    </span>

                    {/* Chevron */}
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
                      <path d="M6 3l5 5-5 5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        ) : null;
      })()}

      {/* Modals */}
      <BuyModal listing={listing} open={buyOpen} onClose={() => setBuyOpen(false)} />
      <OfferModal listing={listing} open={offerOpen} onClose={() => setOfferOpen(false)} />
    </div>
  );
}
