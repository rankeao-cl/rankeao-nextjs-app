import { getTenant, getProducts, getTournaments } from "@/lib/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button, Chip, Tabs } from "@heroui/react";
import { MapPin, Persons, Plus, Envelope, ShieldCheck } from "@gravity-ui/icons";
import { SaleCard, TournamentCard } from "@/components/cards";

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata({ params }: PageProps) {
    const resolvedParams = await params;
    const data = await getTenant(resolvedParams.id).catch(() => null);

    if (!data?.tenant) return { title: "Comunidad no encontrada" };

    return {
        title: `${data.tenant.name} | Rankeao`,
        description: data.tenant.description || `Comunidad de ${data.tenant.name} en Rankeao.`,
    };
}

export default async function StorePage({ params }: PageProps) {
    const resolvedParams = await params;
    const storeId = resolvedParams.id;

    const [tenantData, productsData, tournamentsData] = await Promise.all([
        getTenant(storeId).catch(() => null),
        getProducts({ tenant: storeId, per_page: 8 }).catch(() => null),
        getTournaments({ q: storeId, per_page: 4 }).catch(() => null),
    ]);

    if (!tenantData?.tenant) {
        notFound();
    }

    const { tenant } = tenantData;
    const products = productsData?.products || [];
    const tournaments = tournamentsData?.tournaments || [];

    // Temporary placeholder for 'type' since API currently doesn't return it
    const tenantType = (tenant as any).type || "store";

    // Format rating
    const rating = tenant.rating ? tenant.rating.toFixed(1) : "N/A";
    const reviewCount = tenant.review_count || 0;

    return (
        <div className="flex flex-col w-full">
            {/* Banner & Header section */}
            <div className="relative w-full h-48 md:h-64 lg:h-80 bg-[var(--surface-secondary)] overflow-hidden">
                {tenant.banner_url ? (
                    <Image
                        src={tenant.banner_url}
                        alt={`Banner de ${tenant.name}`}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-tertiary)] to-[var(--surface-secondary)] opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent opacity-80" />
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full relative -mt-16 sm:-mt-24 mb-12">
                <div className="flex flex-col sm:flex-row gap-6 sm:items-end">
                    {/* Logo */}
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-[var(--surface)] border-4 border-[var(--background)] overflow-hidden flex-shrink-0 shadow-xl">
                        {tenant.logo_url ? (
                            <Image
                                src={tenant.logo_url}
                                alt={`Logo de ${tenant.name}`}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-4xl">
                                {tenantType === 'store' ? '🏪' : '🎮'}
                            </div>
                        )}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 pb-2">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)]">{tenant.name}</h1>
                                {tenantType === 'store' && (
                                    <Chip size="sm" variant="soft" className="font-bold border-none bg-orange-500/10 text-orange-500">
                                        ★ {rating} <span className="opacity-70 font-normal ml-0.5">({reviewCount})</span>
                                    </Chip>
                                )}
                                {(tenant as any).verified && (
                                    <Chip size="sm" variant="soft" className="font-bold border-none bg-blue-500/10 text-blue-500 px-2">
                                        <div className="flex items-center gap-1">
                                            <ShieldCheck className="size-3" /> Verificada
                                        </div>
                                    </Chip>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)] font-medium">
                                {(tenant.city || tenant.region) && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="size-4" />
                                        {tenant.city}{tenant.city && tenant.region ? ", " : ""}{tenant.region}
                                    </span>
                                )}
                                {tenant.is_public && (
                                    <span className="flex items-center gap-1 text-[var(--success)]">
                                        <Persons className="size-4" />
                                        Comunidad Pública
                                    </span>
                                )}
                            </div>
                        </div>
                        {tenant.description && (
                            <div className="mt-3 text-sm text-[var(--muted)] max-w-2xl bg-[var(--surface-secondary)] p-3 rounded-xl border border-[var(--border)]">
                                <strong>Acerca de la comunidad:</strong>
                                <p className="mt-1 line-clamp-3">{tenant.description}</p>
                                {/* Placeholder for Expandable Rules Modal/Popover */}
                                <Button size="sm" variant="tertiary" className="p-0 h-auto mt-2 text-[var(--accent)] font-semibold border-none">
                                    Ver Reglas Internas
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row sm:flex-col gap-3 pb-2 w-full sm:w-auto mt-4 sm:mt-0">
                        <Button
                            variant="primary"
                            className="bg-[var(--accent)] text-white font-bold flex-1 sm:flex-none shadow-lg shadow-[var(--accent)]/20"
                        >
                            <div className="flex items-center gap-2"><Plus className="size-4" /> Seguir</div>
                        </Button>
                        <Link href={`mailto:contacto@${tenant.slug}.cl`} className="flex-1 sm:flex-none">
                            <Button
                                variant="outline"
                                className="font-medium w-full border-[var(--border)]"
                            >
                                <div className="flex items-center gap-2"><Envelope className="size-4" /> Contactar</div>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Tabs Content Navigation */}
                <div className="mt-10">
                    <Tabs
                        variant="secondary"
                        className="w-full"
                    >
                        <Tabs.ListContainer>
                            <Tabs.List aria-label="Navegación de Comunidad">
                                {tenantType === 'store' && (
                                    <Tabs.Tab id="products">
                                        🛒 Productos
                                        <Tabs.Indicator />
                                    </Tabs.Tab>
                                )}
                                <Tabs.Tab id="tournaments">
                                    ⚔️ Torneos
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="members">
                                    👥 Miembros
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="posts">
                                    📰 Publicaciones
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                {tenantType === 'store' && (
                                    <Tabs.Tab id="reviews">
                                        ⭐ Reseñas
                                        <Tabs.Indicator />
                                    </Tabs.Tab>
                                )}
                            </Tabs.List>
                        </Tabs.ListContainer>

                        {tenantType === 'store' && (
                            <Tabs.Panel id="products">
                                <div className="flex flex-col gap-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold">Catálogo</h2>
                                        <Link href={`/marketplace?tenant=${storeId}`}>
                                            <Button size="sm" variant="primary">
                                                Ver todo el inventario &rarr;
                                            </Button>
                                        </Link>
                                    </div>

                                    {products.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {products.map(product => {
                                                const productListing = { ...product, title: product.title || product.name || '' };
                                                return <SaleCard key={product.id} listing={productListing} />;
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 bg-[var(--surface-secondary)] border border-dashed border-[var(--border)] rounded-2xl">
                                            <p className="text-[var(--muted)]">No hay productos disponibles actualmente.</p>
                                        </div>
                                    )}
                                </div>
                            </Tabs.Panel>
                        )}

                        <Tabs.Panel id="tournaments">
                            <div className="flex flex-col gap-6">
                                <h2 className="text-xl font-bold">Eventos Oficiales</h2>

                                {tournaments.length > 0 ? (
                                    <div className="flex flex-col gap-4 max-w-4xl">
                                        {tournaments.map(tournament => (
                                            <TournamentCard key={tournament.id} tournament={tournament} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-[var(--surface-secondary)] border border-dashed border-[var(--border)] rounded-2xl">
                                        <p className="text-[var(--muted)]">No hay torneos programados.</p>
                                    </div>
                                )}
                            </div>
                        </Tabs.Panel>

                        <Tabs.Panel id="members">
                            <div className="flex flex-col gap-6">
                                <h2 className="text-xl font-bold">Directorio de Miembros</h2>
                                <p className="text-[var(--muted)]">Roles y personal de la comunidad.</p>
                                <div className="text-center py-16 bg-[var(--surface-secondary)] border border-dashed border-[var(--border)] rounded-2xl max-w-4xl">
                                    <div className="text-4xl mb-4">👑</div>
                                    <h3 className="text-lg font-bold mb-2">(MVP) Sin Integración API</h3>
                                    <p className="text-[var(--muted)]">Pronto podrás visualizar Owner, Staff, Moderadores y Miembros Regulares cuando se implemente en el backend.</p>
                                </div>
                            </div>
                        </Tabs.Panel>

                        <Tabs.Panel id="posts">
                            <div className="text-center py-16 bg-[var(--surface-secondary)] border border-dashed border-[var(--border)] rounded-2xl max-w-4xl">
                                <div className="text-4xl mb-4">📰</div>
                                <h3 className="text-lg font-bold mb-2">Sección en Construcción</h3>
                                <p className="text-[var(--muted)]">Pronto podrás ver las noticias y publicaciones de la comunidad aquí.</p>
                            </div>
                        </Tabs.Panel>

                        {tenantType === 'store' && (
                            <Tabs.Panel id="reviews">
                                <div className="text-center py-16 bg-[var(--surface-secondary)] border border-dashed border-[var(--border)] rounded-2xl max-w-4xl">
                                    <div className="text-4xl mb-4">⭐</div>
                                    <h3 className="text-lg font-bold mb-2">Sección en Construcción</h3>
                                    <p className="text-[var(--muted)]">Pronto podrás leer y dejar opiniones sobre {tenant.name}.</p>
                                </div>
                            </Tabs.Panel>
                        )}

                    </Tabs>
                </div>
            </div>
        </div>
    );
}
