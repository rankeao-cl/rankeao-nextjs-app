"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Compass, ChevronRight } from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { useFeed, useFeedDiscover } from "@/lib/hooks/use-social";
import { browseDecks, getDeck } from "@/lib/api/social";
import FeedTournamentCard from "@/features/feed/FeedTournamentCard";
import FeedListingCard from "@/features/feed/FeedListingCard";
import PostCard from "@/features/social/PostCard";
import type { FeedPost } from "@/features/social/PostCard";
import FeedDuelSearchCard from "@/features/feed/FeedDuelSearchCard";
import FeedActivityCard from "@/features/feed/FeedActivityCard";
import type { ActivityData } from "@/features/feed/FeedActivityCard";
import DeckCard from "@/features/deck/DeckCard";
import type { Deck } from "@/lib/types/social";
import type { Tournament } from "@/lib/types/tournament";
import type { Listing } from "@/lib/types/marketplace";
import type { Duel } from "@/lib/types/duel";
import FeedTabs from "@/features/feed/FeedTabs";
import FeedEmptyState from "@/features/feed/FeedEmptyState";

type FeedFilter = "todo" | "torneos" | "ventas" | "posts" | "actividad";

type FeedItemType =
  | { id: string; type: "tournament"; data: Tournament; timestamp: number; pinned?: boolean }
  | { id: string; type: "sale"; data: Listing; timestamp: number; pinned?: boolean }
  | { id: string; type: "post"; data: FeedPost; timestamp: number; pinned?: boolean }
  | { id: string; type: "duel_search"; data: Duel; timestamp: number; pinned?: boolean }
  | { id: string; type: "deck"; data: Deck; timestamp: number; pinned?: boolean }
  | { id: string; type: "activity"; data: ActivityData; timestamp: number; pinned?: boolean };

