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
    country?: string;
    city?: string;
  }>;
}

const REGIONS = [
  { key: "", label: "Global" },
  { key: "CL", label: "Chile" },
  { key: "AR", label: "Argentina" },
  { key: "MX", label: "Mexico" },
  { key: "CO", label: "Colombia" },
  { key: "PE", label: "Peru" },
];

const CL_CITIES = [
  { key: "", label: "Todo Chile" },
  { key: "Santiago", label: "Santiago" },
  { key: "Valparaiso", label: "Valparaiso" },
  { key: "Concepcion", label: "Concepcion" },
  { key: "Temuco", label: "Temuco" },
  { key: "Antofagasta", label: "Antofagasta" },
];

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const params = (await searchParams) ?? {};
  let xpData, ratingData, gamesData;

  const period = params.period || "all_time";
  const selectedTab = params.tab === "ratings" ? "ratings" : "xp";
  const selectedCountry = params.country || "";
  const selectedCity = params.city || "";

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
        ...(selectedCountry ? { country: selectedCountry } : {}),
        ...(selectedCity ? { city: selectedCity } : {}),
      }).catch(() => null);
    } catch {
      // silent
    }
  }

  // API returns { data: [...], meta, success } — data is a flat array of raw entries
  const xpRaw = xpData as unknown as Record<string, unknown> | null;
  const rawXpArr = [xpRaw?.data, xpRaw?.leaderboard, xpRaw?.entries, xpData?.leaderboard, xpData?.entries].find(Array.isArray) ?? [];
  const xpEntries: LeaderboardEntry[] = rawXpArr.map((e: Record<string, unknown>, i: number) => {
      const user = (e.user ?? {}) as Record<string, unknown>;
      return {
        rank: (e.rank as number) ?? i + 1,
        user_id: (e.user_id ?? user.id ?? user.username ?? "") as string,
        username: (e.username ?? user.username ?? "") as string,
        avatar_url: (e.avatar_url ?? user.avatar_url ?? undefined) as string | undefined,
        total_xp: (e.total_xp ?? e.xp ?? 0) as number,
        level: e.level as number | undefined,
        title: (e.title ?? user.current_title ?? undefined) as string | undefined,
      };
    });
  const ratingRaw = ratingData as unknown as Record<string, unknown> | null;
  const rawRatingArr = [ratingRaw?.data, ratingRaw?.leaderboard, ratingRaw?.entries, ratingData?.leaderboard].find(Array.isArray) ?? [];
  const ratingEntries: LeaderboardEntry[] = rawRatingArr.map((e: Record<string, unknown>, i: number) => {
      const user = (e.user ?? {}) as Record<string, unknown>;
      return {
        rank: (e.rank as number) ?? i + 1,
        user_id: (e.user_id ?? user.id ?? user.username ?? "") as string,
        username: (e.username ?? user.username ?? "") as string,
        avatar_url: (e.avatar_url ?? user.avatar_url ?? undefined) as string | undefined,
        rating: (e.rating ?? e.elo ?? 0) as number,
        games_played: e.games_played as number | undefined,
        wins: e.wins as number | undefined,
        losses: e.losses as number | undefined,
      };
    });

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
    if (selectedCountry) base.country = selectedCountry;
    if (selectedCity) base.city = selectedCity;
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
            backgroundColor: "var(--surface-solid)",
            border: "1px solid var(--border)",
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
            <span
              style={{
                display: "inline-block",
                backgroundColor: "var(--surface)",
                paddingLeft: 10, paddingRight: 10, paddingTop: 4, paddingBottom: 4,
                borderRadius: 999, marginBottom: 8,
                color: "var(--muted)", fontSize: 11, fontWeight: 600,
              }}
            >
              Clasificacion
            </span>
            <h1 style={{ color: "var(--foreground)", fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 4 }}>
              Ranking
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: "18px", margin: 0 }}>
              Compite y sube en el ranking de jugadores.
            </p>
          </div>
        </div>
      </section>

      {/* ── Main content (sidebar + leaderboard) ── */}
      <div className="flex flex-col lg:flex-row gap-6 mx-4 lg:mx-6 mb-12">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 p-4 rounded-2xl" style={{ backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Ranking type */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: "0 0 8px" }}>Tipo</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {tabs.map((t) => (
                    <a key={t.key} href={buildUrl({ tab: t.key })} style={{
                      display: "block", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                      textDecoration: "none", transition: "all 0.15s",
                      backgroundColor: selectedTab === t.key ? "rgba(59,130,246,0.1)" : "transparent",
                      color: selectedTab === t.key ? "var(--accent)" : "var(--muted)",
                      border: selectedTab === t.key ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
                    }}>
                      {t.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Period */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: "0 0 8px" }}>Periodo</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {periods.map((p) => (
                    <a key={p.key} href={buildUrl({ period: p.key })} style={{
                      display: "block", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                      textDecoration: "none", transition: "all 0.15s",
                      backgroundColor: period === p.key ? "rgba(59,130,246,0.1)" : "transparent",
                      color: period === p.key ? "var(--accent)" : "var(--muted)",
                      border: period === p.key ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
                    }}>
                      {p.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Game (ratings only) */}
              {selectedTab === "ratings" && games.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: "0 0 8px" }}>Juego</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {games.map((g) => (
                      <a key={g.slug} href={buildUrl({ tab: "ratings", game: g.slug })} style={{
                        display: "block", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        textDecoration: "none", transition: "all 0.15s",
                        backgroundColor: selectedGame?.slug === g.slug ? "rgba(59,130,246,0.1)" : "transparent",
                        color: selectedGame?.slug === g.slug ? "var(--accent)" : "var(--muted)",
                        border: selectedGame?.slug === g.slug ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
                      }}>
                        {g.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Format (ratings only) */}
              {selectedTab === "ratings" && formats.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: "0 0 8px" }}>Formato</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {formats.map((f) => (
                      <a key={f.slug} href={buildUrl({ tab: "ratings", game: selectedGame?.slug || "", format: f.slug })} style={{
                        display: "block", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        textDecoration: "none", transition: "all 0.15s",
                        backgroundColor: selectedFormat?.slug === f.slug ? "rgba(59,130,246,0.1)" : "transparent",
                        color: selectedFormat?.slug === f.slug ? "var(--accent)" : "var(--muted)",
                        border: selectedFormat?.slug === f.slug ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
                      }}>
                        {f.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Region (ratings only) */}
              {selectedTab === "ratings" && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: "0 0 8px" }}>Region</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {REGIONS.map((r) => (
                      <a key={r.key} href={buildUrl({ country: r.key, city: "" })} style={{
                        display: "block", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        textDecoration: "none", transition: "all 0.15s",
                        backgroundColor: selectedCountry === r.key ? "rgba(59,130,246,0.1)" : "transparent",
                        color: selectedCountry === r.key ? "var(--accent)" : "var(--muted)",
                        border: selectedCountry === r.key ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
                      }}>
                        {r.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* City (Chile only) */}
              {selectedTab === "ratings" && selectedCountry === "CL" && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: "0 0 8px" }}>Ciudad</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {CL_CITIES.map((c) => (
                      <a key={c.key} href={buildUrl({ country: "CL", city: c.key })} style={{
                        display: "block", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        textDecoration: "none", transition: "all 0.15s",
                        backgroundColor: selectedCity === c.key ? "rgba(59,130,246,0.1)" : "transparent",
                        color: selectedCity === c.key ? "var(--accent)" : "var(--muted)",
                        border: selectedCity === c.key ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
                      }}>
                        {c.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile filter pills */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <a key={t.key} href={buildUrl({ tab: t.key })} style={{
              padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", textDecoration: "none",
              border: selectedTab === t.key ? "1px solid transparent" : "1px solid var(--border)",
              backgroundColor: selectedTab === t.key ? "var(--foreground)" : "var(--surface-solid)",
              color: selectedTab === t.key ? "var(--background)" : "var(--muted)",
            }}>
              {t.label}
            </a>
          ))}
          <span style={{ width: 1, height: 24, backgroundColor: "var(--border)", flexShrink: 0 }} />
          {periods.map((p) => (
            <a key={p.key} href={buildUrl({ period: p.key })} style={{
              padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", textDecoration: "none",
              border: period === p.key ? "1px solid transparent" : "1px solid var(--border)",
              backgroundColor: period === p.key ? "var(--foreground)" : "var(--surface-solid)",
              color: period === p.key ? "var(--background)" : "var(--muted)",
            }}>
              {p.label}
            </a>
          ))}
        </div>

        {/* Leaderboard content */}
        <main className="flex-1 min-w-0">
          <RankingTabs
            xpEntries={xpEntries}
            ratingEntries={ratingEntries}
            games={games}
            formats={formats}
            selectedGameSlug={selectedGame?.slug}
            selectedFormatSlug={selectedFormat?.slug}
            selectedTab={selectedTab}
          />
        </main>
      </div>
    </div>
  );
}
