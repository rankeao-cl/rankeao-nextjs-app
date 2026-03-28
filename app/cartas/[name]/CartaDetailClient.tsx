"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "@gravity-ui/icons";
import { scryfallCardByName } from "@/lib/api/catalog";
import RankeaoSpinner from "@/components/RankeaoSpinner";

interface Printing {
    id?: string;
    set_code?: string;
    set_name?: string;
    collector_number?: string;
    rarity?: string;
    image_url?: string;
    image_url_small?: string;
    image_url_art?: string;
    is_foil_available?: boolean;
    is_nonfoil_available?: boolean;
    artist?: string;
    price_usd?: string;
    price_clp?: number;
}

// Normalized card shape used for display
interface CardView {
    name: string;
    type_line: string;
    oracle_text: string;
    flavor_text: string;
    mana_cost: string;
    cmc: number;
    colors: string[];
    image_url: string;
    image_url_small: string;
    rarity: string;
    set_name: string;
    set_code: string;
    artist: string;
    price_usd?: string;
    is_foil: boolean;
    printings: Printing[];
    legality: { format_slug: string; format_name: string; legality: string }[];
    source: string;
    power?: string;
    toughness?: string;
    loyalty?: string;
    keywords?: string[];
}

const rarityColor: Record<string, string> = {
    common: "var(--muted)",
    uncommon: "#C0C0C0",
    rare: "#FFD700",
    mythic: "#F06B2A",
    special: "#9B59B6",
};

const legalityColor: Record<string, string> = {
    LEGAL: "var(--success)",
    BANNED: "var(--danger)",
    RESTRICTED: "var(--warning)",
    NOT_LEGAL: "var(--muted)",
    legal: "var(--success)",
    banned: "var(--danger)",
    restricted: "var(--warning)",
    not_legal: "var(--muted)",
};

function normalizeCard(data: any): CardView | null {
    if (!data) return null;

    const source = data.source || "unknown";

    // Case 1: Card from DB (has .card with .printings)
    if (data.card && data.card.name) {
        const c = data.card;
        const meta = c.metadata || {};
        const p0 = c.printings?.[0];
        return {
            name: c.name,
            type_line: c.type_line || "",
            oracle_text: c.oracle_text || "",
            flavor_text: c.flavor_text || "",
            mana_cost: meta.mana_cost || "",
            cmc: meta.cmc || 0,
            colors: meta.colors || [],
            image_url: p0?.image_url || p0?.image_url_small || "",
            image_url_small: p0?.image_url_small || p0?.image_url || "",
            rarity: p0?.rarity || "",
            set_name: p0?.set_name || "",
            set_code: p0?.set_code || "",
            artist: p0?.artist || "",
            price_usd: p0?.price_usd,
            is_foil: p0?.is_foil_available || false,
            printings: c.printings || [],
            legality: c.legality || [],
            source,
            power: meta.power,
            toughness: meta.toughness,
            loyalty: meta.loyalty,
            keywords: meta.keywords,
        };
    }

    // Case 2: Raw Scryfall card (DB save failed)
    if (data.scryfall_card && data.scryfall_card.name) {
        const sc = data.scryfall_card;
        const imgs = sc.image_uris || sc.card_faces?.[0]?.image_uris || {};
        return {
            name: sc.name,
            type_line: sc.type_line || sc.card_faces?.[0]?.type_line || "",
            oracle_text: sc.oracle_text || sc.card_faces?.map((f: any) => f.oracle_text).filter(Boolean).join(" // ") || "",
            flavor_text: sc.flavor_text || "",
            mana_cost: sc.mana_cost || "",
            cmc: sc.cmc || 0,
            colors: sc.colors || sc.card_faces?.[0]?.colors || [],
            image_url: imgs.normal || imgs.large || "",
            image_url_small: imgs.small || imgs.normal || "",
            rarity: sc.rarity || "",
            set_name: sc.set_name || "",
            set_code: sc.set || "",
            artist: sc.artist || "",
            price_usd: sc.prices?.usd,
            is_foil: sc.finishes?.includes("foil") || false,
            printings: [],
            legality: Object.entries(sc.legalities || {}).map(([slug, status]) => ({
                format_slug: slug,
                format_name: slug.charAt(0).toUpperCase() + slug.slice(1),
                legality: status as string,
            })),
            source,
            power: sc.power,
            toughness: sc.toughness,
            loyalty: sc.loyalty,
            keywords: sc.keywords,
        };
    }

    return null;
}

