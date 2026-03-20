import { getTenants, getTenant } from "@/lib/api/tenants";
import type { Tenant } from "@/lib/types/tenant";
import type { Metadata } from "next";
import ComunidadesClient from "./ComunidadesClient";

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

  // Build sort URLs for server-side links
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

  return (
    <div className="max-w-7xl mx-auto flex flex-col">
      {/* ── Hero header ── */}
      <div className="mx-4 lg:mx-6 mt-3 mb-[14px]">
        <div
          style={{
            backgroundColor: "#1A1A1E",
            border: "1px solid rgba(255,255,255,0.06)",
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
                backgroundColor: "rgba(255,255,255,0.06)",
                paddingLeft: 10, paddingRight: 10, paddingTop: 4, paddingBottom: 4,
                borderRadius: 999, marginBottom: 8,
                color: "#888891", fontSize: 11, fontWeight: 600,
              }}
            >
              Directorio de tiendas
            </span>
            <h1 style={{ color: "#F2F2F2", fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 4 }}>
              Comunidades TCG
            </h1>
            <p style={{ color: "#888891", fontSize: 13, lineHeight: "18px", margin: 0 }}>
              Encuentra tiendas y espacios de juego en Chile.
            </p>
          </div>
        </div>
      </div>

      <ComunidadesClient
        tenants={tenants}
        sortLinks={sortLinks}
        page={page}
        totalPages={totalPages}
        paginationPrev={paginationPrev}
        paginationNext={paginationNext}
        initialQuery={params.q}
      />
    </div>
  );
}
