"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowShapeTurnUpRight, ChevronLeft } from "@gravity-ui/icons";
import { toast } from "@heroui/react/toast";
import { useAuth } from "@/lib/hooks/use-auth";
import ContactSellerButton from "@/features/marketplace/ContactSellerButton";
import TradingCard from "@/components/ui/TradingCard";
import dynamic from "next/dynamic";
const BuyModal = dynamic(() => import("@/features/marketplace/BuyModal"), { ssr: false });
const OfferModal = dynamic(() => import("@/features/marketplace/OfferModal"), { ssr: false });
import type { Listing, ListingDetail } from "@/lib/types/marketplace";

/* ── Tokens compartidos con FeedListingCard ─────────────────────────── */
const CONDITION_COLORS: Record<string, string> = {
  M: "#22c55e", MINT: "#22c55e", NM: "#22c55e",
  LP: "#eab308", MP: "#f97316", HP: "#ef4444", DMG: "#ef4444",
};
const CONDITION_LABELS: Record<string, string> = {
  NM: "Near Mint", LP: "Lightly Played", MP: "Moderately Played",
  HP: "Heavily Played", DMG: "Damaged", M: "Mint",
};
const RARITY_COLORS: Record<string, string> = {
  COMMON: "#9ca3af", UNCOMMON: "#C0C0C0",
  RARE: "#FFD700", MYTHIC: "#F06B2A", SPECIAL: "#9B59B6",
};

const LANGUAGE_FLAGS: Record<string, { countryCode: string; label: string }> = {
  EN: { countryCode: "gb", label: "Inglés" }, ENGLISH: { countryCode: "gb", label: "Inglés" },
  ES: { countryCode: "es", label: "Español" }, SPANISH: { countryCode: "es", label: "Español" }, ESPAÑOL: { countryCode: "es", label: "Español" },
  JA: { countryCode: "jp", label: "Japonés" }, JP: { countryCode: "jp", label: "Japonés" }, JAPANESE: { countryCode: "jp", label: "Japonés" },
  PT: { countryCode: "br", label: "Portugués" }, PORTUGUESE: { countryCode: "br", label: "Portugués" },
  DE: { countryCode: "de", label: "Alemán" }, GERMAN: { countryCode: "de", label: "Alemán" },
  FR: { countryCode: "fr", label: "Francés" }, FRENCH: { countryCode: "fr", label: "Francés" },
  IT: { countryCode: "it", label: "Italiano" }, ITALIAN: { countryCode: "it", label: "Italiano" },
  KO: { countryCode: "kr", label: "Coreano" }, KOREAN: { countryCode: "kr", label: "Coreano" },
  ZH: { countryCode: "cn", label: "Chino" }, CHINESE: { countryCode: "cn", label: "Chino" },
  RU: { countryCode: "ru", label: "Ruso" }, RUSSIAN: { countryCode: "ru", label: "Ruso" },
};

function fmtPrice(n: number) { return n.toLocaleString("es-CL"); }

function getBackUrl(url: string | undefined): string | null {
  if (!url?.includes("/front/")) return null;
  return url.replace("/front/", "/back/");
}

/* Sparkline SVG — precios de vendedores ordenados por fecha */
function PriceSparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const W = 130, H = 52;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = 4;
  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = points.map(p => H - pad - ((p - min) / range) * (H - pad * 2));
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const last = { x: xs[xs.length - 1], y: ys[ys.length - 1] };
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkGrad)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="3" fill="var(--accent)" />
    </svg>
  );
}

/* Celda de meta (estilo tabla Pokémon) */
function MetaCell({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      <span className="text-[13px] font-bold text-foreground" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
    </div>
  );
}

interface Props {
  listing: ListingDetail & Record<string, unknown>;
  id: string;
}

