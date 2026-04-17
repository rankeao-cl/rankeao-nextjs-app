import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";

import {
  getCardDetail,
  getCardPrintings,
  getCardLegality,
  getCardPriceHistory,
} from "@/lib/api/catalog";
import type { Card as CatalogCard, Printing, LegalityEntry, PricePoint } from "@/lib/types/catalog";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

interface CardDetailPageProps {
  params: Promise<{ cardId: string }>;
}

export async function generateMetadata({ params }: CardDetailPageProps): Promise<Metadata> {
  const { cardId } = await params;
  const [detailResult] = await Promise.allSettled([getCardDetail(cardId)]);
  const res = detailResult.status === "fulfilled" ? detailResult.value : null;
  const card = res?.data ?? res?.card;
  return {
    title: card?.name ? `${card.name} - Catalogo` : "Detalle de Carta",
    description: card?.oracle_text ?? `Informacion detallada de la carta ${card?.name ?? cardId}.`,
  };
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { cardId } = await params;
  const [cardResult, printingsResult, legalityResult, priceResult] = await Promise.allSettled([
    getCardDetail(cardId),
    getCardPrintings(cardId),
    getCardLegality(cardId),
    getCardPriceHistory(cardId),
  ]);

  const cardData = cardResult.status === "fulfilled" ? cardResult.value : null;
  const printingsData = printingsResult.status === "fulfilled" ? printingsResult.value : null;
  const legalityData = legalityResult.status === "fulfilled" ? legalityResult.value : null;
  const priceData = priceResult.status === "fulfilled" ? priceResult.value : null;
  const cardLoadFailed = cardResult.status === "rejected";
  const printingsLoadFailed = printingsResult.status === "rejected";
  const legalityLoadFailed = legalityResult.status === "rejected";
  const pricesLoadFailed = priceResult.status === "rejected";

  const card: CatalogCard | undefined = cardData?.data ?? cardData?.card;
  const printings: Printing[] = printingsData?.data ?? printingsData?.printings ?? card?.printings ?? [];
  const legalities: LegalityEntry[] = legalityData?.data ?? legalityData?.legalities ?? [];
  const prices: PricePoint[] = priceData?.prices ?? [];

  if (!card) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col pt-4 px-4">
        <div className="py-20 flex justify-center">
          <Card className="max-w-md w-full border border-dashed border-[var(--border)] bg-transparent">
            <Card.Content className="py-12 text-center flex flex-col items-center">
              <span className="text-4xl block mb-4">&#128196;</span>
              <p className="text-[var(--foreground)] font-medium mb-1">
                {cardLoadFailed ? "No se pudo cargar la carta" : "Carta no encontrada"}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {cardLoadFailed
                  ? "Hubo un problema al consultar el catalogo. Intenta nuevamente en unos minutos."
                  : "No se pudo obtener la informacion de esta carta."}
              </p>
              <Link href="/catalogo" className="mt-4">
                <Button size="sm" variant="ghost">
                  Volver al catalogo
                </Button>
              </Link>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  const mainPrinting = printings[0];
  const mainImage = mainPrinting?.image_url ?? mainPrinting?.image_url_small;

  // Price stats
  const clpPrices = prices.map((p) => p.price_clp).filter((p): p is number => p != null);
  const maxCLP = clpPrices.length > 0 ? Math.max(...clpPrices) : 0;

  const legalityColor: Record<string, string> = {
    LEGAL: "text-green-400 bg-green-400/10",
    BANNED: "text-red-400 bg-red-400/10",
    RESTRICTED: "text-yellow-400 bg-yellow-400/10",
    NOT_LEGAL: "text-[var(--muted)] bg-[var(--surface)]",
  };

  const legalityLabel: Record<string, string> = {
    LEGAL: "Legal",
    BANNED: "Baneada",
    RESTRICTED: "Restringida",
    NOT_LEGAL: "No legal",
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col pt-4">
      {/* Breadcrumb */}
      <nav className="px-4 lg:px-6 mb-4">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <Link href="/catalogo" className="hover:text-[var(--accent)] transition-colors">
            Catalogo
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">{card.name}</span>
        </div>
      </nav>

      {(printingsLoadFailed || legalityLoadFailed || pricesLoadFailed) && (
        <div className="px-4 lg:px-6 mb-4">
          <Card className="border border-amber-500/30 bg-amber-500/10">
            <Card.Content className="py-3">
              <p className="text-xs text-amber-300 font-medium">
                Algunos datos secundarios no pudieron cargarse (precios, legalidad o impresiones).
              </p>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col md:flex-row gap-6 px-4 lg:px-6 mb-12">
        {/* Left: Card image */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="sticky top-20">
            <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-black/20 aspect-[2.5/3.5] relative">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={card.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-5xl text-[var(--muted)] opacity-30">?</span>
                </div>
              )}
            </div>

            {/* Marketplace link */}
            <Link href={`/marketplace?q=${encodeURIComponent(card.name)}`} className="block mt-4">
              <Button variant="primary" className="w-full rounded-xl">
                Buscar en Marketplace
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: Card details */}
        <div className="flex-1 min-w-0">
          {/* Name & type */}
          <div className="glass-sm p-5 rounded-2xl mb-4">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">{card.name}</h1>
            {card.type_line && (
              <p className="text-sm text-[var(--muted)] mb-3">{card.type_line}</p>
            )}
            {card.oracle_text && (
              <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
                {card.oracle_text}
              </p>
            )}
            {card.flavor_text && (
              <p className="text-xs text-[var(--muted)] italic mt-3 border-l-2 border-[var(--border)] pl-3">
                {card.flavor_text}
              </p>
            )}
          </div>

          {/* Price history */}
          {prices.length > 0 && (
            <div className="glass-sm p-5 rounded-2xl mb-4">
              <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-4">
                Historial de Precios
              </h2>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {clpPrices.length > 0 && (
                  <>
                    <div className="text-center p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--muted)] mb-1">Min CLP</p>
                      <p className="text-sm font-bold text-green-400">
                        ${Math.min(...clpPrices).toLocaleString("es-CL")}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--muted)] mb-1">Max CLP</p>
                      <p className="text-sm font-bold text-red-400">
                        ${Math.max(...clpPrices).toLocaleString("es-CL")}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--muted)] mb-1">Prom CLP</p>
                      <p className="text-sm font-bold text-[var(--foreground)]">
                        ${Math.round(clpPrices.reduce((a, b) => a + b, 0) / clpPrices.length).toLocaleString("es-CL")}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* CSS bar chart */}
              {clpPrices.length > 0 && maxCLP > 0 && (
                <div className="flex items-end gap-[2px] h-24 mb-4">
                  {prices.slice(-30).map((point, i) => {
                    const value = point.price_clp ?? 0;
                    const height = maxCLP > 0 ? (value / maxCLP) * 100 : 0;
                    return (
                      <div
                        key={`${point.date}-${i}`}
                        className="flex-1 bg-[var(--accent)] rounded-t opacity-70 hover:opacity-100 transition-opacity min-w-[3px] relative group"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${new Date(point.date).toLocaleDateString("es-CL")} - $${value.toLocaleString("es-CL")} CLP`}
                      />
                    );
                  })}
                </div>
              )}

              {/* Recent prices list */}
              <div className="space-y-1">
                {prices.slice(-10).reverse().map((point, i) => (
                  <div
                    key={`${point.date}-${i}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]"
                  >
                    <span className="text-xs text-[var(--muted)]">
                      {new Date(point.date).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-3">
                      {point.price_clp != null && (
                        <span className="text-xs font-bold text-[var(--foreground)]">
                          ${point.price_clp.toLocaleString("es-CL")} CLP
                        </span>
                      )}
                      {point.price_usd != null && (
                        <span className="text-xs text-[var(--muted)]">
                          US${point.price_usd}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All printings */}
          {printings.length > 0 && (
            <div className="glass-sm p-5 rounded-2xl mb-4">
              <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-4">
                Impresiones ({printings.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {printings.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
                  >
                    {p.image_url_small ? (
                      <Image
                        src={p.image_url_small}
                        alt={`${card.name} - ${p.set_name}`}
                        width={40}
                        height={56}
                        className="object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-14 rounded bg-black/20 flex items-center justify-center">
                        <span className="text-[var(--muted)] text-xs">?</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                        {p.set_name ?? p.set_code ?? "Set desconocido"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.collector_number && (
                          <span className="text-[10px] text-[var(--muted)]">#{p.collector_number}</span>
                        )}
                        {p.rarity && (
                          <Chip size="sm" className="text-[10px] px-1.5 h-4 bg-[var(--surface-secondary)] text-[var(--muted)] border-0">
                            {p.rarity}
                          </Chip>
                        )}
                      </div>
                      {p.artist && (
                        <p className="text-[10px] text-[var(--muted)] mt-0.5 truncate">
                          Artista: {p.artist}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {p.price_clp != null && (
                        <p className="text-xs font-bold text-[var(--foreground)]">
                          ${p.price_clp.toLocaleString("es-CL")}
                        </p>
                      )}
                      {p.price_usd != null && (
                        <p className="text-[10px] text-[var(--muted)]">US${p.price_usd}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legality */}
          {legalities.length > 0 && (
            <div className="glass-sm p-5 rounded-2xl mb-4">
              <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-4">
                Legalidad
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {legalities.map((entry) => (
                  <div
                    key={entry.format_id}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium ${legalityColor[entry.legality] ?? legalityColor.NOT_LEGAL}`}
                  >
                    <span>{entry.format_name ?? entry.format_slug ?? entry.format_id}</span>
                    <span className="font-bold">{legalityLabel[entry.legality] ?? entry.legality}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
