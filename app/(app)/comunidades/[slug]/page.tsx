
import { getTenant } from "@/lib/api/tenants";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button, Chip, Tabs, Tooltip } from "@heroui/react";
import { MapPin, Persons, Plus, Envelope, ShieldCheck } from "@gravity-ui/icons";
// TODO: descomentar cuando el backend implemente los endpoints
// import MemberDirectory from "./MemberDirectory";
// import InternalFeed from "./InternalFeed";
import RulesModal from "./RulesModal";
import ProductsTab from "./ProductsTab";
import TournamentsTab from "./TournamentsTab";
import ReviewsTab from "./ReviewsTab";
import type { Tenant } from "@/lib/types/tenant";

// Extend Tenant type for extra fields from API
type ExtendedTenant = Tenant & {
    type?: string;
    verified?: boolean;
    game_name?: string;
};

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ [key: string]: string | undefined }>;
}

const PLATFORMS = [
    {
        id: "instagram",
        name: "Instagram",
        color: "var(--accent)", // Use accent color for all platforms for consistency
        gradient: "from-[var(--accent)] via-[var(--accent)] to-[var(--accent)]",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
        ),
    },
    {
        id: "facebook",
        name: "Facebook",
        color: "var(--accent)",
        gradient: "from-[var(--accent)] to-[var(--accent)]",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
    },
    {
        id: "tiktok",
        name: "TikTok",
        color: "var(--accent)",
        gradient: "from-[var(--accent)] via-[var(--accent)] to-[var(--accent)]",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
        ),
    },
    {
        id: "twitter",
        name: "TWITTER",
        color: "var(--accent)",
        gradient: "from-[var(--accent)] to-[var(--accent)]",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        id: "youtube",
        name: "YOUTUBE",
        color: "var(--accent)",
        gradient: "from-[var(--accent)] to-[var(--accent)]",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
    },
];


export async function generateMetadata({ params }: PageProps) {
    const resolvedParams = await params;
    const data = await getTenant(resolvedParams.slug).catch(() => null);

    if (!data?.tenant) return { title: "Comunidad no encontrada" };

    return {
        title: `${data.tenant.name} | Rankeao`,
        description: data.tenant.description || `Comunidad de ${data.tenant.name} en Rankeao.`,
    };
}

