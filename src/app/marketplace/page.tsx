import { Card, CardContent, Chip } from "@heroui/react";
import ProductCard from "@/components/ProductCard";
import { getListings } from "@/lib/api";
import MarketplaceFilters from "./MarketplaceFilters";
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
    per_page: 16,
  };

  let listingsData;
  try {
    listingsData = await getListings(filters).catch(() => null);
  } catch {
    // silent
  }

  const listings = listingsData?.listings ?? [];
  const meta = listingsData?.meta;
  const totalPages = meta?.total_pages ?? 1;

  return (
    <div className="rk-container py-10 space-y-7">
      <section className="surface-panel relative overflow-hidden p-6 sm:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(248,250,252,0.24),transparent_42%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_80%,rgba(212,212,216,0.14),transparent_38%)]" />
        <div className="relative">
          <Chip color="accent" variant="soft" size="sm" className="mb-3">
            Mercado Destacado
          </Chip>
          <h1 className="section-title mb-3">Singles, preventas y staples para tu deck</h1>
          <p className="section-subtitle">
            Busca cartas por condicion, rango de precio y orden. Publicaciones reales desde la API publica.
          </p>
        </div>
      </section>

      <section className="surface-panel p-4 sm:p-5">
        <MarketplaceFilters
          currentFilters={{
            q: params.q,
            condition: params.condition,
            min_price: params.min_price,
            max_price: params.max_price,
            sort: params.sort || "newest",
          }}
          totalPages={totalPages}
          currentPage={page}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-white">Resultados del mercado</h2>
          <p className="text-sm text-gray-500">
            {meta?.total != null ? `${meta.total.toLocaleString("es-CL")} publicaciones` : "Sin conteo disponible"}
          </p>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <Card className="surface-panel">
            <CardContent className="py-16 text-center text-gray-500">
              <p className="text-3xl mb-3">🧩</p>
              <p>No encontramos cartas con esos filtros.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
