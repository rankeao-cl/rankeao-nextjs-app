"use client";

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

export default function SaleCardList({ listing }: { listing: Listing }) {
    const imageUrl = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url || listing.card_image_url;
    const condition = listing.card_condition || "";
    const sellerName = listing.seller_username || listing.tenant_name || "Vendedor";
    const isStore = !!listing.tenant_name;

    return (
        <Card className="surface-card rounded-[18px] overflow-hidden group">
            <Card.Content className="p-0">
                <div className="flex gap-0">
                    {/* Thumbnail */}
                    <Link href={`/marketplace/${listing.id}`} className="flex-shrink-0">
                        <div
                            className="relative w-28 h-full min-h-[120px] overflow-hidden cursor-pointer"
                            style={{ background: "var(--surface-secondary)" }}
                        >
                            {imageUrl ? (
                                <Image
                                    src={imageUrl}
                                    alt={listing.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="112px"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-2xl">🃏</div>
                            )}
                        </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0 gap-2">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <Link href={`/marketplace/${listing.id}`}>
                                    <h3 className="text-sm font-semibold truncate hover:text-[var(--accent)] transition-colors" style={{ color: "var(--foreground)" }}>
                                        {listing.title}
                                    </h3>
                                </Link>
                                {listing.price != null && (
                                    <p className="text-base font-extrabold flex-shrink-0" style={{ color: "var(--accent)" }}>
                                        ${listing.price.toLocaleString("es-CL")}
                                    </p>
                                )}
                            </div>

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
                                    <Chip color="warning" variant="soft" size="sm">Foil</Chip>
                                )}
                            </div>
                        </div>

                        {/* Bottom row: seller + location + actions */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Seller */}
                                <div className="flex items-center gap-1.5 text-xs min-w-0" style={{ color: "var(--muted)" }}>
                                    <Avatar size="sm" className="w-5 h-5 flex-shrink-0">
                                        {listing.seller_avatar_url ? (
                                            <Avatar.Image src={listing.seller_avatar_url} />
                                        ) : null}
                                        <Avatar.Fallback className="text-[8px]">
                                            {sellerName[0]?.toUpperCase()}
                                        </Avatar.Fallback>
                                    </Avatar>
                                    <span className="truncate font-medium">{sellerName}</span>
                                    {(isStore || listing.is_verified_store || listing.is_verified_seller) && (
                                        <span
                                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0"
                                            style={{
                                                background: "var(--success)",
                                                color: "var(--success-foreground)",
                                            }}
                                        >
                                            Tienda
                                        </span>
                                    )}
                                </div>

                                {/* Location */}
                                {(listing.city || listing.region) && (
                                    <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>
                                        <MapPin className="size-3" />
                                        <span>{listing.city || listing.region}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-shrink-0">
                                <SaleCardActions listingId={listing.id} sellerUsername={listing.seller_username || ""} />
                            </div>
                        </div>
                    </div>
                </div>
            </Card.Content>
        </Card>
    );
}
