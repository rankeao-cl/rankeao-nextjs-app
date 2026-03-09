import { getTournaments, getGames } from "@/lib/api";
import { TournamentCard } from "@/components/cards";
import TorneosFilters from "./TorneosFilters";
import { Card, Chip, Tabs } from "@heroui/react";
import type { Metadata } from "next";
import type { CatalogGame, Tournament } from "@/lib/api";

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
  live: { apiStatus: "ROUND_IN_PROGRESS", sort: "recent", title: "En Curso" },
  upcoming: { apiStatus: "OPEN,CHECK_IN", sort: "upcoming", title: "Próximos" },
  past: { apiStatus: "FINISHED,CLOSED", sort: "recent", title: "Pasados" },
};

export default async function TorneosPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const tab = (params.tab && tabConfig[params.tab]) ? params.tab : "upcoming";
  const config = tabConfig[tab];

  let tournamentsData, gamesData;

  const apiStatus = params.status || config.apiStatus;

  try {
    [tournamentsData, gamesData] = await Promise.all([
      getTournaments({
        q: params.q,
        status: apiStatus,
        game: params.game,
        format: params.format,
        city: params.city,
        is_ranked: params.is_ranked === "true" ? true : undefined,
        sort: config.sort,
        page,
        per_page: 12,
      }).catch(() => null),
      getGames().catch(() => null),
    ]);
  } catch {
    // silent fail
  }

  const rawTournaments = tournamentsData?.tournaments;
  const tournaments: Tournament[] = Array.isArray(rawTournaments) ? rawTournaments : [];
  const meta = tournamentsData?.meta;
  const rawGames = gamesData?.data ?? gamesData?.games;
  const games: CatalogGame[] = Array.isArray(rawGames) ? rawGames : [];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <section
        className="p-5 sm:p-6 rounded-xl relative overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="relative">
          <Chip size="sm" variant="soft" color="accent" className="mb-2">
            Agenda competitiva
          </Chip>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            Torneos
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Torneos TCG activos, próximos y pasados en tiendas y comunidades de Chile.
          </p>
        </div>
      </section>

      {/* Tabs + Filters */}
      <section
        className="p-4 rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <Tabs aria-label="Tipo de Torneo" selectedKey={tab} className="mb-4">
          <Tabs.ListContainer>
            <Tabs.List>
              <Tabs.Tab id="live" href="?tab=live">
                🔴 En Curso
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="upcoming" href="?tab=upcoming">
                📅 Próximos
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="past" href="?tab=past">
                🏆 Pasados
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        <TorneosFilters
          games={games}
          currentFilters={params}
          totalPages={meta?.total_pages ?? 1}
          currentPage={page}
        />
      </section>

      {/* Results */}
      {tournaments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      ) : (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Card.Content className="py-16 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
              No se encontraron torneos
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Intenta ajustar los filtros de búsqueda
            </p>
          </Card.Content>
        </Card>
      )}

      {/* Pagination info */}
      {meta && meta.total > 0 && (
        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          Mostrando página {meta.page} de {meta.total_pages} ({meta.total} torneos)
        </p>
      )}
    </div>
  );
}
