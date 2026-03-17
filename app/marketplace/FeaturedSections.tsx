"use client";

import Link from "next/link";
import { Chip } from "@heroui/react";
import { SaleCard } from "@/components/cards";
import type { Listing } from "@/lib/types/marketplace";

interface FeaturedSectionsProps {
    listings: Listing[];
}

function HorizontalRow({
    title,
    badge,
    badgeColor,
    items,
    viewAllHref,
    renderBadge,
}: {
    title: string;
    badge?: string;
    badgeColor?: "accent" | "success" | "warning";
    items: Listing[];
    viewAllHref: string;
    renderBadge?: (listing: Listing) => React.ReactNode;
}) {
    if (items.length === 0) return null;

    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                    {title}
                    {badge && (
                        <Chip size="sm" color={badgeColor || "accent"} variant="soft" className="font-semibold">
                            {badge}
                        </Chip>
                    )}
                </h2>
                <Link
                    href={viewAllHref}
                    className="text-sm font-semibold text-[var(--accent)] hover:underline flex-shrink-0"
                >
                    Ver todos &rarr;
                </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
                {items.map((listing) => (
                    <div key={listing.id} className="flex-shrink-0 w-[200px] sm:w-[220px] relative">
                        {renderBadge?.(listing)}
                        <SaleCard listing={listing} />
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function FeaturedSections({ listings }: FeaturedSectionsProps) {
    // Featured / promoted listings (those with verified stores or high view counts)
    const featured = listings.filter(
        (l) => l.is_verified_store || l.is_verified_seller || (l.views_count && l.views_count > 10)
    ).slice(0, 10);

    // Newest listings sorted by created_at desc
    const newest = [...listings]
        .sort((a, b) => {
            const da = a.created_at ? new Date(a.created_at).getTime() : 0;
            const db = b.created_at ? new Date(b.created_at).getTime() : 0;
            return db - da;
        })
        .slice(0, 10);

    // Best offers (lowest price, excluding 0/null)
    const bestOffers = [...listings]
        .filter((l) => l.price != null && l.price > 0)
        .sort((a, b) => (a.price || 0) - (b.price || 0))
        .slice(0, 10);

    // If no listings at all, do not render sections
    if (listings.length === 0) return null;

    return (
        <div className="px-4 lg:px-6 mb-2">
            {/* Productos Destacados */}
            {featured.length > 0 && (
                <HorizontalRow
                    title="Productos Destacados"
                    items={featured}
                    viewAllHref="/marketplace?sort=popular"
                    renderBadge={() => (
                        <div
                            className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide pointer-events-none"
                            style={{
                                background: "var(--accent)",
                                color: "var(--accent-foreground)",
                            }}
                        >
                            Destacado
                        </div>
                    )}
                />
            )}

            {/* Recien Publicados */}
            {newest.length > 0 && (
                <HorizontalRow
                    title="Recien Publicados"
                    badge="Nuevo"
                    badgeColor="success"
                    items={newest}
                    viewAllHref="/marketplace?sort=newest"
                    renderBadge={() => (
                        <div
                            className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide pointer-events-none"
                            style={{
                                background: "var(--success)",
                                color: "var(--success-foreground)",
                            }}
                        >
                            Nuevo
                        </div>
                    )}
                />
            )}

            {/* Mejores Ofertas */}
            {bestOffers.length > 0 && (
                <HorizontalRow
                    title="Mejores Ofertas"
                    badge="Precio bajo"
                    badgeColor="warning"
                    items={bestOffers}
                    viewAllHref="/marketplace?sort=price-asc"
                    renderBadge={(listing) => (
                        <div
                            className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide pointer-events-none"
                            style={{
                                background: "var(--warning)",
                                color: "var(--warning-foreground)",
                            }}
                        >
                            ${listing.price?.toLocaleString("es-CL")}
                        </div>
                    )}
                />
            )}
        </div>
    );
}
