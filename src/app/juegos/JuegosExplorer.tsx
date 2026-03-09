"use client";

import { useMemo, useState } from "react";
import { Card, Chip, Input, Button } from "@heroui/react";
import Link from "next/link";
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
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar - Search & Stats */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-4">
        <div
          className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] sticky top-20"
        >
          <h3 className="font-bold text-[var(--foreground)] mb-3 text-sm uppercase tracking-wider">Filtros</h3>
          <Input
            placeholder="Nombre o formato..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full mb-4"
          />
          <div className="pt-3 border-t border-[var(--separator)]">
            <p className="text-xs font-medium text-[var(--muted)] mb-1">Resultado</p>
            <p className="text-sm font-bold text-[var(--foreground)]">
              {filtered.length} juego{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-6">
        {/* Selected game detail panel */}
        {selectedGame && (
          <div
            className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4 flex-wrap relative z-10">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">
                    {selectedGame.name}
                  </h2>
                  <Chip variant="soft" color="accent" size="sm">
                    Oficial
                  </Chip>
                </div>
                <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
                  {selectedGame.description || "Este juego está disponible para participar en torneos y seguir tu ranking competitivo en Rankeao."}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--separator)] relative z-10">
              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Formatos Competitivos</p>
              <div className="flex flex-wrap gap-2">
                {selectedFormats.map((format) => (
                  <Chip key={format.id || format.slug} variant="secondary" className="px-3 border-[var(--border)]">
                    {format.name}
                  </Chip>
                ))}
                {selectedFormats.length === 0 && (
                  <span className="text-sm text-[var(--muted)] italic">
                    Sin formatos registrados.
                  </span>
                )}
              </div>

              <div className="mt-6">
                <Link href={`/juegos/${selectedGame.slug}`}>
                  <Button variant="primary" className="font-bold">
                    Ver Comunidad y Rankings &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Game grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.length > 0 ? (
            filtered.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onSelect={(selected) => setSelectedSlug(selected.slug)}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/30">
              <p className="text-3xl mb-3 opacity-50">🎮</p>
              <p className="text-[var(--muted)]">No encontramos juegos que coincidan con tu búsqueda.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
