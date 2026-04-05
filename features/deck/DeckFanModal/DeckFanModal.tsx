"use client";

import { useEffect, useState, useMemo, Fragment, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "@heroui/react/toast";

import { Heart, ArrowShapeTurnUpRight } from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { useDeck, useLikeDeck } from "@/lib/hooks/use-social";
import type { DeckCard } from "@/lib/types/social";

interface DeckFanModalProps {
    deckId: string;
    onClose: () => void;
    initialLiked?: boolean;
    initialLikesCount?: number;
    onLikeChange?: (liked: boolean, count: number) => void;
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

export default function DeckFanModal({ deckId, onClose, initialLiked, initialLikesCount, onLikeChange }: DeckFanModalProps) {
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
        return Array.from(map.values());
    }, [mainCards]);

    // Fan view on desktop shows max 10 cards
    const fanCards = useMemo(() => uniqueCards.slice(0, MAX_FAN), [uniqueCards]);

    const fanCount = fanCards.length > 0 ? fanCards.length : MAX_FAN;

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
    const [entered, setEntered] = useState(false);

    // Interactions
    const { status: authStatus } = useAuth();
    const isAuth = authStatus === "authenticated";
    const likeMutation = useLikeDeck();
    const [liked, setLiked] = useState(initialLiked ?? false);
    const [likesCount, setLikesCount] = useState(initialLikesCount ?? 0);

    useEffect(() => {
        const onResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Lock body scroll while modal is open
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    useEffect(() => {
        const id = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(id);
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

    const handleLike = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuth) return;
        const next = !liked;
        const newCount = likesCount + (next ? 1 : -1);
        setLiked(next);
        setLikesCount(newCount);
        onLikeChange?.(next, newCount);
        likeMutation.mutate({ deckId, like: next }, {
            onError: () => {
                setLiked(!next);
                setLikesCount(likesCount);
                onLikeChange?.(!next, likesCount);
            },
        });
    }, [isAuth, liked, likesCount, likeMutation, deckId, onLikeChange]);

    const handleShare = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `https://rankeao.cl/decks/${deckId}`;
        if (navigator.share) navigator.share({ title: deck?.name ?? "Mazo", url }).catch(() => {});
        else navigator.clipboard.writeText(url).then(() => toast.success("Enlace copiado")).catch(() => {});
    }, [deckId, deck?.name]);

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0, zIndex: 200,
                backgroundColor: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
                display: "flex", flexDirection: "column",
                alignItems: "center",
                padding: "16px 20px",
                paddingBottom: "max(16px, env(safe-area-inset-bottom))",
                overflow: "hidden",
                opacity: entered ? 1 : 0,
                transition: "opacity 0.22s ease",
            }}
        >
            {/* Header */}
            <div style={{
                width: "100%", maxWidth: windowWidth < 768 ? 400 : 700,
                display: "flex", flexDirection: "column", gap: 8,
                padding: "0 4px", flexShrink: 0, zIndex: 10,
            }}>
                {/* Row 1: avatar + name + actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {deck && ownerUsername && (
                        <Link
                            href={`/perfil/${ownerUsername}`}
                            onClick={onClose}
                            style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: 16,
                                backgroundColor: "var(--background)", overflow: "hidden",
                                border: "2px solid var(--accent)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontWeight: 700, color: "var(--foreground)",
                            }}>
                                {ownerAvatar
                                    ? <Image src={ownerAvatar} alt={ownerUsername} width={28} height={28} className="object-cover rounded-full" />
                                    : ownerUsername[0].toUpperCase()
                                }
                            </div>
                        </Link>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {deck?.name && (
                            <Link href={`/decks/${deckId}`} onClick={onClose} style={{ textDecoration: "none" }}>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "white", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {deck.name}
                                </p>
                            </Link>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            {ownerUsername && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>@{ownerUsername}</span>}
                            {gameName && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{gameName}</span>}
                        </div>
                    </div>

                    {/* Desktop: all buttons inline */}
                    {windowWidth >= 768 && (
                        <>
                            <ModalBtn onClick={handleLike} active={liked} activeColor="#EF4444">
                                <Heart style={{ width: 14, height: 14 }} />
                                {likesCount > 0 && <span>{likesCount}</span>}
                            </ModalBtn>
                            <ModalBtn onClick={handleShare}>
                                <ArrowShapeTurnUpRight style={{ width: 14, height: 14 }} />
                            </ModalBtn>
                            <ModalBtn onClick={(e) => { e.stopPropagation(); copyDeck(); }}>
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                <span>Copiar</span>
                            </ModalBtn>
                        </>
                    )}

                    {/* Mobile: only copy + close */}
                    {windowWidth < 768 && (
                        <ModalBtn onClick={(e) => { e.stopPropagation(); copyDeck(); }}>
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                        </ModalBtn>
                    )}

                    <button onClick={onClose} style={{
                        height: 34, width: 34,
                        background: "rgba(255,255,255,0.10)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        borderRadius: 17, color: "rgba(255,255,255,0.65)",
                        cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 18, fontWeight: 600, flexShrink: 0, lineHeight: 1,
                    }}>×</button>
                </div>

                {/* Row 2 (mobile only): like + share + stats */}
                {windowWidth < 768 && deck && !selectedCard && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <button type="button" onClick={handleLike} style={{
                                display: "flex", alignItems: "center", gap: 4,
                                background: "none", border: "none",
                                cursor: isAuth ? "pointer" : "default",
                                color: liked ? "#EF4444" : "rgba(255,255,255,0.5)",
                                padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                            }}>
                                <Heart style={{ width: 15, height: 15 }} />
                                {likesCount > 0 && <span>{likesCount}</span>}
                            </button>
                            <button type="button" onClick={handleShare} style={{
                                display: "flex", alignItems: "center",
                                background: "none", border: "none", cursor: "pointer",
                                color: "rgba(255,255,255,0.5)",
                                padding: "4px 8px", borderRadius: 999,
                            }}>
                                <ArrowShapeTurnUpRight style={{ width: 15, height: 15 }} />
                            </button>
                        </div>
                        {deckStats && (
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                                {deckStats.grandTotal} cartas{deckStats.sideTotal > 0 ? ` · ${deckStats.sideTotal} side` : ""}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {selectedCard ? (
                /* ── Detalle carta — centrado vertical ── */
                <div
                    style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, animation: "card-zoom-in 0.2s ease-out" }}>
                        <div style={{ width: "min(380px, 85dvw)", aspectRatio: `1 / ${CARD_RATIO}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 72px rgba(0,0,0,0.75)", border: "2px solid rgba(255,255,255,0.22)", position: "relative" }}>
                            {selectedCard.image_url
                                ? <Image src={selectedCard.image_url} alt={selectedCard.card_name} fill sizes="min(380px, 85vw)" className="object-cover" />
                                : <CardBack w={340} h={Math.round(340 * CARD_RATIO)} />
                            }
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <p style={{ color: "white", fontWeight: 700, fontSize: 16, margin: "0 0 4px" }}>{selectedCard.card_name}</p>
                            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0 }}>×{selectedCard.totalQty} · {selectedCard.board ?? "MAIN"}</p>
                        </div>
                        <button onClick={() => setSelectedCard(null)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 13, fontWeight: 600, padding: "8px 20px", borderRadius: 999, cursor: "pointer" }}>
                            ← Volver al mazo
                        </button>
                    </div>
                </div>
            ) : windowWidth < 768 ? (
                /* ── Mobile: Grid view ── */
                <>
                    <div style={{
                        flex: 1, minHeight: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: "100%", overflow: "hidden",
                    }}>
                    <div style={{
                        width: "100%", maxWidth: 360,
                        maxHeight: "100%",
                        overflowY: "auto",
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 6,
                        padding: "8px 4px",
                        alignContent: "start",
                        WebkitOverflowScrolling: "touch",
                    }}>
                        {(deckQuery.isPending
                            ? Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} style={{
                                    aspectRatio: "63 / 88", borderRadius: 10,
                                    background: "rgba(255,255,255,0.06)",
                                    animation: "deck-skeleton-pulse 1.4s ease-in-out infinite",
                                }} />
                            ))
                            : uniqueCards.map((card) => (
                                <div
                                    key={card.card_id || card.card_name}
                                    onClick={() => setSelectedCard(card)}
                                    style={{
                                        position: "relative",
                                        aspectRatio: "63 / 88",
                                        borderRadius: 10,
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        border: "1.5px solid rgba(255,255,255,0.12)",
                                        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                                        transition: "transform 0.15s",
                                    }}
                                >
                                    {card.image_url ? (
                                        <Image src={card.image_url} alt={card.card_name}
                                            fill sizes="(max-width: 768px) 33vw, 120px"
                                            className="object-cover block" />
                                    ) : (
                                        <CardBack w={120} h={168} />
                                    )}
                                    {card.totalQty > 1 && (
                                        <div style={{
                                            position: "absolute", bottom: 4, right: 4,
                                            backgroundColor: "rgba(0,0,0,0.8)",
                                            color: "white", fontSize: 11, fontWeight: 800,
                                            padding: "2px 7px", borderRadius: 999,
                                            border: "1px solid rgba(255,255,255,0.3)",
                                        }}>
                                            &times;{card.totalQty}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    </div>

                    {/* Stats bar — bottom */}
                    {deckStats && (
                        <div style={{
                            display: "flex", gap: 8, alignItems: "center",
                            flexWrap: "wrap", justifyContent: "center",
                            flexShrink: 0, padding: "10px 0 4px", marginTop: "auto",
                        }}>
                            <StatPill label="Total" value={deckStats.grandTotal} accent />
                            <StatPill label="Únicas" value={deckStats.mainUnique} />
                            {deckStats.sideTotal > 0 && <StatPill label="Side" value={deckStats.sideTotal} />}
                            {deckStats.extraTotal > 0 && <StatPill label="Extra" value={deckStats.extraTotal} />}
                        </div>
                    )}
                </>
            ) : (
                /* ── Desktop: Fan ── */
                <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                    <div style={{
                        position: "relative",
                        width: "80dvw",
                        height: containerH,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        pointerEvents: "none",
                    }}>
                        {(deckQuery.isPending ? Array.from({ length: MAX_FAN }) : Array.from({ length: fanCount })).map((_, i) => {
                            const card = fanCards[i] as UniqueCard | undefined;
                            const angle = getAngle(i, fanCount);
                            const baseZ = getBaseZ(i, fanCount);
                            const stackCount = card ? Math.min(card.totalQty - 1, 3) : 0;
                            const isLoading = deckQuery.isPending;

                            const mid = (fanCount - 1) / 2;
                            const stagger = Math.round(Math.abs(i - mid) * 35);
                            const entryTransition = `transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) ${stagger}ms, opacity 0.3s ease ${stagger}ms`;

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
                                                transform: entered ? `rotate(${angle}deg) translateY(${(s + 1) * 6}px)` : `rotate(0deg) translateY(${(s + 1) * 6}px)`,
                                                transformOrigin: `center ${originY}px`,
                                                zIndex: baseZ - (s + 1),
                                                opacity: entered ? 1 - (s + 1) * 0.18 : 0,
                                                border: "1.5px solid rgba(255,255,255,0.10)",
                                                pointerEvents: "auto",
                                                transition: entryTransition,
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
                                            transform: entered ? `rotate(${angle}deg)` : "rotate(0deg) scale(0.75)",
                                            transformOrigin: `center ${originY}px`,
                                            opacity: entered ? 1 : 0,
                                            zIndex: baseZ,
                                            pointerEvents: "none",
                                            transition: entryTransition,
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
                                            position: "relative",
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
                                            <Image src={card.image_url} alt={card.card_name} fill sizes={`${cardW}px`} className="object-cover block" />
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
                </div>
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

function ModalBtn({ onClick, children, active, activeColor }: { onClick: (e: React.MouseEvent) => void; children: React.ReactNode; active?: boolean; activeColor?: string }) {
    const bg = active && activeColor ? `${activeColor}22` : "rgba(255,255,255,0.10)";
    const border = active && activeColor ? `${activeColor}44` : "rgba(255,255,255,0.18)";
    const color = active && activeColor ? activeColor : "rgba(255,255,255,0.65)";
    return (
        <button onClick={onClick} style={{
            height: 34, background: bg, border: `1px solid ${border}`,
            borderRadius: 10, color, cursor: "pointer", padding: "0 10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 5, fontSize: 12, fontWeight: 600, flexShrink: 0,
        }}>
            {children}
        </button>
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
            background: "linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <div style={{
                width: "70%", height: "80%",
                border: "1.5px solid rgba(255,255,255,0.18)",
                borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <div style={{
                    width: "55%", height: "55%",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 2, background: "rgba(255,255,255,0.03)",
                }} />
            </div>
        </div>
    );
}
