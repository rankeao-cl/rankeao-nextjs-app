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
  const selectedTab = params.tab === "ratings" ? "ratings" : "xp";

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

  const xpAny = xpData as any;
  const rawXp = xpAny?.data;
  const rawXpEntries = Array.isArray(rawXp) ? rawXp : (rawXp?.leaderboard ?? rawXp?.entries ?? xpData?.leaderboard ?? xpData?.entries);
  const xpEntries: LeaderboardEntry[] = Array.isArray(rawXpEntries)
    ? rawXpEntries.map((e: any) => ({
        rank: e.rank,
        user_id: e.user_id ?? e.user?.id ?? e.user?.username ?? "",
        username: e.username ?? e.user?.username ?? "",
        avatar_url: e.avatar_url ?? e.user?.avatar_url ?? undefined,
        total_xp: e.total_xp ?? e.xp ?? 0,
        level: e.level,
        title: e.title ?? e.user?.current_title ?? undefined,
      }))
    : [];
  const ratingAny = ratingData as any;
  const rawRating = ratingAny?.data;
  const rawRatingEntries = Array.isArray(rawRating) ? rawRating : (rawRating?.leaderboard ?? ratingData?.leaderboard);
  const ratingEntries: LeaderboardEntry[] = Array.isArray(rawRatingEntries)
    ? rawRatingEntries.map((e: any) => ({
        rank: e.rank,
        user_id: e.user_id ?? e.user?.id ?? e.user?.username ?? "",
        username: e.username ?? e.user?.username ?? "",
        avatar_url: e.avatar_url ?? e.user?.avatar_url ?? undefined,
        rating: e.rating ?? e.elo ?? 0,
        games_played: e.games_played,
        wins: e.wins,
        losses: e.losses,
      }))
    : [];

  const periods = [
    { key: "week", label: "Semanal" },
    { key: "month", label: "Mensual" },
    { key: "all_time", label: "Todo" },
  ];

  function buildUrl(overrides: Record<string, string>) {
    const base: Record<string, string> = {
      tab: selectedTab,
      period,
    };
    if (params.game) base.game = params.game;
    if (params.format) base.format = params.format;
    const merged = { ...base, ...overrides };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    return `/ranking?${qs}`;
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col pt-4">
      {/* Hero Header */}
      <section className="px-4 lg:px-6 mb-6">
        <div className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative z-10 flex-1">
            <Chip size="sm" variant="soft" color="accent" className="mb-3 px-3">
              Rankings Chile
            </Chip>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Leaderboard competitivo
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-lg">
              Consulta el leaderboard global, compara tu rendimiento y sube de rango.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-2 min-w-0 md:min-w-[200px]">
            <div className="flex-1 p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)]">
              <p className="text-[10px] sm:text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Top XP</p>
              <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{xpEntries.length}</p>
            </div>
            <div className="flex-1 p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)]">
              <p className="text-[10px] sm:text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Juegos</p>
              <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{games.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab pills + Period pills */}
      <div className="px-4 lg:px-6 mb-4 space-y-3">
        {/* Ranking type tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <a
            href={buildUrl({ tab: "xp" })}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              selectedTab === "xp"
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            XP Global
          </a>
          <a
            href={buildUrl({ tab: "ratings" })}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              selectedTab === "ratings"
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Ratings ELO
          </a>

          <span className="w-px h-6 bg-[var(--border)] mx-1 shrink-0" />

          {/* Period pills */}
          {periods.map((p) => (
            <a
              key={p.key}
              href={buildUrl({ period: p.key })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                period === p.key
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {p.label}
            </a>
          ))}
        </div>

        {/* Game pills (inline, scrollable) */}
        {games.length > 0 && selectedTab === "ratings" && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold text-[var(--muted)] shrink-0 mr-1">Juego:</span>
            {games.map((g) => (
              <a
                key={g.slug}
                href={buildUrl({ tab: "ratings", game: g.slug })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedGame?.slug === g.slug
                    ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                    : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent"
                }`}
              >
                {g.name}
              </a>
            ))}
            {formats.length > 0 && (
              <>
                <span className="w-px h-5 bg-[var(--border)] mx-1 shrink-0" />
                <span className="text-xs font-semibold text-[var(--muted)] shrink-0 mr-1">Formato:</span>
                {formats.map((f) => (
                  <a
                    key={f.slug}
                    href={buildUrl({ tab: "ratings", game: selectedGame?.slug || "", format: f.slug })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedFormat?.slug === f.slug
                        ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                        : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent"
                    }`}
                  >
                    {f.name}
                  </a>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Content — full width, no sidebar */}
      <div className="px-4 lg:px-6 mb-12">
        <RankingTabs
          xpEntries={xpEntries}
          ratingEntries={ratingEntries}
          games={games}
          formats={formats}
          selectedGameSlug={selectedGame?.slug}
          selectedFormatSlug={selectedFormat?.slug}
          selectedTab={selectedTab}
        />
      </div>
    </div>
  );
}
