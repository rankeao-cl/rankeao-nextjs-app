"use client";

import { useEffect, useState, useMemo, Fragment, useCallback } from "react";
import Link from "next/link";
import { toast } from "@heroui/react";
import { useDeck } from "@/lib/hooks/use-social";
import type { DeckCard } from "@/lib/types/social";

interface DeckFanModalProps {
    deckId: string;
    onClose: () => void;
}

// Shape of the deck object as returned by the API (fields vary by endpoint)
interface RawDeck {
    id?: string;
    name?: string;
    cards?: RawCard[];
    game_name?: string;
    game?: string;
    format_name?: string;
    format?: string;
    username?: string;
    avatar_url?: string;
    owner?: { username?: string; avatar_url?: string };
    user?: { username?: string; avatar_url?: string };
}

type RawCard = DeckCard & { board?: string };

const MAX_ANGLE = 22;
const MAX_FAN = 10;
const CARD_RATIO = 1.4;       // height / width
const OVERLAP = 0.72;         // fraction of each card visible
const MAX_CARD_W = 240;
const MIN_CARD_W = 110;
const CARD_LIFT = 0.30; // cartas suben 30% de su altura dentro del contenedor

interface Layout {
    cardW: number;
    cardH: number;
    originY: number;
    containerH: number;
    liftPx: number;
}

function calcLayout(fanCount: number, winWidth: number): Layout {
    const n = Math.max(fanCount, 2);
    const availW = winWidth * 0.78;
    const rawW = availW / (OVERLAP * (n - 1) + 1);
    const cardW = Math.round(Math.min(MAX_CARD_W, Math.max(MIN_CARD_W, rawW)));
    const cardH = Math.round(cardW * CARD_RATIO);
    const arcW = cardW * OVERLAP * (n - 1) + cardW;
    const originY = Math.round((arcW / 2) / Math.sin((MAX_ANGLE * Math.PI) / 180));
    const rise = Math.round(originY * (1 - Math.cos((MAX_ANGLE * Math.PI) / 180)));
    const liftPx = Math.round(cardH * CARD_LIFT);
    const containerH = cardH + rise + liftPx + 20;
    return { cardW, cardH, originY, containerH, liftPx };
}

type UniqueCard = DeckCard & { board?: string; totalQty: number };

