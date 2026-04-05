import Link from "next/link";
import Image from "next/image";
import type { GroupedCard } from "@/lib/types/marketplace";

export default function GroupedSaleCardList({ group }: { group: GroupedCard }) {
    const { card_name, card_image_url, min_price, seller_count, game_name, set_name, rarity, cheapest_listing_slug, cheapest_listing_id } = group;
    const imageUrl = card_image_url;
    const price = min_price > 0 ? `Desde $${min_price.toLocaleString("es-CL")}` : "Consultar";
    const sellersLabel = seller_count === 1 ? "1 vendedor" : `${seller_count} vendedores`;

    return (
        <Link href={`/marketplace/${cheapest_listing_slug || cheapest_listing_id}`} className="block group">
            <div className="flex overflow-hidden bg-surface-solid border border-border rounded-[6px]">
                {/* Thumbnail */}
                <div
                    className="shrink-0 relative overflow-hidden w-[80px] bg-[#0a0a0a]"
                    style={{ aspectRatio: "63 / 88" }}
                >
                    {imageUrl ? (
                        <Image src={imageUrl} alt={card_name} fill className="object-cover" sizes="80px" />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-lg opacity-20 text-muted">?</span>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 p-3">
                    <p className="line-clamp-2 m-0 text-foreground text-[13px] font-semibold leading-[17px]">
                        {card_name}
                    </p>

                    {/* Pills */}
                    <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-[4px] text-foreground bg-surface-solid border border-border">
                            {price}
                        </span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-[4px] text-muted bg-surface">
                            {sellersLabel}
                        </span>
                        {rarity && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-[4px] text-muted bg-surface">
                                {rarity}
                            </span>
                        )}
                        {game_name && (
                            <span
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-[4px] text-accent"
                                style={{ backgroundColor: "rgba(59,130,246,0.08)" }}
                            >
                                {game_name}
                            </span>
                        )}
                        {set_name && (
                            <span className="text-[9px] truncate text-muted">
                                {set_name}
                            </span>
                        )}
                    </div>
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
