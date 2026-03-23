"use client";

import SaleCard from "@/components/cards/SaleCard";
import type { Listing } from "@/lib/types/marketplace";

export default function ProfileMarketplaceTab({
    listings,
}: {
    listings: Listing[];
}) {
    if (listings.length === 0) {
        return (
            <div className="bg-surface-solid border border-border rounded-2xl text-center" style={{ padding: "56px 16px" }}>
                <p style={{ fontSize: 24, marginBottom: 12, opacity: 0.5 }}>🏪</p>
                <p className="text-foreground" style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Sin productos en venta</p>
                <p className="text-muted" style={{ fontSize: 12, marginTop: 4, margin: 0 }}>No tiene productos en venta actualmente.</p>
            </div>
        );
    }

    return (
        <div>
            <p className="text-muted" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                {listings.length} producto{listings.length !== 1 ? "s" : ""} en venta
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {listings.map((item, i) => (
                    <SaleCard key={item.id || i} listing={item} />
                ))}
            </div>
        </div>
    );
}
