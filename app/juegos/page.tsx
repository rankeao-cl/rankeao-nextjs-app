import { Chip } from "@heroui/react";
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
  const totalFormats = enrichedGames.reduce((acc, g) => acc + (g.formats?.length ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto flex flex-col pt-4">
      <section className="px-4 lg:px-6 mb-6">
        <div
          className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="relative z-10 flex-1">
            <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
              Catálogo TCG
            </Chip>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Todos los juegos y formatos
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-lg">
              Revisa los juegos soportados en Rankeao y sus formatos para torneos, rankings y
              actividad competitiva.
            </p>
          </div>

          <div className="hidden md:flex flex-col gap-2 min-w-[200px]">
            <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent)] opacity-10 blur-xl rounded-full"></div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Juegos activos</p>
              <p className="text-xl font-bold text-[var(--foreground)]">{enrichedGames.length}</p>
            </div>
            <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent)] opacity-10 blur-xl rounded-full"></div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">Formatos</p>
              <p className="text-xl font-bold text-[var(--foreground)]">{totalFormats}</p>
            </div>
          </div>
        </div>
      </section>

      <JuegosExplorer games={enrichedGames} />
    </div>
  );
}