export default function ListingDetailClient({ listing, id }: Props) {
  const { session } = useAuth();
  const isLoggedIn = !!session?.accessToken;

  const [buyOpen, setBuyOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

  const imageUrl = listing.images?.[0]?.url || listing.card_image_url;
  const backUrl = getBackUrl(imageUrl as string | undefined);

  const condition = listing.card_condition || "";
  const condColor = CONDITION_COLORS[condition] ?? "var(--muted)";
  const sellerName = listing.seller_username || listing.tenant_name || "Vendedor";
  const isVerified = listing.is_verified_seller || listing.is_verified_store;
  const rarityKey = (listing.rarity as string | undefined)?.toUpperCase().split(" ")[0] ?? "";
  const priceCtx = listing.price_context;
  const similar = listing.similar ?? listing.similar_listings;
  const allSellers = [listing, ...(similar || [])];
  const isDFC = !!backUrl && (listing.card_name as string | undefined)?.includes(" // ");

  // Puntos para el sparkline: precios de vendedores ordenados por fecha
  const pricePoints: number[] = allSellers
    .filter((s: Listing) => s.price != null && s.created_at)
    .sort((a: Listing, b: Listing) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime())
    .map((s: Listing) => s.price ?? 0);

  function handleShare() {
    const url = `https://rankeao.cl/marketplace/${listing.slug || listing.id}`;
    if (navigator.share) navigator.share({ title: listing.title, url }).catch(() => {});
    else navigator.clipboard.writeText(url).then(() => toast.success("Enlace copiado")).catch(() => {});
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-5">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted mb-6">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors"
          style={{ textDecoration: "none", color: "var(--muted)" }}
        >
          <ChevronLeft style={{ width: 13, height: 13 }} />
          Marketplace
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground truncate max-w-[200px]">
          {listing.card_name || listing.title}
        </span>
      </nav>

      {/* ── Main grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-10 items-start">

        {/* ── LEFT: carta aislada, sin caja ── */}
        <div className="md:sticky md:top-6">
          {imageUrl && (
            <TradingCard
              frontUrl={imageUrl as string}
              backUrl={isDFC ? backUrl : null}
              alt={listing.title}
              sizes="(max-width: 768px) 92vw, 42vw"
              priority
              showGlow
              cardWidthPct={88}
            />
          )}
        </div>

        {/* ── RIGHT: Info ── */}
        <div className="flex flex-col gap-3">

          {/* Nombre + fav/share + meta pills en una sola sección */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[22px] font-extrabold text-foreground leading-tight m-0 flex-1">
                {listing.card_name || listing.title}
              </h1>
              <button
                onClick={handleShare}
                className="shrink-0 pt-0.5"
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "var(--surface-solid)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                <ArrowShapeTurnUpRight style={{ width: 13, height: 13, color: "var(--muted)" }} />
              </button>
            </div>

            {listing.title !== listing.card_name && listing.title && (
              <p className="text-[12px] text-muted m-0 mt-0.5">{listing.title}</p>
            )}

            {/* Meta grid — EDITION | RARITY | FINISH | IDIOMA */}
            {(listing.set_name || listing.rarity || condition || listing.card_language) && (
              <div
                className="grid mt-3 rounded-xl overflow-hidden"
                style={{
                  gridTemplateColumns: `repeat(${[listing.set_name, listing.rarity, condition || listing.is_foil, listing.card_language].filter(Boolean).length}, 1fr)`,
                  border: "1px solid var(--border)",
                  gap: "1px",
                  background: "var(--border)",
                }}
              >
                {listing.set_name && (
                  <div className="px-3 py-2.5" style={{ background: "var(--surface-solid)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest m-0 mb-0.5" style={{ color: "var(--muted)" }}>Edición</p>
                    <p className="text-[12px] font-bold text-foreground m-0 leading-snug">{listing.set_name as string}</p>
                  </div>
                )}
                {listing.rarity && (
                  <div className="px-3 py-2.5" style={{ background: "var(--surface-solid)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest m-0 mb-0.5" style={{ color: "var(--muted)" }}>Rareza</p>
                    <p className="text-[12px] font-bold m-0 leading-snug" style={{ color: RARITY_COLORS[rarityKey] ?? "var(--foreground)" }}>
                      {listing.rarity as string}
                    </p>
                  </div>
                )}
                {(condition || listing.is_foil) && (
                  <div className="px-3 py-2.5" style={{ background: "var(--surface-solid)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest m-0 mb-0.5" style={{ color: "var(--muted)" }}>Estado</p>
                    <p className="text-[12px] font-bold m-0 leading-snug" style={{ color: condColor }}>
                      {[CONDITION_LABELS[condition] || condition, listing.is_foil ? "Foil" : ""].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
                {listing.card_language && (
                  <div className="px-3 py-2.5" style={{ background: "var(--surface-solid)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest m-0 mb-0.5" style={{ color: "var(--muted)" }}>Idioma</p>
                    <p className="text-[12px] font-bold text-foreground m-0 leading-snug">
                      {LANGUAGE_FLAGS[(listing.card_language as string).toUpperCase()]?.label || listing.card_language as string}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Precio ── */}
          {listing.price != null && (
            <div className="rounded-xl px-5 py-4" style={{ background: "var(--surface-solid)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-4">

                {/* Izq: número + mercado */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <span style={{ fontSize: 26, fontWeight: 800, color: "rgba(255,255,255,0.45)", lineHeight: 1 }}>$</span>
                    <span style={{ fontSize: 50, fontWeight: 900, color: "#fff", letterSpacing: "-2.5px", lineHeight: 1 }}>
                      {fmtPrice(listing.price)}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", paddingBottom: 2 }}>
                      {listing.currency || "CLP"}
                    </span>
                  </div>

                  {priceCtx && (priceCtx.total_count ?? priceCtx.listings_count ?? 0) > 0 && (
                    <p className="m-0 mt-2.5 text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
                      <span className="text-[9px] font-bold uppercase tracking-wider mr-1.5" style={{ color: "var(--muted)" }}>Mercado</span>
                      Mín{" "}<strong style={{ color: "var(--foreground)" }}>${priceCtx.min_price?.toLocaleString("es-CL")}</strong>
                      {" · "}
                      Prom{" "}<strong style={{ color: "var(--accent)" }}>${Math.round(priceCtx.avg_price ?? 0).toLocaleString("es-CL")}</strong>
                      {" · "}
                      Máx{" "}<strong style={{ color: "var(--foreground)" }}>${priceCtx.max_price?.toLocaleString("es-CL")}</strong>
                    </p>
                  )}
                </div>

                {/* Der: sparkline */}
                {pricePoints.length >= 2 && (
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      {pricePoints.length} vendedores
                    </span>
                    <PriceSparkline points={pricePoints} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CTAs — lado a lado ── */}
          <div className="flex gap-2">
            <button
              onClick={() => isLoggedIn ? setBuyOpen(true) : undefined}
              style={{
                flex: listing.accepts_offers ? 2 : 1,
                padding: "13px 20px",
                borderRadius: 12, border: "none",
                background: "var(--accent)",
                color: "#fff", fontSize: 15, fontWeight: 800,
                cursor: "pointer", letterSpacing: "-0.2px",
                boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
              }}
            >
              Comprar ahora
            </button>
            {listing.accepts_offers && (
              <button
                onClick={() => isLoggedIn ? setOfferOpen(true) : undefined}
                style={{
                  flex: 1,
                  padding: "11px 20px",
                  borderRadius: 12,
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  color: "#22c55e", fontSize: 14, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Hacer oferta
              </button>
            )}
          </div>

          {/* ── Vendedor compacto — una sola fila ── */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ border: "1px solid var(--border)", background: "var(--surface-solid)" }}
          >
            <Link href={`/perfil/${listing.seller_username}`} style={{ textDecoration: "none", flexShrink: 0 }}>
              <div
                className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-foreground"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                {listing.seller_avatar_url ? (
                  <Image src={listing.seller_avatar_url as string} alt={sellerName} width={36} height={36} className="w-full h-full object-cover" />
                ) : sellerName[0]?.toUpperCase()}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={`/perfil/${listing.seller_username}`}
                  className="text-sm font-bold text-foreground hover:text-accent transition-colors"
                  style={{ textDecoration: "none" }}
                >
                  {sellerName}
                </Link>
                {isVerified && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
                    ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {(listing.city || listing.region) && (
                  <span className="text-[11px] text-muted flex items-center gap-0.5">
                    <MapPin style={{ width: 9, height: 9 }} />
                    {[listing.city, listing.region].filter(Boolean).join(", ")}
                  </span>
                )}
                {listing.accepts_shipping && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                    Envío
                  </span>
                )}
                {listing.accepts_in_person && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                    Presencial
                  </span>
                )}
              </div>
            </div>
            <ContactSellerButton
              sellerUsername={listing.seller_username ?? ""}
              listingTitle={listing.title}
              listingId={listing.id || id}
              className="font-semibold text-sm shrink-0"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "rgba(255,255,255,0.8)",
              }}
            />
          </div>

          {/* ── Card Details ── */}
          {(listing.set_name || listing.rarity || condition || listing.card_language || listing.collector_number || listing.game_name) && (
            <div
              className="rounded-xl"
              style={{ border: "1px solid var(--border)", background: "var(--surface-solid)" }}
            >
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Detalles de la carta
                </span>
              </div>
              <div className="grid grid-cols-2 px-4 pb-4 pt-2 gap-x-6 gap-y-3">
                {listing.set_name && (
                  <MetaCell label="Edición" value={listing.set_name as string} />
                )}
                {listing.rarity && (
                  <MetaCell label="Rareza" value={listing.rarity as string} valueColor={RARITY_COLORS[rarityKey]} />
                )}
                {condition && (
                  <MetaCell label="Condición" value={CONDITION_LABELS[condition] || condition} valueColor={condColor} />
                )}
                {listing.card_language && (
                  <MetaCell
                    label="Idioma"
                    value={LANGUAGE_FLAGS[(listing.card_language as string).toUpperCase()]?.label || listing.card_language as string}
                  />
                )}
                {!!listing.collector_number && (
                  <MetaCell label="Número" value={`#${listing.collector_number as string}`} />
                )}
                {listing.game_name && (
                  <MetaCell label="Juego" value={listing.game_name as string} />
                )}
              </div>
            </div>
          )}

          {/* ── Descripción ── */}
          {listing.description && (
            <div
              className="rounded-xl px-4 py-3"
              style={{ border: "1px solid var(--border)", background: "var(--surface-solid)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2 m-0">Descripción</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap m-0">
                {listing.description as string}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Otros vendedores — filas horizontales estilo TCGPlayer ────── */}
      {allSellers.length > 1 && (
        <div className="mt-8 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
          {/* Header */}
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-[13px] font-bold text-foreground m-0">{allSellers.length} vendedores</h2>
            {(() => {
              const prices = allSellers.map((s) => s.price).filter((p): p is number => p != null);
              const minP = prices.length ? Math.min(...prices) : null;
              return minP != null ? (
                <span className="text-[12px] text-muted">desde ${fmtPrice(minP)}</span>
              ) : null;
            })()}
          </div>

          {/* Column headers */}
          <div className="hidden sm:grid px-4 pb-1.5" style={{
            gridTemplateColumns: "1fr auto auto",
            gap: "0 16px",
          }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Vendedor</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Condición</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted text-right" style={{ minWidth: 130 }}>Precio</span>
          </div>

          {/* Rows */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {allSellers.slice(0, 12).map((item: Listing, idx: number) => {
              const itemSeller = item.seller_username || item.tenant_name || "Vendedor";
              const itemCond = item.card_condition;
              const itemCondColor = CONDITION_COLORS[itemCond ?? ""] ?? "var(--muted)";
              const isCurrent = item.id === listing.id;
              const isVerifiedItem = item.is_verified_seller || item.is_verified_store;

              return (
                <div
                  key={item.id}
                  style={{
                    borderTop: idx === 0 ? "none" : "1px solid var(--border)",
                    backgroundColor: isCurrent ? "rgba(59,130,246,0.04)" : "var(--surface-solid)",
                  }}
                >
                  {/* Row layout: seller | condition+delivery | price+cta */}
                  <div className="flex items-center gap-3 px-4 py-3">

                    {/* Seller — left */}
                    <div className="flex-1 min-w-0 flex items-center gap-2.5">
                      <div
                        className="shrink-0 w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold text-foreground"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                      >
                        {item.seller_avatar_url
                          ? <Image src={item.seller_avatar_url} alt={itemSeller} width={28} height={28} className="w-full h-full object-cover" />
                          : itemSeller[0]?.toUpperCase()
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-foreground truncate">{itemSeller}</span>
                          {isVerifiedItem && (
                            <span style={{ fontSize: 9, fontWeight: 800, color: "#22c55e" }}>✓</span>
                          )}
                          {isCurrent && (
                            <span className="text-[9px] font-bold shrink-0" style={{ color: "var(--accent)" }}>· esta</span>
                          )}
                        </div>
                        {item.city && (
                          <span className="text-[10px] text-muted truncate flex items-center gap-0.5">
                            <MapPin style={{ width: 9, height: 9 }} />{item.city}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Condition + delivery — center */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      {itemCond && (
                        <span
                          className="text-[10px] font-[800] px-2 py-0.5 rounded-md whitespace-nowrap"
                          style={{ color: itemCondColor, background: `${itemCondColor}16`, border: `1px solid ${itemCondColor}33` }}
                        >
                          {CONDITION_LABELS[itemCond] || itemCond}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        {item.is_foil && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ color: "#eab308", background: "rgba(234,179,8,0.1)" }}>
                            Foil
                          </span>
                        )}
                        {item.accepts_shipping && (
                          <span className="text-[9px] text-muted">Envío</span>
                        )}
                        {item.accepts_in_person && !item.accepts_shipping && (
                          <span className="text-[9px] text-muted">Presencial</span>
                        )}
                      </div>
                    </div>

                    {/* Price + CTA — right */}
                    <div className="shrink-0 flex items-center gap-2.5" style={{ minWidth: 130 }}>
                      <div className="flex items-baseline gap-0.5 leading-none flex-1 justify-end">
                        <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", fontFamily: "Georgia, serif" }}>$</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
                          {fmtPrice(item.price ?? 0)}
                        </span>
                      </div>
                      <Link
                        href={`/marketplace/${item.slug || item.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <span
                          className="text-[11px] font-bold whitespace-nowrap px-3 py-1.5 rounded-lg"
                          style={{
                            background: isCurrent ? "rgba(59,130,246,0.15)" : "var(--accent)",
                            color: isCurrent ? "var(--accent)" : "#fff",
                            border: isCurrent ? "1px solid rgba(59,130,246,0.35)" : "none",
                            display: "inline-block",
                          }}
                        >
                          {isCurrent ? "Esta oferta" : "Ver oferta"}
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BuyModal listing={listing} open={buyOpen} onClose={() => setBuyOpen(false)} />
      <OfferModal listing={listing} open={offerOpen} onClose={() => setOfferOpen(false)} />
    </div>
  );
}
