import { Card, Chip, Button, Avatar } from "@heroui/react";
import Image from "next/image";
import type { Listing } from "@/lib/types/marketplace";
import { MapPin } from "@gravity-ui/icons";

const conditionColors: Record<string, "success" | "warning" | "danger" | "default"> = {
    mint: "success",
    near_mint: "success",
    NM: "success",
    M: "success",
    excellent: "warning",
    good: "warning",
    LP: "warning",
    MP: "warning",
    played: "danger",
    HP: "danger",
    damaged: "danger",
    DMG: "danger",
};

export default function SaleCard({ listing }: { listing: Listing }) {
    const imageUrl = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url;
    const condition = listing.card_condition || "";
    const sellerName = listing.seller_username || listing.tenant_name || "Vendedor";
    const isStore = !!listing.tenant_name;

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
                        {listing.set_name && (
                            <Chip variant="secondary" size="sm">{listing.set_name}</Chip>
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
                        {listing.rarity && (
                            <Chip variant="soft" size="sm">{listing.rarity}</Chip>
                        )}
                        {listing.is_foil && (
                            <Chip color="warning" variant="soft" size="sm">✨ Foil</Chip>
                        )}
                    </div>

                    {/* Seller */}
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                        <Avatar size="sm" className="w-5 h-5">
                            {listing.seller_avatar_url ? (
                                <Avatar.Image src={listing.seller_avatar_url} />
                            ) : null}
                            <Avatar.Fallback className="text-[8px]">
                                {sellerName[0]?.toUpperCase()}
                            </Avatar.Fallback>
                        </Avatar>
                        <span className="truncate flex-1 font-medium">
                            {sellerName}
                        </span>
                        {(isStore || listing.is_verified_store) && (
                            <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                                style={{
                                    background: "var(--success)",
                                    color: "var(--success-foreground)",
                                }}
                            >
                                ✓ Tienda
                            </span>
                        )}
                    </div>

                    {/* Location */}
                    {(listing.city || listing.region) && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                            <MapPin className="size-3" />
                            <span>{listing.city || listing.region}</span>
                        </div>
                    )}

                    {/* CTA */}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="flex-1 font-medium"
                            style={{
                                background: "var(--accent)",
                                color: "var(--accent-foreground)",
                            }}
                        >
                            Contactar
                        </Button>
                        <Button
                            size="sm"
                            variant="tertiary"
                            className="font-medium"
                        >
                            Detalle
                        </Button>
                    </div>
                </div>
            </Card.Content>
        </Card>
    );
}
