"use client";

import Image from "next/image";
import type { Deck } from "@/lib/types/social";

type FeedDeckTrayItemProps = {
  deck: Deck;
  itemWidth: number;
  scrollSnapAlign?: "start";
  onClick: () => void;
};

export default function FeedDeckTrayItem({ deck, itemWidth, scrollSnapAlign, onClick }: FeedDeckTrayItemProps) {
  const hasCards = deck.cards && deck.cards.length > 0;
  const coverImg = hasCards ? deck.cards?.[0]?.image_url : undefined;
  const deckOwner = deck.username ?? deck.owner?.username ?? "";
  const deckAvatar = deck.avatar_url ?? deck.owner?.avatar_url ?? "";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        width: itemWidth,
        scrollSnapAlign,
      }}
    >
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 18,
            background: "var(--accent)",
            padding: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: 13,
              backgroundColor: "var(--surface-solid)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {coverImg ? (
              <Image src={coverImg} alt={deck.name} fill sizes="75px" className="object-cover" />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  padding: 6,
                  textAlign: "center",
                }}
              >
                <svg
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="18" rx="3" />
                  <rect x="5" y="1" width="14" height="18" rx="2" opacity="0.4" />
                </svg>
                <span style={{ fontSize: 7, fontWeight: 700, color: "var(--muted)", lineHeight: "10px" }}>
                  {deck.game_name || "TCG"}
                </span>
              </div>
            )}
          </div>
        </div>

        {deckOwner && (
          <div
            style={{
              position: "absolute",
              bottom: -2,
              left: -2,
              width: 26,
              height: 26,
              borderRadius: 13,
              background: "var(--foreground)",
              padding: 1.5,
              border: "2px solid var(--background)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {deckAvatar ? (
              <Image src={deckAvatar} alt={deckOwner} width={22} height={22} className="object-cover rounded-[11px]" />
            ) : (
              <span style={{ fontSize: 9, fontWeight: 800, color: "var(--background)", lineHeight: 1 }}>
                {deckOwner[0].toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>

      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--muted)",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
        }}
      >
        {deckOwner || deck.name}
      </span>
    </button>
  );
}
