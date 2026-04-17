import { getTenants, getTenant } from "@/lib/api/tenants";
import { getClans } from "@/lib/api/clans";
import type { Tenant } from "@/lib/types/tenant";
import type { Clan } from "@/lib/types/clan";
import type { Metadata } from "next";
import Link from "next/link";
import ComunidadesClient from "./ComunidadesClient";
import PageHero from "@/components/ui/PageHero";
import FilterPills from "@/components/ui/FilterPills";
import type { FilterPill } from "@/components/ui/FilterPills";

export const metadata: Metadata = {
  title: "Comunidades",
  description: "Explora tiendas, comunidades y clanes TCG activos en Rankeao.",
};

interface ComunidadesPageProps {
  searchParams?: Promise<{
    q?: string;
    city?: string;
    region?: string;
    min_rating?: string;
    sort?: string;
    page?: string;
    type?: string;
  }>;
}

export default async function ComunidadesPage({ searchParams }: ComunidadesPageProps) {
  const params = (await searchParams) ?? {};
  const activeType = params.type === "clanes" ? "clanes" : "tiendas";
  const page = Number(params.page || "1") || 1;
  const sort = params.sort || "rating-desc";

  // ── Fetch data based on active type ──
  let tenants: Tenant[] = [];
  let clans: Clan[] = [];
  let totalPages = 1;
  let tenantsLoadFailed = false;
  let clansLoadFailed = false;

  if (activeType === "clanes") {
    const [clansResult] = await Promise.allSettled([
      getClans({
        search: params.q,
        per_page: 30,
      }),
    ]);

    if (clansResult.status === "fulfilled") {
      const data = clansResult.value;
      const raw = data?.data?.clans ?? data?.clans ?? data?.data;
      clans = Array.isArray(raw) ? raw : [];
    } else {
      clansLoadFailed = true;
    }
  } else {
    const filters = {
      q: params.q,
      city: params.city,
      region: params.region,
      min_rating: params.min_rating ? Number(params.min_rating) : undefined,
      sort,
      page,
      per_page: 12,
    };

    const [tenantsResult] = await Promise.allSettled([getTenants(filters)]);
    let tenantsData;
    if (tenantsResult.status === "fulfilled") {
      const raw = tenantsResult.value;
      if (raw && typeof raw === "object" && "data" in raw) {
        const inner = (raw as Record<string, unknown>).data as Record<string, unknown> | undefined;
        tenantsData = {
          tenants: (inner?.tenants ?? (raw as Record<string, unknown>).tenants ?? []) as Tenant[],
          meta: (raw as Record<string, unknown>).meta as Record<string, number> | undefined,
        };
      } else {
        tenantsData = raw;
      }
    } else {
      tenantsLoadFailed = true;
    }

    const baseTenants = (tenantsData?.tenants ?? []) as Tenant[];
    const meta = tenantsData?.meta as Record<string, number> | undefined;
    totalPages = meta?.total_pages ?? 1;

    // Enrich tenants with detail data (banner_url, etc.) in parallel
    const enrichedResults = await Promise.allSettled(
      baseTenants.map(async (t) => {
        if (t.banner_url) return t;
        const detail = await getTenant(t.slug || t.id);
        if (detail?.tenant?.banner_url) {
          return { ...t, banner_url: detail.tenant.banner_url };
        }
        return t;
      })
    );

    tenants = enrichedResults.map((result, index) =>
      result.status === "fulfilled" ? result.value : baseTenants[index]
    );
    if (enrichedResults.some((result) => result.status === "rejected")) {
      tenantsLoadFailed = true;
    }
  }

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

  // Build sort URLs for server-side links (tiendas only)
  const sortOptions = [
    { key: "rating-desc", label: "Mejor valoradas" },
    { key: "newest", label: "Mas recientes" },
    { key: "name-asc", label: "A-Z" },
  ];
  const sortLinks = sortOptions.map((opt) => ({
    ...opt,
    href: buildUrl({ sort: opt.key, page: "1" }),
    active: sort === opt.key,
  }));

  const paginationPrev = page > 1 ? buildUrl({ page: String(page - 1) }) : null;
  const paginationNext = page < totalPages ? buildUrl({ page: String(page + 1) }) : null;

  const isTiendas = activeType === "tiendas";
  const isClanes = activeType === "clanes";
  const showLoadWarning = isClanes
    ? clansLoadFailed
    : tenantsLoadFailed;

  return (
    <div className="max-w-7xl mx-auto flex flex-col">
      {/* ── Hero header ── */}
      <PageHero
        badge={isTiendas ? "Directorio de tiendas" : "Equipos & Clanes"}
        title={isTiendas ? "Comunidades TCG" : "Clanes"}
        subtitle={
          isTiendas
            ? "Encuentra tiendas y espacios de juego en Chile."
            : "Unite a un clan, compite en grupo y representa a tu equipo."
        }
        action={
          isClanes ? (
            <Link
              href="/clanes/new"
              style={{
                display: "flex", flexDirection: "row", alignItems: "center", gap: 4,
                backgroundColor: "var(--accent)", borderRadius: 12,
                paddingLeft: 14, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
                marginLeft: 12, alignSelf: "center", textDecoration: "none", flexShrink: 0,
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--accent-foreground)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span style={{ color: "var(--accent-foreground)", fontSize: 12, fontWeight: 700 }}>Crear</span>
            </Link>
          ) : undefined
        }
      />

      {/* ── Segment control ── */}
      <div className="mx-4 lg:mx-6 mb-3">
        <FilterPills
          items={[
            { key: "tiendas", label: "Tiendas", href: "/comunidades" },
            { key: "clanes", label: "Clanes", href: "/comunidades?type=clanes" },
          ] satisfies FilterPill[]}
          activeKey={activeType}
        />
      </div>

      {showLoadWarning && (
        <div className="mx-4 lg:mx-6 mb-3 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">No pudimos cargar comunidades en este momento.</p>
          <p className="text-xs text-[var(--muted)]">Intenta recargar en unos segundos.</p>
        </div>
      )}

      <ComunidadesClient
        tenants={tenants}
        sortLinks={sortLinks}
        page={page}
        totalPages={totalPages}
        paginationPrev={paginationPrev}
        paginationNext={paginationNext}
        initialQuery={params.q}
        activeType={activeType}
        clans={clans}
      />
    </div>
  );
}
