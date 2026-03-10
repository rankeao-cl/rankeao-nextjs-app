import { getXpLeaderboard } from "@/lib/api/gamification";
import { getRatingLeaderboard } from "@/lib/api/ratings";
import { getGames, getGameFormats } from "@/lib/api/catalog";
import type { CatalogFormat, CatalogGame } from "@/lib/types/catalog";
import type { LeaderboardEntry } from "@/lib/types/gamification";
import RankingTabs from "./RankingTabs";
import { Chip } from "@heroui/react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ranking",
  description: "Leaderboards de XP y ratings competitivos TCG.",
};

interface RankingPageProps {
  searchParams?: Promise<{
    game?: string;
    format?: string;
    tab?: string;
    period?: string;
  }>;
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const params = (await searchParams) ?? {};
  let xpData, ratingData, gamesData;

  const period = params.period || "all_time";

  try {
    [xpData, gamesData] = await Promise.all([
      getXpLeaderboard({ period, per_page: 20 }).catch(() => null),
      getGames().catch(() => null),
    ]);
  } catch {
    // silent
  }

  const rawGames = gamesData?.data ?? gamesData?.games;
  const games: CatalogGame[] = Array.isArray(rawGames) ? rawGames : [];

  const selectedGame =
    games.find((g) => g.slug === params.game) ?? games[0];

  let formats: CatalogFormat[] = Array.isArray(selectedGame?.formats) ? selectedGame.formats : [];
  if (selectedGame?.slug) {
    try {
      const formatsRes = await getGameFormats(selectedGame.slug).catch(() => null);
      const rawFormats = formatsRes?.formats ?? formatsRes?.data;
      const fetchedFormats: CatalogFormat[] = Array.isArray(rawFormats) ? rawFormats : [];
      if (fetchedFormats.length > 0) {
        formats = fetchedFormats;
      }
    } catch {
      // silent
    }
  }

  const selectedFormat =
    formats.find((f) => f.slug === params.format) ?? formats[0];

  if (selectedGame?.slug && selectedFormat?.slug) {
    try {
      ratingData = await getRatingLeaderboard({
        game: selectedGame.slug,
        format: selectedFormat.slug,
        per_page: 20,
      }).catch(() => null);
    } catch {
      // silent
    }
  }

  const rawXpEntries = xpData?.leaderboard ?? xpData?.entries;
  const xpEntries: LeaderboardEntry[] = Array.isArray(rawXpEntries) ? rawXpEntries : [];
  const ratingEntries: LeaderboardEntry[] = Array.isArray(ratingData?.leaderboard)
    ? ratingData.leaderboard
    : [];

  return (
    <div className="max-w-7xl mx-auto flex flex-col pt-4">
      {/* Hero Header */}
      <section className="px-4 lg:px-6 mb-6">
        <div
          className="p-5 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="relative z-10 flex-1">
            <Chip size="sm" variant="soft" color="accent" className="mb-3 px-3">
              Rankings Globales Chile
            </Chip>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--foreground)] to-[var(--muted)] mb-2">
              Sube en XP, domina en ELO
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-lg mb-2">
              Consulta el leaderboard global, compara tu rendimiento, sube de rango y obtén badges exclusivos.
            </p>
          </div>

          <div className="hidden md:flex flex-col gap-2 min-w-[200px]">
            <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent)] opacity-10 blur-xl rounded-full"></div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Jugadores XP</p>
              <p className="text-sm font-medium text-[var(--foreground)]">{xpEntries.length} en el top <span className="text-[var(--accent)] inline-block ml-1">&rarr;</span></p>
            </div>
            <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent)] opacity-10 blur-xl rounded-full"></div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Juegos activos</p>
              <p className="text-sm font-medium text-[var(--foreground)]">{games.length} juegos rankeados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className="flex flex-col md:flex-row gap-6 px-4 lg:px-6 mb-12">
        {/* Left Sidebar - Game/Format Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-20 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <RankingFilters
              games={games}
              formats={formats}
              selectedGameSlug={selectedGame?.slug}
              selectedFormatSlug={selectedFormat?.slug}
              selectedTab={params.tab === "ratings" ? "ratings" : "xp"}
              selectedPeriod={period}
            />
          </div>
        </aside>

        {/* Right Content - Leaderboard */}
        <main className="flex-1">
          <RankingTabs
            xpEntries={xpEntries}
            ratingEntries={ratingEntries}
            games={games}
            formats={formats}
            selectedGameSlug={selectedGame?.slug}
            selectedFormatSlug={selectedFormat?.slug}
            selectedTab={params.tab === "ratings" ? "ratings" : "xp"}
          />
        </main>
      </div>
    </div>
  );
}

// Inline server component for the sidebar filters
function RankingFilters({
  games,
  formats,
  selectedGameSlug,
  selectedFormatSlug,
  selectedTab,
  selectedPeriod,
}: {
  games: CatalogGame[];
  formats: CatalogFormat[];
  selectedGameSlug?: string;
  selectedFormatSlug?: string;
  selectedTab: string;
  selectedPeriod: string;
}) {
  const periods = [
    { key: "weekly", label: "Semanal" },
    { key: "monthly", label: "Mensual" },
    { key: "all_time", label: "Histórico" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-bold text-[var(--foreground)]">Navegación</h3>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Tipo de Ranking</p>
        <div className="flex flex-col gap-2">
          <a
            href={`/ranking?tab=xp${selectedGameSlug ? `&game=${selectedGameSlug}` : ""}${selectedFormatSlug ? `&format=${selectedFormatSlug}` : ""}`}
            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${selectedTab === "xp"
              ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] font-medium"
              : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
          >
            XP Global
          </a>
          <a
            href={`/ranking?tab=ratings${selectedGameSlug ? `&game=${selectedGameSlug}` : ""}${selectedFormatSlug ? `&format=${selectedFormatSlug}` : ""}`}
            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${selectedTab === "ratings"
              ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] font-medium"
              : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
          >
            Ratings ELO
          </a>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex flex-col gap-3 pt-3 border-t border-[var(--separator)]">
        <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Periodo</p>
        <div className="flex flex-col gap-2">
          {periods.map((p) => {
            const isActive = selectedPeriod === p.key;
            return (
              <a
                key={p.key}
                href={`/ranking?tab=${selectedTab}&period=${p.key}${selectedGameSlug ? `&game=${selectedGameSlug}` : ""}${selectedFormatSlug ? `&format=${selectedFormatSlug}` : ""}`}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${isActive
                  ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] font-medium"
                  : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
              >
                {p.label}
              </a>
            );
          })}
        </div>
      </div>

      {games.length > 0 && (
        <div className="flex flex-col gap-3 pt-3 border-t border-[var(--separator)]">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Juego</p>
          <div className="flex flex-col gap-2">
            {games.map((g) => {
              const isActive = selectedGameSlug === g.slug;
              return (
                <a
                  key={g.slug}
                  href={`/ranking?tab=${selectedTab}&game=${g.slug}`}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${isActive
                    ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] font-medium"
                    : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                >
                  {g.name}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {formats.length > 0 && (
        <div className="flex flex-col gap-3 pt-3 border-t border-[var(--separator)]">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Formato</p>
          <div className="flex flex-col gap-2">
            {formats.map((f) => {
              const isActive = selectedFormatSlug === f.slug;
              return (
                <a
                  key={f.slug}
                  href={`/ranking?tab=${selectedTab}&game=${selectedGameSlug}&format=${f.slug}`}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${isActive
                    ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] font-medium"
                    : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                >
                  {f.name}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
