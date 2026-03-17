"use client";

import { Card } from "@heroui/react";
import SaleCard from "@/components/cards/SaleCard";
import type { Listing } from "@/lib/types/marketplace";

export default function ProfileMarketplaceTab({
    listings,
}: {
    listings: Listing[];
}) {
    if (listings.length === 0) {
        return (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="py-14 text-center">
                    <p className="text-3xl mb-3 opacity-50">🏪</p>
                    <p className="text-sm font-medium text-[var(--foreground)]">Sin productos en venta</p>
                    <p className="text-xs mt-1 text-[var(--muted)]">No tiene productos en venta actualmente.</p>
                </Card.Content>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
                {listings.length} producto{listings.length !== 1 ? "s" : ""} en venta
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map((item, i) => (
                    <SaleCard key={item.id || i} listing={item} />
                ))}
            </div>
        </div>
    );
}
