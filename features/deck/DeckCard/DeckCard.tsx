"use client";

import { useState, useMemo, memo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { timeAgo } from "@/lib/utils/format";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLikeDeck } from "@/lib/hooks/use-social";
import { Heart, Eye, ArrowShapeTurnUpRight } from "@gravity-ui/icons";
import { toast } from "@heroui/react";
import DeckFanModal from "@/features/deck/DeckFanModal";
import type { Deck, DeckCard as DeckCardType } from "@/lib/types/social";

export interface FeedDeck {
    id: string;
    author: { username: string; avatar_url?: string; rank_badge?: string };
    deck_name: string;
    game: string;
    format: string;
    card_count: number;
    preview_images?: string[];
    created_at: string;
}

const GRID_COLS = 6;
const GRID_ROWS = 2;
const MAX_VISIBLE = GRID_COLS * GRID_ROWS;

interface DeckCardProps {
    deck: Deck;
}

function DeckCardInner({ deck }: DeckCardProps) {
    const [fanOpen, setFanOpen] = useState(false);
    const { status } = useAuth();
    const isAuth = status === "authenticated";

    const [liked, setLiked] = useState((deck as any).is_liked ?? false);
    const [likesCount, setLikesCount] = useState(deck.like_count ?? (deck as any).likes_count ?? 0);
    const likeMutation = useLikeDeck();

    const handleLike = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuth) return;
        const next = !liked;
        setLiked(next);
        setLikesCount((c: number) => c + (next ? 1 : -1));
        likeMutation.mutate({ deckId: deck.id, like: next }, {
            onError: () => { setLiked(!next); setLikesCount((c: number) => c + (next ? -1 : 1)); },
        });
    }, [isAuth, liked, likeMutation, deck.id]);

    const handleShare = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `https://rankeao.cl/decks/${deck.id}`;
        if (navigator.share) navigator.share({ title: deck.name, url }).catch(() => {});
        else navigator.clipboard.writeText(url).then(() => toast.success("Enlace copiado")).catch(() => {});
    }, [deck.id, deck.name]);

    const { visibleCards, remaining, totalCards, sideCount } = useMemo(() => {
        const mainCards = (deck.cards ?? []).filter((c) => c.board === "MAIN");
        const unique: DeckCardType[] = [];
        const seen = new Set<string>();
        for (const c of mainCards) {
            if (!seen.has(c.card_id) && c.image_url) {
                seen.add(c.card_id);
                unique.push(c);
            }
        }
        return {
            visibleCards: unique.slice(0, MAX_VISIBLE),
            remaining: Math.max(0, unique.length - MAX_VISIBLE),
            totalCards: mainCards.reduce((sum, c) => sum + c.quantity, 0),
            sideCount: (deck.cards ?? []).filter((c) => c.board === "SIDE").reduce((s, c) => s + c.quantity, 0),
        };
    }, [deck.cards]);

    const username = deck.username || (deck as any).owner?.username || "";
    const gameName = deck.game_name ?? deck.game ?? "";
    const formatName = deck.format_name ?? deck.format ?? "";
    const avatarUrl = (deck as any).avatar_url || (deck as any).owner?.avatar_url || "";

    return (
        <>
            <article
                onClick={() => setFanOpen(true)}
                style={{
                    background: "var(--surface-solid)",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                    cursor: "pointer",
                }}
            >
                {/* Header: author */}
                <div style={{ padding: "12px 14px 0", display: "flex", alignItems: "center", gap: 10 }}>
                    <Link
                        href={`/perfil/${username}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ textDecoration: "none", flexShrink: 0 }}
                    >
                        <div style={{
                            width: 32, height: 32, borderRadius: 16,
                            backgroundColor: "var(--surface)", overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 700, color: "var(--foreground)",
                        }}>
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt={username}
                                    width={32} height={32}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                username?.[0]?.toUpperCase() || "?"
                            )}
                        </div>
                    </Link>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <Link
                                href={`/perfil/${username}`}
                                onClick={(e) => e.stopPropagation()}
                                style={{ textDecoration: "none" }}
                            >
                                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                                    {username}
                                </span>
                            </Link>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>
                                {deck.created_at ? timeAgo(deck.created_at) : ""}
                            </span>
                        </div>
                    </div>

                    {gameName && (
                        <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: "var(--accent)",
                            background: "rgba(59,130,246,0.08)",
                            padding: "3px 8px", borderRadius: 999, flexShrink: 0,
                            whiteSpace: "nowrap",
                        }}>
                            {gameName}
                        </span>
                    )}
                </div>

                {/* Deck name + format + count — una sola línea */}
                <div style={{ padding: "6px 14px 0", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                        {deck.name}
                    </span>
                    {formatName && (
                        <span style={{
                            fontSize: 10, fontWeight: 600, color: "var(--muted)",
                            background: "var(--surface)", border: "1px solid var(--border)",
                            padding: "1px 6px", borderRadius: 999,
                        }}>
                            {formatName}
                        </span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        {totalCards}{sideCount > 0 ? ` + ${sideCount} side` : ""}
                    </span>
                </div>

                {/* Card miniature grid */}
                <div style={{
                    padding: "8px 14px",
                    display: "grid",
                    gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                    gap: 3,
                }}>
                    {visibleCards.map((card, i) => {
                        const isLastWithOverflow = remaining > 0 && i === MAX_VISIBLE - 1;
                        return (
                            <div
                                key={card.card_id}
                                style={{
                                    position: "relative",
                                    aspectRatio: "63 / 88",
                                    borderRadius: 5,
                                    overflow: "hidden",
                                    backgroundColor: "var(--background)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                {card.image_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={card.image_url}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                )}
                                {card.quantity > 1 && !isLastWithOverflow && (
                                    <div style={{
                                        position: "absolute", bottom: 2, right: 2,
                                        backgroundColor: "rgba(0,0,0,0.7)",
                                        borderRadius: 4, padding: "1px 4px",
                                        fontSize: 9, fontWeight: 800, color: "#fff",
                                        lineHeight: 1.2,
                                    }}>
                                        &times;{card.quantity}
                                    </div>
                                )}
                                {isLastWithOverflow && (
                                    <div style={{
                                        position: "absolute", inset: 0,
                                        backgroundColor: "rgba(0,0,0,0.6)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>
                                            +{remaining}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {visibleCards.length < MAX_VISIBLE && visibleCards.length > 0 &&
                        Array.from({ length: MAX_VISIBLE - visibleCards.length }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                style={{
                                    aspectRatio: "63 / 88",
                                    borderRadius: 5,
                                    backgroundColor: "var(--surface)",
                                    border: "1px dashed var(--border)",
                                    opacity: 0.25,
                                }}
                            />
                        ))
                    }
                </div>

                {/* Footer: like + views + CTA */}
                <div style={{
                    padding: "6px 14px 10px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderTop: "1px solid var(--border)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <button type="button" onClick={handleLike} style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: "none", border: "none",
                            cursor: isAuth ? "pointer" : "default",
                            color: liked ? "#EF4444" : "var(--muted)",
                            padding: "4px 6px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                        }}>
                            <Heart style={{ width: 15, height: 15 }} />
                            {likesCount > 0 && <span>{likesCount}</span>}
                        </button>

                        {deck.view_count != null && deck.view_count > 0 && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)", padding: "4px 6px" }}>
                                <Eye style={{ width: 15, height: 15 }} />
                                {deck.view_count}
                            </span>
                        )}

                        <button type="button" onClick={handleShare} style={{
                            display: "flex", alignItems: "center",
                            background: "none", border: "none", cursor: "pointer",
                            color: "var(--muted)",
                            padding: "4px 6px", borderRadius: 999,
                        }}>
                            <ArrowShapeTurnUpRight style={{ width: 15, height: 15 }} />
                        </button>
                    </div>

                    <span style={{
                        fontSize: 12, fontWeight: 700, color: "var(--accent)",
                        display: "inline-flex", alignItems: "center", gap: 3,
                    }}>
                        Ver mazo
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </span>
                </div>
            </article>

            {fanOpen && (
                <DeckFanModal
                    deckId={deck.id}
                    onClose={() => setFanOpen(false)}
                    initialLiked={liked}
                    initialLikesCount={likesCount}
                    onLikeChange={(l, c) => { setLiked(l); setLikesCount(c); }}
                />
            )}
        </>
    );
}

const DeckCard = memo(DeckCardInner);
export default DeckCard;
