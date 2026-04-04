import Link from "next/link";
import Image from "next/image";
import type { GroupedCard } from "@/lib/types/marketplace";

export default function GroupedSaleCard({ group }: { group: GroupedCard }) {
    const { representative, card_name, card_image_url, min_price, seller_count, game_name, set_name, rarity } = group;
    const imageUrl = card_image_url;
    const price = min_price > 0 ? `Desde $${min_price.toLocaleString("es-CL")}` : "Consultar";
    const sellersLabel = seller_count === 1 ? "1 vendedor" : `${seller_count} vendedores`;

    return (
        <Link href={`/marketplace/${representative.slug || representative.id}`} className="block h-full group">
            <div className="h-full flex flex-col">
                {/* Card image */}
                <div
                    className="relative w-full shrink-0 overflow-hidden"
                    style={{ aspectRatio: "63 / 88", borderRadius: 4, backgroundColor: "#0a0a0a" }}
                >
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={card_name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-2xl opacity-20" style={{ color: "var(--muted)" }}>?</span>
                        </div>
                    )}

                    {/* Sellers badge */}
                    {seller_count > 1 && (
                        <span
                            className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5"
                            style={{
                                borderRadius: 3,
                                color: "#fff",
                                backgroundColor: "rgba(0,0,0,0.7)",
                                backdropFilter: "blur(4px)",
                                letterSpacing: "0.3px",
                            }}
                        >
                            {sellersLabel}
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1.5 pt-2">
                    <p
                        className="line-clamp-2"
                        style={{
                            color: "var(--foreground)",
                            fontSize: 12,
                            fontWeight: 600,
                            lineHeight: "16px",
                            minHeight: 32,
                            margin: 0,
                        }}
                    >
                        {card_name}
                    </p>

                    {/* Pills */}
                    <div className="flex flex-wrap gap-1">
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

                        {rarity && (
                            <span
                                className="text-[9px] font-semibold px-1.5 py-0.5"
                                style={{ borderRadius: 4, color: "var(--muted)", backgroundColor: "var(--surface)" }}
                            >
                                {rarity}
                            </span>
                        )}
                    </div>

                    {/* Set + game */}
                    {(set_name || game_name) && (
                        <p className="m-0 text-[10px] leading-[14px]" style={{ color: "var(--muted)" }}>
                            {game_name && <span style={{ color: "var(--accent)", fontWeight: 600 }}>{game_name}</span>}
                            {game_name && set_name && " · "}
                            {set_name}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}
