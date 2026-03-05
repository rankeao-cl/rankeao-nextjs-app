import { Chip } from "@heroui/react";
import { getGameFormats, getGames, type CatalogGame } from "@/lib/api";
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
    <div className="rk-container py-10 space-y-7">
      <section className="surface-panel relative overflow-hidden p-6 sm:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(124,58,237,0.22),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(34,211,238,0.15),transparent_40%)]" />
        <div className="relative">
          <Chip color="accent" variant="soft" size="sm" className="mb-3">
            Catalogo TCG
          </Chip>
          <h1 className="section-title mb-2">Todos los juegos y formatos</h1>
          <p className="section-subtitle">
            Revisa los juegos soportados en Rankeao y sus formatos para torneos, rankings y
            actividad competitiva.
          </p>
        </div>
      </section>

      <JuegosExplorer games={enrichedGames} />
    </div>
  );
}
