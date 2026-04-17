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
        <Link href={`/marketplace/${listing.slug || listing.id}`} className="block group">
            <div className="flex overflow-hidden bg-surface-solid border border-border rounded-[6px]">
                {/* Thumbnail — sharp corners */}
                <div
                    className="shrink-0 relative overflow-hidden w-[80px] bg-surface"
                    style={{ aspectRatio: "63 / 88" }}
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
                            <span className="text-lg opacity-20 text-muted">?</span>
                        </div>
                    )}
                    {isFoil && (
                        <span
                            className="absolute top-1 left-1 text-[7px] font-bold uppercase px-1 py-px rounded-[2px] text-yellow"
                            style={{
                                backgroundColor: "color-mix(in srgb, var(--background) 70%, transparent)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            Foil
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 p-3">
                    {/* Title */}
                    <p className="line-clamp-2 m-0 text-foreground text-[13px] font-semibold leading-[17px]">
                        {name}
                    </p>

                    {/* Pills */}
                    <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-[4px] text-foreground bg-surface-solid border border-border">
                            {price}
                        </span>
                        {condition && (
                            <span className="uppercase text-[9px] font-semibold px-1.5 py-0.5 rounded-[4px] text-muted bg-surface">
                                {condition.replace("_", " ")}
                            </span>
                        )}
                        {rarity && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-[4px] text-muted bg-surface">
                                {rarity}
                            </span>
                        )}
                        {gameName && (
                            <span
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-[4px] text-accent"
                                style={{ backgroundColor: "rgba(59,130,246,0.08)" }}
                            >
                                {gameName}
                            </span>
                        )}
                        {setName && (
                            <span className="text-[9px] truncate text-muted">
                                {setName}
                            </span>
                        )}
                    </div>

                    {/* Seller */}
                    {sellerName && (
                        <div className="flex items-center gap-1.5">
                            {listing.seller_avatar_url ? (
                                <Image src={listing.seller_avatar_url} alt="" width={16} height={16} className="rounded-full" />
                            ) : (
                                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-surface">
                                    <span className="text-[8px] text-muted">{sellerName[0]?.toUpperCase()}</span>
                                </div>
                            )}
                            <span className="text-[11px] truncate text-muted">{sellerName}</span>
                            {isVerified && <span className="text-[11px] text-success">&#10003;</span>}
                            {city && <span className="text-[10px] text-muted">&middot; {city}</span>}
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
