"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { getUserFollowing, browseDecks } from "@/lib/api/social";
import type { UserProfile, Deck } from "@/lib/types/social";
import dynamic from "next/dynamic";
const DeckFanModal = dynamic(() => import("@/features/deck/DeckFanModal"), { ssr: false });

type FeedItem =
  | { kind: "user"; date: string; data: UserProfile }
  | { kind: "deck"; date: string; data: Deck };

const ITEM_WIDTH = 88;
const ITEM_GAP = 16;
const VISIBLE_COUNT = 6;
const PAGE_SIZE = VISIBLE_COUNT;
const SCROLL_AMOUNT = PAGE_SIZE * (ITEM_WIDTH + ITEM_GAP);

export default function FeedClient() {
  const { status, session } = useAuth();
  const isAuth = status === "authenticated";

  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!isAuth || !session?.username) return;
    getUserFollowing(session.username, { per_page: 20 })
      .then((val: Record<string, unknown>) => {
        const users = (val?.data as Record<string, unknown>)?.following as UserProfile[] | undefined || val?.data as UserProfile[] | undefined || val?.following as UserProfile[] | undefined || [];
        setFollowing(Array.isArray(users) ? users : []);
      })
      .catch(() => {});
  }, [isAuth, session?.username]);

  useEffect(() => {
    browseDecks({ per_page: 15, sort: "newest" })
      .then((val: Record<string, unknown>) => {
        const d = (val?.data as Record<string, unknown>)?.decks as Deck[] | undefined || val?.data as Deck[] | undefined || val?.decks as Deck[] | undefined || [];
        setDecks(Array.isArray(d) ? d : []);
      })
      .catch(() => {});
  }, []);

  const items = useMemo<FeedItem[]>(() => {
    const userItems: FeedItem[] = following.map(u => ({
      kind: "user",
      date: u.last_seen_at || u.created_at || "",
      data: u,
    }));
    const deckItems: FeedItem[] = decks.map(d => ({
      kind: "deck",
      date: d.updated_at || d.created_at || "",
      data: d,
    }));
    return [...userItems, ...deckItems].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [following, decks]);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, [updateScrollButtons, items]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "right" ? SCROLL_AMOUNT : -SCROLL_AMOUNT, behavior: "smooth" });
  };

  // Total items including "Tu perfil"
  const totalItems = (isAuth ? 1 : 0) + items.length;

  return (
    <div style={{ position: "relative" }}>
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          style={{
            position: "absolute", left: -6, top: "50%", transform: "translateY(-70%)",
            zIndex: 10, width: 28, height: 28, borderRadius: 14,
            backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="Anterior"
        >
          <ChevronLeft style={{ width: 14, height: 14, color: "var(--foreground)" }} />
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && totalItems > VISIBLE_COUNT && (
        <button
          onClick={() => scroll("right")}
          style={{
            position: "absolute", right: -6, top: "50%", transform: "translateY(-70%)",
            zIndex: 10, width: 28, height: 28, borderRadius: 14,
            backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="Siguiente"
        >
          <ChevronRight style={{ width: 14, height: 14, color: "var(--foreground)" }} />
        </button>
      )}

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="feed-stories-scroll no-scrollbar"
        style={{
          display: "flex",
          gap: ITEM_GAP,
          overflowX: "auto",
          scrollbarWidth: "none",
          padding: "4px 0",
          maxWidth: VISIBLE_COUNT * ITEM_WIDTH + (VISIBLE_COUNT - 1) * ITEM_GAP,
          scrollSnapType: "x mandatory",
        }}
      >
        {/* My profile (always first) */}
        {isAuth && (
          <Link
            href={`/perfil/${session?.username}`}
            style={{ textDecoration: "none", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: ITEM_WIDTH, scrollSnapAlign: "start" }}
          >
            <div style={{ position: "relative" }}>
              <div style={{
                width: 80, height: 80, borderRadius: 40,
                background: "var(--foreground)",
                padding: 2, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 74, height: 74, borderRadius: 37,
                  backgroundColor: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>
                    {session?.username?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
              </div>
              <div style={{
                position: "absolute", bottom: -2, right: -2,
                width: 22, height: 22, borderRadius: 11,
                backgroundColor: "var(--accent)", border: "2px solid var(--background)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={3} strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
              Tu perfil
            </span>
          </Link>
        )}

        {/* Intercalated items */}
        {items.map((item, idx) => {
          // Every 6th item snaps
          const snapAlign = idx % PAGE_SIZE === 0 ? "start" : undefined;

          if (item.kind === "user") {
            const user = item.data;
            return (
              <Link
                key={`u-${user.id}`}
                href={`/perfil/${user.username}`}
                style={{ textDecoration: "none", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: ITEM_WIDTH, scrollSnapAlign: snapAlign }}
              >
                <div style={{
                  width: 80, height: 80, borderRadius: 40,
                  background: "var(--accent)",
                  padding: 2, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: 74, height: 74, borderRadius: 37,
                    backgroundColor: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt={user.username} width={74} height={74} className="object-cover" />
                    ) : (
                      <span style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>
                        {user.username.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                  {user.username}
                </span>
              </Link>
            );
          }

          const deck = item.data;
          const hasCards = deck.cards && deck.cards.length > 0;
          const coverImg = hasCards ? deck.cards![0].image_url : undefined;
          const deckOwner = deck.username ?? deck.owner?.username ?? "";
          const deckAvatar = deck.avatar_url ?? deck.owner?.avatar_url ?? "";

          return (
            <button
              key={`d-${deck.id}`}
              type="button"
              onClick={() => setActiveDeckId(deck.id)}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: ITEM_WIDTH, scrollSnapAlign: snapAlign }}
            >
              {/* Cuadrado con imagen + avatar del dueño en esquina */}
              <div style={{ position: "relative", width: 80, height: 80 }}>
                {/* Borde accent */}
                <div style={{
                  width: 80, height: 80, borderRadius: 18,
                  background: "var(--accent)",
                  padding: 2.5, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    position: "relative", width: "100%", height: "100%", borderRadius: 13,
                    backgroundColor: "var(--surface-solid)", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {coverImg ? (
                      <Image src={coverImg} alt={deck.name} fill sizes="75px" className="object-cover" />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: 6, textAlign: "center" }}>
                        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
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

                {/* Avatar del dueño — esquina inferior izquierda */}
                {deckOwner && (
                  <div style={{
                    position: "absolute", bottom: -2, left: -2,
                    width: 26, height: 26, borderRadius: 13,
                    background: "var(--foreground)",
                    padding: 1.5,
                    border: "2px solid var(--background)",
                    overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
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

              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                {deckOwner || deck.name}
              </span>
            </button>
          );
        })}

        {/* Skeletons when empty */}
        {items.length === 0 && !isAuth && [0,1,2,3,4,5].map(i => (
          <div key={i} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: ITEM_WIDTH }}>
            <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "var(--surface-solid)", border: "2px solid var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ width: 40, height: 8, borderRadius: 4, backgroundColor: "var(--surface-solid)", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
        ))}
      </div>

      {activeDeckId && (
        <DeckFanModal deckId={activeDeckId} onClose={() => setActiveDeckId(null)} />
      )}
    </div>
  );
}
