"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { timeAgo } from "@/lib/utils/format";
import { Heart, Comment, ArrowShapeTurnUpRight, Bookmark, MapPin, ShoppingCart } from "@gravity-ui/icons";
import type { Listing } from "@/lib/types/marketplace";

export default function FeedListingCard({ listing }: { listing: Listing }) {
    const imageUrl = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url || listing.card_image_url;
    const sellerName = listing.seller_username || listing.tenant_name || "Vendedor";
    const isStore = !!listing.tenant_name || listing.is_verified_store || listing.is_verified_seller;

    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);

    return (
        <article
            style={{
                background: "var(--surface-solid)",
                borderRadius: 16,
                border: "1px solid var(--border)",
                overflow: "hidden",
            }}
        >
            {/* Main row: image + content */}
            <div style={{ display: "flex", gap: 0 }}>

                {/* Left: Card image — native TCG ratio, fixed width */}
                {imageUrl && (
                    <Link
                        href={`/marketplace/${listing.id}`}
                        style={{
                            flexShrink: 0,
                            width: 130,
                            position: "relative",
                            background: "var(--background)",
                            display: "block",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                width: 130,
                                aspectRatio: "63 / 88",
                            }}
                        >
                            <Image
                                src={imageUrl}
                                alt={listing.title}
                                fill
                                style={{ objectFit: "contain" }}
                                sizes="130px"
                            />
                        </div>
                    </Link>
                )}

                {/* Right: Content */}
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        padding: "12px 14px",
                        gap: 8,
                        borderLeft: imageUrl ? "1px solid var(--border)" : "none",
                    }}
                >
                    {/* Seller row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "var(--surface)",
                                overflow: "hidden",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "var(--foreground)",
                            }}
                        >
                            {listing.seller_avatar_url ? (
                                <Image
                                    src={listing.seller_avatar_url}
                                    alt={sellerName}
                                    width={28}
                                    height={28}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                sellerName[0]?.toUpperCase()
                            )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "var(--foreground)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {sellerName}
                                </span>
                                {isStore && (
                                    <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</span>
                                )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--muted)" }}>
                                {listing.city && (
                                    <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                        <MapPin style={{ width: 9, height: 9 }} />
                                        {listing.city}
                                    </span>
                                )}
                                <span>{timeAgo(listing.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card title */}
                    <Link href={`/marketplace/${listing.id}`} style={{ textDecoration: "none" }}>
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "var(--foreground)",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                lineHeight: 1.3,
                            }}
                        >
                            {listing.title}
                        </span>
                    </Link>

                    {/* Price */}
                    {listing.price != null && (
                        <span
                            style={{
                                fontSize: 18,
                                fontWeight: 800,
                                color: "#3B82F6",
                                letterSpacing: "-0.5px",
                            }}
                        >
                            ${listing.price.toLocaleString("es-CL")}
                        </span>
                    )}

                    {/* Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {listing.card_condition && (
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: "var(--muted)",
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                    padding: "2px 7px",
                                    borderRadius: 6,
                                }}
                            >
                                {listing.card_condition}
                            </span>
                        )}
                        {listing.rarity && (
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: "var(--muted)",
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                    padding: "2px 7px",
                                    borderRadius: 6,
                                }}
                            >
                                {listing.rarity}
                            </span>
                        )}
                        {listing.is_foil && (
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: "#eab308",
                                    background: "rgba(234,179,8,0.12)",
                                    border: "1px solid rgba(234,179,8,0.3)",
                                    padding: "2px 7px",
                                    borderRadius: 6,
                                }}
                            >
                                ✦ Foil
                            </span>
                        )}
                        {listing.game_name && (
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: "#3B82F6",
                                    background: "rgba(59,130,246,0.1)",
                                    border: "1px solid rgba(59,130,246,0.2)",
                                    padding: "2px 7px",
                                    borderRadius: 6,
                                }}
                            >
                                {listing.game_name}
                            </span>
                        )}
                    </div>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Footer: actions + CTA */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: 8,
                            borderTop: "1px solid var(--border)",
                            marginTop: 2,
                        }}
                    >
                        {/* Left actions */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--muted)" }}>
                            <button
                                type="button"
                                onClick={() => setLiked((v) => !v)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    background: "none",
                                    border: "none",
                                    color: liked ? "#ef4444" : "var(--muted)",
                                    cursor: "pointer",
                                    padding: 0,
                                    fontSize: 12,
                                }}
                            >
                                <Heart style={{ width: 15, height: 15 }} />
                            </button>
                            <button
                                type="button"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    background: "none",
                                    border: "none",
                                    color: "var(--muted)",
                                    cursor: "pointer",
                                    padding: 0,
                                    fontSize: 12,
                                }}
                            >
                                <Comment style={{ width: 15, height: 15 }} />
                            </button>
                            <button
                                type="button"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    background: "none",
                                    border: "none",
                                    color: bookmarked ? "#3B82F6" : "var(--muted)",
                                    cursor: "pointer",
                                    padding: 0,
                                }}
                                onClick={() => setBookmarked((v) => !v)}
                            >
                                <Bookmark style={{ width: 15, height: 15 }} />
                            </button>
                        </div>

                        {/* CTA */}
                        <Link
                            href={`/marketplace/${listing.id}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#FFFFFF",
                                background: "#3B82F6",
                                padding: "5px 12px",
                                borderRadius: 8,
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <ShoppingCart style={{ width: 13, height: 13 }} />
                            Ver oferta
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
