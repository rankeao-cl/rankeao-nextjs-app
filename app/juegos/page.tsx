import { getGameFormats, getGames } from "@/lib/api/catalog";
import type { CatalogGame } from "@/lib/types/catalog";
import JuegosExplorer from "./JuegosExplorer";

export const metadata = {
  title: "Juegos - Rankeao",
  description: "Explora todos los juegos TCG disponibles y sus formatos competitivos.",
};

async function enrichGamesWithFormats(games: CatalogGame[]): Promise<CatalogGame[]> {
  const enriched = await Promise.all(
    games.map(async (game) => {
      if ((game.formats?.length ?? 0) > 0) return game;
      try {
        const formatsRes = await getGameFormats(game.slug).catch(() => null);
        const rawFormats = formatsRes?.formats ?? formatsRes?.data;
        const formats = Array.isArray(rawFormats) ? rawFormats : [];
        return { ...game, formats };
      } catch {
        return game;
      }
    })
  );
  return enriched;
}

export default async function JuegosPage() {
  let gamesData;
  try {
    gamesData = await getGames().catch(() => null);
  } catch {
    // silent
  }

  const rawGames = gamesData?.data ?? gamesData?.games;
  const games = Array.isArray(rawGames) ? rawGames : [];
  const enrichedGames = await enrichGamesWithFormats(games);

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
              Catalogo de juegos
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
              Juegos
            </h1>
            <p
              style={{
                color: "#888891",
                fontSize: 13,
                lineHeight: "18px",
                margin: 0,
              }}
            >
              Explora los juegos de cartas disponibles en Rankeao.
            </p>
          </div>
        </div>
      </section>

      {/* Search bar */}
      <div className="mx-4 lg:mx-6 mb-3">
        <JuegosExplorer games={enrichedGames} />
      </div>
    </div>
  );
}
