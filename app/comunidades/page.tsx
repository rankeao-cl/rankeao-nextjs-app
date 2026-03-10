import { Card, Chip } from "@heroui/react";
import TenantCard from "@/components/TenantCard";
import { getTenants } from "@/lib/api/tenants";
import type { Tenant } from "@/lib/types/tenant";
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
    const raw = await getTenants(filters).catch(() => null);
    // The API wraps response as { data: { tenants: [...] }, meta: {...} }
    if (raw && typeof raw === "object" && "data" in raw) {
      const inner = (raw as Record<string, unknown>).data as Record<string, unknown> | undefined;
      tenantsData = {
        tenants: (inner?.tenants ?? (raw as Record<string, unknown>).tenants ?? []) as Tenant[],
        meta: (raw as Record<string, unknown>).meta as Record<string, unknown> | undefined,
      };
    } else {
      tenantsData = raw;
    }
  } catch {
    // silent
  }

  const tenants = tenantsData?.tenants ?? [];
  const meta = tenantsData?.meta as Record<string, number> | undefined;
  const totalPages = meta?.total_pages ?? 1;

  return (
    <div className="max-w-7xl mx-auto flex flex-col pt-4">
      {/* General Search Header */}
      <section className="px-4 lg:px-6 mb-6">
        <div
          className="p-5 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="relative z-10 flex-1">
            <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
              Tiendas Locales
            </Chip>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--foreground)] to-[var(--muted)] mb-2">
              Comunidades y tiendas activas
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-lg mb-6">
              Descubre espacios de juego en todo Chile para competir, comprar cartas y armar comunidad.
            </p>
          </div>

          <div className="hidden md:flex flex-col gap-2 min-w-[200px]">
            {/* Destacados placeholder */}
            <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent)] opacity-10 blur-xl rounded-full"></div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Comunidades</p>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {meta?.total != null ? `${meta.total.toLocaleString("es-CL")} activas` : "Sin conteo disponible"} <span className="text-[var(--accent)] inline-block ml-1">&rarr;</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className="flex flex-col md:flex-row gap-6 px-4 lg:px-6 mb-12">
        {/* Left Sidebar - Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-20 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <ComunidadesFilters
              currentFilters={{
                q: params.q,
                city: params.city,
                region: params.region,
                min_rating: params.min_rating?.toString(),
                sort: params.sort || "rating-desc",
              }}
              totalPages={totalPages}
              currentPage={page}
            />
          </div>
        </aside>

        {/* Right Content - Results */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              Resultados del directorio
            </h2>
          </div>

          {tenants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map((tenant) => (
                <TenantCard key={tenant.id} tenant={tenant} />
              ))}
            </div>
          ) : (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <Card.Content className="py-16 text-center">
                <p className="text-4xl mb-4">🏪</p>
                <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
                  No hay comunidades que coincidan con los filtros actuales.
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  Intenta ajustar los filtros de búsqueda
                </p>
              </Card.Content>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
