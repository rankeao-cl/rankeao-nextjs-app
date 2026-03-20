import { getListings } from "@/lib/api/marketplace";
import { getTournaments } from "@/lib/api/tournaments";
import type { Listing } from "@/lib/types/marketplace";
import type { Tournament } from "@/lib/types/tournament";
import FeedClient from "./FeedClient";
import FeedContent from "./FeedContent";

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

  return (
    <div style={{ maxWidth: 672, marginLeft: "auto", marginRight: "auto", paddingLeft: 8, paddingRight: 8 }}>
      <div style={{ paddingTop: 8 }}>
        {/* Create post widget */}
        <FeedClient />

        {/* Discover button + Tabs + Feed items (client-side filtering) */}
        <FeedContent tournaments={tournaments} listings={listings} />
      </div>
    </div>
  );
}
