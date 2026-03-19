import { getListings } from "@/lib/api/marketplace";
import { getTournaments } from "@/lib/api/tournaments";
import type { Listing } from "@/lib/types/marketplace";
import type { Tournament } from "@/lib/types/tournament";
import { FeedListingCard, FeedTournamentCard } from "@/components/cards";
import FeedHeader from "./FeedClient";
import FeedTabs from "./FeedTabs";
import FeedEmptyState from "./FeedEmptyState";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export default async function HomePage() {
  let tournamentsData;
  let listingsData;

  try {
    [tournamentsData, listingsData] = await Promise.all([
      getTournaments({ sort: "upcoming", per_page: 15 }).catch(() => null),
      getListings({ sort: "newest", per_page: 15 }).catch(() => null),
    ]);
  } catch {
    // Silent fallback
  }

  const tournaments = asArray<Tournament>(tournamentsData?.tournaments);
  const listings = asArray<Listing>(listingsData?.listings);

  const feedItems = [
    ...tournaments.map((t) => ({
      id: `tournament-${t.id}`,
      type: "tournament" as const,
      data: t,
      timestamp: new Date(t.starts_at || t.created_at || Date.now()).getTime(),
    })),
    ...listings.map((l) => ({
      id: `listing-${l.id}`,
      type: "sale" as const,
      data: l,
      timestamp: new Date(l.created_at || Date.now()).getTime(),
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Create post */}
      <FeedHeader />

      {/* Filter tabs */}
      <FeedTabs />

      {/* Feed items */}
      {feedItems.length > 0 ? (
        <div className="space-y-4">
          {feedItems.map((item) => {
            if (item.type === "tournament") {
              return <FeedTournamentCard key={item.id} tournament={item.data} />;
            }
            if (item.type === "sale") {
              return <FeedListingCard key={item.id} listing={item.data} />;
            }
            return null;
          })}
        </div>
      ) : (
        <FeedEmptyState />
      )}
    </div>
  );
}
