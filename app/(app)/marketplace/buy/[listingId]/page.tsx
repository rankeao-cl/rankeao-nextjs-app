import type { Metadata } from "next";
import { Button } from "@heroui/react/button";
import Link from "next/link";

import { getListingDetail, getListings } from "@/lib/api/marketplace";
import type { ListingDetail } from "@/lib/types/marketplace";
import CheckoutClient from "./CheckoutClient";

interface Props {
    params: Promise<{ listingId: string }>;
}

export const metadata: Metadata = {
    title: "Checkout",
    description: "Finaliza tu compra en el marketplace de Rankeao.",
    robots: { index: false, follow: false },
};

// Server component: prefetch del listing para evitar flash inicial.
// Si el detalle falla, hacemos fallback a buscar el listing en el listado general.
export default async function CheckoutRoutePage({ params }: Props) {
    const { listingId } = await params;

    let listing: (ListingDetail & Record<string, unknown>) | null = null;

    try {
        listing = (await getListingDetail(listingId)) as ListingDetail & Record<string, unknown>;
    } catch {
        // fallback abajo
    }

    if (!listing || "error" in listing) {
        try {
            const listRes = await getListings({ per_page: 100 });
            const found = listRes.listings.find((l) => l.id === listingId);
            if (found) listing = found as ListingDetail & Record<string, unknown>;
        } catch {
            // deja null
        }
    }

    if (!listing || "error" in listing) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <h1 className="text-xl font-bold text-foreground mb-2">Publicacion no encontrada</h1>
                <p className="text-sm text-muted mb-6">
                    Es posible que haya sido eliminada o el enlace sea incorrecto.
                </p>
                <Link href="/marketplace">
                    <Button variant="secondary">Volver al marketplace</Button>
                </Link>
            </div>
        );
    }

    return <CheckoutClient listingId={listingId} listing={listing} />;
}
