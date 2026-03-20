import { getTournaments } from "@/lib/api/tournaments";
import { getGames } from "@/lib/api/catalog";
import { TournamentCard, PastTournamentCard } from "@/components/cards";
import TorneosFilters from "./TorneosFilters";
import TorneosPagination from "./TorneosPagination";
import TorneosViewToggle from "./TorneosViewToggle";
import TorneosCalendar from "./TorneosCalendar";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#1A1A1E] p-4"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="w-full flex flex-col gap-2">
                <div className="h-5 w-3/4 rounded-lg bg-[rgba(255,255,255,0.06)] animate-pulse" />
                <div className="h-3 w-1/2 rounded-lg bg-[rgba(255,255,255,0.06)] animate-pulse" />
              </div>
              <div className="h-6 w-16 rounded-full bg-[rgba(255,255,255,0.06)] animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-md bg-[rgba(255,255,255,0.06)] animate-pulse" />
              <div className="h-6 w-20 rounded-md bg-[rgba(255,255,255,0.06)] animate-pulse" />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="h-4 w-24 rounded-md bg-[rgba(255,255,255,0.06)] animate-pulse" />
              <div className="h-4 w-12 rounded-md bg-[rgba(255,255,255,0.06)] animate-pulse" />
            </div>
            <div className="h-8 w-full rounded-lg bg-[rgba(255,255,255,0.06)] animate-pulse mt-2" />
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
        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#1A1A1E]">
          <div className="py-16 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-medium text-[#F2F2F2]">
              No se encontraron torneos
            </p>
            <p className="text-sm mt-1 text-[#888891]">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        </div>
      )}

      {/* Pagination info */}
      {meta && meta.total > 0 && (
        <TorneosPagination currentPage={page} totalPages={meta.total_pages} />
      )}
    </>
  );
}

async function CalendarTournaments({ params }: { params: Record<string, string | undefined> }) {
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
    <div className="max-w-7xl mx-auto flex flex-col">
      {/* Hero header — matches Expo layout */}
      <section className="mx-4 lg:mx-6 mb-[14px] mt-3">
        <div
          style={{
            backgroundColor: "#1A1A1E",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: 18,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 120,
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1 }}>
            {/* Badge */}
            <span
              style={{
                display: "inline-block",
                backgroundColor: "rgba(255,255,255,0.06)",
                alignSelf: "flex-start",
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 999,
                marginBottom: 8,
                color: "#888891",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Agenda competitiva
            </span>
            <h1
              style={{
                color: "#F2F2F2",
                fontSize: 22,
                fontWeight: 800,
                margin: 0,
                marginBottom: 4,
              }}
            >
              Torneos TCG
            </h1>
            <p
              style={{
                color: "#888891",
                fontSize: 13,
                lineHeight: "18px",
                margin: 0,
              }}
            >
              Busca y participa en torneos activos, proximos y pasados.
            </p>
          </div>

          {/* Create button */}
          <a
            href="/torneos/new"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "#3B82F6",
              borderRadius: 12,
              paddingLeft: 14,
              paddingRight: 14,
              paddingTop: 8,
              paddingBottom: 8,
              marginLeft: 12,
              alignSelf: "center",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>Crear</span>
          </a>
        </div>
      </section>

      {/* Search bar + view toggle */}
      <div className="mx-4 lg:mx-6 mb-3 flex items-center gap-2">
        <form action="/torneos" method="GET" className="flex-1 flex items-center gap-2 bg-[#1A1A1E] border border-[rgba(255,255,255,0.06)] rounded-full px-[14px] py-[10px]">
          {/* Preserve current params */}
          {params.tab && <input type="hidden" name="tab" value={params.tab} />}
          {params.view && <input type="hidden" name="view" value={params.view} />}
          {params.game && <input type="hidden" name="game" value={params.game} />}
          {/* Search icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            name="q"
            placeholder="Buscar torneos..."
            defaultValue={params.q || ""}
            className="flex-1 bg-transparent text-sm text-[#F2F2F2] placeholder-[#888891] outline-none"
          />
          {params.q && (
            <a href={`/torneos?tab=${tab}${params.view ? `&view=${params.view}` : ""}${params.game ? `&game=${params.game}` : ""}`} className="shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </a>
          )}
        </form>
        <TorneosViewToggle currentView={currentView} />
      </div>

      {/* Tabs — matches Expo pill style */}
      <div className="mx-4 lg:mx-6 mb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {Object.entries(tabConfig).map(([key, cfg]) => (
            <a
              key={key}
              href={`?tab=${key}${params.view ? `&view=${params.view}` : ""}${params.game ? `&game=${params.game}` : ""}`}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
                tab === key
                  ? "bg-[#F2F2F2] text-[#000000] border border-transparent"
                  : "bg-[#1A1A1E] border border-[rgba(255,255,255,0.06)] text-[#888891] hover:text-[#F2F2F2]"
              }`}
            >
              {cfg.title}
            </a>
          ))}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-6 mx-4 lg:mx-6 mb-12">
        {/* Left Sidebar - Filters (hidden mobile, collapsible) */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 p-4 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#1A1A1E]">
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
