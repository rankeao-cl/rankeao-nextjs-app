"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, Chip, Input } from "@heroui/react";
import GameCard from "@/components/GameCard";
import type { CatalogGame } from "@/lib/api";

interface Props {
  games: CatalogGame[];
}

export default function JuegosExplorer({ games }: Props) {
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>(games[0]?.slug);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter((game) => {
      const inName = game.name?.toLowerCase().includes(q);
      const inDesc = game.description?.toLowerCase().includes(q);
      const inFormats = game.formats?.some((f) => f.name?.toLowerCase().includes(q));
      return inName || inDesc || inFormats;
    });
  }, [games, query]);

  const selectedGame =
    filtered.find((game) => game.slug === selectedSlug) ?? filtered[0] ?? games[0];
  const selectedFormats = Array.isArray(selectedGame?.formats) ? selectedGame.formats : [];

  return (
    <div className="space-y-6">
      <div className="surface-panel p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
        <Input
          placeholder="Buscar juego o formato..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-purple-500/25 bg-black/30 px-3 text-sm text-gray-100"
        />
        <p className="text-sm text-gray-500 md:text-right">
          {filtered.length} juego{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {selectedGame && (
        <Card className="surface-panel">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{selectedGame.name}</h3>
                <p className="text-gray-400 text-sm max-w-3xl">
                  {selectedGame.description || "Juego disponible para torneos, rankings y actividad competitiva en Rankeao."}
                </p>
              </div>
              <Chip color="accent" variant="soft" className="mt-1">
                {selectedFormats.length} formato{selectedFormats.length !== 1 ? "s" : ""}
              </Chip>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              {selectedFormats.map((format) => (
                <Chip
                  key={format.id || format.slug}
                  variant="secondary"
                  className="border-purple-700/40 text-purple-300"
                >
                  {format.name}
                </Chip>
              ))}
              {selectedFormats.length === 0 && (
                <span className="text-sm text-gray-500">Este juego aun no tiene formatos cargados.</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onSelect={(selected) => setSelectedSlug(selected.slug)}
            />
          ))}
        </div>
      ) : (
        <Card className="surface-panel">
          <CardContent className="py-14 text-center text-gray-500">
            <p className="text-3xl mb-3">🎮</p>
            <p>No hay juegos que coincidan con la busqueda.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
