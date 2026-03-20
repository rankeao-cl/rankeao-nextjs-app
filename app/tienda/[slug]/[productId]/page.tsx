import { Card, Chip, Button } from "@heroui/react";
import { getProductDetail } from "@/lib/api/store";
import { getTenant } from "@/lib/api/tenants";
import type { Product } from "@/lib/types/store";
import type { Tenant } from "@/lib/types/tenant";
import Link from "next/link";
import type { Metadata } from "next";
import AddToCartButton from "./AddToCartButton";

interface ProductDetailPageProps {
  params: Promise<{ slug: string; productId: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { productId } = await params;
  const res = await getProductDetail(productId).catch(() => null);
  const product = res?.product ?? res?.data ?? res;
  const name = product?.name ?? product?.title;
  return {
    title: name ? `${name} - Tienda` : "Detalle de Producto",
    description: product?.description ?? `Detalle del producto ${name ?? productId}.`,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug, productId } = await params;

  let productRes, tenantData;
  try {
    [productRes, tenantData] = await Promise.all([
      getProductDetail(productId).catch(() => null),
      getTenant(slug).catch(() => null),
    ]);
  } catch {
    // silent
  }

  const raw = productRes as Record<string, unknown> | null;
  const product: Product | undefined = (raw?.product ?? raw?.data ?? raw) as Product | undefined;
  const tenant: Tenant | undefined = tenantData?.tenant;

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col pt-4 px-4">
        <div className="py-20 flex justify-center">
          <Card className="max-w-md w-full border border-dashed border-[var(--border)] bg-transparent">
            <Card.Content className="py-12 text-center flex flex-col items-center">
              <span className="text-4xl block mb-4">&#128230;</span>
              <p className="text-[var(--foreground)] font-medium mb-1">Producto no encontrado</p>
              <p className="text-sm text-[var(--muted)]">
                No se pudo obtener la informacion de este producto.
              </p>
              <Link href={`/tienda/${slug}`} className="mt-4">
                <Button size="sm" variant="ghost">
                  Volver a la tienda
                </Button>
              </Link>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  const displayName = product.name ?? product.title ?? "Producto";
  const images = product.images ?? [];
  const variants = product.variants ?? [];
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const displayPrice = product.price ?? 0;

  return (
    <div className="max-w-7xl mx-auto flex flex-col pt-4">
      {/* Breadcrumb */}
      <nav className="px-4 lg:px-6 mb-4">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <Link href={`/tienda/${slug}`} className="hover:text-[var(--accent)] transition-colors">
            {tenant?.name ?? "Tienda"}
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">{displayName}</span>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex flex-col md:flex-row gap-6 px-4 lg:px-6 mb-12">
        {/* Left: Images */}
        <div className="w-full md:w-96 flex-shrink-0">
          <div className="sticky top-20">
            <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-black/20 aspect-square">
              {images.length > 0 ? (
                <img
                  src={images[0].url}
                  alt={displayName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-5xl text-[var(--muted)] opacity-30">&#128230;</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0"
                  >
                    <img
                      src={img.thumbnail_url ?? img.url}
                      alt={img.alt_text ?? `Imagen ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Product details */}
        <div className="flex-1 min-w-0">
          {/* Name & price */}
          <div className="glass-sm p-5 rounded-2xl mb-4">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">{displayName}</h1>

            <div className="flex items-baseline gap-3 mb-3">
              <p className="text-2xl font-bold text-[var(--foreground)]">
                ${displayPrice.toLocaleString("es-CL")}
              </p>
              {product.compare_at_price != null && product.compare_at_price > displayPrice && (
                <p className="text-sm text-[var(--muted)] line-through">
                  ${product.compare_at_price.toLocaleString("es-CL")}
                </p>
              )}
              {product.currency && (
                <span className="text-xs text-[var(--muted)]">{product.currency}</span>
              )}
            </div>

            {/* Condition & foil */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {product.card_condition && (
                <Chip size="sm" className="bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
                  {product.card_condition}
                </Chip>
              )}
              {product.is_foil && (
                <Chip size="sm" className="bg-yellow-400/10 text-yellow-400 border-0">
                  Foil
                </Chip>
              )}
              {product.category_name && (
                <Chip size="sm" className="bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
                  {product.category_name}
                </Chip>
              )}
            </div>

            {/* Stock */}
            {outOfStock ? (
              <div className="flex items-center gap-2 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm font-medium">Agotado</span>
              </div>
            ) : product.stock != null ? (
              <div className="flex items-center gap-2 text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm font-medium">
                  {product.stock <= 10 ? `${product.stock} disponibles` : "En stock"}
                </span>
              </div>
            ) : null}
          </div>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="glass-sm p-5 rounded-2xl mb-4">
              <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-3">
                Variantes
              </h2>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <div
                    key={v.id}
                    className="px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm"
                  >
                    <span className="font-medium text-[var(--foreground)]">{v.name}</span>
                    {v.price != null && (
                      <span className="text-xs text-[var(--muted)] ml-2">
                        ${v.price.toLocaleString("es-CL")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="glass-sm p-5 rounded-2xl mb-4">
              <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-3">
                Descripcion
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Add to cart */}
          {!outOfStock && (
            <div className="glass-sm p-5 rounded-2xl mb-4">
              <AddToCartButton
                slug={slug}
                productId={product.id}
                price={displayPrice}
                maxStock={product.stock ?? 99}
              />
            </div>
          )}

          {/* Store info */}
          {tenant && (
            <Link href={`/tienda/${slug}`}>
              <div className="glass-sm p-4 rounded-2xl flex items-center gap-3 hover:border-[var(--accent)] border border-[var(--border)] transition-colors">
                {tenant.logo_url ? (
                  <img
                    src={tenant.logo_url}
                    alt={tenant.name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface)] flex items-center justify-center">
                    <span className="text-sm font-bold text-[var(--muted)]">{tenant.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{tenant.name}</p>
                  {tenant.city && (
                    <p className="text-xs text-[var(--muted)]">{tenant.city}</p>
                  )}
                </div>
                <span className="text-[var(--muted)] text-sm">&rsaquo;</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