export default function CartaDetailClient({ cardName }: { cardName: string }) {
    const [card, setCard] = useState<CardView | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedPrinting, setSelectedPrinting] = useState(0);

    useEffect(() => {
        setLoading(true);
        setError("");
        scryfallCardByName(cardName)
            .then((res: any) => {
                const normalized = normalizeCard(res?.data);
                if (normalized) {
                    setCard(normalized);
                } else {
                    setError("Carta no encontrada");
                }
            })
            .catch((err: any) => {
                console.error("Error loading card:", err);
                setError("No se pudo cargar la carta");
            })
            .finally(() => setLoading(false));
    }, [cardName]);

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
                <RankeaoSpinner className="h-10 w-auto" />
            </div>
        );
    }

    if (error || !card) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
                <span className="text-3xl opacity-30">?</span>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{error || "Carta no encontrada"}</p>
                <Link href="/cartas" className="text-xs font-semibold" style={{ color: "var(--accent)", textDecoration: "none" }}>
                    Volver a buscar
                </Link>
            </div>
        );
    }

    // If there are multiple printings, use the selected one for image
    const printing = card.printings[selectedPrinting];
    const imgUrl = printing?.image_url || printing?.image_url_small || card.image_url || card.image_url_small;

    return (
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "16px" }}>
            {/* Back */}
            <Link href="/cartas" className="inline-flex items-center gap-1 mb-4 text-sm font-semibold" style={{ color: "var(--muted)", textDecoration: "none" }}>
                <ChevronLeft style={{ width: 16, height: 16 }} /> Buscar cartas
            </Link>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Card image */}
                <div className="shrink-0 mx-auto md:mx-0">
                    <div className="relative" style={{ width: 300, aspectRatio: "63 / 88", borderRadius: 8, overflow: "hidden", backgroundColor: "#0a0a0a" }}>
                        {imgUrl ? (
                            <Image src={imgUrl} alt={card.name} fill className="object-cover" sizes="300px" priority />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <span className="text-4xl opacity-20" style={{ color: "var(--muted)" }}>?</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Card info */}
                <div className="flex-1 min-w-0 flex flex-col gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold m-0" style={{ color: "var(--foreground)" }}>{card.name}</h1>
                        {card.type_line && <p className="text-sm mt-1 m-0" style={{ color: "var(--muted)" }}>{card.type_line}</p>}
                    </div>

                    {/* Pills */}
                    <div className="flex flex-wrap gap-2">
                        {card.mana_cost && (
                            <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
                                {card.mana_cost}
                            </span>
                        )}
                        {card.cmc > 0 && (
                            <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>
                                CMC {card.cmc}
                            </span>
                        )}
                        {card.colors.length > 0 && (
                            <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>
                                {card.colors.join(", ")}
                            </span>
                        )}
                        {card.power && card.toughness && (
                            <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
                                {card.power}/{card.toughness}
                            </span>
                        )}
                        {card.loyalty && (
                            <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
                                Loyalty: {card.loyalty}
                            </span>
                        )}
                        {card.rarity && (
                            <span className="text-xs font-semibold px-2 py-1 rounded uppercase" style={{ backgroundColor: "var(--surface)", color: rarityColor[card.rarity] ?? "var(--muted)" }}>
                                {card.rarity}
                            </span>
                        )}
                        {card.price_usd && (
                            <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                                ${card.price_usd} USD
                            </span>
                        )}
                        {card.is_foil && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded uppercase" style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "var(--yellow)" }}>
                                Foil
                            </span>
                        )}
                        <span className="text-[10px] font-semibold px-2 py-1 rounded" style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>
                            {card.source === "db" ? "catálogo" : "scryfall"}
                        </span>
                    </div>

                    {/* Oracle text */}
                    {card.oracle_text && (
                        <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--surface-solid)", borderColor: "var(--border)" }}>
                            <p className="text-sm leading-[22px] m-0 whitespace-pre-line" style={{ color: "var(--foreground)" }}>
                                {card.oracle_text}
                            </p>
                        </div>
                    )}

                    {/* Flavor text */}
                    {card.flavor_text && (
                        <p className="text-sm italic m-0 leading-[20px] px-4" style={{ color: "var(--muted)", borderLeft: "2px solid var(--border)" }}>
                            {card.flavor_text}
                        </p>
                    )}

                    {/* Keywords */}
                    {card.keywords && card.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {card.keywords.map((kw) => (
                                <span key={kw} className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(59,130,246,0.08)", color: "var(--accent)" }}>
                                    {kw}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Set info */}
                    {(card.set_name || card.artist) && (
                        <div className="flex flex-wrap gap-2 text-xs" style={{ color: "var(--muted)" }}>
                            {card.set_code && <span className="font-bold">{card.set_code.toUpperCase()}</span>}
                            {card.set_name && <span>{card.set_name}</span>}
                            {card.artist && <span>Art: {card.artist}</span>}
                        </div>
                    )}

                    {/* Printing selector */}
                    {card.printings.length > 1 && (
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted)" }}>
                                Ediciones ({card.printings.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {card.printings.map((p, i) => (
                                    <button
                                        key={p.id || i}
                                        onClick={() => setSelectedPrinting(i)}
                                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                                        style={{
                                            border: `1px solid ${selectedPrinting === i ? "var(--accent)" : "var(--border)"}`,
                                            backgroundColor: selectedPrinting === i ? "rgba(59,130,246,0.1)" : "transparent",
                                            color: selectedPrinting === i ? "var(--accent)" : "var(--muted)",
                                        }}
                                    >
                                        {p.set_code?.toUpperCase()} #{p.collector_number}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Legality */}
                    {card.legality.length > 0 && (
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted)" }}>
                                Legalidad
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {card.legality
                                    .filter((l) => l.legality !== "not_legal" && l.legality !== "NOT_LEGAL")
                                    .map((l) => (
                                    <span
                                        key={l.format_slug}
                                        className="text-[10px] font-semibold px-2 py-1 rounded"
                                        style={{
                                            backgroundColor: "var(--surface)",
                                            color: legalityColor[l.legality] ?? "var(--muted)",
                                        }}
                                    >
                                        {l.format_name || l.format_slug}: {l.legality.toLowerCase().replace("_", " ")}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
