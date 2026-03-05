import { Card, CardContent, Chip } from "@heroui/react";
import TenantCard from "@/components/TenantCard";
import { getTenants } from "@/lib/api";
import ComunidadesFilters from "./ComunidadesFilters";

export const metadata = {
  title: "Comunidades - Rankeao",
  description: "Explora tiendas y comunidades TCG activas en Rankeao.",
};

interface ComunidadesPageProps {
  searchParams?: Promise<{
    q?: string;
    city?: string;
    region?: string;
    min_rating?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ComunidadesPage({ searchParams }: ComunidadesPageProps) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page || "1") || 1;

  const filters = {
    q: params.q,
    city: params.city,
    region: params.region,
    min_rating: params.min_rating ? Number(params.min_rating) : undefined,
    sort: params.sort || "rating-desc",
    page,
    per_page: 12,
  };

  let tenantsData;
  try {
    tenantsData = await getTenants(filters).catch(() => null);
  } catch {
    // silent
  }

  const tenants = tenantsData?.tenants ?? [];
  const meta = tenantsData?.meta;
  const totalPages = meta?.total_pages ?? 1;

  return (
    <div className="rk-container py-10 space-y-7">
      <section className="surface-panel relative overflow-hidden p-6 sm:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(124,58,237,0.2),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.15),transparent_40%)]" />
        <div className="relative">
          <Chip color="accent" variant="soft" size="sm" className="mb-3">
            Tiendas Locales
          </Chip>
          <h1 className="section-title mb-2">Comunidades y tiendas activas</h1>
          <p className="section-subtitle">
            Descubre espacios de juego en todo Chile para competir, comprar cartas y armar comunidad.
          </p>
        </div>
      </section>

      <section className="surface-panel p-4 sm:p-5">
        <ComunidadesFilters
          currentFilters={{
            q: params.q,
            city: params.city,
            region: params.region,
            min_rating: params.min_rating,
            sort: params.sort || "rating-desc",
          }}
          totalPages={totalPages}
          currentPage={page}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-white">Resultados del directorio</h2>
          <p className="text-sm text-gray-500">
            {meta?.total != null ? `${meta.total.toLocaleString("es-CL")} resultados` : "Sin conteo disponible"}
          </p>
        </div>

        {tenants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map((tenant) => (
              <TenantCard key={tenant.id} tenant={tenant} />
            ))}
          </div>
        ) : (
          <Card className="surface-panel">
            <CardContent className="py-16 text-center text-gray-500">
              <p className="text-3xl mb-3">🏪</p>
              <p>No hay comunidades que coincidan con los filtros actuales.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
