"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { timeAgo } from "@/lib/utils/format";
import { ArrowShapeTurnUpRight, MapPin } from "@gravity-ui/icons";
import { toast } from "@heroui/react/toast";

import type { Listing } from "@/lib/types/marketplace";

const CONDITION_COLORS: Record<string, string> = {
    M: "#22c55e", MINT: "#22c55e",
    NM: "#22c55e",
    LP: "#eab308",
    MP: "#f97316",
    HP: "#ef4444",
    DMG: "#ef4444",
};

function fmtPrice(n: number) {
    return n.toLocaleString("es-CL");
}

function FeedListingCard({ listing }: { listing: Listing }) {
    const imageUrl = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url || listing.card_image_url;
    const sellerName = listing.seller_username || listing.tenant_name || "Vendedor";
    const isStore = !!listing.tenant_name || listing.is_verified_store || listing.is_verified_seller;
    const condColor = CONDITION_COLORS[listing.card_condition ?? ""] ?? "var(--muted)";

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `https://rankeao.cl/marketplace/${listing.slug || listing.id}`;
        if (navigator.share) navigator.share({ title: listing.title, url }).catch(() => {});
        else navigator.clipboard.writeText(url).then(() => toast.success("Enlace copiado")).catch(() => {});
    };

    return (
        <Link href={`/marketplace/${listing.slug || listing.id}`} className="no-underline block">
            <article className="bg-surface-solid rounded-2xl border border-border overflow-hidden">
                {/* Layout: imagen izq + info der en todos los tamaños */}
                <div className="flex min-h-[140px]">
                    {/* Imagen */}
                    <div className="shrink-0 w-[120px] bg-background flex items-center justify-center p-2.5 relative">
                        {imageUrl ? (
                            <div className="relative w-full" style={{ aspectRatio: "63 / 88" }}>
                                <Image
                                    src={imageUrl}
                                    alt={listing.title}
                                    fill
                                    style={{ objectFit: "contain", filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.3))" }}
                                    sizes="120px"
                                />
                            </div>
                        ) : (
                            <span className="text-[11px] text-muted">Sin imagen</span>
                        )}

                        {/* Condition badge */}
                        {listing.card_condition && (
                            <span
                                className="absolute top-1.5 left-1.5 text-[9px] font-[800] tracking-[0.5px] px-1.5 py-[2px] rounded-[5px]"
                                style={{
                                    color: condColor,
                                    backgroundColor: "rgba(0,0,0,0.65)",
                                    backdropFilter: "blur(6px)",
                                    border: `1px solid ${condColor}44`,
                                }}
                            >
                                {listing.card_condition}
                                {listing.is_foil && <span style={{ color: "#eab308", marginLeft: 3 }}>&#10022;</span>}
                            </span>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-between gap-1 border-l border-border">
                        {/* Title + time */}
                        <div>
                            <div className="flex items-baseline gap-1.5">
                                <p className="m-0 text-[15px] font-bold text-foreground leading-[1.3] line-clamp-1">
                                    {listing.title}
                                </p>
                                <span className="text-[11px] text-muted whitespace-nowrap shrink-0">
                                    {timeAgo(listing.created_at, { verbose: true })}
                                </span>
                            </div>
                            <div className="flex items-center gap-[5px] mt-1 flex-wrap">
                                {listing.set_name && (
                                    <span className="text-[11px] text-muted">{listing.set_name}</span>
                                )}
                                {listing.rarity && (
                                    <span className="text-[9px] font-bold text-muted bg-surface px-[5px] py-[1px] rounded-[4px] border border-border uppercase">
                                        {listing.rarity}
                                    </span>
                                )}
                                {listing.game_name && (
                                    <span className="text-[10px] font-semibold text-accent">
                                        {listing.game_name}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Seller */}
                        <div className="flex items-center gap-1.5">
                            <div className="w-[22px] h-[22px] rounded-full shrink-0 bg-surface overflow-hidden flex items-center justify-center text-[9px] font-bold text-foreground">
                                {listing.seller_avatar_url ? (
                                    <Image src={listing.seller_avatar_url} alt={sellerName} width={22} height={22}
                                        className="w-full h-full object-cover" />
                                ) : sellerName[0]?.toUpperCase()}
                            </div>
                            <span className="truncate text-[14px] font-semibold text-foreground">
                                {sellerName}
                            </span>
                            {isStore && <span className="text-[9px] text-success font-bold">&#10003;</span>}
                        </div>
                    </div>

                    {/* Right column: city+share top, price+CTA bottom */}
                    <div className="shrink-0 flex flex-col items-end justify-between px-4 py-3">
                        {/* City + share — top right */}
                        <div className="flex items-center gap-1.5">
                            {listing.city && (
                                <span className="text-[11px] text-muted inline-flex items-center gap-[3px]">
                                    <MapPin className="w-[11px] h-[11px]" />{listing.city}
                                </span>
                            )}
                            <button onClick={handleShare} className="w-7 h-7 rounded-lg shrink-0 bg-surface border border-border cursor-pointer flex items-center justify-center text-muted">
                                <ArrowShapeTurnUpRight className="w-[13px] h-[13px]" />
                            </button>
                        </div>

                        {/* Price + CTA — bottom right */}
                        <div className="flex flex-col items-end gap-2.5">
                            {listing.price != null && (
                                <div className="flex items-end gap-1 whitespace-nowrap">
                                    <span style={{
                                        fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.28)",
                                        fontFamily: "Georgia, 'Times New Roman', serif",
                                        lineHeight: 1, marginBottom: 4,
                                    }}>$</span>
                                    <span style={{
                                        fontSize: 46, fontWeight: 900, color: "#fff",
                                        letterSpacing: "-2.5px", lineHeight: 0.82,
                                        textShadow: "0 2px 0 rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.25)",
                                    }}>
                                        {fmtPrice(listing.price)}
                                    </span>
                                </div>
                            )}
                            <span style={{
                                fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)",
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                backdropFilter: "blur(8px)",
                            }} className="whitespace-nowrap inline-flex items-center gap-1 px-4 py-1.5 rounded-full">
                                Ver oferta &rsaquo;
                            </span>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}

export default memo(FeedListingCard);
