import { getTournaments } from "@/lib/api/tournaments";
import { getGames } from "@/lib/api/catalog";
import TournamentCard from "@/features/tournament/TournamentCard";
import PastTournamentCard from "@/features/tournament/PastTournamentCard";
import TorneosFilters from "./TorneosFilters";
import Pagination from "@/components/ui/Pagination";
import ViewToggle, { LIST_ICON, CALENDAR_ICON } from "@/components/ui/ViewToggle";
import TorneosCalendar from "./TorneosCalendar";
import type { Metadata } from "next";
import { Suspense } from "react";
import type { CatalogGame } from "@/lib/types/catalog";
import type { Tournament } from "@/lib/types/tournament";
import PageHero from "@/components/ui/PageHero";
import FilterPills from "@/components/ui/FilterPills";
import type { FilterPill } from "@/components/ui/FilterPills";
import Link from "next/link";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-surface-solid p-4"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="w-full flex flex-col gap-2">
                <div className="h-5 w-3/4 rounded-lg bg-border animate-pulse" />
                <div className="h-3 w-1/2 rounded-lg bg-border animate-pulse" />
              </div>
              <div className="h-6 w-16 rounded-full bg-border animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-md bg-border animate-pulse" />
              <div className="h-6 w-20 rounded-md bg-border animate-pulse" />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="h-4 w-24 rounded-md bg-border animate-pulse" />
              <div className="h-4 w-12 rounded-md bg-border animate-pulse" />
            </div>
            <div className="h-8 w-full rounded-lg bg-border animate-pulse mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function TournamentsList({ params, tab }: { params: Record<string, string | undefined>; tab: string }) {
  const page = parseInt(params.page || "1", 10);
  const config = tabConfig[tab];
  const apiStatus = params.status || config.apiStatus;

  let tournamentsData;
  let listLoadFailed = false;

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
    });
  } catch {
    listLoadFailed = true;
    tournamentsData = null;
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
      ) : listLoadFailed ? (
        <div className="rounded-2xl border border-border bg-surface-solid">
          <div className="py-16 text-center">
            <p className="text-4xl mb-4">⚠️</p>
            <p className="text-lg font-medium text-foreground">
              No pudimos cargar los torneos
            </p>
            <p className="text-sm mt-1 text-muted">
              Intenta actualizar la pagina en unos segundos.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface-solid">
          <div className="py-16 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-medium text-foreground">
              No se encontraron torneos
            </p>
            <p className="text-sm mt-1 text-muted">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        </div>
      )}

      {/* Pagination info */}
      {meta && meta.total > 0 && (
        <Pagination currentPage={page} totalPages={meta.total_pages} />
      )}
    </>
  );
}

async function CalendarTournaments() {
  // Fetch upcoming + live tournaments for the calendar view
  const allTournaments: Tournament[] = [];
  let calendarLoadFailed = false;
  try {
    const [upcoming, live, past] = await Promise.all([
      getTournaments({ status: "OPEN", sort: "upcoming", per_page: 50 }),
      getTournaments({ status: "STARTED,CHECK_IN,ROUND_IN_PROGRESS,ROUND_COMPLETE", sort: "recent", per_page: 50 }),
      getTournaments({ status: "FINISHED,CLOSED", sort: "recent", per_page: 50 }),
    ]);
    const u = upcoming?.tournaments;
    const l = live?.tournaments;
    const p = past?.tournaments;
    if (Array.isArray(u)) allTournaments.push(...u);
    if (Array.isArray(l)) allTournaments.push(...l);
    if (Array.isArray(p)) allTournaments.push(...p);
  } catch {
    calendarLoadFailed = true;
  }

  if (calendarLoadFailed && allTournaments.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface-solid">
        <div className="py-16 text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-lg font-medium text-foreground">No pudimos cargar el calendario</p>
          <p className="text-sm mt-1 text-muted">Intenta nuevamente en unos segundos.</p>
        </div>
      </div>
    );
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
    <div className="max-w-7xl mx-auto flex flex-col">
      {/* Hero header -- matches Expo layout */}
      <PageHero
        badge="Agenda competitiva"
        title="Torneos TCG"
        subtitle="Busca y participa en torneos activos, proximos y pasados."
      />

      {/* Search bar + view toggle */}
      <div className="mx-4 lg:mx-6 mb-3 flex items-center gap-2">
        <form action="/torneos" method="GET" className="flex-1 flex items-center gap-2 bg-surface-solid border border-border rounded-full px-[14px] py-[10px]">
          {/* Preserve current params */}
          {params.tab && <input type="hidden" name="tab" value={params.tab} />}
          {params.view && <input type="hidden" name="view" value={params.view} />}
          {params.game && <input type="hidden" name="game" value={params.game} />}
          {/* Search icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            name="q"
            placeholder="Buscar torneos..."
            defaultValue={params.q || ""}
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted outline-none"
          />
          {params.q && (
            <Link href={`/torneos?tab=${tab}${params.view ? `&view=${params.view}` : ""}${params.game ? `&game=${params.game}` : ""}`} className="shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </Link>
          )}
        </form>
        <ViewToggle currentView={currentView} options={[
                            { key: "list", icon: LIST_ICON, ariaLabel: "Vista lista" },
                            { key: "calendar", icon: CALENDAR_ICON, ariaLabel: "Vista calendario" },
                        ]} defaultView="list" />
      </div>

      {/* Tabs -- matches Expo pill style */}
      <div className="mx-4 lg:mx-6 mb-3">
        <FilterPills
          items={Object.entries(tabConfig).map(([key, cfg]) => ({
            key,
            label: cfg.title,
            href: `?tab=${key}${params.view ? `&view=${params.view}` : ""}${params.game ? `&game=${params.game}` : ""}`,
          } satisfies FilterPill))}
          activeKey={tab}
        />
      </div>

      {/* Main Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-6 mx-4 lg:mx-6 mb-12">
        {/* Left Sidebar - Filters (hidden mobile, collapsible) */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 p-4 rounded-2xl border border-border bg-surface-solid">
            <TorneosFilters
              games={games}
              currentFilters={params}
              activeStatus={apiStatus}
            />
          </div>
        </aside>

        {/* Content */}
        <section className="flex-1 min-w-0">
          {currentView === "calendar" ? (
            <Suspense key="calendar" fallback={<TournamentsSkeleton />}>
              <CalendarTournaments />
            </Suspense>
          ) : (
            <Suspense key={JSON.stringify(params)} fallback={<TournamentsSkeleton />}>
              <TournamentsList params={params} tab={tab} />
            </Suspense>
          )}
        </section>
      </div>
    </div>
  );
}
