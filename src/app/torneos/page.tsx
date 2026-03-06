import { getTournaments, getGames } from "@/lib/api";
import TournamentCard from "@/components/TournamentCard";
import TorneosFilters from "./TorneosFilters";
import { Card, CardContent, Chip, Tabs } from "@heroui/react";
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

export default async function TorneosPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  let tournamentsData, gamesData;

  const tab = params.tab === "past" ? "past" : "active";

  // If tab is past, override status to show finished/closed if not explicitly set
  const apiStatus = params.status || (tab === "past" ? "FINISHED,CLOSED" : "OPEN,CHECK_IN,ROUND_IN_PROGRESS");

  try {
    [tournamentsData, gamesData] = await Promise.all([
      getTournaments({
        q: params.q,
        status: apiStatus,
        game: params.game,
        format: params.format,
        city: params.city,
        is_ranked: params.is_ranked === "true" ? true : undefined,
        sort: tab === "past" ? "recent" : "upcoming",
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
    <div className="rk-container py-10 space-y-7">
      <section className="surface-panel p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(248,250,252,0.16),transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_80%,rgba(248,250,252,0.22),transparent_40%)]" />
        <div className="relative">
          <Chip size="sm" variant="soft" color="accent" className="mb-3">
            Agenda competitiva
          </Chip>
          <h1 className="section-title mb-2">/ Torneos Activos y Proximos</h1>
          <p className="section-subtitle">
            Explora eventos en tiendas y comunidades locales. Filtra por juego, formato, ciudad y estado.
          </p>
        </div>
      </section>

      <section className="surface-panel p-4 sm:p-5">
        <Tabs aria-label="Filtro de Temporada" selectedKey={tab} className="mb-4">
          <Tabs.ListContainer>
            <Tabs.List>
              <Tabs.Tab id="active" href="?tab=active">
                Activos
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="past" href="?tab=past">
                Pasados
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

      {tournaments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      ) : (
        <Card className="surface-panel">
          <CardContent className="py-16 text-center text-gray-500">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-medium">No se encontraron torneos</p>
            <p className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
          </CardContent>
        </Card>
      )}

      {meta && meta.total > 0 && (
        <p className="text-center text-gray-500 text-sm">
          Mostrando página {meta.page} de {meta.total_pages} ({meta.total} torneos)
        </p>
      )}
    </div>
  );
}
