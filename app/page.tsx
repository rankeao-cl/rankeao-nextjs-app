import { Avatar, Card, Chip } from "@heroui/react";
import { getListings } from "@/lib/api/marketplace";
import { getTournaments } from "@/lib/api/tournaments";
import type { Listing } from "@/lib/types/marketplace";
import type { Tournament } from "@/lib/types/tournament";
import { SaleCard, TournamentCard } from "@/components/cards";

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

  // Build a unified feed by aggregating the available API data
  const feedItems = [
    ...tournaments.map((t) => ({
      id: `tournament-${t.id}`,
      type: "tournament",
      data: t,
      timestamp: new Date(t.starts_at || t.created_at || Date.now()).getTime(),
    })),
    ...listings.map((l) => ({
      id: `listing-${l.id}`,
      type: "sale",
      data: l,
      timestamp: new Date(l.created_at || Date.now()).getTime(),
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="max-w-2xl mx-auto w-full px-4 lg:px-6 py-6 space-y-6">
      {/* Create Post Header (Mock UI for MVP since no post API exists) */}
      <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <Card.Content className="p-4 flex gap-3">
          <Avatar size="sm" />
          <div
            className="flex-1 rounded-full px-4 py-2 flex items-center cursor-text"
            style={{ background: "var(--surface-secondary)", color: "var(--muted)" }}
          >
            <span className="text-sm">¿Qué estás jugando hoy?</span>
          </div>
        </Card.Content>
      </Card>

      {/* Unified Feed Stream */}
      <div className="space-y-4">
        {feedItems.length > 0 ? (
          feedItems.map((item) => {
            if (item.type === "tournament") {
              return <TournamentCard key={item.id} tournament={item.data as Tournament} />;
            }
            if (item.type === "sale") {
              return <SaleCard key={item.id} listing={item.data as Listing} />;
            }
            return null;
          })
        ) : (
          <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Card.Content className="py-10 text-center">
              <p style={{ color: "var(--muted)" }}>No hay actividad reciente en el feed.</p>
            </Card.Content>
          </Card>
        )}
      </div>
    </div>
  );
}