export default function DeckFanModal({ deckId, onClose }: DeckFanModalProps) {
    const deckQuery = useDeck(deckId);
    const rawData = deckQuery.data as { data?: { deck?: RawDeck; [k: string]: unknown }; deck?: RawDeck; [k: string]: unknown } | null | undefined;
    const deck: RawDeck | null = rawData?.data?.deck ?? (rawData?.deck as RawDeck | undefined) ?? (rawData?.data as RawDeck | undefined) ?? null;

    const mainCards = useMemo<RawCard[]>(() =>
        (deck?.cards ?? []).filter(c => !c.board || c.board === "MAIN"),
    [deck?.cards]);

    const uniqueCards = useMemo<UniqueCard[]>(() => {
        const map = new Map<string, UniqueCard>();
        for (const card of mainCards) {
            const key = card.card_id || card.card_name;
            const existing = map.get(key);
            if (existing) {
                existing.totalQty += card.quantity ?? 1;
            } else {
                map.set(key, { ...card, totalQty: card.quantity ?? 1 });
            }
        }
        return Array.from(map.values()).slice(0, MAX_FAN);
    }, [mainCards]);

    const fanCount = uniqueCards.length > 0 ? uniqueCards.length : MAX_FAN;

    const deckStats = useMemo(() => {
        const allCards = deck?.cards ?? [];
        if (allCards.length === 0) return null;
        const boards: Record<string, { total: number; unique: number }> = {};
        for (const c of allCards) {
            const b = c.board ?? "MAIN";
            if (!boards[b]) boards[b] = { total: 0, unique: 0 };
            boards[b].total += c.quantity ?? 1;
            boards[b].unique += 1;
        }
        const mainTotal  = boards["MAIN"]?.total ?? 0;
        const mainUnique = boards["MAIN"]?.unique ?? 0;
        const sideTotal  = boards["SIDE"]?.total ?? 0;
        const extraTotal = boards["EXTRA"]?.total ?? 0;
        const grandTotal = allCards.reduce((s, c) => s + (c.quantity ?? 1), 0);
        return { mainTotal, mainUnique, sideTotal, extraTotal, grandTotal };
    }, [deck?.cards]);

    const [windowWidth, setWindowWidth] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth : 900
    );
    const [selectedCard, setSelectedCard] = useState<UniqueCard | null>(null);

    useEffect(() => {
        const onResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const layout = useMemo<Layout>(() => calcLayout(fanCount, windowWidth), [fanCount, windowWidth]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (selectedCard) setSelectedCard(null);
                else onClose();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose, selectedCard]);

    const getAngle = (i: number, total: number) => {
        if (total <= 1) return 0;
        return (i / (total - 1)) * 2 * MAX_ANGLE - MAX_ANGLE;
    };

    // Center card gets highest z-index; multiply by 10 so shadows fit between
    const getBaseZ = (i: number, total: number) =>
        (total - Math.abs(i - Math.floor((total - 1) / 2))) * 10;

    const { cardW, cardH, originY, containerH, liftPx } = layout;

    const copyDeck = useCallback(() => {
        if (!deck) return;
        const allCards = deck.cards ?? [];
        const boards: Record<string, RawCard[]> = {};
        for (const c of allCards) {
            const b = c.board ?? "MAIN";
            if (!boards[b]) boards[b] = [];
            boards[b].push(c);
        }
        const boardLabel: Record<string, string> = { MAIN: "Maindeck", SIDE: "Sideboard", EXTRA: "Extra", MAYBE: "Maybe" };
        const lines: string[] = [];
        const deckName   = deck.name ?? "Mazo";
        const gameName   = deck.game_name ?? deck.game ?? "";
        const formatName = deck.format_name ?? deck.format ?? "";
        lines.push(`// ${deckName}${formatName ? ` — ${formatName}` : ""}`);
        if (gameName) lines.push(`// ${gameName}`);
        lines.push("");
        for (const board of ["MAIN", "SIDE", "EXTRA", "MAYBE"]) {
            const cards = boards[board];
            if (!cards || cards.length === 0) continue;
            const total = cards.reduce((s, c) => s + (c.quantity ?? 1), 0);
            lines.push(`// ${boardLabel[board]} (${total})`);
            for (const c of cards) lines.push(`${c.quantity ?? 1} ${c.card_name}`);
            lines.push("");
        }
        navigator.clipboard.writeText(lines.join("\n").trim()).then(() => {
            toast.success("Mazo copiado al portapapeles");
        }).catch(() => {});
    }, [deck]);

    const ownerUsername = deck?.username ?? deck?.owner?.username ?? deck?.user?.username ?? "";
    const ownerAvatar   = deck?.avatar_url ?? deck?.owner?.avatar_url ?? deck?.user?.avatar_url ?? "";
    const gameName      = deck?.game_name ?? deck?.game ?? "";

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0, zIndex: 200,
                backgroundColor: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: 20,
            }}
        >
            {/* Creador del mazo — esquina superior izquierda */}
            {deck && ownerUsername && (
                <Link
                    href={`/perfil/${ownerUsername}`}
                    onClick={onClose}
                    style={{
                        position: "absolute", top: 18, left: 20,
                        display: "flex", alignItems: "center", gap: 9,
                        textDecoration: "none", zIndex: 10,
                    }}
                >
                    <div style={{
                        width: 36, height: 36, borderRadius: 18,
                        background: "var(--accent)", padding: 2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 16,
                            backgroundColor: "var(--background)", overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 700, color: "var(--foreground)",
                        }}>
                            {ownerAvatar
                                ? <img src={ownerAvatar} alt={ownerUsername} style={{ width: 32, height: 32, objectFit: "cover" }} />
                                : ownerUsername[0].toUpperCase()
                            }
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "white", lineHeight: 1.2 }}>
                            @{ownerUsername}
                        </span>
                        {gameName && (
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.2 }}>
                                {gameName}
                            </span>
                        )}
                    </div>
                </Link>
            )}

            {/* Nombre del mazo + copiar — top center */}
            {deck?.name && (
                <div style={{
                    position: "absolute", top: 20,
                    left: "50%", transform: "translateX(-50%)",
                    display: "flex", alignItems: "center", gap: 8, zIndex: 10,
                }}>
                    <Link
                        href={`/decks/${deckId}`}
                        onClick={onClose}
                        style={{ textDecoration: "none" }}
                    >
                        <span style={{
                            fontSize: 15, fontWeight: 700,
                            color: "rgba(255,255,255,0.80)",
                            letterSpacing: "0.03em",
                        }}>
                            {deck.name}
                        </span>
                    </Link>
                    <button
                        onClick={copyDeck}
                        title="Copiar lista"
                        style={{
                            background: "rgba(255,255,255,0.10)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            borderRadius: 8, color: "rgba(255,255,255,0.65)",
                            cursor: "pointer", padding: "4px 8px",
                            display: "flex", alignItems: "center", gap: 5,
                            fontSize: 11, fontWeight: 600,
                        }}
                    >
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copiar lista
                    </button>
                </div>
            )}

            {/* Cerrar */}
            <button
                onClick={onClose}
                style={{
                    position: "absolute", top: 20, right: 20,
                    width: 38, height: 38, borderRadius: 19,
                    backgroundColor: "rgba(255,255,255,0.12)",
                    border: "1.5px solid rgba(255,255,255,0.22)",
                    color: "white", fontSize: 22, fontWeight: 700,
                    cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    lineHeight: 1, zIndex: 10,
                }}
            >×</button>

            {selectedCard ? (
                /* ── Detalle carta ── */
                <div
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, animation: "card-zoom-in 0.2s ease-out" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ width: "min(380px, 72dvw)", aspectRatio: `1 / ${CARD_RATIO}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 72px rgba(0,0,0,0.75)", border: "2px solid rgba(255,255,255,0.22)" }}>
                        {selectedCard.image_url
                            ? <img src={selectedCard.image_url} alt={selectedCard.card_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <CardBack w={380} h={Math.round(380 * CARD_RATIO)} />
                        }
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <p style={{ color: "white", fontWeight: 700, fontSize: 17, margin: "0 0 4px" }}>{selectedCard.card_name}</p>
                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0 }}>×{selectedCard.totalQty} · {selectedCard.board ?? "MAIN"}</p>
                    </div>
                    <button onClick={() => setSelectedCard(null)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 20px", borderRadius: 999, cursor: "pointer" }}>
                        ← Volver al mazo
                    </button>
                </div>
            ) : (
                /* ── Fan ── */
                <>
                    <div style={{
                        position: "relative",
                        width: "80dvw",
                        height: containerH,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        marginBottom: 32,
                        pointerEvents: "none",
                    }}>
                        {(deckQuery.isPending ? Array.from({ length: MAX_FAN }) : Array.from({ length: fanCount })).map((_, i) => {
                            const card = uniqueCards[i] as UniqueCard | undefined;
                            const angle = getAngle(i, fanCount);
                            const baseZ = getBaseZ(i, fanCount);
                            const stackCount = card ? Math.min(card.totalQty - 1, 3) : 0;
                            const isLoading = deckQuery.isPending;

                            return (
                                <Fragment key={i}>
                                    {/* Sombras apiladas */}
                                    {Array.from({ length: stackCount }).map((_, s) => (
                                        <div
                                            key={`s${s}`}
                                            style={{
                                                position: "absolute",
                                                width: cardW, height: cardH,
                                                left: "50%", marginLeft: -(cardW / 2), bottom: liftPx,
                                                borderRadius: Math.round(cardW * 0.07),
                                                overflow: "hidden",
                                                transform: `rotate(${angle}deg) translateY(${(s + 1) * 6}px)`,
                                                transformOrigin: `center ${originY}px`,
                                                zIndex: baseZ - (s + 1),
                                                opacity: 1 - (s + 1) * 0.18,
                                                border: "1.5px solid rgba(255,255,255,0.10)",
                                                pointerEvents: "auto",
                                            }}
                                        >
                                            <CardBack w={cardW} h={cardH} />
                                        </div>
                                    ))}

                                    {/* Carta principal — outer: arc rotation / inner: scale on hover */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            width: cardW, height: cardH,
                                            left: "50%", marginLeft: -(cardW / 2), bottom: liftPx,
                                            transform: `rotate(${angle}deg)`,
                                            transformOrigin: `center ${originY}px`,
                                            zIndex: baseZ,
                                            pointerEvents: "none",
                                        }}
                                    >
                                    <div
                                        onClick={() => !isLoading && card && setSelectedCard(card)}
                                        style={{
                                            width: "100%", height: "100%",
                                            borderRadius: Math.round(cardW * 0.07),
                                            overflow: "hidden",
                                            boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
                                            border: "1.5px solid rgba(255,255,255,0.14)",
                                            cursor: card && !isLoading ? "pointer" : "default",
                                            transition: "transform 0.18s, filter 0.18s",
                                            transformOrigin: "center center",
                                            pointerEvents: "auto",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!card || isLoading) return;
                                            const el = e.currentTarget as HTMLElement;
                                            el.style.transform = "scale(1.22)";
                                            el.style.filter = "brightness(1.12)";
                                            (el.parentElement as HTMLElement).style.zIndex = "500";
                                        }}
                                        onMouseLeave={(e) => {
                                            const el = e.currentTarget as HTMLElement;
                                            el.style.transform = "";
                                            el.style.filter = "";
                                            (el.parentElement as HTMLElement).style.zIndex = String(baseZ);
                                        }}
                                    >
                                        {isLoading ? (
                                            <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.08)", animation: "deck-skeleton-pulse 1.4s ease-in-out infinite" }} />
                                        ) : card?.image_url ? (
                                            <img src={card.image_url} alt={card.card_name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                                        ) : (
                                            <CardBack w={cardW} h={cardH} />
                                        )}

                                        {/* Badge ×N */}
                                        {!isLoading && card && card.totalQty > 1 && (
                                            <div style={{
                                                position: "absolute",
                                                bottom: 6,
                                                ...(angle < 0 ? { left: 6 } : { right: 6 }),
                                                backgroundColor: "rgba(0,0,0,0.85)",
                                                color: "white",
                                                fontSize: Math.max(10, Math.round(cardW * 0.09)),
                                                fontWeight: 800,
                                                padding: "2px 7px",
                                                borderRadius: 999,
                                                border: "1.5px solid rgba(255,255,255,0.35)",
                                                lineHeight: 1.5,
                                                pointerEvents: "none",
                                            }}>
                                                ×{card.totalQty}
                                            </div>
                                        )}
                                    </div>
                                    </div>
                                </Fragment>
                            );
                        })}
                    </div>

                    {/* Stats bar */}
                    {deckStats && (
                        <div style={{
                            display: "flex", gap: 8, alignItems: "center",
                            flexWrap: "wrap", justifyContent: "center",
                            pointerEvents: "none",
                        }}>
                            <StatPill label="Total" value={deckStats.grandTotal} accent />
                            <StatPill label="Únicas" value={deckStats.mainUnique} />
                            {deckStats.sideTotal > 0 && <StatPill label="Side" value={deckStats.sideTotal} />}
                            {deckStats.extraTotal > 0 && <StatPill label="Extra" value={deckStats.extraTotal} />}
                        </div>
                    )}
                </>
            )}

            <style>{`
                @keyframes card-zoom-in {
                    from { transform: scale(0.85); opacity: 0; }
                    to   { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

function StatPill({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: accent ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)",
            border: `1px solid ${accent ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 999, padding: "4px 11px",
        }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "white", lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.50)", lineHeight: 1 }}>{label}</span>
        </div>
    );
}

function CardBack({ w, h }: { w: number; h: number }) {
    return (
        <div style={{
            width: w, height: h,
            background: "linear-gradient(145deg, #2b3c6a 0%, #1a2848 50%, #2b3c6a 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <div style={{
                width: "70%", height: "80%",
                border: "1.5px solid rgba(200,180,80,0.45)",
                borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <div style={{
                    width: "55%", height: "55%",
                    border: "1px solid rgba(200,180,80,0.28)",
                    borderRadius: 2, background: "rgba(200,180,80,0.05)",
                }} />
            </div>
        </div>
    );
}
