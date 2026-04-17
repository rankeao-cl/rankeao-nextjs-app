import Link from "next/link";
import TradingCard from "@/components/ui/TradingCard";
import type { Listing } from "@/lib/types/marketplace";

export default function SaleCard({ listing }: { listing: Listing }) {
    const imageUrl =
        listing.images?.[0]?.thumbnail_url ||
        listing.images?.[0]?.url ||
        listing.card_image_url;

    const name = listing.title || listing.card_name || "Sin titulo";

    return (
        <Link href={`/marketplace/${listing.slug || listing.id}`} className="block h-full group">
            <div className="h-full flex flex-col">
                {/* Card — free floating */}
                <div className="w-full shrink-0">
                    {imageUrl ? (
                        <TradingCard
                            frontUrl={imageUrl}
                            alt={name}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                            showFlipButton={false}
                            className="w-full transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <div
                            className="w-full flex items-center justify-center"
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
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1 pt-2">
                    <p className="line-clamp-2 text-foreground text-[12px] font-semibold leading-[15px] min-h-[30px] m-0">
                        {name}
                    </p>

                    {listing.price != null ? (
                        <div className="flex items-baseline gap-[2px] leading-none mt-0.5">
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", lineHeight: 1 }}>$</span>
                            <span style={{ fontSize: 18, fontWeight: 900, color: "var(--foreground)", letterSpacing: "-0.5px", lineHeight: 1 }}>
                                {listing.price.toLocaleString("es-CL")}
                            </span>
                        </div>
                    ) : (
                        <span className="text-[11px] text-muted font-semibold mt-0.5">Consultar</span>
                    )}

                    {(listing.card_condition || listing.rarity || listing.is_foil) && (
                        <div className="flex flex-wrap gap-[3px] mt-0.5">
                            {listing.card_condition && (
                                <span className="text-[8px] font-semibold text-muted bg-surface px-[5px] py-[2px] rounded-[3px] border border-border uppercase tracking-wide">
                                    {listing.card_condition}{listing.is_foil ? " ✦" : ""}
                                </span>
                            )}
                            {listing.rarity && (
                                <span className="text-[8px] font-semibold text-muted bg-surface px-[5px] py-[2px] rounded-[3px] border border-border uppercase tracking-wide">
                                    {listing.rarity}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
