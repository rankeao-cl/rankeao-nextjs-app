import {
  getXpLeaderboard,
  getRatingLeaderboard,
  getGames,
  getGameFormats,
  type CatalogFormat,
  type CatalogGame,
  type LeaderboardEntry,
} from "@/lib/api";
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
  }>;
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const params = (await searchParams) ?? {};
  let xpData, ratingData, gamesData;

  try {
    [xpData, gamesData] = await Promise.all([
      getXpLeaderboard({ period: "all_time", per_page: 20 }).catch(() => null),
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
    <div className="rk-container py-10 space-y-7">
      <section className="surface-panel p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(212,212,216,0.16),transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_90%,rgba(248,250,252,0.2),transparent_38%)]" />
        <div className="relative">
          <Chip size="sm" variant="soft" color="accent" className="mb-3">
            Rankings Globales Chile
          </Chip>
          <h1 className="section-title mb-2">Sube en XP, domina en ELO</h1>
          <p className="section-subtitle">
            Consulta el leaderboard global y compara rendimiento por juego y formato competitivo.
          </p>
        </div>
      </section>

      <section className="surface-panel p-4 sm:p-6">
        <RankingTabs
          xpEntries={xpEntries}
          ratingEntries={ratingEntries}
          games={games}
          formats={formats}
          selectedGameSlug={selectedGame?.slug}
          selectedFormatSlug={selectedFormat?.slug}
          selectedTab={params.tab === "ratings" ? "ratings" : "xp"}
        />
      </section>
    </div>
  );
}
