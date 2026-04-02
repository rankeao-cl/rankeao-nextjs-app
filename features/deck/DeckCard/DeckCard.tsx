"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { timeAgo } from "@/lib/utils/format";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLikeDeck } from "@/lib/hooks/use-social";
import { Heart, Flame, Comment, Eye } from "@gravity-ui/icons";
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

// Number of columns in the miniature grid
const GRID_COLS = 6;
const GRID_ROWS = 2;
const MAX_VISIBLE = GRID_COLS * GRID_ROWS;

interface DeckCardProps {
    deck: Deck;
}

export default function DeckCard({ deck }: DeckCardProps) {
    const [fanOpen, setFanOpen] = useState(false);
    const { status } = useAuth();
    const isAuth = status === "authenticated";

    // Like state
    const [liked, setLiked] = useState((deck as any).is_liked ?? false);
    const [likesCount, setLikesCount] = useState(deck.like_count ?? 0);
    const likeMutation = useLikeDeck();

    // Fire state (local only — backend TBD)
    const [fired, setFired] = useState(false);
    const [firesCount, setFiresCount] = useState(0);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuth) return;
        const next = !liked;
        setLiked(next);
        setLikesCount((c) => c + (next ? 1 : -1));
        likeMutation.mutate({ deckId: deck.id, like: next }, {
            onError: () => { setLiked(!next); setLikesCount((c) => c + (next ? -1 : 1)); },
        });
    };

    const handleFire = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuth) return;
        setFired((f) => !f);
        setFiresCount((c) => c + (fired ? -1 : 1));
    };

    const mainCards = (deck.cards ?? []).filter((c) => c.board === "MAIN");
    // Deduplicate by card_id, keep first occurrence (for unique card images)
    const uniqueCards: DeckCardType[] = [];
    const seen = new Set<string>();
    for (const c of mainCards) {
        if (!seen.has(c.card_id) && c.image_url) {
            seen.add(c.card_id);
            uniqueCards.push(c);
        }
    }

    const visibleCards = uniqueCards.slice(0, MAX_VISIBLE);
    const remaining = uniqueCards.length - MAX_VISIBLE;
    const totalCards = mainCards.reduce((sum, c) => sum + c.quantity, 0);
    const sideCount = (deck.cards ?? []).filter((c) => c.board === "SIDE").reduce((s, c) => s + c.quantity, 0);
    const username = deck.username ?? "";
    const gameName = deck.game_name ?? deck.game ?? "";
    const formatName = deck.format_name ?? deck.format ?? "";

    return (
        <>
            <article
                className="deck-grid-card"
                onClick={() => setFanOpen(true)}
                style={{
                    background: "var(--surface-solid)",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                }}
            >
                <style>{`
                    .deck-grid-card:hover {
                        border-color: rgba(59,130,246,0.35) !important;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(59,130,246,0.12) !important;
                        transform: translateY(-2px);
                    }
                `}</style>

                {/* Header: author + deck info */}
                <div style={{ padding: "12px 14px 0", display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Avatar */}
                    <Link
                        href={`/perfil/${username}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ textDecoration: "none", flexShrink: 0 }}
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: "var(--surface)", overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, fontWeight: 700, color: "var(--foreground)",
                        }}>
                            {(deck as any).avatar_url || (deck as any).owner?.avatar_url ? (
                                <Image
                                    src={(deck as any).avatar_url || (deck as any).owner?.avatar_url}
                                    alt={username}
                                    width={36} height={36}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                username?.[0]?.toUpperCase() || "?"
                            )}
                        </div>
                    </Link>

                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>publicó un mazo</span>
                    </div>

                    {/* Game tag */}
                    {gameName && (
                        <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: "var(--accent)",
                            background: "rgba(59,130,246,0.08)",
                            padding: "3px 8px", borderRadius: 999, flexShrink: 0,
                        }}>
                            {gameName}
                        </span>
                    )}
                </div>

                {/* Deck name + format */}
                <div style={{ padding: "8px 14px 0" }}>
                    <p style={{
                        margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)",
                        lineHeight: 1.3,
                    }}>
                        {deck.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        {formatName && (
                            <span style={{
                                fontSize: 10, fontWeight: 600, color: "var(--muted)",
                                background: "var(--surface)", border: "1px solid var(--border)",
                                padding: "2px 7px", borderRadius: 999,
                            }}>
                                {formatName}
                            </span>
                        )}
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                            {totalCards} cartas{sideCount > 0 ? ` · ${sideCount} side` : ""}
                        </span>
                    </div>
                </div>

                {/* Card miniature grid */}
                <div style={{
                    padding: "10px 14px",
                    display: "grid",
                    gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                    gap: 4,
                }}>
                    {visibleCards.map((card, i) => {
                        // Last cell shows "+N" overlay if there are more cards
                        const isLastWithOverflow = remaining > 0 && i === MAX_VISIBLE - 1;

                        return (
                            <div
                                key={card.card_id}
                                style={{
                                    position: "relative",
                                    aspectRatio: "63 / 88",
                                    borderRadius: 6,
                                    overflow: "hidden",
                                    backgroundColor: "var(--background)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                {card.image_url && (
                                    <Image
                                        src={card.image_url}
                                        alt={card.card_name}
                                        fill
                                        style={{ objectFit: "cover" }}
                                        sizes="60px"
                                    />
                                )}

                                {/* Quantity badge */}
                                {card.quantity > 1 && !isLastWithOverflow && (
                                    <div style={{
                                        position: "absolute", bottom: 2, right: 2,
                                        backgroundColor: "rgba(0,0,0,0.7)",
                                        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                                        borderRadius: 4, padding: "1px 4px",
                                        fontSize: 9, fontWeight: 800, color: "#fff",
                                        lineHeight: 1.2,
                                    }}>
                                        &times;{card.quantity}
                                    </div>
                                )}

                                {/* "+N more" overlay on last card */}
                                {isLastWithOverflow && (
                                    <div style={{
                                        position: "absolute", inset: 0,
                                        backgroundColor: "rgba(0,0,0,0.65)",
                                        backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
                                            +{remaining}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Fill empty cells if less than grid */}
                    {visibleCards.length < MAX_VISIBLE && visibleCards.length > 0 && (
                        Array.from({ length: MAX_VISIBLE - visibleCards.length }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                style={{
                                    aspectRatio: "63 / 88",
                                    borderRadius: 6,
                                    backgroundColor: "var(--surface)",
                                    border: "1px dashed var(--border)",
                                    opacity: 0.3,
                                }}
                            />
                        ))
                    )}
                </div>

                {/* Footer: reactions + CTA */}
                <div style={{
                    padding: "8px 14px 12px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderTop: "1px solid var(--border)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {/* Like */}
                        <button type="button" onClick={handleLike} style={{
                            display: "flex", alignItems: "center", gap: 5,
                            background: "none", border: "none",
                            cursor: isAuth ? "pointer" : "default",
                            color: liked ? "#EF4444" : "var(--muted)",
                            padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                            transition: "transform 0.15s",
                            transform: liked ? "scale(1.05)" : "scale(1)",
                            opacity: likeMutation.isPending ? 0.6 : 1,
                        }}>
                            <Heart style={{ width: 16, height: 16 }} />
                            <span>{likesCount}</span>
                        </button>

                        {/* Fire */}
                        <button type="button" onClick={handleFire} style={{
                            display: "flex", alignItems: "center", gap: 5,
                            background: fired ? "rgba(249,115,22,0.12)" : "none",
                            border: "none",
                            cursor: isAuth ? "pointer" : "default",
                            color: fired ? "#F97316" : "var(--muted)",
                            padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                            transition: "transform 0.15s, background 0.15s",
                            transform: fired ? "scale(1.05)" : "scale(1)",
                        }}>
                            <Flame style={{ width: 16, height: 16 }} />
                            <span>{firesCount}</span>
                        </button>

                        {/* Views */}
                        {deck.view_count != null && deck.view_count > 0 && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)", fontWeight: 600, padding: "4px 8px" }}>
                                <Eye style={{ width: 16, height: 16 }} />
                                {deck.view_count}
                            </span>
                        )}
                    </div>

                    <span style={{
                        fontSize: 12, fontWeight: 700, color: "var(--accent)",
                        display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                        Ver mazo
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </span>
                </div>
            </article>

            {fanOpen && (
                <DeckFanModal deckId={deck.id} onClose={() => setFanOpen(false)} />
            )}
        </>
    );
}
