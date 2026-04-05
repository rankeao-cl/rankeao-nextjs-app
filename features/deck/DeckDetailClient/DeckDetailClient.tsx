"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Eye, ChevronLeft, Copy } from "@gravity-ui/icons";
import { toast } from "@heroui/react/toast";

import { useAuth } from "@/lib/hooks/use-auth";
import { likeDeck, unlikeDeck } from "@/lib/api/social";
import type { Deck, DeckCard } from "@/lib/types/social";

type Board = "MAIN" | "SIDE" | "EXTRA" | "MAYBE";
const BOARD_LABELS: Record<Board, string> = {
  MAIN: "Principal",
  SIDE: "Side",
  EXTRA: "Extra",
  MAYBE: "Quizás",
};

export default function DeckDetailClient({ deck }: { deck: Deck }) {
  const { session, status } = useAuth();
  const isAuth = status === "authenticated";
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(deck.likes_count ?? deck.like_count ?? 0);

  const cards = useMemo(() => {
    const raw = deck.cards ?? [];
    // Normalize: API may return objects with different shapes
    return raw.map((c) => {
      const ext = c as DeckCard & Record<string, unknown>;
      return {
        card_name: ext.card_name ?? (ext.name as string) ?? "Carta",
        quantity: ext.quantity ?? (ext.qty as number) ?? 1,
        board: (ext.board ?? "MAIN") as Board,
        image_url: ext.image_url ?? (ext.img as string) ?? undefined,
      };
    });
  }, [deck.cards]);

  const boards = useMemo(() => {
    const map: Partial<Record<Board, typeof cards>> = {};
    for (const card of cards) {
      const b = card.board || "MAIN";
      if (!map[b]) map[b] = [];
      map[b]!.push(card);
    }
    return map;
  }, [cards]);

  const totalCards = useMemo(() => {
    const fromCards = cards.reduce((sum, c) => sum + c.quantity, 0);
    return fromCards || deck.card_count || 0;
  }, [cards, deck]);

  const gameName = deck.game_name || deck.game || "";
  const formatName = deck.format_name || deck.format || "";
  const ownerUsername = deck.username || deck.owner?.username || "";
  const viewCount = deck.view_count ?? 0;

  const handleLike = async () => {
    if (!isAuth || !session?.accessToken) return;
    try {
      if (liked) {
        await unlikeDeck(deck.id, session.accessToken);
        setLiked(false);
        setLikeCount((c: number) => Math.max(0, c - 1));
      } else {
        await likeDeck(deck.id, session.accessToken);
        setLiked(true);
        setLikeCount((c: number) => c + 1);
      }
    } catch {}
  };

  const handleCopy = () => {
    const text = cards
      .map(c => `${c.quantity} ${c.card_name}`)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Mazo copiado al portapapeles");
    }).catch(() => {});
  };

  return (
    <div style={{ maxWidth: 768, margin: "0 auto", padding: "8px 8px 40px" }}>
      {/* Back */}
      <Link
        href="/"
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 13, fontWeight: 600, color: "var(--muted)",
          textDecoration: "none", marginBottom: 16,
        }}
      >
        <ChevronLeft style={{ width: 16, height: 16 }} />
        Volver
      </Link>

      {/* Header */}
      <div style={{
        backgroundColor: "var(--surface-solid)",
        borderRadius: 16, border: "1px solid var(--border)",
        padding: 20, marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", margin: "0 0 6px" }}>
              {deck.name}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              {ownerUsername && (
                <Link
                  href={`/perfil/${ownerUsername}`}
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}
                >
                  @{ownerUsername}
                </Link>
              )}
              {gameName && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: "var(--muted)",
                  backgroundColor: "var(--background)", border: "1px solid var(--border)",
                  padding: "2px 8px", borderRadius: 999,
                }}>
                  {gameName}
                </span>
              )}
              {formatName && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: "var(--muted)",
                  backgroundColor: "var(--background)", border: "1px solid var(--border)",
                  padding: "2px 8px", borderRadius: 999,
                }}>
                  {formatName}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleCopy}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "8px 12px", borderRadius: 10,
                backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)",
                cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--foreground)",
              }}
            >
              <Copy style={{ width: 14, height: 14 }} />
              Copiar
            </button>
            {isAuth && (
              <button
                onClick={handleLike}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "8px 12px", borderRadius: 10,
                  backgroundColor: liked ? "rgba(239,68,68,0.1)" : "var(--surface-solid)",
                  border: liked ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--border)",
                  cursor: "pointer", fontSize: 12, fontWeight: 600,
                  color: liked ? "#EF4444" : "var(--foreground)",
                }}
              >
                <Heart style={{ width: 14, height: 14 }} />
                {likeCount}
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {deck.description && (
          <p style={{ fontSize: 14, color: "var(--muted)", margin: "12px 0 0", lineHeight: "20px" }}>
            {deck.description}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
          <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="3" />
            </svg>
            {totalCards} cartas
          </span>
          {viewCount > 0 && (
            <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
              <Eye style={{ width: 14, height: 14 }} />
              {viewCount} vistas
            </span>
          )}
        </div>

        {/* Tags */}
        {deck.tags && deck.tags.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
            {deck.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 11, fontWeight: 500, color: "var(--accent)",
                backgroundColor: "rgba(59,130,246,0.1)",
                padding: "2px 8px", borderRadius: 999,
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card list by board */}
      {cards.length > 0 ? (
        (["MAIN", "SIDE", "EXTRA", "MAYBE"] as Board[]).map(board => {
          const boardCards = boards[board];
          if (!boardCards || boardCards.length === 0) return null;
          const boardTotal = boardCards.reduce((s, c) => s + c.quantity, 0);

          return (
            <div key={board} style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 8, padding: "0 4px",
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                  {BOARD_LABELS[board]}
                </span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {boardTotal} cartas
                </span>
              </div>

              <div style={{
                backgroundColor: "var(--surface-solid)",
                borderRadius: 12, border: "1px solid var(--border)",
                overflow: "hidden",
              }}>
                {boardCards.map((card, i) => {
                  const hasImage = !!card.image_url;
                  return (
                    <div
                      key={`${card.card_name}-${i}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px",
                        borderTop: i > 0 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      {/* Card image or placeholder */}
                      {hasImage ? (
                        <div style={{
                          width: 36, height: 50, borderRadius: 4, overflow: "hidden",
                          flexShrink: 0, border: "1px solid var(--border)", position: "relative",
                        }}>
                          <Image src={card.image_url!} alt={card.card_name} fill sizes="36px" className="object-cover" />
                        </div>
                      ) : (
                        <div style={{
                          width: 36, height: 50, borderRadius: 4,
                          backgroundColor: "var(--background)", border: "1px solid var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={1.5}>
                            <rect x="2" y="3" width="20" height="18" rx="3" />
                          </svg>
                        </div>
                      )}

                      {/* Quantity */}
                      <span style={{
                        fontSize: 14, fontWeight: 700, color: "var(--accent)",
                        minWidth: 20, textAlign: "center", flexShrink: 0,
                      }}>
                        {card.quantity}x
                      </span>

                      {/* Name */}
                      <span style={{
                        fontSize: 14, fontWeight: 500, color: "var(--foreground)",
                        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {card.card_name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div style={{
          backgroundColor: "var(--surface-solid)",
          borderRadius: 12, border: "1px solid var(--border)",
          padding: "40px 16px", textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Este mazo no tiene cartas.</p>
        </div>
      )}
    </div>
  );
}
