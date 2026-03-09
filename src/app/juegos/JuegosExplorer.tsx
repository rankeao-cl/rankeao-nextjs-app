"use client";

import { useMemo, useState } from "react";
import { Card, Chip, Input } from "@heroui/react";
import { GameCard } from "@/components/cards";
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
    <div className="space-y-5">
      {/* Search */}
      <div
        className="p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 items-end"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <Input
          placeholder="Buscar juego o formato..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full"
          style={{
            background: "var(--field-background)",
            border: "1px solid var(--border)",
            borderRadius: "0.75rem",
            color: "var(--field-foreground)",
          }}
        />
        <p className="text-sm sm:text-right" style={{ color: "var(--muted)" }}>
          {filtered.length} juego{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Selected game detail */}
      {selectedGame && (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Card.Content className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
                  {selectedGame.name}
                </h3>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {selectedGame.description || "Juego disponible para torneos, rankings y actividad competitiva."}
                </p>
              </div>
              <Chip color="accent" variant="soft">
                {selectedFormats.length} formato{selectedFormats.length !== 1 ? "s" : ""}
              </Chip>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {selectedFormats.map((format) => (
                <Chip key={format.id || format.slug} variant="secondary">
                  {format.name}
                </Chip>
              ))}
              {selectedFormats.length === 0 && (
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  Este juego aún no tiene formatos cargados.
                </span>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Game grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onSelect={(selected) => setSelectedSlug(selected.slug)}
            />
          ))}
        </div>
      ) : (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Card.Content className="py-14 text-center">
            <p className="text-3xl mb-3">🎮</p>
            <p style={{ color: "var(--muted)" }}>No hay juegos que coincidan con la búsqueda.</p>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
