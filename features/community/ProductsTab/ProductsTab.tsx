"use client";

import { useListings } from "@/lib/hooks/use-marketplace";
import SaleCard from "@/features/marketplace/SaleCard";
import { Button } from "@heroui/react/button";

import Link from "next/link";

interface Props {
    tenantSlug: string;
}

export default function ProductsTab({ tenantSlug }: Props) {
    const { data, isLoading } = useListings({ seller_type: "store", q: tenantSlug, per_page: 12 });
    const listings = data?.listings ?? [];

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Catálogo Destacado</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="aspect-[4/5] rounded-[22px] bg-[var(--surface-secondary)] animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Catálogo Destacado</h2>
                <Link href={`/marketplace?tenant=${tenantSlug}`}>
                    <Button size="sm" variant="primary" className="font-semibold bg-[var(--accent)] text-[var(--accent-foreground)]">
                        Ver todo el inventario &rarr;
                    </Button>
                </Link>
            </div>

            {listings.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {listings.map((listing) => (
                        <SaleCard key={listing.id} listing={listing} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-sm text-center">
                    <div className="size-16 bg-[var(--surface-tertiary)] rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">
                        📦
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Sin productos</h3>
                    <p className="text-[var(--muted)] max-w-sm">Esta comunidad aún no ha listado productos en el catálogo.</p>
                </div>
            )}
        </div>
    );
}
