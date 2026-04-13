"use client";

import { memo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/utils/format";
import { ArrowShapeTurnUpRight, MapPin } from "@gravity-ui/icons";
import { toast } from "@heroui/react/toast";
import TradingCard from "@/components/ui/TradingCard";

import type { Listing } from "@/lib/types/marketplace";

function getBackUrl(url: string | undefined): string | null {
    if (!url?.includes("/front/")) return null;
    return url.replace("/front/", "/back/");
}

function FlipIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
        </svg>
    );
}

const CONDITION_COLORS: Record<string, string> = {
    M: "#22c55e", MINT: "#22c55e", NM: "#22c55e",
    LP: "#eab308", MP: "#f97316",
    HP: "#ef4444", DMG: "#ef4444",
};

function fmtPrice(n: number) {
    return n.toLocaleString("es-CL");
}

function FeedListingCard({ listing }: { listing: Listing }) {
    const router = useRouter();
    const imageUrl = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url || listing.card_image_url;
    const backUrl = getBackUrl(imageUrl);
    const isDFC = !!backUrl && listing.card_name?.includes(" // ");
    const href = `/marketplace/${listing.slug || listing.id}`;

    const [flipped, setFlipped] = useState(false);

    const sellerName = listing.seller_username || listing.tenant_name || "Vendedor";
    const isStore = !!listing.tenant_name || listing.is_verified_store || listing.is_verified_seller;
    const condColor = CONDITION_COLORS[listing.card_condition ?? ""] ?? "var(--muted)";

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `https://rankeao.cl/marketplace/${listing.slug || listing.id}`;
        if (navigator.share) navigator.share({ title: listing.title, url }).catch(() => {});
        else navigator.clipboard.writeText(url).then(() => toast.success("Enlace copiado")).catch(() => {});
    };

    const handleBuy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(href);
    };

    return (
        <div className="relative">
            <Link href={href} className="no-underline block">
                <article className="grid grid-cols-2 items-stretch">

                    {/* ── Izquierda: carta libre ── */}
                    <div className="self-center" style={{ padding: "8px 4px 8px 0" }}>
                        {imageUrl ? (
                            <TradingCard
                                frontUrl={imageUrl}
                                backUrl={isDFC ? backUrl : null}
                                flipped={isDFC ? flipped : undefined}
                                alt={listing.title}
                                sizes="(max-width: 640px) 48vw, 300px"
                                className="w-full"
                            />
                        ) : (
                            <div
                                className="w-full"
                                style={{
                                    aspectRatio: "63 / 88",
                                    borderRadius: "4.75% / 3.5%",
                                    background: "var(--surface-solid)",
                                    border: "1px solid var(--border)",
                                }}
                            />
                        )}
                    </div>

                    {/* ── Derecha: info ── */}
                    <div
                        className="flex flex-col overflow-hidden"
                        style={{
                            borderRadius: 10,
                            background: "var(--surface-solid)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            containerType: "inline-size",
                        }}
                    >
                        {/* Cabecera */}
                        <div style={{ padding: "10px 10px 10px 12px", display: "flex", alignItems: "flex-start", gap: 6 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p className="m-0 text-[12px] font-bold text-foreground leading-[1.3] line-clamp-2">
                                    {listing.title}
                                </p>
                                <span className="text-[9px] text-muted mt-[5px] block">
                                    {timeAgo(listing.created_at, { verbose: true })}
                                </span>
                            </div>
                            <button
                                onClick={handleShare}
                                style={{
                                    flexShrink: 0,
                                    width: 26, height: 26,
                                    borderRadius: 8,
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--muted)",
                                }}
                            >
                                <ArrowShapeTurnUpRight style={{ width: 11, height: 11 }} />
                            </button>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: "var(--border)", margin: "0 12px" }} />

                        {/* Pills */}
                        {(listing.card_condition || listing.rarity || listing.set_name) && (
                            <div className="flex flex-wrap gap-[5px]" style={{ padding: "8px 12px" }}>
                                {listing.card_condition && (
                                    <span
                                        className="text-[9px] font-bold px-[5px] py-[2px] rounded-[4px] border uppercase tracking-wide"
                                        style={{
                                            color: condColor,
                                            background: `${condColor}18`,
                                            borderColor: `${condColor}40`,
                                        }}
                                    >
                                        {listing.card_condition}{listing.is_foil ? " ✦" : ""}
                                    </span>
                                )}
                                {listing.rarity && (
                                    <span className="text-[9px] font-semibold text-muted bg-surface px-[5px] py-[2px] rounded-[4px] border border-border uppercase tracking-wide">
                                        {listing.rarity}
                                    </span>
                                )}
                                {listing.set_name && (
                                    <span className="text-[9px] text-muted truncate max-w-[90px] py-[2px]">
                                        {listing.set_name}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Precio — bloque central dominante */}
                        <div style={{ padding: "4px 10px 8px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                            {listing.price != null ? (
                                <div style={{ width: "100%", textAlign: "center" }}>
                                    <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.22)", letterSpacing: "0.5px", display: "block", lineHeight: 1, marginBottom: 2 }}>
                                        PRECIO
                                    </span>
                                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 1, lineHeight: 1, width: "100%" }}>
                                        <span style={{ fontSize: "10cqw", fontWeight: 600, color: "rgba(255,255,255,0.30)", lineHeight: 1, marginBottom: "0.15em" }}>$</span>
                                        <span style={{ fontSize: "26cqw", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>
                                            {fmtPrice(listing.price)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ width: "100%", textAlign: "center" }}>
                                    <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.22)", letterSpacing: "0.5px", display: "block", lineHeight: 1, marginBottom: 4 }}>
                                        PRECIO
                                    </span>
                                    <span className="text-[13px] text-muted font-semibold">Consultar</span>
                                </div>
                            )}
                        </div>

                        {/* CTA */}
                        <div style={{ padding: "0 10px 10px" }}>
                            <button
                                onClick={handleBuy}
                                style={{
                                    width: "100%",
                                    padding: "8px 0",
                                    borderRadius: 10,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: "0.3px",
                                    cursor: "pointer",
                                    background: "var(--foreground)",
                                    color: "var(--background)",
                                    border: "none",
                                    transition: "opacity 0.15s",
                                }}
                            >
                                Comprar ahora
                            </button>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: "var(--border)" }} />

                        {/* Vendedor */}
                        <div className="flex items-center gap-[8px]" style={{ padding: "8px 10px" }}>
                            <div
                                className="shrink-0 overflow-hidden flex items-center justify-center"
                                style={{
                                    width: 30, height: 30,
                                    borderRadius: "50%",
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                    fontSize: 12, fontWeight: 700,
                                    color: "var(--foreground)",
                                }}
                            >
                                {listing.seller_avatar_url ? (
                                    <Image src={listing.seller_avatar_url} alt={sellerName} width={30} height={30} className="w-full h-full object-cover" />
                                ) : sellerName[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-[3px]">
                                    <span className="truncate text-[12px] font-semibold text-foreground leading-none">
                                        {sellerName}
                                    </span>
                                    {isStore && (
                                        <span style={{ fontSize: 10, color: "var(--success)", fontWeight: 700 }}>✓</span>
                                    )}
                                </div>
                                {listing.city && (
                                    <span className="text-[9px] text-muted flex items-center gap-[2px] mt-[3px]">
                                        <MapPin style={{ width: 8, height: 8 }} />{listing.city}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                </article>
            </Link>

            {/* ── Botón Girar — FUERA del Link ── */}
            {isDFC && imageUrl && (
                <button
                    onClick={() => setFlipped(f => !f)}
                    aria-label={flipped ? "Ver frente" : "Girar carta"}
                    style={{
                        position: "absolute",
                        top: 10,
                        left: "calc(50% - 44px)",
                        zIndex: 10,
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.68)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        border: "1.5px solid rgba(255,255,255,0.28)",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.55)",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.9)",
                    }}
                >
                    <FlipIcon />
                </button>
            )}
        </div>
    );
}

export default memo(FeedListingCard);