export default async function StorePage({ params }: PageProps) {
    const resolvedParams = await params;
    const storeSlug = resolvedParams.slug;

    // First fetch tenant to get the ID if needed later
    const tenantData = await getTenant(storeSlug).catch(() => null);

    if (!tenantData?.tenant) {
        notFound();
    }
    const tenant: ExtendedTenant = tenantData.tenant;

    // TODO: members y posts cuando el backend implemente los endpoints

    // Temporary placeholder for 'type' since API currently doesn't return it
    const tenantType = tenant.type || "store";

    // Format rating
    const rating = (tenant.avg_rating ?? tenant.rating) ? (tenant.avg_rating ?? tenant.rating)!.toFixed(1) : "N/A";
    const reviewCount = tenant.review_count || 0;

    return (
        <div className="flex flex-col w-full min-h-screen bg-[var(--background)] pb-20">
            {/* Banner Section */}
            <div className="relative w-full h-52 md:h-72 lg:h-96 overflow-hidden">
                {tenant.banner_url ? (
                    <Image
                        src={tenant.banner_url}
                        alt={`Banner de ${tenant.name}`}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    // Fallback solid pattern if no image
                    <div className="absolute inset-0 bg-[var(--surface-tertiary)]" />
                )}
                {/* Overlay for text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-black/20" />
            </div>

            {/* Main Content Container */}
            <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full relative -mt-24 sm:-mt-32 z-10">
                {/* Profile Card */}
                <div className="bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
                        {/* Logo */}
                        <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] bg-[var(--surface-secondary)] border-4 border-[var(--surface)] overflow-hidden flex-shrink-0 shadow-lg -mt-16 sm:-mt-20 z-20">
                            {tenant.logo_url ? (
                                <Image
                                    src={tenant.logo_url}
                                    alt={`Logo de ${tenant.name}`}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full text-5xl bg-[var(--surface-tertiary)]">
                                    {tenantType === 'store' ? '🏪' : '🎮'}
                                </div>
                            )}
                        </div>

                        {/* Title & Badges */}
                        <div className="flex-1 flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
                                    {tenant.name}
                                </h1>
                                <div className="flex flex-wrap gap-2">
                                    {tenantType === 'store' && (
                                        <Chip
                                            size="sm"
                                            className="font-bold border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm rounded-full"
                                        >
                                            <Chip.Label className="flex items-center gap-1">
                                                ★ {rating} <span className="opacity-70 font-normal">({reviewCount})</span>
                                            </Chip.Label>
                                        </Chip>
                                    )}
                                    {tenant.verified && (
                                        <Chip
                                            size="sm"
                                            className="font-bold border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm px-2 rounded-full"
                                        >
                                            <Chip.Label className="flex items-center gap-1">
                                                <ShieldCheck className="size-3.5" /> Verificada
                                            </Chip.Label>
                                        </Chip>
                                    )}
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)] font-medium">
                                {tenant.game_name && (
                                    <span className="flex items-center gap-1.5 bg-[var(--accent)]/10 text-[var(--accent)] px-2.5 py-1 rounded-full border border-[var(--accent)]/20 shadow-sm font-bold">
                                        <span className="text-base leading-none">🎮</span>
                                        {tenant.game_name}
                                    </span>
                                )}
                                {(tenant.city || tenant.region) && (
                                    <span className="flex items-center gap-1.5 bg-[var(--surface-sunken)] px-2.5 py-1 rounded-full border border-[var(--border)]">
                                        <MapPin className="size-4" />
                                        {tenant.city}{tenant.city && tenant.region ? ", " : ""}{tenant.region}
                                    </span>
                                )}
                                {tenant.is_public && (
                                    <span className="flex items-center gap-1.5 bg-[var(--success)]/10 text-[var(--success)] px-2.5 py-1 rounded-full border border-[var(--success)]/20">
                                        <Persons className="size-4" />
                                        Comunidad Pública
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                            <Button
                                variant="primary"
                                className="bg-[var(--accent)] text-[var(--accent-foreground)] font-bold flex-1 sm:flex-none shadow-lg shadow-[var(--accent)]/30 hover:shadow-[var(--accent)]/50 transition-all hover:-translate-y-0.5"
                            >
                                <span className="flex items-center gap-2"><Plus className="size-4" /> Seguir</span>
                            </Button>
                            <Link href={`mailto:contacto@${tenant.slug}.cl`} className="flex-1 sm:flex-none">
                                <Button
                                    variant="outline"
                                    className="font-semibold w-full border-[var(--border)] hover:bg-[var(--surface-secondary)] hover:border-[var(--border-hover)] transition-all"
                                >
                                    <span className="flex items-center gap-2"><Envelope className="size-4" /> Contactar</span>
                                </Button>
                            </Link>

                            {tenant.rules && (
                                <div className="flex-1 sm:flex-none">
                                    <RulesModal rules={tenant.rules} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description & Socials Frame */}
                    {tenant.description && (
                        <div className="flex flex-col gap-3 mt-2">
                            <div className="bg-[var(--surface-sunken)]/50 p-4 rounded-xl border border-[var(--border)]">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">
                                    Acerca de la comunidad
                                </h3>
                                <p className="text-[var(--foreground)]/90 leading-relaxed text-sm">
                                    {tenant.description}
                                </p>

                                <div className="mt-4 flex flex-col gap-2.5 border-t border-[var(--border)] pt-4">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Redes Sociales</span>
                                    <div className="flex flex-wrap gap-2">
                                        {tenant.social_links?.map((link) => {
                                            const platformId = link.platform.toLowerCase();
                                            const platform = PLATFORMS.find(
                                                (p) => p.id === platformId || p.name.toLowerCase() === platformId
                                            );
                                            return (
                                                <Tooltip
                                                    key={link.platform}
                                                    closeDelay={0}
                                                >
                                                    <Tooltip.Trigger>
                                                        <Link
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="group relative flex items-center justify-center size-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                                                            style={{ "--hover-color": platform?.color } as React.CSSProperties}
                                                        >
                                                            {/* Glow effect */}
                                                            <div
                                                                className="absolute inset-0 rounded-lg bg-current opacity-0 group-hover:opacity-15 transition-opacity duration-300 pointer-events-none"
                                                                style={{ color: platform?.color }}
                                                            />
                                                            {/* Icon */}
                                                            <span
                                                                className="relative z-10 text-[var(--muted)] transition-colors duration-300 group-hover:text-[var(--hover-color)]"
                                                            >
                                                                {platform?.icon || (
                                                                    <span className="text-[10px] font-bold">{link.platform.substring(0, 2).toUpperCase()}</span>
                                                                )}
                                                            </span>
                                                        </Link>
                                                    </Tooltip.Trigger>
                                                    <Tooltip.Content offset={8}>
                                                        <p className="text-xs font-medium">{platform?.name || link.platform}</p>
                                                    </Tooltip.Content>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs Content Navigation */}
                <div className="mt-8">
                    <Tabs
                        variant="secondary"
                        className="w-full relative"
                    >
                        <Tabs.ListContainer>
                            <Tabs.List aria-label="Navegación de Comunidad" className="w-full relative border-b border-[var(--border)] pb-0 rounded-none bg-transparent">
                                {tenantType === 'store' && (
                                    <Tabs.Tab id="products">
                                        <div className="flex items-center gap-2">🛒 <span>Productos</span></div>
                                        <Tabs.Indicator className="bg-[var(--accent)]" />
                                    </Tabs.Tab>
                                )}
                                <Tabs.Tab id="tournaments">
                                    <div className="flex items-center gap-2">⚔️ <span>Torneos</span></div>
                                    <Tabs.Indicator className="bg-[var(--accent)]" />
                                </Tabs.Tab>
                                {/* TODO: Habilitar cuando el backend implemente GET /tenants/:slug/members */}
                                {/* <Tabs.Tab id="members">
                                    <div className="flex items-center gap-2">👥 <span>Miembros</span></div>
                                    <Tabs.Indicator className="bg-[var(--accent)]" />
                                </Tabs.Tab> */}
                                {/* TODO: Habilitar cuando el backend implemente GET /tenants/:slug/feed o /social/feed?tenant_id */}
                                {/* <Tabs.Tab id="posts">
                                    <div className="flex items-center gap-2">📰 <span>Publicaciones</span></div>
                                    <Tabs.Indicator className="bg-[var(--accent)]" />
                                </Tabs.Tab> */}
                                {tenantType === 'store' && (
                                    <Tabs.Tab id="reviews">
                                        <div className="flex items-center gap-2">⭐ <span>Reseñas</span></div>
                                        <Tabs.Indicator className="bg-[var(--accent)]" />
                                    </Tabs.Tab>
                                )}
                            </Tabs.List>
                        </Tabs.ListContainer>

                        {tenantType === 'store' && (
                            <Tabs.Panel id="products">
                                <ProductsTab tenantSlug={storeSlug} />
                            </Tabs.Panel>
                        )}

                        <Tabs.Panel id="tournaments">
                            <TournamentsTab tenantSlug={storeSlug} />
                        </Tabs.Panel>

                        {/* TODO: Habilitar cuando el backend implemente los endpoints */}
                        {/* <Tabs.Panel id="members">
                            <MemberDirectory members={members} />
                        </Tabs.Panel>

                        <Tabs.Panel id="posts">
                            <InternalFeed posts={posts} />
                        </Tabs.Panel> */}

                        {tenantType === 'store' && (
                            <Tabs.Panel id="reviews">
                                <ReviewsTab tenantSlug={storeSlug} tenantName={tenant.name} />
                            </Tabs.Panel>
                        )}
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
