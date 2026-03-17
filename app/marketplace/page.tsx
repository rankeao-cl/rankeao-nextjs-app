import { Card, Chip, Button } from "@heroui/react";
import { SaleCard, SaleCardList } from "@/components/cards";
import { getListings } from "@/lib/api/marketplace";
import { getGames } from "@/lib/api/catalog";
import type { CatalogGame } from "@/lib/types/catalog";
import MarketplaceFilters from "./MarketplaceFilters";
import MarketplaceSearch from "./MarketplaceSearch";
import MarketplaceViewToggle from "./MarketplaceViewToggle";
import FeaturedSections from "./FeaturedSections";
import type { Metadata } from "next";

export async function generateMetadata({ searchParams }: MarketplacePageProps): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim();
  return {
    title: q ? `Marketplace: ${q}` : "Marketplace",
    description: q
      ? `Resultados del marketplace para ${q} en Rankeao.`
      : "Compra y vende cartas TCG entre jugadores y tiendas de la comunidad.",
  };
}

interface MarketplacePageProps {
  searchParams?: Promise<{
    q?: string;
    condition?: string;
    min_price?: string;
    max_price?: string;
    sort?: string;
    page?: string;
    category?: string;
    game?: string;
    city?: string;
    seller_type?: string;
    view?: string;
  }>;
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page || "1") || 1;
  const filters = {
    q: params.q,
    condition: params.condition,
    min_price: params.min_price ? Number(params.min_price) : undefined,
    max_price: params.max_price ? Number(params.max_price) : undefined,
    sort: params.sort || "newest",
    page,
    per_page: 24,
    game: params.game,
    city: params.city,
    seller_type: params.seller_type,
    category: params.category,
  };

  let listingsData;
  let gamesData;
  try {
    [listingsData, gamesData] = await Promise.all([
      getListings(filters).catch(() => null),
      getGames().catch(() => null),
    ]);
  } catch {
    // silent
  }

  const listings = listingsData?.listings ?? [];
  const meta = listingsData?.meta;
  const totalPages = meta?.total_pages ?? 1;
  const rawGames = gamesData?.data ?? gamesData?.games;
  const games: CatalogGame[] = Array.isArray(rawGames) ? rawGames : [];
  const viewMode = params.view || "grid";

  return (
    <div className="max-w-7xl mx-auto flex flex-col pt-4">
      {/* General Search Header */}
      <section className="px-4 lg:px-6 mb-6">
        <div
          className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="relative z-10 flex-1">
            <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
              Singles & Productos
            </Chip>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Marketplace TCG
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-lg mb-6">
              Busca cartas, sets o tiendas. Descubre las mejores ofertas de la comunidad.
            </p>

            <MarketplaceSearch initialQuery={params.q} />
          </div>

          <div className="hidden md:flex flex-col gap-2 min-w-[200px]">
            {/* Destacados placeholder */}
            <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent)] opacity-10 blur-xl rounded-full"></div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Destacados</p>
              <p className="text-sm font-medium text-[var(--foreground)]">Últimos lotes agregados <span className="text-[var(--accent)] inline-block ml-1">&rarr;</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Sections */}
      {page === 1 && !params.q && (
        <FeaturedSections listings={listings} />
      )}

      {/* Main Grid Layout */}
      <div className="flex flex-col md:flex-row gap-6 px-4 lg:px-6 mb-12">
        {/* Left Sidebar - Filters (hidden on mobile) */}
        <aside className="hidden md:block w-full md:w-64 flex-shrink-0">
          <div className="sticky top-20 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-3xl">
            <MarketplaceFilters
              currentFilters={{
                q: params.q,
                condition: params.condition,
                min_price: params.min_price,
                max_price: params.max_price,
                sort: params.sort,
                category: params.category,
                game: params.game,
                city: params.city,
                seller_type: params.seller_type,
              }}
              games={games}
            />
          </div>
        </aside>

        {/* Right Content - Results */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              Catálogo
              {meta?.total != null && (
                <Chip size="sm" className="bg-[var(--surface-secondary)] text-[var(--muted)] border-0">
                  {meta.total.toLocaleString("es-CL")} resultados
                </Chip>
              )}
            </h2>
            <MarketplaceViewToggle currentView={viewMode} />
          </div>

          {listings.length > 0 ? (
            <>
              {viewMode === "list" ? (
                <div className="flex flex-col gap-3">
                  {listings.map((listing) => (
                    <SaleCardList key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {listings.map((listing) => (
                    <SaleCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}

              {/* Pagination controls MVP */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12 mb-8">
                  <div className="flex justify-center py-4 px-6 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] gap-4 items-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      isDisabled={page <= 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-xs font-semibold text-[var(--muted)]">Página {page} de {totalPages}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      isDisabled={page >= totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 flex justify-center">
              <Card className="max-w-md w-full border border-dashed border-[var(--border)] bg-transparent">
                <Card.Content className="py-12 text-center flex flex-col items-center">
                  <span className="text-4xl block mb-4">🔍</span>
                  <p className="text-[var(--foreground)] font-medium mb-1">No hay resultados</p>
                  <p className="text-sm text-[var(--muted)]">
                    Intenta quitar filtros o usar términos más generales.
                  </p>
                </Card.Content>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
