import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types/marketplace";

export default function SaleCardList({ listing }: { listing: Listing }) {
    const imageUrl =
        listing.card_image_url ||
        listing.images?.[0]?.url ||
        listing.images?.[0]?.thumbnail_url;

    const name = listing.title || listing.card_name || "Sin titulo";
    const setName = listing.set_name;
    const condition = listing.card_condition;
    const sellerName = listing.seller_username || listing.tenant_name;
    const isVerified = !!(listing.is_verified_seller || listing.is_verified_store);
    const city = listing.city;
    const price =
        listing.price != null
            ? `$${listing.price.toLocaleString("es-CL")}`
            : "Consultar";

    return (
        <Link href={`/marketplace/${listing.id}`} className="block">
            <div
                className="flex overflow-hidden rounded-2xl"
                style={{
                    backgroundColor: "var(--surface-solid)",
                    border: "1px solid var(--border)",
                }}
            >
                {/* Thumbnail */}
                <div
                    className="shrink-0 relative"
                    style={{
                        width: "90px",
                        aspectRatio: "63 / 88",
                        backgroundColor: "var(--code-bg)",
                    }}
                >
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            className="object-contain"
                            sizes="90px"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-xl opacity-30">🃏</span>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ padding: "12px" }}>
                    {/* Title */}
                    <p
                        className="line-clamp-2"
                        style={{
                            color: "var(--foreground)",
                            fontSize: "14px",
                            fontWeight: 600,
                            lineHeight: "18px",
                        }}
                    >
                        {name}
                    </p>

                    {/* Set name */}
                    {setName && (
                        <p
                            className="truncate"
                            style={{
                                color: "var(--muted)",
                                fontSize: "11px",
                                marginTop: "2px",
                            }}
                        >
                            {setName}
                        </p>
                    )}

                    {/* Price + condition */}
                    <div className="flex items-center gap-2" style={{ marginTop: "8px" }}>
                        <span
                            style={{
                                color: "var(--foreground)",
                                fontSize: "16px",
                                fontWeight: 700,
                            }}
                        >
                            {price}
                        </span>
                        {condition && (
                            <span
                                className="uppercase"
                                style={{
                                    color: "var(--muted)",
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    backgroundColor: "var(--surface)",
                                    padding: "2px 6px",
                                    borderRadius: "8px",
                                }}
                            >
                                {condition.replace("_", " ")}
                            </span>
                        )}
                    </div>

                    {/* Seller row */}
                    {sellerName && (
                        <div className="flex items-center" style={{ marginTop: "8px" }}>
                            {listing.seller_avatar_url ? (
                                <img
                                    src={listing.seller_avatar_url}
                                    alt=""
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "8px",
                                    }}
                                />
                            ) : (
                                <div
                                    className="flex items-center justify-center"
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "8px",
                                        backgroundColor: "var(--surface)",
                                    }}
                                >
                                    <span style={{ fontSize: "8px", color: "var(--muted)" }}>
                                        {sellerName[0]?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <span
                                className="truncate"
                                style={{
                                    color: "var(--muted)",
                                    fontSize: "11px",
                                    marginLeft: "6px",
                                }}
                            >
                                {sellerName}
                            </span>
                            {isVerified && (
                                <span style={{ color: "var(--success)", fontSize: "11px", marginLeft: "3px" }}>
                                    ✓
                                </span>
                            )}
                            {city && (
                                <span style={{ color: "var(--muted)", fontSize: "10px", marginLeft: "8px" }}>
                                    · {city}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Chevron */}
                <div className="flex items-center shrink-0" style={{ paddingRight: "12px" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 3l5 5-5 5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
