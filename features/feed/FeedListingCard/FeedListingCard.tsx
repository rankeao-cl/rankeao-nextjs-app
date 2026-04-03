"use client";

import Image from "next/image";
import Link from "next/link";
import { timeAgo } from "@/lib/utils/format";
import { ArrowShapeTurnUpRight, MapPin } from "@gravity-ui/icons";
import { toast } from "@heroui/react";
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

export default function FeedListingCard({ listing }: { listing: Listing }) {
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
        <Link href={`/marketplace/${listing.slug || listing.id}`} style={{ textDecoration: "none", display: "block" }}>
            <article style={{
                background: "var(--surface-solid)",
                borderRadius: 16,
                border: "1px solid var(--border)",
                overflow: "hidden",
            }}>
                {/* Layout: imagen izq + info der en todos los tamaños */}
                <div style={{ display: "flex", minHeight: 140 }}>
                    {/* Imagen */}
                    <div style={{
                        flexShrink: 0, width: 120,
                        background: "var(--background)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 10, position: "relative",
                    }}>
                        {imageUrl ? (
                            <div style={{ position: "relative", width: "100%", aspectRatio: "63 / 88" }}>
                                <Image
                                    src={imageUrl}
                                    alt={listing.title}
                                    fill
                                    style={{ objectFit: "contain", filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.3))" }}
                                    sizes="120px"
                                />
                            </div>
                        ) : (
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>Sin imagen</span>
                        )}

                        {/* Condition badge */}
                        {listing.card_condition && (
                            <span style={{
                                position: "absolute", top: 6, left: 6,
                                fontSize: 9, fontWeight: 800, letterSpacing: "0.5px",
                                color: condColor,
                                backgroundColor: "rgba(0,0,0,0.65)",
                                backdropFilter: "blur(6px)",
                                padding: "2px 6px", borderRadius: 5,
                                border: `1px solid ${condColor}44`,
                            }}>
                                {listing.card_condition}
                                {listing.is_foil && <span style={{ color: "#eab308", marginLeft: 3 }}>&#10022;</span>}
                            </span>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{
                        flex: 1, minWidth: 0, padding: "12px 14px",
                        display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 4,
                        borderLeft: "1px solid var(--border)",
                    }}>
                        {/* Title + time */}
                        <div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                <p style={{
                                    margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)",
                                    lineHeight: 1.3,
                                    display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as any, overflow: "hidden",
                                }}>
                                    {listing.title}
                                </p>
                                <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                                    {timeAgo(listing.created_at, { verbose: true })}
                                </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                                {listing.set_name && (
                                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{listing.set_name}</span>
                                )}
                                {listing.rarity && (
                                    <span style={{
                                        fontSize: 9, fontWeight: 700, color: "var(--muted)",
                                        background: "var(--surface)", padding: "1px 5px", borderRadius: 4,
                                        border: "1px solid var(--border)", textTransform: "uppercase",
                                    }}>
                                        {listing.rarity}
                                    </span>
                                )}
                                {listing.game_name && (
                                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)" }}>
                                        {listing.game_name}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Seller */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                                width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                                backgroundColor: "var(--surface)", overflow: "hidden",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 9, fontWeight: 700, color: "var(--foreground)",
                            }}>
                                {listing.seller_avatar_url ? (
                                    <Image src={listing.seller_avatar_url} alt={sellerName} width={22} height={22}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : sellerName[0]?.toUpperCase()}
                            </div>
                            <span className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                                {sellerName}
                            </span>
                            {isStore && <span style={{ fontSize: 9, color: "var(--success)", fontWeight: 700 }}>&#10003;</span>}
                        </div>
                    </div>

                    {/* Right column: city+share top, price+CTA bottom */}
                    <div style={{
                        flexShrink: 0,
                        display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between",
                        padding: "12px 16px",
                    }}>
                        {/* City + share — top right */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {listing.city && (
                                <span style={{ fontSize: 11, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <MapPin style={{ width: 11, height: 11 }} />{listing.city}
                                </span>
                            )}
                            <button onClick={handleShare} style={{
                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                background: "var(--surface)", border: "1px solid var(--border)",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--muted)",
                            }}>
                                <ArrowShapeTurnUpRight style={{ width: 13, height: 13 }} />
                            </button>
                        </div>

                        {/* Price + CTA — bottom right */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                            {listing.price != null && (
                                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, whiteSpace: "nowrap" }}>
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
                                whiteSpace: "nowrap",
                                display: "inline-flex", alignItems: "center", gap: 4,
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                backdropFilter: "blur(8px)",
                                padding: "6px 16px", borderRadius: 999,
                            }}>
                                Ver oferta &rsaquo;
                            </span>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}
