import Link from "next/link";
import { Avatar, Button, Card, CardContent, Chip } from "@heroui/react";
import {
  getBadges,
  getGameFormats,
  getGames,
  getListings,
  getRatingLeaderboard,
  getSeasons,
  getTenants,
  getTournaments,
  getXpLeaderboard,
  type Badge,
  type CatalogFormat,
  type CatalogGame,
  type LeaderboardEntry,
  type Listing,
  type Tenant,
  type Tournament,
} from "@/lib/api";
import GameCard from "@/components/GameCard";
import ProductCard from "@/components/ProductCard";
import TenantCard from "@/components/TenantCard";
import TournamentCard from "@/components/TournamentCard";

const medals = ["", "#1", "#2", "#3"];

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function rankingMetric(entry: LeaderboardEntry, type: "xp" | "rating") {
  if (type === "xp") return `${(entry.total_xp ?? 0).toLocaleString("es-CL")} XP`;
  return `${entry.rating ?? 0} ELO`;
}

export default async function HomePage() {
  let tournamentsData;
  let xpData;
  let gamesData;
  let listingsData;
  let tenantsData;
  let badgesData;
  let seasonsData;

  try {
    [tournamentsData, xpData, gamesData, listingsData, tenantsData, badgesData, seasonsData] = await Promise.all([
      getTournaments({ sort: "upcoming", per_page: 6 }).catch(() => null),
      getXpLeaderboard({ period: "all_time", per_page: 8 }).catch(() => null),
      getGames().catch(() => null),
      getListings({ sort: "newest", per_page: 8 }).catch(() => null),
      getTenants({ sort: "rating-desc", per_page: 6 }).catch(() => null),
      getBadges({ sort: "rarity-desc", per_page: 6 }).catch(() => null),
      getSeasons().catch(() => null),
    ]);
  } catch {
    // Silent fallback with empty states.
  }

  const tournaments = asArray<Tournament>(tournamentsData?.tournaments);
  const xpEntries = asArray<LeaderboardEntry>(xpData?.leaderboard ?? xpData?.entries);
  const games = asArray<CatalogGame>(gamesData?.data ?? gamesData?.games);
  const listings = asArray<Listing>(listingsData?.listings);
  const tenants = asArray<Tenant>(tenantsData?.tenants);
  const badges = asArray<Badge>(badgesData?.badges);

  const selectedGame = games[0];
  let selectedFormats = asArray<CatalogFormat>(selectedGame?.formats);

  if (selectedGame?.slug && selectedFormats.length === 0) {
    try {
      const formatsRes = await getGameFormats(selectedGame.slug).catch(() => null);
      selectedFormats = asArray<CatalogFormat>(formatsRes?.formats ?? formatsRes?.data);
    } catch {
      // no-op
    }
  }

  let ratingEntries: LeaderboardEntry[] = [];
  if (selectedGame?.slug && selectedFormats[0]?.slug) {
    try {
      const ratingData = await getRatingLeaderboard({
        game: selectedGame.slug,
        format: selectedFormats[0].slug,
        per_page: 8,
      }).catch(() => null);
      ratingEntries = asArray<LeaderboardEntry>(ratingData?.leaderboard);
    } catch {
      // no-op
    }
  }

  const stats = [
    { label: "Torneos", value: (tournamentsData?.meta?.total ?? tournaments.length).toLocaleString("es-CL") },
    { label: "Mercado", value: (listingsData?.meta?.total ?? listings.length).toLocaleString("es-CL") },
    { label: "Comunidades", value: (tenantsData?.meta?.total ?? tenants.length).toLocaleString("es-CL") },
    { label: "Jugadores", value: (xpData?.meta?.total ?? xpEntries.length).toLocaleString("es-CL") },
  ];

  const activeSeasonName = seasonsData?.current?.name;

  return (
    <div>
      <section className="rk-hero min-h-[86vh] flex items-center">
        <div className="rk-container relative py-20 sm:py-28">
          <div className="max-w-4xl">
            <span className="kicker mb-5">Chile TCG competitivo</span>
            <h1 className="hero-title mb-5">
              EL RANKING MAS <span className="hero-title-accent">RANKEAO</span> DE CHILE
            </h1>
            <p className="text-gray-300 text-base sm:text-xl max-w-2xl leading-relaxed">
              Torneos TCG, rankings en vivo, FNM, ligas y mercado real para Pokemon, Magic y
              Yu-Gi-Oh!. Encuentra tu comunidad local y compite al maximo nivel.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/torneos">
                <Button size="lg" className="bg-gradient-to-r from-zinc-700 to-zinc-400 text-white font-bold neon-button px-8">
                  Ver Torneos Activos
                </Button>
              </Link>
              <Link href="/ranking">
                <Button size="lg" variant="outline" className="border-zinc-300/60 text-zinc-200 px-8">
                  Ver Ranking Global
                </Button>
              </Link>
            </div>

            <div className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
              {stats.map((stat) => (
                <Card key={stat.label} className="surface-card">
                  <CardContent className="py-3 px-3 text-center">
                    <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {activeSeasonName && (
              <Chip color="accent" variant="soft" className="mt-5 text-xs font-semibold">
                Temporada activa: {activeSeasonName}
              </Chip>
            )}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="rk-container">
          <div className="flex items-end justify-between gap-3 mb-6">
            <div>
              <p className="kicker mb-2">/ Torneos Destacados</p>
              <h2 className="section-title">Compite en los mejores eventos locales</h2>
            </div>
            <Link href="/torneos">
              <Button variant="secondary" size="sm">Ver calendario completo</Button>
            </Link>
          </div>

          {tournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          ) : (
            <Card className="surface-panel">
              <CardContent className="py-12 text-center text-gray-400">
                No hay torneos activos por el momento.
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="section-block pt-0">
        <div className="rk-container">
          <div className="mb-6">
            <p className="kicker mb-2">Rankings Globales Chile</p>
            <h2 className="section-title">Quienes dominan el meta local</h2>
            <p className="section-subtitle mt-2">
              Ranking de XP global y rating competitivo con datos en tiempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="surface-panel">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-xl font-bold">XP Global</h3>
                  <Chip color="accent" variant="soft" size="sm">Top {xpEntries.slice(0, 6).length}</Chip>
                </div>
                <div className="space-y-2">
                  {xpEntries.slice(0, 6).map((entry, idx) => {
                    const rank = entry.rank ?? idx + 1;
                    return (
                      <div key={entry.user_id || idx} className="surface-card px-3 py-2.5 flex items-center gap-3">
                        <span className="text-sm font-extrabold text-zinc-100 w-8">{medals[rank] || `#${rank}`}</span>
                        <Avatar size="sm" className="ring-2 ring-zinc-500/35">
                          <Avatar.Image src={entry.avatar_url ?? undefined} />
                          <Avatar.Fallback>{entry.username?.[0]?.toUpperCase() || "?"}</Avatar.Fallback>
                        </Avatar>
                        <span className="text-sm font-semibold text-gray-100 flex-1 truncate">{entry.username || "Anonimo"}</span>
                        <span className="text-xs text-zinc-200 font-semibold">{rankingMetric(entry, "xp")}</span>
                      </div>
                    );
                  })}
                  {xpEntries.length === 0 && <p className="text-sm text-gray-500">Sin datos de ranking por ahora.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="surface-panel">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-xl font-bold">Rating {selectedGame?.name ? `- ${selectedGame.name}` : ""}</h3>
                  <Chip color="success" variant="soft" size="sm">Top {ratingEntries.slice(0, 6).length}</Chip>
                </div>
                <div className="space-y-2">
                  {ratingEntries.slice(0, 6).map((entry, idx) => {
                    const rank = entry.rank ?? idx + 1;
                    return (
                      <div key={entry.user_id || idx} className="surface-card px-3 py-2.5 flex items-center gap-3">
                        <span className="text-sm font-extrabold text-zinc-100 w-8">{medals[rank] || `#${rank}`}</span>
                        <Avatar size="sm" className="ring-2 ring-zinc-400/35">
                          <Avatar.Image src={entry.avatar_url ?? undefined} />
                          <Avatar.Fallback>{entry.username?.[0]?.toUpperCase() || "?"}</Avatar.Fallback>
                        </Avatar>
                        <span className="text-sm font-semibold text-gray-100 flex-1 truncate">{entry.username || "Anonimo"}</span>
                        <span className="text-xs text-zinc-100 font-semibold">{rankingMetric(entry, "rating")}</span>
                      </div>
                    );
                  })}
                  {ratingEntries.length === 0 && (
                    <p className="text-sm text-gray-500">Aun no hay datos de rating para el juego seleccionado.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="section-block pt-0">
        <div className="rk-container">
          <div className="flex items-end justify-between gap-3 mb-6">
            <div>
              <p className="kicker mb-2">Mercado Destacado</p>
              <h2 className="section-title">Singles y sellados de jugadores reales</h2>
            </div>
            <Link href="/marketplace">
              <Button variant="secondary" size="sm">Ver todo el mercado</Button>
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.slice(0, 8).map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <Card className="surface-panel">
              <CardContent className="py-12 text-center text-gray-400">No hay publicaciones destacadas en este momento.</CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="section-block pt-0">
        <div className="rk-container">
          <div className="flex items-end justify-between gap-3 mb-6">
            <div>
              <p className="kicker mb-2">Juegos Populares</p>
              <h2 className="section-title">Catalogo TCG disponible en Rankeao</h2>
            </div>
            <Link href="/juegos">
              <Button variant="secondary" size="sm">Ver juegos</Button>
            </Link>
          </div>

          {games.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {games.slice(0, 8).map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <Card className="surface-panel">
              <CardContent className="py-12 text-center text-gray-400">No se pudo cargar el catalogo de juegos.</CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="section-block pt-0">
        <div className="rk-container">
          <div className="flex items-end justify-between gap-3 mb-6">
            <div>
              <p className="kicker mb-2">Tiendas Locales en Chile</p>
              <h2 className="section-title">Encuentra donde jugar y comprar cartas</h2>
            </div>
            <Link href="/comunidades">
              <Button variant="secondary" size="sm">Ver directorio</Button>
            </Link>
          </div>

          {tenants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.slice(0, 6).map((tenant) => (
                <TenantCard key={tenant.id} tenant={tenant} />
              ))}
            </div>
          ) : (
            <Card className="surface-panel">
              <CardContent className="py-12 text-center text-gray-400">No hay comunidades destacadas disponibles.</CardContent>
            </Card>
          )}
        </div>
      </section>

      {badges.length > 0 && (
        <section className="section-block pt-0">
          <div className="rk-container">
            <p className="kicker mb-2">Gamificacion</p>
            <h2 className="section-title mb-6">Badges para grinders y campeones</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {badges.map((badge) => (
                <Card key={badge.slug} className="surface-card">
                  <CardContent className="text-center py-4 px-3">
                    <div className="w-14 h-14 mx-auto rounded-full mb-3 bg-gradient-to-br from-zinc-700/25 to-zinc-300/20 grid place-items-center text-2xl">
                      🏅
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{badge.name}</p>
                    {badge.rarity && (
                      <Chip
                        size="sm"
                        variant="soft"
                        className="mt-2 text-[10px] uppercase"
                        color={
                          badge.rarity === "legendary"
                            ? "warning"
                            : badge.rarity === "epic"
                              ? "accent"
                              : badge.rarity === "rare"
                                ? "success"
                                : "default"
                        }
                      >
                        {badge.rarity}
                      </Chip>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
