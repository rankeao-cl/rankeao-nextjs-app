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
            <div style={{
                backgroundColor: "#1A1A1E",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: "56px 16px",
                textAlign: "center",
            }}>
                <p style={{ fontSize: 24, marginBottom: 12, opacity: 0.5 }}>🏪</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#F2F2F2", margin: 0 }}>Sin productos en venta</p>
                <p style={{ fontSize: 12, color: "#888891", marginTop: 4, margin: 0 }}>No tiene productos en venta actualmente.</p>
            </div>
        );
    }

    return (
        <div>
            <p style={{ fontSize: 12, color: "#888891", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
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
