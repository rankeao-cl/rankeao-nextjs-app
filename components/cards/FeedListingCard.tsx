import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types/marketplace";
import { Heart, Comment, ArrowShapeTurnUpRight, Bookmark, MapPin } from "@gravity-ui/icons";

function timeAgo(dateStr?: string): string {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}sem`;
}

export default function FeedListingCard({ listing }: { listing: Listing }) {
    const imageUrl = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url || listing.card_image_url;
    const sellerName = listing.seller_username || listing.tenant_name || "Vendedor";
    const isStore = !!listing.tenant_name || listing.is_verified_store || listing.is_verified_seller;

    return (
        <article
            style={{
                background: "#1A1A1E",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
                {/* Avatar 36px */}
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#2A2A2E",
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#F2F2F2",
                    }}
                >
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

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#F2F2F2",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {sellerName}
                        </span>
                        {isStore && (
                            <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>✓</span>
                        )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#888891" }}>
                        {listing.city && (
                            <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <MapPin style={{ width: 10, height: 10 }} />
                                {listing.city}
                            </span>
                        )}
                        <span>{timeAgo(listing.created_at)}</span>
                    </div>
                </div>
            </div>

            {/* Card image - aspect ratio 63:88 */}
            {imageUrl && (
                <Link href={`/marketplace/${listing.id}`}>
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            aspectRatio: "63 / 88",
                            background: "#111113",
                        }}
                    >
                        <Image
                            src={imageUrl}
                            alt={listing.title}
                            fill
                            style={{ objectFit: "contain" }}
                            sizes="(max-width: 640px) 100vw, 700px"
                        />
                    </div>
                </Link>
            )}

            {/* Info section */}
            <div style={{ padding: "10px 14px" }}>
                {/* Title row: card name + price badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <Link href={`/marketplace/${listing.id}`} style={{ flex: 1, minWidth: 0, textDecoration: "none" }}>
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#F2F2F2",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "block",
                            }}
                        >
                            {listing.title}
                        </span>
                    </Link>
                    {listing.price != null && (
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#FFFFFF",
                                background: "rgba(0,0,0,0.6)",
                                padding: "4px 10px",
                                borderRadius: 8,
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                            }}
                        >
                            ${listing.price.toLocaleString("es-CL")}
                        </span>
                    )}
                </div>

                {/* Tags row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {listing.game_name && (
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: "#3B82F6",
                                background: "rgba(59,130,246,0.15)",
                                padding: "3px 8px",
                                borderRadius: 6,
                            }}
                        >
                            {listing.game_name}
                        </span>
                    )}
                    {listing.card_condition && (
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: "#F2F2F2",
                                background: "rgba(255,255,255,0.08)",
                                padding: "3px 8px",
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
                                color: "#F2F2F2",
                                background: "rgba(255,255,255,0.08)",
                                padding: "3px 8px",
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
                                background: "rgba(234,179,8,0.15)",
                                padding: "3px 8px",
                                borderRadius: 6,
                            }}
                        >
                            Foil
                        </span>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 14px 10px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "#888891" }}>
                    <button
                        type="button"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "none",
                            border: "none",
                            color: "inherit",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "inherit",
                        }}
                    >
                        <Heart style={{ width: 18, height: 18 }} />
                    </button>
                    <button
                        type="button"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "none",
                            border: "none",
                            color: "inherit",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "inherit",
                        }}
                    >
                        <Comment style={{ width: 18, height: 18 }} />
                    </button>
                    <button
                        type="button"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "none",
                            border: "none",
                            color: "inherit",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "inherit",
                        }}
                    >
                        <ArrowShapeTurnUpRight style={{ width: 18, height: 18 }} />
                    </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        type="button"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            background: "none",
                            border: "none",
                            color: "#888891",
                            cursor: "pointer",
                            padding: 0,
                        }}
                    >
                        <Bookmark style={{ width: 18, height: 18 }} />
                    </button>
                    <Link
                        href={`/marketplace/${listing.id}`}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#FFFFFF",
                            background: "#3B82F6",
                            padding: "6px 14px",
                            borderRadius: 8,
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Ver carta
                    </Link>
                </div>
            </div>
        </article>
    );
}
