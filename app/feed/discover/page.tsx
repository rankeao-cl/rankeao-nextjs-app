import type { Metadata } from "next";
import { getTournaments } from "@/lib/api/tournaments";
import { getListings } from "@/lib/api/marketplace";
import type { Listing } from "@/lib/types/marketplace";
import type { Tournament } from "@/lib/types/tournament";
import { FeedListingCard, FeedTournamentCard } from "@/components/cards";
import DiscoverFilters from "./DiscoverFilters";

export const metadata: Metadata = {
  title: "Descubrir",
  description: "Descubre torneos, ventas y contenido de la comunidad TCG en Rankeao",
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

interface Props {
  searchParams: Promise<{ tipo?: string }>;
}

export default async function DiscoverPage({ searchParams }: Props) {
  const { tipo } = await searchParams;

  const showTournaments = !tipo || tipo === "torneos";
  const showListings = !tipo || tipo === "ventas";

  let tournamentsData;
  let listingsData;

  try {
    [tournamentsData, listingsData] = await Promise.all([
      showTournaments
        ? getTournaments({ sort: "upcoming", per_page: 20 }).catch(() => null)
        : Promise.resolve(null),
      showListings
        ? getListings({ sort: "newest", per_page: 20 }).catch(() => null)
        : Promise.resolve(null),
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
      timestamp: new Date(t.starts_at || t.created_at || 0).getTime(),
    })),
    ...listings.map((l) => ({
      id: `listing-${l.id}`,
      type: "sale" as const,
      data: l,
      timestamp: new Date(l.created_at || 0).getTime(),
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
          Explorar
        </p>
        <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
          Descubrir
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Contenido popular y reciente de toda la comunidad
        </p>
      </div>

      {/* Filter chips */}
      <DiscoverFilters active={tipo} />

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
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-lg font-bold text-[var(--foreground)] mb-1">
            Sin resultados
          </p>
          <p className="text-sm text-[var(--muted)]">
            No se encontró contenido para este filtro. Intenta con otra categoría.
          </p>
        </div>
      )}
    </div>
  );
}
