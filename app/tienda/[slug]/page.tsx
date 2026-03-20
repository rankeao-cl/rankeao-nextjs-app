import { Card, Chip, Button } from "@heroui/react";
import { getTenantProducts, getCategories } from "@/lib/api/store";
import { getTenant } from "@/lib/api/tenants";
import type { Product } from "@/lib/types/store";
import type { Tenant } from "@/lib/types/tenant";
import Link from "next/link";
import type { Metadata } from "next";

interface TiendaPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    q?: string;
    category?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: TiendaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await getTenant(slug).catch(() => null);
  const tenant = res?.tenant;
  return {
    title: tenant?.name ? `${tenant.name} - Tienda` : "Tienda",
    description: tenant?.description ?? `Productos disponibles en ${tenant?.name ?? slug}.`,
  };
}

export default async function TiendaPage({ params, searchParams }: TiendaPageProps) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const query = sp.q?.trim();
  const page = Number(sp.page || "1") || 1;
  const categoryFilter = sp.category ?? "";

  let tenantData, productsData, categoriesData;
  try {
    [tenantData, productsData, categoriesData] = await Promise.all([
      getTenant(slug).catch(() => null),
      getTenantProducts(slug, {
        ...(query ? { q: query } : {}),
        ...(categoryFilter ? { category_id: categoryFilter } : {}),
        page,
        per_page: 24,
      }).catch(() => null),
      getCategories().catch(() => null),
    ]);
  } catch {
    // silent
  }

  const tenant: Tenant | undefined = tenantData?.tenant;
  const products: Product[] = productsData?.products ?? [];
  const meta = productsData?.meta;
  const totalPages = meta?.total_pages ?? 1;

  const rawCategories = (categoriesData as Record<string, unknown>)?.categories ??
    (categoriesData as Record<string, unknown>)?.data ?? [];
  const categories: { id: string; name: string; slug?: string }[] = Array.isArray(rawCategories)
    ? rawCategories
    : [];

  return (
    <div className="max-w-7xl mx-auto flex flex-col pt-4">
      {/* Store banner */}
      <section className="px-4 lg:px-6 mb-6">
        <div className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden">
          {tenant?.banner_url && (
            <div className="absolute inset-0">
              <img
                src={tenant.banner_url}
                alt=""
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            </div>
          )}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
            {tenant?.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[var(--border)]"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center border border-[var(--border)]">
                <span className="text-2xl font-bold text-[var(--muted)]">
                  {tenant?.name?.charAt(0) ?? "T"}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {tenant?.name ?? "Tienda"}
              </h1>
              {tenant?.description && (
                <p className="text-sm text-[var(--muted)] mt-1 max-w-lg line-clamp-2">
                  {tenant.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {tenant?.city && (
                  <span className="text-xs text-[var(--muted)]">{tenant.city}{tenant.region ? `, ${tenant.region}` : ""}</span>
                )}
                {tenant?.rating != null && (
                  <Chip size="sm" className="bg-yellow-400/10 text-yellow-400 border-0">
                    {tenant.rating.toFixed(1)} ({tenant.review_count ?? 0})
                  </Chip>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & filters */}
      <section className="px-4 lg:px-6 mb-6">
        <form
          method="get"
          action={`/tienda/${slug}`}
          className="flex gap-2 max-w-lg mb-4"
        >
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscar productos..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
          />
          {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
          <Button type="submit" variant="primary" size="sm" className="rounded-xl px-5">
            Buscar
          </Button>
        </form>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/tienda/${slug}${query ? `?q=${query}` : ""}`}>
              <Chip
                size="sm"
                className={`cursor-pointer px-3 ${!categoryFilter ? "bg-[var(--foreground)] text-[var(--surface)]" : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"}`}
              >
                Todos
              </Chip>
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/tienda/${slug}?category=${cat.id}${query ? `&q=${query}` : ""}`}
              >
                <Chip
                  size="sm"
                  className={`cursor-pointer px-3 ${categoryFilter === cat.id ? "bg-[var(--foreground)] text-[var(--surface)]" : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"}`}
                >
                  {cat.name}
                </Chip>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Product grid */}
      <section className="px-4 lg:px-6 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            Productos
            {meta?.total != null && (
              <Chip size="sm" className="bg-[var(--surface-secondary)] text-[var(--muted)] border-0">
                {meta.total.toLocaleString("es-CL")}
              </Chip>
            )}
          </h2>
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {products.map((product) => {
                const displayName = product.name ?? product.title ?? "Producto";
                const imageUrl = product.images?.[0]?.url;
                const outOfStock = product.stock !== undefined && product.stock <= 0;
                return (
                  <Link key={product.id} href={`/tienda/${slug}/${product.id}`}>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--accent)] transition-colors group cursor-pointer">
                      <div className="aspect-square bg-black/20 relative">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-3xl text-[var(--muted)] opacity-40">&#128230;</span>
                          </div>
                        )}
                        {outOfStock && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">Agotado</span>
                          </div>
                        )}
                        {product.is_foil && (
                          <div className="absolute top-2 right-2 bg-yellow-400/20 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Foil
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                          {displayName}
                        </p>
                        {product.card_condition && (
                          <p className="text-[10px] text-[var(--muted)] mt-0.5">
                            {product.card_condition}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm font-bold text-[var(--foreground)]">
                            {product.price != null
                              ? `$${product.price.toLocaleString("es-CL")}`
                              : "Consultar"}
                          </p>
                          {product.stock != null && product.stock > 0 && (
                            <span className="text-[10px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded font-semibold">
                              {product.stock <= 5 ? `${product.stock} disp.` : "En stock"}
                            </span>
                          )}
                        </div>
                        {product.compare_at_price != null && product.compare_at_price > (product.price ?? 0) && (
                          <p className="text-[10px] text-[var(--muted)] line-through">
                            ${product.compare_at_price.toLocaleString("es-CL")}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 mb-8">
                <div className="flex justify-center py-4 px-6 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] gap-4 items-center">
                  <Link
                    href={`/tienda/${slug}?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(categoryFilter ? { category: categoryFilter } : {}), page: String(page - 1) }).toString()}`}
                    className={page <= 1 ? "pointer-events-none opacity-40" : ""}
                  >
                    <Button size="sm" variant="ghost" isDisabled={page <= 1}>
                      Anterior
                    </Button>
                  </Link>
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    Pagina {page} de {totalPages}
                  </span>
                  <Link
                    href={`/tienda/${slug}?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(categoryFilter ? { category: categoryFilter } : {}), page: String(page + 1) }).toString()}`}
                    className={page >= totalPages ? "pointer-events-none opacity-40" : ""}
                  >
                    <Button size="sm" variant="ghost" isDisabled={page >= totalPages}>
                      Siguiente
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 flex justify-center">
            <Card className="max-w-md w-full border border-dashed border-[var(--border)] bg-transparent">
              <Card.Content className="py-12 text-center flex flex-col items-center">
                <span className="text-4xl block mb-4">&#128230;</span>
                <p className="text-[var(--foreground)] font-medium mb-1">No se encontraron productos</p>
                <p className="text-sm text-[var(--muted)]">
                  Intenta con otra busqueda o categoria.
                </p>
              </Card.Content>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
