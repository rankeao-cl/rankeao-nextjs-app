import GroupedSaleCard from "@/features/marketplace/GroupedSaleCard";
import GroupedSaleCardList from "@/features/marketplace/GroupedSaleCardList";
import { getListings } from "@/lib/api/marketplace";
import { getGames } from "@/lib/api/catalog";
import { groupListings } from "@/lib/utils/group-listings";
import type { CatalogGame } from "@/lib/types/catalog";
import MarketplaceFilters from "./MarketplaceFilters";
import MarketplaceSearch from "./MarketplaceSearch";
import ViewToggle, { GRID_ICON, LIST_ICON } from "@/components/ui/ViewToggle";
import ConditionFilterChips from "./ConditionFilterChips";
import type { Metadata } from "next";
import Link from "next/link";
import MarketplaceFavorites from "./MarketplaceFavorites";
import MarketplaceSubastas from "./MarketplaceSubastas";

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
    tab?: string;
  }>;
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = (await searchParams) ?? {};
  const activeTab = params.tab || "explorar";
  const page = Number(params.page || "1") || 1;
  const filters = {
    q: params.q,
    condition: params.condition,
    min_price: params.min_price ? Number(params.min_price) : undefined,
    max_price: params.max_price ? Number(params.max_price) : undefined,
    sort: params.sort || "newest",
    page,
    per_page: 30,
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
  const groupedCards = groupListings(listings);
  const meta = listingsData?.meta;
  const totalPages = meta?.total_pages ?? 1;
  const rawGames = gamesData?.data ?? gamesData?.games;
  const games: CatalogGame[] = Array.isArray(rawGames) ? rawGames : [];
  const viewMode = params.view || "grid";

  return (
    <div className="max-w-7xl mx-auto flex flex-col min-h-full">
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
            {/* Badge */}
            <span
              style={{
                display: "inline-block",
                backgroundColor: "var(--surface)",
                alignSelf: "flex-start",
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 999,
                marginBottom: 8,
                color: "var(--muted)",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Compra y venta
            </span>
            <h1
              style={{
                color: "var(--foreground)",
                fontSize: 22,
                fontWeight: 800,
                margin: 0,
                marginBottom: 4,
              }}
            >
              Marketplace TCG
            </h1>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 13,
                lineHeight: "18px",
                margin: 0,
              }}
            >
              Compra y vende cartas con jugadores de tu comunidad.
            </p>
          </div>
          <Link
            href="/marketplace/new"
            className="shrink-0"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "var(--accent)",
              borderRadius: 12,
              paddingLeft: 14,
              paddingRight: 14,
              paddingTop: 8,
              paddingBottom: 8,
              marginLeft: 12,
              alignSelf: "center",
              textDecoration: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>Vender</span>
          </Link>
        </div>
      </div>

      {/* ── Quick links ── */}
      <div className="mx-4 lg:mx-6 mb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { href: "/marketplace", label: "Explorar", active: activeTab === "explorar" },
          { href: "/marketplace?tab=favoritos", label: "Favoritos", active: activeTab === "favoritos" },
          { href: "/marketplace?tab=subastas", label: "Subastas", active: activeTab === "subastas" },
          { href: "/marketplace?category=accessories", label: "Accesorios", active: false },
          { href: "/marketplace/my-listings", label: "Mis publicaciones", active: false },
          { href: "/marketplace/offers", label: "Ofertas", active: false },
          { href: "/marketplace/orders", label: "Pedidos", active: false },
          { href: "/catalogo", label: "Catalogo de cartas", active: false },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
              textDecoration: "none",
              backgroundColor: link.active ? "var(--foreground)" : "var(--surface-solid)",
              color: link.active ? "var(--background)" : "var(--muted)",
              border: link.active ? "1px solid transparent" : "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {activeTab === "subastas" ? (
        <MarketplaceSubastas />
      ) : activeTab === "favoritos" ? (
        <MarketplaceFavorites />
      ) : (
      <>
      {/* ── Search + view toggle ── */}
      <div className="flex items-center gap-2 mx-4 lg:mx-6 mb-3">
        <div className="flex-1 min-w-0">
          <MarketplaceSearch initialQuery={params.q} />
        </div>
        <ViewToggle currentView={viewMode} options={[
                            { key: "grid", icon: GRID_ICON, ariaLabel: "Vista cuadricula" },
                            { key: "list", icon: LIST_ICON, ariaLabel: "Vista lista" },
                        ]} defaultView="grid" />
      </div>

      {/* ── Condition filters (mobile only) ── */}
      <div className="lg:hidden mx-4 mb-3">
        <div className="overflow-x-auto no-scrollbar">
          <ConditionFilterChips currentCondition={params.condition || ""} />
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex gap-6 mx-4 lg:mx-6 mb-12">
        {/* Desktop sidebar filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div
            className="sticky top-20 p-4 rounded-2xl"
            style={{
              backgroundColor: "var(--surface-solid)",
              border: "1px solid var(--border)",
            }}
          >
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

        {/* Listings */}
        <main className="flex-1 min-w-0">
          {groupedCards.length > 0 ? (
            <>
              {viewMode === "list" ? (
                <div className="flex flex-col gap-3">
                  {groupedCards.map((group) => (
                    <GroupedSaleCardList key={group.group_key} group={group} />
                  ))}
                </div>
              ) : (
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  }}
                >
                  {groupedCards.map((group) => (
                    <GroupedSaleCard key={group.group_key} group={group} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-10 mb-6">
                  <div
                    className="flex items-center gap-4 py-3 px-5 rounded-full"
                    style={{
                      backgroundColor: "var(--surface-solid)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {page > 1 ? (
                      <a
                        href={`?${buildQuery(params, { page: String(page - 1) })}`}
                        style={{ color: "var(--foreground)", fontSize: "13px", fontWeight: 600 }}
                      >
                        ← Anterior
                      </a>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: "13px", fontWeight: 600, opacity: 0.4 }}>
                        ← Anterior
                      </span>
                    )}
                    <span style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 600 }}>
                      {page} / {totalPages}
                    </span>
                    {page < totalPages ? (
                      <a
                        href={`?${buildQuery(params, { page: String(page + 1) })}`}
                        style={{ color: "var(--foreground)", fontSize: "13px", fontWeight: 600 }}
                      >
                        Siguiente →
                      </a>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: "13px", fontWeight: 600, opacity: 0.4 }}>
                        Siguiente →
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center py-12">
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "var(--surface-solid)" }}
              >
                <span className="text-3xl opacity-40">🏪</span>
              </div>
              <p style={{ color: "var(--foreground)", fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>
                No se encontraron publicaciones
              </p>
              <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                Intenta con otros filtros o busca otra carta
              </p>
            </div>
          )}
        </main>
      </div>
      </>
      )}
    </div>
  );
}

function buildQuery(current: Record<string, string | undefined>, overrides: Record<string, string>): string {
  const merged = { ...current, ...overrides };
  return Object.entries(merged)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join("&");
}
