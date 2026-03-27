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
            className="feed-listing-card"
            style={{
                background: "var(--surface-solid)",
                borderRadius: 16,
                border: "1px solid var(--border)",
                overflow: "hidden",
                position: "relative",
                transition: "box-shadow 0.25s, border-color 0.25s",
            }}
        >
            <style>{`
                .feed-listing-card:hover {
                    border-color: rgba(59,130,246,0.4) !important;
                    box-shadow: 0 0 20px rgba(59,130,246,0.15), 0 4px 16px rgba(0,0,0,0.1) !important;
                }
            `}</style>
            {/*
             * Mobile  (< md): vertical — imagen centrada arriba, mini detalle abajo
             * Desktop (≥ md): horizontal — imagen 260px izquierda, detalle completo derecha
             */}

            {/* ── MOBILE: vertical layout ── */}
            <div className="flex flex-col md:hidden">
                {/* Seller row — same style as PostCard */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px 0" }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 20,
                        background: "var(--accent)", padding: 2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: "var(--background)", overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, fontWeight: 700, color: "var(--foreground)",
                        }}>
                            {listing.seller_avatar_url ? (
                                <Image
                                    src={listing.seller_avatar_url}
                                    alt={sellerName}
                                    width={36}
                                    height={36}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                sellerName[0]?.toUpperCase()
                            )}
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                                {sellerName}
                            </span>
                            {isStore && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--success)", background: "rgba(34,197,94,0.15)", padding: "2px 6px", borderRadius: 6 }}>
                                    Tienda
                                </span>
                            )}
                        </div>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{timeAgo(listing.created_at)}</span>
                    </div>
                    {listing.city && (
                        <span style={{
                            fontSize: 11, fontWeight: 600, color: "#FFFFFF",
                            backgroundColor: "rgba(59,130,246,0.35)",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            border: "1px solid rgba(59,130,246,0.25)",
                            padding: "4px 10px", borderRadius: 999,
                            display: "inline-flex", alignItems: "center", gap: 4,
                            marginLeft: "auto", flexShrink: 0,
                        }}>
                            <MapPin style={{ width: 11, height: 11 }} />
                            {listing.city}
                        </span>
                    )}
                </div>

                {/* Card image with floating actions */}
                {imageUrl && (
                    <div style={{ position: "relative" }}>
                        <Link href={`/marketplace/${listing.id}`} style={{ display: "flex", justifyContent: "center", padding: "4px", background: "var(--surface-solid)" }}>
                            <div style={{ position: "relative", width: "98%", aspectRatio: "63 / 88" }}>
                                <Image
                                    src={imageUrl}
                                    alt={listing.title}
                                    fill
                                    style={{ objectFit: "contain", borderRadius: 8 }}
                                    sizes="(max-width: 768px) 75vw, 300px"
                                />
                            </div>
                        </Link>
                        {/* Floating like + bookmark */}
                        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                            <button
                                onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
                                style={{
                                    width: 36, height: 36, borderRadius: 18,
                                    backgroundColor: "rgba(0,0,0,0.45)",
                                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                                    border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >
                                <Heart style={{ width: 18, height: 18, color: liked ? "#EF4444" : "#FFFFFF", fill: liked ? "#EF4444" : "none" }} />
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); setBookmarked(!bookmarked); }}
                                style={{
                                    width: 36, height: 36, borderRadius: 18,
                                    backgroundColor: "rgba(0,0,0,0.45)",
                                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                                    border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >
                                <Bookmark style={{ width: 18, height: 18, color: bookmarked ? "var(--accent)" : "#FFFFFF", fill: bookmarked ? "var(--accent)" : "none" }} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Detail */}
                <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Title row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Link href={`/marketplace/${listing.id}`} style={{ textDecoration: "none", flex: 1, minWidth: 0 }}>
                            <span
                                style={{
                                    fontSize: 17,
                                    fontWeight: 800,
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
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
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
                    </div>

                    {/* Game + set info */}
                    {(listing.game_name || listing.set_name) && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {listing.game_name && (
                                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "rgba(59,130,246,0.1)", padding: "3px 8px", borderRadius: 999 }}>
                                    {listing.game_name}
                                </span>
                            )}
                            {listing.set_name && (
                                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", background: "var(--surface)", border: "1px solid var(--border)", padding: "3px 8px", borderRadius: 999 }}>
                                    {listing.set_name}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Reactions */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        paddingTop: 8, borderTop: "1px solid var(--border)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button type="button" onClick={() => setLiked(!liked)} style={{
                                display: "flex", alignItems: "center", gap: 5,
                                background: "none", border: "none", cursor: "pointer",
                                color: liked ? "#EF4444" : "var(--muted)",
                                padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                                transition: "transform 0.15s",
                                transform: liked ? "scale(1.05)" : "scale(1)",
                            }}>
                                <Heart style={{ width: 18, height: 18 }} />
                                <span>{(listing as any).likes_count ?? 0}</span>
                            </button>
                            <button type="button" style={{
                                display: "flex", alignItems: "center", gap: 5,
                                background: "none", border: "none", cursor: "pointer",
                                color: "var(--muted)",
                                padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                            }}>
                                <Comment style={{ width: 18, height: 18 }} />
                                <span>{(listing as any).comments_count ?? 0}</span>
                            </button>
                        </div>
                        <button type="button" onClick={() => setBookmarked(!bookmarked)} style={{
                            display: "flex", alignItems: "center",
                            background: "none", border: "none", cursor: "pointer",
                            color: bookmarked ? "var(--accent)" : "var(--muted)",
                            padding: "4px 8px", borderRadius: 999,
                            transition: "color 0.15s",
                        }}>
                            <Bookmark style={{ width: 18, height: 18 }} />
                        </button>
                    </div>

                    {/* CTA — Comprar + precio */}
                    <Link
                        href={`/marketplace/${listing.id}`}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 15,
                            fontWeight: 600,
                            background: "var(--foreground)",
                            color: "var(--background)",
                            padding: "5px 5px 5px 18px",
                            borderRadius: 999,
                            textDecoration: "none",
                            width: "100%",
                            transition: "opacity 0.15s",
                        }}
                        onMouseEnter={(e: any) => { e.currentTarget.style.opacity = "0.9"; }}
                        onMouseLeave={(e: any) => { e.currentTarget.style.opacity = "1"; }}
                    >
                        Comprar
                        {listing.price != null && (
                            <span style={{
                                fontSize: 18, fontWeight: 800,
                                backgroundColor: "var(--accent)",
                                color: "#FFFFFF",
                                padding: "7px 16px", borderRadius: 999,
                                marginLeft: "auto",
                                letterSpacing: "-0.5px",
                            }}>
                                <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.85 }}>$</span>{listing.price.toLocaleString("es-CL")}
                            </span>
                        )}
                    </Link>
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
                        <div style={{
                            width: 32, height: 32, borderRadius: 16,
                            background: "var(--accent)", padding: 2,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 14,
                                backgroundColor: "var(--background)", overflow: "hidden",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 700, color: "var(--foreground)",
                            }}>
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

                    {/* Reactions */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button type="button" onClick={() => setLiked(v => !v)} style={{
                                display: "flex", alignItems: "center", gap: 5,
                                background: "none", border: "none", cursor: "pointer",
                                color: liked ? "#EF4444" : "var(--muted)",
                                padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                                transition: "transform 0.15s",
                                transform: liked ? "scale(1.05)" : "scale(1)",
                            }}>
                                <Heart style={{ width: 18, height: 18 }} />
                                <span>{(listing as any).likes_count ?? 0}</span>
                            </button>
                            <button type="button" style={{
                                display: "flex", alignItems: "center", gap: 5,
                                background: "none", border: "none", cursor: "pointer",
                                color: "var(--muted)",
                                padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                            }}>
                                <Comment style={{ width: 18, height: 18 }} />
                                <span>{(listing as any).comments_count ?? 0}</span>
                            </button>
                            <button type="button" onClick={() => setBookmarked(v => !v)} style={{
                                display: "flex", alignItems: "center",
                                background: "none", border: "none", cursor: "pointer",
                                color: bookmarked ? "var(--accent)" : "var(--muted)",
                                padding: "4px 8px", borderRadius: 999,
                                transition: "color 0.15s",
                            }}>
                                <Bookmark style={{ width: 18, height: 18 }} />
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
