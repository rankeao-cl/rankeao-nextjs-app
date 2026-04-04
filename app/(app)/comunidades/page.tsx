import { getTenants, getTenant } from "@/lib/api/tenants";
import { getClans } from "@/lib/api/clans";
import type { Tenant } from "@/lib/types/tenant";
import type { Clan } from "@/lib/types/clan";
import type { Metadata } from "next";
import ComunidadesClient from "./ComunidadesClient";

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

  if (activeType === "clanes") {
    try {
      const data = await getClans({
        search: params.q,
        per_page: 30,
      }).catch(() => null);
      const raw = (data as any)?.data?.clans ?? (data as any)?.clans ?? (data as any)?.data;
      clans = Array.isArray(raw) ? raw : [];
    } catch {
      // silent
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
    totalPages = meta?.total_pages ?? 1;

    // Enrich tenants with detail data (banner_url, etc.) in parallel
    tenants = await Promise.all(
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

  return (
    <div className="max-w-7xl mx-auto flex flex-col">
      {/* ── Hero header ── */}
      <div className="mx-4 lg:mx-6 mt-3 mb-[14px]">
        <div
          style={{
            backgroundColor: "var(--surface-solid)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 18,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 120,
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1 }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "var(--surface)",
                paddingLeft: 10, paddingRight: 10, paddingTop: 4, paddingBottom: 4,
                borderRadius: 999, marginBottom: 8,
                color: "var(--muted)", fontSize: 11, fontWeight: 600,
              }}
            >
              {isTiendas ? "Directorio de tiendas" : "Equipos & Clanes"}
            </span>
            <h1 style={{ color: "var(--foreground)", fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 4 }}>
              {isTiendas ? "Comunidades TCG" : "Clanes"}
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: "18px", margin: 0 }}>
              {isTiendas
                ? "Encuentra tiendas y espacios de juego en Chile."
                : "Unite a un clan, compite en grupo y representa a tu equipo."}
            </p>
          </div>
          {isClanes && (
            <a
              href="/clanes/new"
              style={{
                display: "flex", flexDirection: "row", alignItems: "center", gap: 4,
                backgroundColor: "var(--accent)", borderRadius: 12,
                paddingLeft: 14, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
                marginLeft: 12, alignSelf: "center", textDecoration: "none", flexShrink: 0,
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>Crear</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Segment control ── */}
      <div className="mx-4 lg:mx-6 mb-3 flex items-center gap-2">
        <a
          href="/comunidades"
          style={{
            padding: "8px 18px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            backgroundColor: isTiendas ? "var(--foreground)" : "var(--surface-solid)",
            color: isTiendas ? "var(--background)" : "var(--muted)",
            border: isTiendas ? "1px solid transparent" : "1px solid var(--border)",
          }}
        >
          Tiendas
        </a>
        <a
          href="/comunidades?type=clanes"
          style={{
            padding: "8px 18px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            backgroundColor: isClanes ? "var(--foreground)" : "var(--surface-solid)",
            color: isClanes ? "var(--background)" : "var(--muted)",
            border: isClanes ? "1px solid transparent" : "1px solid var(--border)",
          }}
        >
          Clanes
        </a>
      </div>

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
