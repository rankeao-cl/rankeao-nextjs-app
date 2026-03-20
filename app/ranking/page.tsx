import { getXpLeaderboard } from "@/lib/api/gamification";
import { getRatingLeaderboard } from "@/lib/api/ratings";
import { getGames, getGameFormats } from "@/lib/api/catalog";
import type { CatalogFormat, CatalogGame } from "@/lib/types/catalog";
import type { LeaderboardEntry } from "@/lib/types/gamification";
import RankingTabs from "./RankingTabs";
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
    { key: "all_time", label: "Todo" },
    { key: "month", label: "Mes" },
    { key: "week", label: "Semana" },
  ];

  const tabs = [
    { key: "xp", label: "XP Global" },
    { key: "ratings", label: "ELO Rating" },
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
    <div className="max-w-7xl mx-auto flex flex-col">
      {/* Hero header */}
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
              Clasificacion
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
              Ranking
            </h1>
            <p
              style={{
                color: "#888891",
                fontSize: 13,
                lineHeight: "18px",
                margin: 0,
              }}
            >
              Compite y sube en el ranking de jugadores.
            </p>
          </div>
        </div>
      </section>

      {/* Search bar */}
      <section className="mx-4 lg:mx-6 mb-3">
        <div
          style={{
            backgroundColor: "#1A1A1E",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 999,
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 10,
            paddingBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#888891"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span
            style={{
              color: "#888891",
              fontSize: 13,
              flex: 1,
            }}
          >
            Buscar jugador...
          </span>
        </div>
      </section>

      {/* Filter pills — ranking type */}
      <section className="mx-4 lg:mx-6 mb-3">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
          }}
          className="no-scrollbar"
        >
          {tabs.map((t) => (
            <a
              key={t.key}
              href={buildUrl({ tab: t.key })}
              style={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                textDecoration: "none",
                border:
                  selectedTab === t.key
                    ? "1px solid transparent"
                    : "1px solid rgba(255,255,255,0.06)",
                backgroundColor:
                  selectedTab === t.key ? "#F2F2F2" : "#1A1A1E",
                color: selectedTab === t.key ? "#000000" : "#888891",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </a>
          ))}

          {/* Separator */}
          <span
            style={{
              width: 1,
              height: 24,
              backgroundColor: "rgba(255,255,255,0.06)",
              marginLeft: 4,
              marginRight: 4,
              flexShrink: 0,
            }}
          />

          {/* Period pills */}
          {periods.map((p) => (
            <a
              key={p.key}
              href={buildUrl({ period: p.key })}
              style={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                textDecoration: "none",
                border:
                  period === p.key
                    ? "1px solid transparent"
                    : "1px solid rgba(255,255,255,0.06)",
                backgroundColor:
                  period === p.key ? "#F2F2F2" : "#1A1A1E",
                color: period === p.key ? "#000000" : "#888891",
                transition: "all 0.15s ease",
              }}
            >
              {p.label}
            </a>
          ))}
        </div>
      </section>

      {/* Game / format pills (only for ratings tab) */}
      {games.length > 0 && selectedTab === "ratings" && (
        <section className="mx-4 lg:mx-6 mb-3">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              overflowX: "auto",
            }}
            className="no-scrollbar"
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#888891",
                flexShrink: 0,
                marginRight: 2,
              }}
            >
              Juego:
            </span>
            {games.map((g) => (
              <a
                key={g.slug}
                href={buildUrl({ tab: "ratings", game: g.slug })}
                style={{
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  border:
                    selectedGame?.slug === g.slug
                      ? "1px solid transparent"
                      : "1px solid rgba(255,255,255,0.06)",
                  backgroundColor:
                    selectedGame?.slug === g.slug ? "#F2F2F2" : "#1A1A1E",
                  color:
                    selectedGame?.slug === g.slug ? "#000000" : "#888891",
                  transition: "all 0.15s ease",
                }}
              >
                {g.name}
              </a>
            ))}

            {formats.length > 0 && (
              <>
                <span
                  style={{
                    width: 1,
                    height: 20,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    marginLeft: 4,
                    marginRight: 4,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#888891",
                    flexShrink: 0,
                    marginRight: 2,
                  }}
                >
                  Formato:
                </span>
                {formats.map((f) => (
                  <a
                    key={f.slug}
                    href={buildUrl({
                      tab: "ratings",
                      game: selectedGame?.slug || "",
                      format: f.slug,
                    })}
                    style={{
                      paddingLeft: 16,
                      paddingRight: 16,
                      paddingTop: 8,
                      paddingBottom: 8,
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      textDecoration: "none",
                      border:
                        selectedFormat?.slug === f.slug
                          ? "1px solid transparent"
                          : "1px solid rgba(255,255,255,0.06)",
                      backgroundColor:
                        selectedFormat?.slug === f.slug
                          ? "#F2F2F2"
                          : "#1A1A1E",
                      color:
                        selectedFormat?.slug === f.slug
                          ? "#000000"
                          : "#888891",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {f.name}
                  </a>
                ))}
              </>
            )}
          </div>
        </section>
      )}

      {/* Content */}
      <section className="mx-4 lg:mx-6 mb-12">
        <RankingTabs
          xpEntries={xpEntries}
          ratingEntries={ratingEntries}
          games={games}
          formats={formats}
          selectedGameSlug={selectedGame?.slug}
          selectedFormatSlug={selectedFormat?.slug}
          selectedTab={selectedTab}
        />
      </section>
    </div>
  );
}
