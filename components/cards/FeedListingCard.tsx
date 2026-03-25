"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { timeAgo } from "@/lib/utils/format";
import { Heart, Comment, Bookmark, MapPin, ShoppingCart } from "@gravity-ui/icons";
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
            {/*
             * Mobile  (< md): vertical — imagen centrada arriba, mini detalle abajo
             * Desktop (≥ md): horizontal — imagen 260px izquierda, detalle completo derecha
             */}

            {/* ── MOBILE: vertical layout ── */}
            <div className="flex flex-col md:hidden">
                {/* Seller row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px 0" }}>
                    <div
                        style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: "var(--surface)",
                            overflow: "hidden",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--foreground)",
                        }}
                    >
                        {listing.seller_avatar_url ? (
                            <Image
                                src={listing.seller_avatar_url}
                                alt={sellerName}
                                width={26}
                                height={26}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            sellerName[0]?.toUpperCase()
                        )}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
                        {sellerName}
                        {isStore && <span style={{ color: "var(--success)", marginLeft: 3 }}>✓</span>}
                    </span>
                    {listing.city && (
                        <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 2, marginLeft: "auto" }}>
                            <MapPin style={{ width: 9, height: 9 }} />
                            {listing.city}
                        </span>
                    )}
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{timeAgo(listing.created_at)}</span>
                </div>

                {/* Card image — centered, restrained width */}
                {imageUrl && (
                    <Link href={`/marketplace/${listing.id}`} style={{ display: "flex", justifyContent: "center", padding: "10px 12px", background: "var(--background)" }}>
                        <div style={{ position: "relative", width: 150, aspectRatio: "63 / 88" }}>
                            <Image
                                src={imageUrl}
                                alt={listing.title}
                                fill
                                style={{ objectFit: "contain" }}
                                sizes="150px"
                            />
                        </div>
                    </Link>
                )}

                {/* Mini detail */}
                <div style={{ padding: "8px 12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <Link href={`/marketplace/${listing.id}`} style={{ textDecoration: "none", flex: 1, minWidth: 0 }}>
                            <span
                                style={{
                                    fontSize: 13,
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
                        {listing.price != null && (
                            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)", whiteSpace: "nowrap", flexShrink: 0 }}>
                                ${listing.price.toLocaleString("es-CL")}
                            </span>
                        )}
                    </div>

                    {/* Tags + CTA */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {listing.card_condition && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 5 }}>
                                    {listing.card_condition}
                                </span>
                            )}
                            {listing.is_foil && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--yellow)", background: "color-mix(in srgb, var(--yellow) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--yellow) 30%, transparent)", padding: "2px 6px", borderRadius: 5 }}>
                                    ✦ Foil
                                </span>
                            )}
                        </div>
                        <Link
                            href={`/marketplace/${listing.id}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#FFFFFF",
                                background: "var(--accent)",
                                padding: "4px 10px",
                                borderRadius: 7,
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                            }}
                        >
                            <ShoppingCart style={{ width: 11, height: 11 }} />
                            Ver oferta
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── DESKTOP: horizontal layout ── */}
            <div className="hidden md:flex">
                {/* Left: Card image 260px */}
                {imageUrl && (
                    <Link
                        href={`/marketplace/${listing.id}`}
                        style={{
                            flexShrink: 0,
                            width: 260,
                            background: "var(--background)",
                            display: "block",
                        }}
                    >
                        <div style={{ position: "relative", width: 260, aspectRatio: "63 / 88" }}>
                            <Image
                                src={imageUrl}
                                alt={listing.title}
                                fill
                                style={{ objectFit: "contain" }}
                                sizes="260px"
                            />
                        </div>
                    </Link>
                )}

                {/* Right: Full detail */}
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        padding: "14px 16px",
                        gap: 10,
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
                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {sellerName}
                                </span>
                                {isStore && <span style={{ color: "var(--success)", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</span>}
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

                    {/* Title */}
                    <Link href={`/marketplace/${listing.id}`} style={{ textDecoration: "none" }}>
                        <span
                            style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: "var(--foreground)",
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                lineHeight: 1.35,
                            }}
                        >
                            {listing.title}
                        </span>
                    </Link>

                    {/* Price */}
                    {listing.price != null && (
                        <span style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.5px" }}>
                            ${listing.price.toLocaleString("es-CL")}
                        </span>
                    )}

                    {/* Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {listing.card_condition && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", padding: "2px 7px", borderRadius: 6 }}>
                                {listing.card_condition}
                            </span>
                        )}
                        {listing.rarity && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", padding: "2px 7px", borderRadius: 6 }}>
                                {listing.rarity}
                            </span>
                        )}
                        {listing.is_foil && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--yellow)", background: "color-mix(in srgb, var(--yellow) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--yellow) 30%, transparent)", padding: "2px 7px", borderRadius: 6 }}>
                                ✦ Foil
                            </span>
                        )}
                        {listing.game_name && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", padding: "2px 7px", borderRadius: 6 }}>
                                {listing.game_name}
                            </span>
                        )}
                    </div>

                    <div style={{ flex: 1 }} />

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--muted)" }}>
                            <button type="button" onClick={() => setLiked(v => !v)} style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", color: liked ? "var(--danger)" : "var(--muted)", cursor: "pointer", padding: 0, fontSize: 12 }}>
                                <Heart style={{ width: 15, height: 15 }} />
                            </button>
                            <button type="button" style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0, fontSize: 12 }}>
                                <Comment style={{ width: 15, height: 15 }} />
                            </button>
                            <button type="button" onClick={() => setBookmarked(v => !v)} style={{ display: "flex", alignItems: "center", background: "none", border: "none", color: bookmarked ? "var(--accent)" : "var(--muted)", cursor: "pointer", padding: 0 }}>
                                <Bookmark style={{ width: 15, height: 15 }} />
                            </button>
                        </div>
                        <Link
                            href={`/marketplace/${listing.id}`}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#FFFFFF", background: "var(--accent)", padding: "6px 14px", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap" }}
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
