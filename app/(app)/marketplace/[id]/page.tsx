import { Button } from "@heroui/react/button";

import Link from "next/link";
import { getListingDetail, getListings, getCardListings } from "@/lib/api/marketplace";
import ListingDetailClient from "./ListingDetailClient";
import type { Listing, ListingDetail } from "@/lib/types/marketplace";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    let title = "Detalle de publicacion";
    try {
        const listing = await getListingDetail(id);
        if (listing?.title && !("error" in listing)) title = listing.title;
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

    let listing: (ListingDetail & Record<string, unknown>) | null = null;
    try {
        listing = await getListingDetail(id) as ListingDetail & Record<string, unknown>;
    } catch {
        // Detail endpoint failed — fallback: search in listings list
    }

    // Fallback: find the listing from the list endpoint
    if (!listing || "error" in listing) {
        try {
            const listRes = await getListings({ per_page: 100 });
            const found = listRes.listings.find((l) => l.id === id) ?? null;
            listing = found as ListingDetail & Record<string, unknown>;
        } catch {
            // both failed
        }
    }

    if (!listing || "error" in listing) {
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

    // Fetch other sellers for the same card via backend endpoint
    const cardId = listing.card_id;
    if (cardId && typeof cardId === "number") {
        try {
            const res = await getCardListings(cardId, { per_page: 20, sort: "price" });
            const otherSellers = (res.listings || []).filter((l: Listing) => l.id !== listing!.id);
            if (otherSellers.length > 0) {
                listing.similar_listings = otherSellers;
            }
        } catch {
            // silent — fall back to API's similar_listings
        }
    }

    return <ListingDetailClient listing={listing} id={id} />;
}
