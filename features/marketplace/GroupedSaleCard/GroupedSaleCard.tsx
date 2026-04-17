"use client";

import { memo } from "react";
import Link from "next/link";
import TradingCard from "@/components/ui/TradingCard";
import type { GroupedCard } from "@/lib/types/marketplace";

function GroupedSaleCard({ group }: { group: GroupedCard }) {
    const { card_name, card_image_url, min_price, seller_count, rarity, set_name, cheapest_listing_slug, cheapest_listing_id } = group;

    return (
        <Link href={`/marketplace/${cheapest_listing_slug || cheapest_listing_id}`} className="block h-full group">
            <div className="h-full flex flex-col">

                {/* Card — free floating */}
                <div className="relative w-full shrink-0">
                    {card_image_url ? (
                        <TradingCard
                            frontUrl={card_image_url}
                            alt={card_name}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                            showFlipButton={false}
                            className="w-full transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <div
                            className="relative w-full flex items-center justify-center"
                            style={{
                                aspectRatio: "63 / 88",
                                borderRadius: "4.75% / 3.5%",
                                background: "var(--surface-solid)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            <span className="text-2xl opacity-20 text-muted">?</span>
                        </div>
                    )}

                    {/* Sellers badge */}
                    {seller_count > 1 && (
                        <span
                            className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-[3px] tracking-[0.3px]"
                            style={{
                                backgroundColor: "color-mix(in srgb, var(--background) 75%, transparent)",
                                color: "var(--foreground)",
                                border: "1px solid var(--border)",
                                backdropFilter: "blur(4px)",
                                zIndex: 10,
                            }}
                        >
                            {seller_count} vendedores
                        </span>
                    )}
                </div>

                {/* Info — below card */}
                <div className="flex flex-col gap-1 pt-2">
                    <p className="line-clamp-2 text-foreground text-[12px] font-semibold leading-[15px] min-h-[30px] m-0">
                        {card_name}
                    </p>

                    {/* Price */}
                    {min_price > 0 ? (
                        <div className="flex items-baseline gap-[2px] leading-none mt-0.5">
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", lineHeight: 1 }}>$</span>
                            <span style={{ fontSize: 18, fontWeight: 900, color: "var(--foreground)", letterSpacing: "-0.5px", lineHeight: 1 }}>
                                {min_price.toLocaleString("es-CL")}
                            </span>
                        </div>
                    ) : (
                        <span className="text-[11px] text-muted font-semibold mt-0.5">Consultar</span>
                    )}

                    {/* Meta */}
                    {(rarity || set_name) && (
                        <div className="flex flex-wrap gap-[3px] mt-0.5">
                            {rarity && (
                                <span className="text-[8px] font-semibold text-muted bg-surface px-[5px] py-[2px] rounded-[3px] border border-border uppercase tracking-wide">
                                    {rarity}
                                </span>
                            )}
                            {set_name && (
                                <span className="text-[8px] text-muted truncate max-w-[80px] py-[2px]">
                                    {set_name}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default memo(GroupedSaleCard);
