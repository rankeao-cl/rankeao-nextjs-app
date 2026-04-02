"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { timeAgo } from "@/lib/utils/format";
import { Bookmark, MapPin } from "@gravity-ui/icons";
import type { Listing } from "@/lib/types/marketplace";

export default function FeedListingCard({ listing }: { listing: Listing }) {
    const imageUrl = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url || listing.card_image_url;
    const sellerName = listing.seller_username || listing.tenant_name || "Vendedor";
    const isStore = !!listing.tenant_name || listing.is_verified_store || listing.is_verified_seller;
    const [bookmarked, setBookmarked] = useState(false);

    const conditionColor = listing.card_condition === "NM" || listing.card_condition === "M"
        ? "var(--success)" : listing.card_condition === "LP"
        ? "var(--warning)" : "var(--muted)";

    return (
        <Link href={`/marketplace/${listing.id}`} style={{ textDecoration: "none", display: "block" }}>
            <article
                className="feed-listing-card"
                style={{
                    background: "var(--surface-solid)",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                    transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                }}
            >
                <style>{`
                    .feed-listing-card:hover {
                        border-color: rgba(59,130,246,0.35) !important;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(59,130,246,0.15) !important;
                        transform: translateY(-2px);
                    }
                `}</style>

                {/* ── MOBILE ── */}
                <div className="flex flex-col md:hidden">
                    {/* Image hero with overlays */}
                    <div style={{ position: "relative", background: "var(--background)" }}>
                        {imageUrl ? (
                            <div style={{
                                display: "flex", justifyContent: "center", alignItems: "center",
                                padding: "16px 12px", minHeight: 200,
                            }}>
                                <div style={{ position: "relative", width: "55%", aspectRatio: "63 / 88" }}>
                                    <Image
                                        src={imageUrl}
                                        alt={listing.title}
                                        fill
                                        style={{ objectFit: "contain", filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.4))" }}
                                        sizes="(max-width: 768px) 55vw, 200px"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: 13, color: "var(--muted)" }}>Sin imagen</span>
                            </div>
                        )}

                        {/* Top-left: condition badge */}
                        {listing.card_condition && (
                            <div style={{ position: "absolute", top: 10, left: 10 }}>
                                <span style={{
                                    fontSize: 11, fontWeight: 800, letterSpacing: "0.5px",
                                    color: conditionColor,
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                                    padding: "4px 10px", borderRadius: 8,
                                    border: `1px solid color-mix(in srgb, ${conditionColor} 30%, transparent)`,
                                }}>
                                    {listing.card_condition}
                                    {listing.is_foil && <span style={{ color: "var(--yellow)", marginLeft: 4 }}>&#10022;</span>}
                                </span>
                            </div>
                        )}

                        {/* Top-right: bookmark */}
                        <div style={{ position: "absolute", top: 10, right: 10 }}>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBookmarked(!bookmarked); }}
                                style={{
                                    width: 34, height: 34, borderRadius: 10,
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                                    border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "transform 0.15s",
                                    transform: bookmarked ? "scale(1.1)" : "scale(1)",
                                }}
                            >
                                <Bookmark style={{ width: 16, height: 16, color: bookmarked ? "var(--accent)" : "#fff" }} />
                            </button>
                        </div>

                        {/* Bottom-left: game tag */}
                        {listing.game_name && (
                            <div style={{ position: "absolute", bottom: 10, left: 10 }}>
                                <span style={{
                                    fontSize: 10, fontWeight: 700,
                                    color: "var(--accent)",
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                                    padding: "3px 8px", borderRadius: 6,
                                }}>
                                    {listing.game_name}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Info section */}
                    <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                        {/* Title */}
                        <span style={{
                            fontSize: 14, fontWeight: 700, color: "var(--foreground)",
                            lineHeight: 1.3,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                            {listing.title}
                        </span>

                        {/* Set + rarity */}
                        {(listing.set_name || listing.rarity) && (
                            <span style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.2 }}>
                                {[listing.set_name, listing.rarity].filter(Boolean).join(" · ")}
                            </span>
                        )}

                        {/* Seller + price row */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            marginTop: 2,
                        }}>
                            {/* Seller mini */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                <div style={{
                                    width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                                    backgroundColor: "var(--surface)", overflow: "hidden",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 10, fontWeight: 700, color: "var(--foreground)",
                                }}>
                                    {listing.seller_avatar_url ? (
                                        <Image src={listing.seller_avatar_url} alt={sellerName} width={22} height={22}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        sellerName[0]?.toUpperCase()
                                    )}
                                </div>
                                <span className="truncate" style={{ fontSize: 12, color: "var(--muted)", maxWidth: 100 }}>
                                    {sellerName}
                                </span>
                                {isStore && <span style={{ fontSize: 9, color: "var(--success)", fontWeight: 700 }}>&#10003;</span>}
                                {listing.city && (
                                    <span style={{ fontSize: 10, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 2 }}>
                                        <MapPin style={{ width: 10, height: 10 }} />{listing.city}
                                    </span>
                                )}
                            </div>

                            {/* Price */}
                            {listing.price != null && (
                                <span style={{
                                    fontSize: 18, fontWeight: 800, color: "var(--foreground)",
                                    letterSpacing: "-0.5px",
                                }}>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>$</span>
                                    {listing.price.toLocaleString("es-CL")}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── DESKTOP: horizontal ── */}
                <div className="hidden md:flex" style={{ minHeight: 160 }}>
                    {/* Left: Card image */}
                    {imageUrl && (
                        <div style={{
                            flexShrink: 0, width: 140,
                            background: "var(--background)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: 12, position: "relative",
                        }}>
                            <div style={{ position: "relative", width: "100%", aspectRatio: "63 / 88" }}>
                                <Image
                                    src={imageUrl}
                                    alt={listing.title}
                                    fill
                                    style={{ objectFit: "contain", filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.3))" }}
                                    sizes="140px"
                                />
                            </div>
                            {/* Condition overlay */}
                            {listing.card_condition && (
                                <span style={{
                                    position: "absolute", top: 8, left: 8,
                                    fontSize: 10, fontWeight: 800,
                                    color: conditionColor,
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                                    padding: "2px 7px", borderRadius: 6,
                                    border: `1px solid color-mix(in srgb, ${conditionColor} 25%, transparent)`,
                                }}>
                                    {listing.card_condition}
                                    {listing.is_foil && <span style={{ color: "var(--yellow)", marginLeft: 3 }}>&#10022;</span>}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Center: Details */}
                    <div style={{
                        flex: 1, minWidth: 0, padding: "14px 16px",
                        display: "flex", flexDirection: "column", justifyContent: "center", gap: 6,
                        borderLeft: imageUrl ? "1px solid var(--border)" : undefined,
                    }}>
                        {/* Game tag */}
                        {listing.game_name && (
                            <span style={{
                                fontSize: 10, fontWeight: 700, color: "var(--accent)",
                                background: "rgba(59,130,246,0.08)",
                                padding: "2px 8px", borderRadius: 999, alignSelf: "flex-start",
                            }}>
                                {listing.game_name}
                            </span>
                        )}

                        {/* Title */}
                        <span style={{
                            fontSize: 15, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                            {listing.title}
                        </span>

                        {/* Set + rarity + tags */}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            {listing.set_name && (
                                <span style={{ fontSize: 11, color: "var(--muted)" }}>{listing.set_name}</span>
                            )}
                            {listing.rarity && (
                                <span style={{ fontSize: 10, color: "var(--muted)", background: "var(--surface)", padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border)" }}>
                                    {listing.rarity}
                                </span>
                            )}
                        </div>

                        {/* Seller row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <div style={{
                                width: 20, height: 20, borderRadius: 10, flexShrink: 0,
                                backgroundColor: "var(--surface)", overflow: "hidden",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 9, fontWeight: 700, color: "var(--foreground)",
                            }}>
                                {listing.seller_avatar_url ? (
                                    <Image src={listing.seller_avatar_url} alt={sellerName} width={20} height={20}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    sellerName[0]?.toUpperCase()
                                )}
                            </div>
                            <span style={{ fontSize: 12, color: "var(--muted)" }}>{sellerName}</span>
                            {isStore && <span style={{ fontSize: 9, color: "var(--success)", fontWeight: 700 }}>&#10003;</span>}
                            {listing.city && (
                                <span style={{ fontSize: 10, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 2 }}>
                                    <MapPin style={{ width: 10, height: 10 }} />{listing.city}
                                </span>
                            )}
                            <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: "auto" }}>
                                {timeAgo(listing.created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Right: Price + CTA */}
                    <div style={{
                        flexShrink: 0, width: 140,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        gap: 8, padding: 16,
                        borderLeft: "1px solid var(--border)",
                    }}>
                        {listing.price != null && (
                            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.5px" }}>
                                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--muted)" }}>$</span>
                                {listing.price.toLocaleString("es-CL")}
                            </span>
                        )}
                        <span style={{
                            fontSize: 12, fontWeight: 700, color: "var(--accent)",
                            display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                            Ver oferta
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
