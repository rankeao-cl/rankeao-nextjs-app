import { getListings } from "@/lib/api/marketplace";
import { getTournaments } from "@/lib/api/tournaments";
import type { Listing } from "@/lib/types/marketplace";
import type { Tournament } from "@/lib/types/tournament";
import FeedClient from "./FeedClient";
import FeedMobileCarousel from "./FeedMobileCarousel";
import FeedContent from "./FeedContent";
import FeedRightSidebar from "./FeedRightSidebar";

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
    <div className="max-w-[980px] mx-auto px-2">
      <h1 className="sr-only">Feed principal</h1>
      <div style={{ paddingTop: 16, display: "flex", gap: 56 }}>
        {/* Main feed column */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 620 }}>
          <FeedClient />
          <FeedMobileCarousel tournaments={tournaments} />
          <FeedContent tournaments={tournaments} listings={listings} />
        </div>

        {/* Right sidebar — sticky con scroll propio */}
        <div className="hidden lg:block" style={{ width: 300, flexShrink: 0, paddingTop: 16 }}>
          <div style={{ position: "sticky", top: 0, maxHeight: "calc(100vh - 4rem - 16px)", overflowY: "auto", paddingBottom: 16, scrollbarWidth: "none" }} className="[&::-webkit-scrollbar]:hidden">
            <FeedRightSidebar tournaments={tournaments} />
          </div>
        </div>
      </div>
    </div>
  );
}
