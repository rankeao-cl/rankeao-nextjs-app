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
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <section
        className="p-5 sm:p-6 rounded-xl relative overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="relative">
          <Chip size="sm" variant="soft" color="accent" className="mb-2">
            Rankings Globales Chile
          </Chip>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            Sube en XP, domina en ELO
          </h1>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: "var(--muted)" }}>
            Consulta el leaderboard global, compara tu rendimiento, sube de rango y obtén badges exclusivos.
          </p>
        </div>
      </section>

      {/* Tabs Layout */}
      <section
        className="p-4 sm:p-5 rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
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