export default function FeedContent({
  tournaments,
  listings,
}: {
  tournaments: Tournament[];
  listings: Listing[];
}) {
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("todo");
  const { status } = useAuth();
  const isAuth = status === "authenticated";

  const personalFeedQ = useFeed({ per_page: 20 }, isAuth);

  // Always fetch discover feed (for unauthenticated users it's the primary; for auth users it's the fallback)
  const discoverFeedQ = useFeedDiscover({ per_page: 20 });

  // Load decks to inject into feed as DeckCards (with full card details)
  const [feedDecks, setFeedDecks] = useState<Deck[]>([]);
  useEffect(() => {
    browseDecks({ per_page: 6, sort: "newest" })
      .then(async (val: any) => {
        const list: Deck[] = val?.data?.decks || val?.data || val?.decks || [];
        if (!Array.isArray(list) || list.length === 0) return;
        // Fetch details (with cards) for up to 4 random decks
        const shuffled = [...list].sort(() => Math.random() - 0.5).slice(0, 4);
        const detailed = await Promise.all(
          shuffled.map((dk) =>
            getDeck(dk.id)
              .then((res: any) => res?.data?.deck || res?.deck || res?.data || null)
              .catch(() => null)
          )
        );
        setFeedDecks(detailed.filter((dk): dk is Deck => dk !== null && (dk.cards?.length ?? 0) > 0));
      })
      .catch(() => {});
  }, []);

  // Personal feed resolved with 0 items or errored → fall back to discover
  const personalFeedData: any = personalFeedQ.data;
  const personalFeedArray: any[] = personalFeedData?.data?.feed ?? personalFeedData?.feed ?? personalFeedData?.data?.items ?? personalFeedData?.items ?? [];
  const personalFeedDone = personalFeedQ.status !== "pending";
  const personalFeedEmpty = isAuth && personalFeedDone && personalFeedArray.length === 0;

  const socialQ = isAuth && !personalFeedEmpty ? personalFeedQ : discoverFeedQ;

  const feedItems = useMemo<FeedItemType[]>(() => {
    const items: FeedItemType[] = [];

    const now = Date.now();

    if (feedFilter !== "torneos" && feedFilter !== "posts" && feedFilter !== "actividad") {
      for (const l of listings) {
        items.push({
          id: `listing-${l.id}`,
          type: "sale",
          data: l,
          timestamp: new Date(l.created_at || 0).getTime(),
        });
      }
    }

    if (feedFilter !== "torneos" && feedFilter !== "ventas") {
      const socialData: any = socialQ.data;
      const feedArray: any[] =
        socialData?.data?.feed ??
        socialData?.feed ??
        socialData?.data?.items ??
        socialData?.items ??
        (Array.isArray(socialData) ? socialData : []);
      for (const s of feedArray) {
        const user = s.user ?? {};
        const itemType = (s.type ?? s.item_type ?? "").toUpperCase();

        // Duel search items — show in feed (mobile only via CSS)
        if (itemType === "DUEL_SEARCH") {
          const meta = s.metadata ?? {};
          items.push({
            id: `duel-search-${s.id}`,
            type: "duel_search",
            pinned: true,
            data: {
              id: meta.duel_id ?? String(s.entity_id ?? s.id),
              challenger: {
                id: user.id ?? "",
                username: user.username ?? s.username ?? "",
                display_name: user.display_name,
                avatar_url: user.avatar_url ?? s.avatar_url,
                rating: user.rating,
              },
              opponent: { id: "", username: "" },
              game_name: meta.game_name ?? "",
              format_name: meta.format_name,
              best_of: meta.best_of ?? 1,
              status: "PENDING" as const,
              created_at: s.created_at ?? "",
              message: s.description,
            },
            timestamp: new Date(s.created_at || Date.now()).getTime(),
          });
          continue;
        }

        // Deck published → DeckCard with miniature grid
        if (itemType === "DECK_PUBLISHED") {
          const meta = s.metadata ?? {};
          if (feedFilter !== "actividad") {
            items.push({
              id: `deck-${s.id}`,
              type: "deck",
              data: {
                id: String(meta.deck_id ?? s.entity_id ?? s.id),
                user_id: user.id ?? "",
                username: user.username ?? s.username ?? "",
                name: meta.deck_name ?? s.title ?? "",
                game_name: meta.game_name ?? s.game ?? "",
                format_name: meta.format_name ?? "",
                is_public: true,
                like_count: s.likes_count ?? 0,
                view_count: meta.views_count ?? 0,
                cards: meta.cards ?? [],
                created_at: s.created_at ?? "",
              },
              timestamp: new Date(s.created_at || Date.now()).getTime(),
            });
          }
          continue;
        }

        // User-generated posts → PostCard
        if (itemType === "POST") {
          if (feedFilter !== "actividad") {
            items.push({
              id: `post-${s.id}`,
              type: "post",
              data: {
                id: String(s.id),
                author: {
                  username: user.username ?? s.username ?? "",
                  avatar_url: user.avatar_url ?? s.avatar_url,
                  rank_badge: user.rank_badge,
                },
                text: s.description ?? s.text ?? s.content ?? "",
                images: s.images ?? (s.image_url ? [s.image_url] : undefined),
                tags: s.tags,
                game: s.game ?? s.game_name,
                likes_count: s.likes_count ?? s.like_count ?? 0,
                is_liked: s.is_liked ?? false,
                fires_count: s.fires_count ?? 0,
                is_fired: s.is_fired ?? false,
                comments_count: s.comments_count ?? s.comment_count,
                created_at: s.created_at ?? "",
              },
              timestamp: new Date(s.created_at || Date.now()).getTime(),
            });
          }
          continue;
        }

        // All other activity types → FeedActivityCard
        if (feedFilter !== "posts") {
          items.push({
            id: `activity-${s.id}`,
            type: "activity",
            data: {
              id: String(s.id),
              type: itemType,
              user: {
                username: user.username ?? s.username ?? "",
                avatar_url: user.avatar_url ?? s.avatar_url,
              },
              title: s.title ?? s.description ?? "",
              description: s.title ? (s.description ?? undefined) : undefined,
              image_url: s.image_url,
              entity_type: s.entity_type,
              entity_id: s.entity_id,
              metadata: s.metadata,
              likes_count: s.likes_count ?? 0,
              is_liked: s.is_liked ?? false,
              fires_count: s.fires_count ?? 0,
              is_fired: s.is_fired ?? false,
              comments_count: s.comments_count ?? s.comment_count ?? 0,
              created_at: s.created_at ?? "",
            },
            timestamp: new Date(s.created_at || Date.now()).getTime(),
          });
        }
      }
    }

    // Inject deck cards from browse (only those with cards loaded)
    if (feedFilter !== "torneos" && feedFilter !== "ventas") {
      // Avoid duplicating decks that already appear as DECK_PUBLISHED activities
      const existingDeckIds = new Set(items.filter(i => i.type === "deck").map(i => i.id));
      for (const dk of feedDecks) {
        const deckItemId = `deck-${dk.id}`;
        if (!existingDeckIds.has(deckItemId)) {
          items.push({
            id: deckItemId,
            type: "deck",
            data: dk,
            timestamp: new Date(dk.created_at || 0).getTime(),
          });
        }
      }
    }

    items.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.timestamp - a.timestamp;
    });
    return items;
  }, [feedFilter, tournaments, listings, socialQ.data, feedDecks]);

  return (
    <>
      {/* Discover button — only for unauthenticated users */}
      {!isAuth && (
        <Link
          href="/feed/discover"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "var(--surface-solid)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 12,
            paddingBottom: 12,
            gap: 8,
            textDecoration: "none",
            marginTop: 8,
          }}
        >
          <Compass width={16} height={16} color="var(--foreground)" />
          <span
            style={{
              flex: 1,
              color: "var(--foreground)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Descubrir
          </span>
          <ChevronRight width={14} height={14} color="var(--muted)" />
        </Link>
      )}

      {/* Feed tabs */}
      <FeedTabs active={feedFilter} onChange={setFeedFilter} />

      {/* Feed items */}
      {feedItems.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {feedItems.map((item) => {
            if (item.type === "duel_search") {
              return (
                <div key={item.id} className="lg:hidden">
                  <FeedDuelSearchCard
                    duel={item.data as Duel}
                    onAccepted={() => socialQ.refetch()}
                  />
                </div>
              );
            }
            if (item.type === "sale") {
              return (
                <FeedListingCard
                  key={item.id}
                  listing={item.data as Listing}
                />
              );
            }
            if (item.type === "deck") {
              return (
                <DeckCard
                  key={item.id}
                  deck={item.data as Deck}
                />
              );
            }
            if (item.type === "activity") {
              return (
                <FeedActivityCard
                  key={item.id}
                  activity={item.data as ActivityData}
                />
              );
            }
            if (item.type !== "post") {
              return null;
            }
            return (
              <PostCard key={item.id} post={item.data as FeedPost} />
            );
          })}
        </div>
      ) : (
        <FeedEmptyState />
      )}
      <style>{`
        .feed-card-hover:hover {
          border-color: rgba(59,130,246,0.4) !important;
          box-shadow: 0 0 20px rgba(59,130,246,0.15), 0 4px 16px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </>
  );
}
