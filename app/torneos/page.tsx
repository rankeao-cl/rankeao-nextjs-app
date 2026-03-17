import { getTournaments } from "@/lib/api/tournaments";
import { getGames } from "@/lib/api/catalog";
import { TournamentCard, PastTournamentCard } from "@/components/cards";
import TorneosFilters from "./TorneosFilters";
import TorneosPagination from "./TorneosPagination";
import TorneosViewToggle from "./TorneosViewToggle";
import TorneosCalendar from "./TorneosCalendar";
import { Card, Chip, Button, Skeleton } from "@heroui/react";
import type { Metadata } from "next";
import { Suspense } from "react";
import type { CatalogGame } from "@/lib/types/catalog";
import type { Tournament } from "@/lib/types/tournament";

interface Props {
  searchParams: Promise<{
    q?: string;
    status?: string;
    game?: string;
    format?: string;
    city?: string;
    is_ranked?: string;
    page?: string;
    tab?: string;
    view?: string;
    date_from?: string;
    date_to?: string;
  }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q?.trim();
  return {
    title: q ? `Torneos: ${q}` : "Torneos",
    description: q
      ? `Resultados de torneos para ${q} en Rankeao.`
      : "Busca y participa en torneos TCG en Chile.",
  };
}

const tabConfig: Record<string, { apiStatus: string; sort: string; title: string }> = {
  live: { apiStatus: "STARTED,CHECK_IN,ROUND_IN_PROGRESS,ROUND_COMPLETE", sort: "recent", title: "En Curso" },
  upcoming: { apiStatus: "OPEN", sort: "upcoming", title: "Próximos" },
  past: { apiStatus: "FINISHED,CLOSED", sort: "recent", title: "Pasados" },
};

function TournamentsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="glass p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              {/* header skeleton */}
              <div className="w-full flex flex-col gap-2">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            {/* tags skeleton */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
            {/* details skeleton */}
            <div className="flex justify-between items-center mt-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-md" />
            </div>
            {/* button skeleton */}
            <Skeleton className="h-8 w-full rounded-lg mt-2" />
          </div>
        </Card>
      ))}
    </div>
  );
}

async function TournamentsList({ params, tab }: { params: any; tab: string }) {
  const page = parseInt(params.page || "1", 10);
  const config = tabConfig[tab];
  const apiStatus = params.status || config.apiStatus;

  let tournamentsData;

  try {
    tournamentsData = await getTournaments({
      q: params.q,
      status: apiStatus,
      game: params.game,
      format: params.format,
      city: params.city,
      is_ranked: params.is_ranked === "true" ? true : undefined,
      date_from: params.date_from,
      date_to: params.date_to,
      sort: config.sort,
      page,
      per_page: 12,
    }).catch(() => null);
  } catch {
    // silent fail
  }

  const rawTournaments = tournamentsData?.tournaments;
  const tournaments: Tournament[] = Array.isArray(rawTournaments) ? rawTournaments : [];
  const meta = tournamentsData?.meta;

  return (
    <>
      {/* Results */}
      {tournaments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => (
            tab === "past" ? (
              <PastTournamentCard key={t.id} tournament={t} />
            ) : (
              <TournamentCard key={t.id} tournament={t} />
            )
          ))}
        </div>
      ) : (
        <Card className="glass">
          <Card.Content className="py-16 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-medium text-[var(--foreground)]">
              No se encontraron torneos
            </p>
            <p className="text-sm mt-1 text-[var(--muted)]">
              Intenta ajustar los filtros de búsqueda
            </p>
          </Card.Content>
        </Card>
      )}

      {/* Pagination info */}
      {meta && meta.total > 0 && (
        <TorneosPagination currentPage={page} totalPages={meta.total_pages} />
      )}
    </>
  );
}

async function CalendarTournaments({ params }: { params: any }) {
  // Fetch upcoming + live tournaments for the calendar view
  let allTournaments: Tournament[] = [];
  try {
    const [upcoming, live, past] = await Promise.all([
      getTournaments({ status: "OPEN", sort: "upcoming", per_page: 50 }).catch(() => null),
      getTournaments({ status: "STARTED,CHECK_IN,ROUND_IN_PROGRESS,ROUND_COMPLETE", sort: "recent", per_page: 50 }).catch(() => null),
      getTournaments({ status: "FINISHED,CLOSED", sort: "recent", per_page: 50 }).catch(() => null),
    ]);
    const u = upcoming?.tournaments;
    const l = live?.tournaments;
    const p = past?.tournaments;
    if (Array.isArray(u)) allTournaments.push(...u);
    if (Array.isArray(l)) allTournaments.push(...l);
    if (Array.isArray(p)) allTournaments.push(...p);
  } catch {
    // silent fail
  }

  return <TorneosCalendar tournaments={allTournaments} />;
}

export default async function TorneosPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = (params.tab && tabConfig[params.tab]) ? params.tab : "upcoming";
  const currentView = params.view === "calendar" ? "calendar" : "list";
  const config = tabConfig[tab];
  const apiStatus = params.status || config.apiStatus;

  let gamesData;
  try {
    gamesData = await getGames().catch(() => null);
  } catch {
    // silent fail
  }

  const rawGames = gamesData?.data ?? gamesData?.games;
  const games: CatalogGame[] = Array.isArray(rawGames) ? rawGames : [];

  return (
    <div className="max-w-7xl mx-auto flex flex-col pt-4">
      {/* General Search Header */}
      <section className="px-4 lg:px-6 mb-6">
        <div
          className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="relative z-10 flex-1">
            <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
              Agenda competitiva
            </Chip>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Torneos TCG
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-lg mb-6">
              Busca y participa en torneos activos, próximos y pasados en tiendas y comunidades de Chile.
            </p>
          </div>

          <div className="hidden md:flex flex-col gap-2 min-w-[200px]">
            {/* Destacados placeholder */}
            <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent)] opacity-10 blur-xl rounded-full"></div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Destacados</p>
              <p className="text-sm font-medium text-[var(--foreground)]">Próximos lanzamientos <span className="text-[var(--accent)] inline-block ml-1">&rarr;</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs — always visible */}
      <div className="px-4 lg:px-6 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {Object.entries(tabConfig).map(([key, cfg]) => (
            <a
              key={key}
              href={`?tab=${key}${params.view ? `&view=${params.view}` : ""}${params.game ? `&game=${params.game}` : ""}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === key
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {cfg.title}
            </a>
          ))}
          <div className="ml-auto shrink-0">
            <TorneosViewToggle currentView={currentView} />
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-6 px-4 lg:px-6 mb-12">
        {/* Left Sidebar - Filters (hidden mobile, collapsible) */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <TorneosFilters
              games={games}
              currentFilters={params}
              activeStatus={apiStatus}
            />
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {currentView === "calendar" ? (
            <Suspense key="calendar" fallback={<TournamentsSkeleton />}>
              <CalendarTournaments params={params} />
            </Suspense>
          ) : (
            <Suspense key={JSON.stringify(params)} fallback={<TournamentsSkeleton />}>
              <TournamentsList params={params} tab={tab} />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
