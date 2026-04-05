import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types/marketplace";

export default function SaleCard({ listing }: { listing: Listing }) {
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
    const price =
        listing.price != null
            ? `$${listing.price.toLocaleString("es-CL")}`
            : "Consultar";

    return (
        <Link href={`/marketplace/${listing.slug || listing.id}`} className="block h-full group">
            <div className="h-full flex flex-col">
                {/* Card image — sharp corners, TCG feel */}
                <div
                    className="relative w-full shrink-0 overflow-hidden rounded-[4px] bg-background"
                    style={{ aspectRatio: "63 / 88" }}
                >
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-2xl opacity-20 text-muted">?</span>
                        </div>
                    )}

                    {/* Foil indicator */}
                    {isFoil && (
                        <span
                            className="absolute top-1.5 left-1.5 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-[3px] text-yellow tracking-[0.5px]"
                            style={{
                                backgroundColor: "rgba(0,0,0,0.7)",
                                backdropFilter: "blur(4px)",
                            }}
                        >
                            Foil
                        </span>
                    )}
                </div>

                {/* Info — pills below the card */}
                <div className="flex flex-col gap-1.5 pt-2">
                    {/* Title */}
                    <p className="line-clamp-2 text-foreground text-[12px] font-semibold leading-[16px] min-h-[32px] m-0">
                        {name}
                    </p>

                    {/* Pills row */}
                    <div className="flex flex-wrap gap-1">
                        {/* Price pill */}
                        <span className="text-xs font-bold px-2 py-0.5 rounded-[4px] text-foreground bg-surface-solid border border-border">
                            {price}
                        </span>

                        {/* Condition pill */}
                        {condition && (
                            <span className="uppercase text-[9px] font-semibold px-1.5 py-0.5 rounded-[4px] text-muted bg-surface">
                                {condition.replace("_", " ")}
                            </span>
                        )}

                        {/* Rarity pill */}
                        {rarity && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-[4px] text-muted bg-surface">
                                {rarity}
                            </span>
                        )}
                    </div>

                    {/* Set + game */}
                    {(setName || gameName) && (
                        <p className="m-0 text-[10px] leading-[14px] text-muted">
                            {gameName && <span className="text-accent font-semibold">{gameName}</span>}
                            {gameName && setName && " · "}
                            {setName}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}
