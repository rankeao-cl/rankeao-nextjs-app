import Link from "next/link";
import TradingCard from "@/components/ui/TradingCard";
import type { GroupedCard } from "@/lib/types/marketplace";

export default function GroupedSaleCardList({ group }: { group: GroupedCard }) {
    const { card_name, card_image_url, min_price, seller_count, rarity, set_name, game_name, cheapest_listing_slug, cheapest_listing_id } = group;
    const sellersLabel = seller_count === 1 ? "1 vendedor" : `${seller_count} vendedores`;

    return (
        <Link href={`/marketplace/${cheapest_listing_slug || cheapest_listing_id}`} className="block group">
            <div
                className="flex items-center gap-3 rounded-xl"
                style={{
                    background: "var(--surface-solid)",
                    border: "1px solid var(--border)",
                    padding: "10px 12px 10px 10px",
                }}
            >
                {/* Thumbnail */}
                <div className="shrink-0 w-[52px] self-center">
                    {card_image_url ? (
                        <TradingCard
                            frontUrl={card_image_url}
                            alt={card_name}
                            sizes="52px"
                            showFlipButton={false}
                            className="w-full"
                        />
                    ) : (
                        <div
                            className="w-full flex items-center justify-center"
                            style={{
                                aspectRatio: "63 / 88",
                                borderRadius: "4.75% / 3.5%",
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            <span className="text-sm opacity-20 text-muted">?</span>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p className="line-clamp-2 m-0 text-foreground text-[13px] font-semibold leading-[17px]">
                        {card_name}
                    </p>

                    {/* Price */}
                    {min_price > 0 ? (
                        <div className="flex items-baseline gap-[2px] leading-none">
                            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.30)", lineHeight: 1 }}>$</span>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "var(--foreground)", letterSpacing: "-0.5px", lineHeight: 1 }}>
                                {min_price.toLocaleString("es-CL")}
                            </span>
                        </div>
                    ) : (
                        <span className="text-[12px] text-muted font-semibold">Consultar</span>
                    )}

                    {/* Pills */}
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        <span className="text-[8px] font-semibold text-muted bg-surface px-[5px] py-[2px] rounded-[3px] border border-border">
                            {sellersLabel}
                        </span>
                        {rarity && (
                            <span className="text-[8px] font-semibold text-muted bg-surface px-[5px] py-[2px] rounded-[3px] border border-border uppercase tracking-wide">
                                {rarity}
                            </span>
                        )}
                        {game_name && (
                            <span className="text-[8px] font-semibold text-accent px-[5px] py-[2px] rounded-[3px]"
                                style={{ backgroundColor: "rgba(59,130,246,0.08)" }}>
                                {game_name}
                            </span>
                        )}
                        {set_name && (
                            <span className="text-[8px] text-muted truncate max-w-[80px]">{set_name}</span>
                        )}
                    </div>
                </div>

                {/* Chevron */}
                <div className="shrink-0">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M6 3l5 5-5 5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}
