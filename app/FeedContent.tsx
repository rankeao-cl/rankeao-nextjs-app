"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Compass, ChevronRight } from "@gravity-ui/icons";
import { useFeed, useFeedDiscover } from "@/lib/hooks/use-social";
import { FeedTournamentCard, FeedListingCard, PostCard } from "@/components/cards";
import type { FeedPost } from "@/components/cards";
import type { Tournament } from "@/lib/types/tournament";
import type { Listing } from "@/lib/types/marketplace";
import FeedTabs from "./FeedTabs";
import FeedEmptyState from "./FeedEmptyState";

type FeedFilter = "todo" | "torneos" | "ventas" | "posts";

type FeedItemType =
  | { id: string; type: "tournament"; data: Tournament; timestamp: number }
  | { id: string; type: "sale"; data: Listing; timestamp: number }
  | { id: string; type: "post"; data: FeedPost; timestamp: number };

export default function FeedContent({
  tournaments,
  listings,
}: {
  tournaments: Tournament[];
  listings: Listing[];
}) {
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("todo");

  const personalQ = useFeed({ per_page: 20 });
  const discoverQ = useFeedDiscover({ per_page: 20 });

  // Use personal feed if it has posts, otherwise fallback to discover
  const personalFeed: any[] = (() => {
    const d: any = personalQ.data;
    return d?.data?.feed ?? d?.feed ?? d?.data?.items ?? d?.items ?? (Array.isArray(d) ? d : []);
  })();
  const socialQ = personalFeed.length > 0 ? personalQ : discoverQ;

  const feedItems = useMemo<FeedItemType[]>(() => {
    const items: FeedItemType[] = [];

    if (feedFilter !== "ventas" && feedFilter !== "posts") {
      for (const t of tournaments) {
        items.push({
          id: `tournament-${t.id}`,
          type: "tournament",
          data: t,
          timestamp: new Date(t.starts_at || t.created_at || 0).getTime(),
        });
      }
    }

    if (feedFilter !== "torneos" && feedFilter !== "posts") {
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
            likes_count: s.likes_count ?? s.like_count,
            comments_count: s.comments_count ?? s.comment_count,
            created_at: s.created_at ?? "",
          },
          timestamp: new Date(s.created_at || Date.now()).getTime(),
        });
      }
    }

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  }, [feedFilter, tournaments, listings, socialQ.data]);

  return (
    <>
      {/* Discover button */}
      <Link
        href="/feed/discover"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#1A1A1E",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 12,
          paddingBottom: 12,
          gap: 8,
          textDecoration: "none",
          marginTop: 8,
        }}
      >
        <Compass width={16} height={16} color="#F2F2F2" />
        <span
          style={{
            flex: 1,
            color: "#F2F2F2",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Descubrir
        </span>
        <ChevronRight width={14} height={14} color="#888891" />
      </Link>

      {/* Feed tabs */}
      <FeedTabs active={feedFilter} onChange={setFeedFilter} />

      {/* Feed items */}
      {feedItems.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {feedItems.map((item) => {
            if (item.type === "tournament") {
              return (
                <FeedTournamentCard
                  key={item.id}
                  tournament={item.data as Tournament}
                />
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
            return (
              <PostCard key={item.id} post={item.data as FeedPost} />
            );
          })}
        </div>
      ) : (
        <FeedEmptyState />
      )}
    </>
  );
}
