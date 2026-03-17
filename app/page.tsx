import { getListings } from "@/lib/api/marketplace";
import { getTournaments } from "@/lib/api/tournaments";
import type { Listing } from "@/lib/types/marketplace";
import type { Tournament } from "@/lib/types/tournament";
import { FeedListingCard, FeedTournamentCard } from "@/components/cards";
import FeedHeader from "./FeedClient";

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
    <div className="w-full p-4 space-y-4">
      <FeedHeader />

      {feedItems.length > 0 ? (
        feedItems.map((item) => {
          if (item.type === "tournament") {
            return <FeedTournamentCard key={item.id} tournament={item.data} />;
          }
          if (item.type === "sale") {
            return <FeedListingCard key={item.id} listing={item.data} />;
          }
          return null;
        })
      ) : (
        <div className="glass py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📭</span>
          </div>
          <p className="font-semibold text-[var(--foreground)] mb-1">Tu feed esta vacio</p>
          <p className="text-sm text-[var(--muted)]">
            Explora torneos y el marketplace para descubrir contenido.
          </p>
        </div>
      )}
    </div>
  );
}
