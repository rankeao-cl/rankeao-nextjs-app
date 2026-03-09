import { Card, Chip, Button } from "@heroui/react";
import Image from "next/image";
import type { Listing } from "@/lib/api";
import { ShoppingCart, MapPin } from "@gravity-ui/icons";
import { UserDisplayName } from "@/components/UserIdentity";

const conditionColors: Record<string, "success" | "warning" | "danger" | "default"> = {
    mint: "success",
    near_mint: "success",
    NM: "success",
    excellent: "warning",
    good: "warning",
    played: "danger",
    damaged: "danger",
};

export default function SaleCard({ listing }: { listing: Listing }) {
    const imageUrl = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url;
    const condition = listing.card_condition || "";

    return (
        <Card
            className="overflow-hidden transition-all duration-200 hover:scale-[1.01] group"
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
            }}
        >
            <Card.Content className="p-0">
                {/* Promoted badge */}
                <div
                    className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
                    style={{
                        background: "var(--accent)",
                        color: "var(--accent-foreground)",
                    }}
                >
                    Venta
                </div>

                {/* Image */}
                <div className="relative aspect-[4/5] w-full overflow-hidden" style={{ background: "var(--surface-secondary)" }}>
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={listing.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-3xl">🃏</div>
                    )}
                </div>

                {/* Content */}
                <div className="p-3 space-y-2">
                    <h3 className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                        {listing.title}
                    </h3>

                    {/* Price — prominent */}
                    {listing.price != null && (
                        <p className="text-lg font-extrabold" style={{ color: "var(--accent)" }}>
                            ${listing.price.toLocaleString("es-CL")}
                        </p>
                    )}

                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-1">
                        {listing.game_name && (
                            <Chip variant="secondary" size="sm">{listing.game_name}</Chip>
                        )}
                        {condition && (
                            <Chip
                                color={conditionColors[condition] || "default"}
                                variant="soft"
                                size="sm"
                            >
                                {condition}
                            </Chip>
                        )}
                        {listing.is_foil && (
                            <Chip color="warning" variant="soft" size="sm">✨ Foil</Chip>
                        )}
                    </div>

                    {/* Seller */}
                    <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
                        <UserDisplayName
                            user={{
                                name: listing.seller_username || listing.tenant_name || "Vendedor",
                                isStore: !!listing.tenant_name
                            }}
                        />
                        {(listing.city || listing.region) && (
                            <span className="flex items-center gap-0.5">
                                <MapPin className="size-3" />
                                {listing.city || listing.region}
                            </span>
                        )}
                    </div>

                    {/* CTA */}
                    <Button
                        size="sm"
                        variant="secondary"
                        className="w-full font-medium"
                    >
                        <ShoppingCart className="size-3.5" /> Ver en Marketplace
                    </Button>
                </div>
            </Card.Content>
        </Card>
    );
}
