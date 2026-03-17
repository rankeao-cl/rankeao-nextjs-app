import { Card, Chip, Avatar } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types/marketplace";
import { MapPin } from "@gravity-ui/icons";
import SaleCardActions from "./SaleCardActions";

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
    const imageUrl = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url || listing.card_image_url;
    const condition = listing.card_condition || "";
    const sellerName = listing.seller_username || listing.tenant_name || "Vendedor";
    const isStore = !!listing.tenant_name;

    return (
        <Card className="surface-card rounded-[22px] overflow-hidden group">
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

                {/* Image — clickable to detail */}
                <Link href={`/marketplace/${listing.id}`}>
                    <div className="relative aspect-[4/5] w-full overflow-hidden cursor-pointer" style={{ background: "var(--surface-secondary)" }}>
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
                </Link>

                {/* Content */}
                <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
                    <h3 className="text-xs sm:text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                        {listing.title}
                    </h3>

                    {/* Price — prominent */}
                    {listing.price != null && (
                        <p className="text-base sm:text-lg font-extrabold" style={{ color: "var(--accent)" }}>
                            ${listing.price.toLocaleString("es-CL")}
                        </p>
                    )}

                    {/* Meta chips — hide overflow on mobile */}
                    <div className="flex flex-wrap gap-1 max-h-[52px] overflow-hidden">
                        {condition && (
                            <Chip
                                color={conditionColors[condition] || "default"}
                                variant="soft"
                                size="sm"
                            >
                                {condition}
                            </Chip>
                        )}
                        {listing.game_name && (
                            <Chip variant="secondary" size="sm">{listing.game_name}</Chip>
                        )}
                        {listing.is_foil && (
                            <Chip color="warning" variant="soft" size="sm">Foil</Chip>
                        )}
                    </div>

                    {/* Seller + Location row — compact */}
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs min-w-0" style={{ color: "var(--muted)" }}>
                        <Avatar size="sm" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0">
                            {listing.seller_avatar_url ? (
                                <Avatar.Image src={listing.seller_avatar_url} />
                            ) : null}
                            <Avatar.Fallback className="text-[7px]">
                                {sellerName[0]?.toUpperCase()}
                            </Avatar.Fallback>
                        </Avatar>
                        <span className="truncate font-medium">{sellerName}</span>
                        {(isStore || listing.is_verified_store) && (
                            <span className="text-[var(--success)] shrink-0">✓</span>
                        )}
                        {listing.city && (
                            <>
                                <span className="text-[var(--border)]">·</span>
                                <span className="truncate shrink-0">{listing.city}</span>
                            </>
                        )}
                    </div>

                    {/* CTA */}
                    <SaleCardActions listingId={listing.id} sellerUsername={listing.seller_username || ""} />
                </div>
            </Card.Content>
        </Card>
    );
}
