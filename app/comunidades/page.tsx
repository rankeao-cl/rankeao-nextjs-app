import { Card, Chip, Button } from "@heroui/react";
import { getTenants, getTenant } from "@/lib/api/tenants";
import type { Tenant } from "@/lib/types/tenant";
import ComunidadesSearch from "./ComunidadesSearch";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Comunidades",
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

const sortOptions = [
  { key: "rating-desc", label: "Mejor valoradas" },
  { key: "newest", label: "Mas recientes" },
  { key: "name-asc", label: "A-Z" },
];

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="text-yellow-400 text-sm tracking-wide">
      {"★".repeat(full)}{half ? "☆" : ""}
    </span>
  );
}

export default async function ComunidadesPage({ searchParams }: ComunidadesPageProps) {
  const params = (await searchParams) ?? {};
  const page = Number(params.page || "1") || 1;
  const sort = params.sort || "rating-desc";

  const filters = {
    q: params.q,
    city: params.city,
    region: params.region,
    min_rating: params.min_rating ? Number(params.min_rating) : undefined,
    sort,
    page,
    per_page: 12,
  };

  let tenantsData;
  try {
    const raw = await getTenants(filters).catch(() => null);
    if (raw && typeof raw === "object" && "data" in raw) {
      const inner = (raw as Record<string, unknown>).data as Record<string, unknown> | undefined;
      tenantsData = {
        tenants: (inner?.tenants ?? (raw as Record<string, unknown>).tenants ?? []) as Tenant[],
        meta: (raw as Record<string, unknown>).meta as Record<string, number> | undefined,
      };
    } else {
      tenantsData = raw;
    }
  } catch {
    // silent
  }

  const baseTenants = (tenantsData?.tenants ?? []) as Tenant[];
  const meta = tenantsData?.meta as Record<string, number> | undefined;
  const totalPages = meta?.total_pages ?? 1;

  // Enrich tenants with detail data (banner_url, etc.) in parallel
  const tenants = await Promise.all(
    baseTenants.map(async (t) => {
      if (t.banner_url) return t;
      try {
        const detail = await getTenant(t.slug || t.id).catch(() => null);
        if (detail?.tenant?.banner_url) {
          return { ...t, banner_url: detail.tenant.banner_url };
        }
      } catch {}
      return t;
    })
  );

  function buildUrl(overrides: Record<string, string>) {
    const base: Record<string, string> = { sort };
    if (params.q) base.q = params.q;
    if (params.city) base.city = params.city;
    const merged = { ...base, ...overrides };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    return `/comunidades?${qs}`;
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col pt-4">
      {/* Hero */}
      <section className="px-4 lg:px-6 mb-6">
        <div className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 opacity-5 blur-[80px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex-1">
              <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
                Directorio de tiendas
              </Chip>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Comunidades TCG
              </h1>
              <p className="text-sm text-[var(--muted)] max-w-lg mb-5">
                Encuentra tiendas, clubs y espacios de juego en todo Chile para competir y conectar.
              </p>
              <ComunidadesSearch initialQuery={params.q} initialCity={params.city} />
            </div>

            <div className="flex flex-row md:flex-col gap-2 min-w-0 md:min-w-[180px]">
              <div className="flex-1 p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)]">
                <p className="text-[10px] sm:text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Activas</p>
                <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                  {meta?.total ?? tenants.length}
                </p>
              </div>
              <div className="flex-1 p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)]">
                <p className="text-[10px] sm:text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Ciudades</p>
                <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                  {new Set(tenants.map(t => t.city).filter(Boolean)).size || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sort pills */}
      <div className="px-4 lg:px-6 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {sortOptions.map((opt) => (
            <a
              key={opt.key}
              href={buildUrl({ sort: opt.key, page: "1" })}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                sort === opt.key
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {opt.label}
            </a>
          ))}

          {meta?.total != null && (
            <Chip size="sm" className="bg-[var(--surface-secondary)] text-[var(--muted)] border-0 ml-auto shrink-0">
              {meta.total} resultados
            </Chip>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 lg:px-6 mb-12">
        {tenants.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map((tenant) => (
                <Link key={tenant.id} href={`/comunidades/${tenant.slug || tenant.id}`} className="block group">
                  <div className="surface-card rounded-[22px] overflow-hidden h-full transition-all group-hover:shadow-lg">
                    {/* Banner area — uses banner_url, logo_url as blur bg, or gradient fallback */}
                    <div className="h-24 relative overflow-hidden">
                      {tenant.banner_url ? (
                        <Image
                          src={tenant.banner_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : tenant.logo_url ? (
                        <Image
                          src={tenant.logo_url}
                          alt=""
                          fill
                          className="object-cover scale-[3] blur-2xl opacity-30"
                          sizes="33vw"
                        />
                      ) : null}
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(135deg, var(--accent)/20, var(--surface-secondary))" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
                    </div>

                    <div className="px-4 pb-4 -mt-8 relative z-10">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-xl border-[3px] border-[var(--bg-solid,#fff)] bg-[var(--surface-secondary)] overflow-hidden mb-3 shadow-lg">
                        {tenant.logo_url ? (
                          <Image
                            src={tenant.logo_url}
                            alt={tenant.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-black text-[var(--accent)] bg-[var(--surface-secondary)]">
                            {tenant.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <h3 className="font-bold text-[var(--foreground)] text-base truncate mb-0.5 group-hover:text-[var(--accent)] transition-colors">
                        {tenant.name}
                      </h3>

                      {tenant.city && (
                        <p className="text-xs text-[var(--muted)] mb-2 truncate">
                          📍 {tenant.city}{tenant.region ? `, ${tenant.region}` : ""}
                        </p>
                      )}

                      {tenant.description && (
                        <p className="text-xs text-[var(--muted)] line-clamp-2 mb-3 leading-relaxed">
                          {tenant.description}
                        </p>
                      )}

                      {/* Footer row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {tenant.rating != null && tenant.rating > 0 && (
                          <div className="flex items-center gap-1">
                            {renderStars(tenant.rating)}
                            <span className="text-[var(--muted)] text-[11px] font-semibold">
                              {tenant.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {tenant.is_public && (
                          <Chip size="sm" color="success" variant="soft" className="text-[10px] font-bold">
                            Activa
                          </Chip>
                        )}
                        {tenant.is_open && (
                          <Chip size="sm" color="accent" variant="soft" className="text-[10px] font-bold">
                            Abierta ahora
                          </Chip>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-10">
                <div className="flex items-center gap-4 py-3 px-6 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)]">
                  <a
                    href={page > 1 ? buildUrl({ page: String(page - 1) }) : "#"}
                    className={`text-sm font-semibold ${page <= 1 ? "text-[var(--muted)] pointer-events-none" : "text-[var(--foreground)] hover:text-[var(--accent)]"}`}
                  >
                    Anterior
                  </a>
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    {page} de {totalPages}
                  </span>
                  <a
                    href={page < totalPages ? buildUrl({ page: String(page + 1) }) : "#"}
                    className={`text-sm font-semibold ${page >= totalPages ? "text-[var(--muted)] pointer-events-none" : "text-[var(--foreground)] hover:text-[var(--accent)]"}`}
                  >
                    Siguiente
                  </a>
                </div>
              </div>
            )}
          </>
        ) : (
          <Card className="glass">
            <Card.Content className="py-16 text-center">
              <p className="text-4xl mb-4">🏪</p>
              <p className="text-lg font-medium text-[var(--foreground)]">
                No se encontraron comunidades
              </p>
              <p className="text-sm mt-1 text-[var(--muted)]">
                Intenta buscar con otros términos o explorar sin filtros.
              </p>
            </Card.Content>
          </Card>
        )}
      </div>
    </div>
  );
}
