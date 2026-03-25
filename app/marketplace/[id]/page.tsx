import { Button } from "@heroui/react";
import Link from "next/link";
import { getListingDetail, getListings } from "@/lib/api/marketplace";
import ListingDetailClient from "./ListingDetailClient";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    let title = "Detalle de publicacion";
    try {
        const listing = await getListingDetail(id);
        if (listing?.title && !(listing as any)?.error) title = listing.title;
    } catch { /* fallback */ }
    if (title === "Detalle de publicacion") {
        try {
            const listRes = await getListings({ per_page: 100 });
            const found = listRes.listings.find((l) => l.id === id);
            if (found?.title) title = found.title;
        } catch { /* fallback */ }
    }
    return { title };
}

export default async function ListingDetailPage({ params }: Props) {
    const { id } = await params;

    let listing: any = null;
    try {
        listing = await getListingDetail(id);
    } catch {
        // Detail endpoint failed — fallback: search in listings list
    }

    // Fallback: find the listing from the list endpoint
    if (!listing || listing.error) {
        try {
            const listRes = await getListings({ per_page: 100 });
            listing = listRes.listings.find((l) => l.id === id) ?? null;
        } catch {
            // both failed
        }
    }

    if (!listing || listing.error) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <p className="text-4xl mb-4">😕</p>
                <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Publicacion no encontrada</h1>
                <p className="text-sm text-[var(--muted)] mb-6">Es posible que haya sido eliminada o el enlace sea incorrecto.</p>
                <Link href="/marketplace">
                    <Button variant="secondary">Volver al marketplace</Button>
                </Link>
            </div>
        );
    }

    return <ListingDetailClient listing={listing} id={id} />;
}
