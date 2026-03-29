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
    const isFoil = listing.is_foil;
    const gameName = listing.game_name;
    const rarity = listing.rarity;
    const sellerName = listing.seller_username || listing.tenant_name;
    const isVerified = !!(listing.is_verified_seller || listing.is_verified_store);
    const city = listing.city;
    const price =
        listing.price != null
            ? `$${listing.price.toLocaleString("es-CL")}`
            : "Consultar";

    return (
        <Link href={`/marketplace/${listing.id}`} className="block group">
            <div
                className="flex overflow-hidden"
                style={{
                    backgroundColor: "var(--surface-solid)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                }}
            >
                {/* Thumbnail — sharp corners */}
                <div
                    className="shrink-0 relative overflow-hidden"
                    style={{
                        width: 80,
                        aspectRatio: "63 / 88",
                        backgroundColor: "#0a0a0a",
                    }}
                >
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="80px"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-lg opacity-20" style={{ color: "var(--muted)" }}>?</span>
                        </div>
                    )}
                    {isFoil && (
                        <span
                            className="absolute top-1 left-1 text-[7px] font-bold uppercase px-1 py-px"
                            style={{ borderRadius: 2, color: "var(--yellow)", backgroundColor: "rgba(0,0,0,0.7)" }}
                        >
                            Foil
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5" style={{ padding: 12 }}>
                    {/* Title */}
                    <p
                        className="line-clamp-2 m-0"
                        style={{
                            color: "var(--foreground)",
                            fontSize: 13,
                            fontWeight: 600,
                            lineHeight: "17px",
                        }}
                    >
                        {name}
                    </p>

                    {/* Pills */}
                    <div className="flex flex-wrap items-center gap-1">
                        <span
                            className="text-xs font-bold px-2 py-0.5"
                            style={{
                                borderRadius: 4,
                                color: "var(--foreground)",
                                backgroundColor: "var(--surface-solid)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            {price}
                        </span>
                        {condition && (
                            <span
                                className="uppercase text-[9px] font-semibold px-1.5 py-0.5"
                                style={{ borderRadius: 4, color: "var(--muted)", backgroundColor: "var(--surface)" }}
                            >
                                {condition.replace("_", " ")}
                            </span>
                        )}
                        {rarity && (
                            <span
                                className="text-[9px] font-semibold px-1.5 py-0.5"
                                style={{ borderRadius: 4, color: "var(--muted)", backgroundColor: "var(--surface)" }}
                            >
                                {rarity}
                            </span>
                        )}
                        {gameName && (
                            <span
                                className="text-[9px] font-semibold px-1.5 py-0.5"
                                style={{ borderRadius: 4, color: "var(--accent)", backgroundColor: "rgba(59,130,246,0.08)" }}
                            >
                                {gameName}
                            </span>
                        )}
                        {setName && (
                            <span className="text-[9px] truncate" style={{ color: "var(--muted)" }}>
                                {setName}
                            </span>
                        )}
                    </div>

                    {/* Seller */}
                    {sellerName && (
                        <div className="flex items-center gap-1.5">
                            {listing.seller_avatar_url ? (
                                <img src={listing.seller_avatar_url} alt="" style={{ width: 16, height: 16, borderRadius: 8 }} />
                            ) : (
                                <div className="flex items-center justify-center" style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "var(--surface)" }}>
                                    <span style={{ fontSize: 8, color: "var(--muted)" }}>{sellerName[0]?.toUpperCase()}</span>
                                </div>
                            )}
                            <span className="text-[11px] truncate" style={{ color: "var(--muted)" }}>{sellerName}</span>
                            {isVerified && <span className="text-[11px]" style={{ color: "var(--success)" }}>✓</span>}
                            {city && <span className="text-[10px]" style={{ color: "var(--muted)" }}>· {city}</span>}
                        </div>
                    )}
                </div>

                {/* Chevron */}
                <div className="flex items-center shrink-0 pr-3">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M6 3l5 5-5 5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
