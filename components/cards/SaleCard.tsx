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
    const price =
        listing.price != null
            ? `$${listing.price.toLocaleString("es-CL")}`
            : "Consultar";

    return (
        <Link href={`/marketplace/${listing.id}`} className="block h-full">
            <div
                className="rounded-2xl overflow-hidden h-full flex flex-col"
                style={{
                    backgroundColor: "#1A1A1E",
                    border: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                {/* Image — fixed aspect ratio, cover to fill uniformly */}
                <div
                    className="relative w-full shrink-0"
                    style={{
                        aspectRatio: "63 / 88",
                        backgroundColor: "#111113",
                    }}
                >
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-3xl opacity-30">🃏</span>
                        </div>
                    )}
                </div>

                {/* Body — fixed height so all cards align */}
                <div className="flex flex-col flex-1" style={{ padding: "10px" }}>
                    {/* Title — always 2 lines tall */}
                    <p
                        className="line-clamp-2"
                        style={{
                            color: "#F2F2F2",
                            fontSize: "12px",
                            fontWeight: 600,
                            lineHeight: "16px",
                            minHeight: "32px",
                        }}
                    >
                        {name}
                    </p>

                    {/* Set name — always 1 line tall */}
                    <p
                        className="truncate"
                        style={{
                            color: "#888891",
                            fontSize: "10px",
                            marginTop: "2px",
                            minHeight: "14px",
                        }}
                    >
                        {setName || "\u00A0"}
                    </p>

                    {/* Price + condition — pushed to bottom */}
                    <div
                        className="flex items-center justify-between mt-auto"
                        style={{ paddingTop: "6px" }}
                    >
                        <span
                            style={{
                                color: "#F2F2F2",
                                fontSize: "14px",
                                fontWeight: 700,
                            }}
                        >
                            {price}
                        </span>
                        {condition && (
                            <span
                                className="uppercase"
                                style={{
                                    color: "#888891",
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    backgroundColor: "rgba(255,255,255,0.06)",
                                    padding: "2px 6px",
                                    borderRadius: "8px",
                                }}
                            >
                                {condition.replace("_", " ")}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
