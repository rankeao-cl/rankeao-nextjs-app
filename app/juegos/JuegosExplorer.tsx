"use client";

import { useMemo, useState } from "react";
import { Card, Chip, Input, Button, Accordion } from "@heroui/react";
import Link from "next/link";
import Image from "next/image";
import { GameCard } from "@/components/cards";
import type { CatalogGame } from "@/lib/types/catalog";

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
    <div className="flex flex-col md:flex-row gap-6 px-4 lg:px-6 mb-12">
      {/* Left Sidebar - Filters */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="sticky top-20 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[var(--foreground)]">Filtros</h3>
            {query && (
              <Button size="sm" variant="danger-soft" onPress={() => setQuery("")} className="h-7 text-xs">
                Limpiar
              </Button>
            )}
          </div>

          <Accordion defaultExpandedKeys={["search", "stats"]} className="px-0">
            <Accordion.Item key="search">
              <Accordion.Heading>
                <Accordion.Trigger>
                  <span className="text-sm font-semibold">Buscar</span>
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body>
                  <Input
                    placeholder="Nombre o formato..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full mt-1"
                  />
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item key="stats">
              <Accordion.Heading>
                <Accordion.Trigger>
                  <span className="text-sm font-semibold">Resumen</span>
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body>
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">Total</span>
                      <span className="font-bold text-[var(--foreground)]">{games.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">Mostrando</span>
                      <span className="font-bold text-[var(--foreground)]">{filtered.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">Seleccionado</span>
                      <span className="font-bold text-[var(--accent)] truncate max-w-[120px]">{selectedGame?.name ?? "-"}</span>
                    </div>
                  </div>
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item key="games-list">
              <Accordion.Heading>
                <Accordion.Trigger>
                  <span className="text-sm font-semibold">Juegos</span>
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body>
                  <div className="flex flex-col gap-2 mt-2">
                    {games.map((game) => {
                      const isActive = selectedGame?.slug === game.slug;
                      return (
                        <button
                          key={game.slug}
                          onClick={() => setSelectedSlug(game.slug)}
                          className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${isActive
                            ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] font-medium"
                            : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                            }`}
                        >
                          {game.name}
                        </button>
                      );
                    })}
                  </div>
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </div>
      </aside>

      {/* Right - Main Content */}
      <main className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            Catálogo
            <Chip size="sm" className="bg-[var(--surface-secondary)] text-[var(--muted)] border-0">
              {filtered.length} disponibles
            </Chip>
          </h2>
        </div>

        {/* Selected game detail panel */}
        {selectedGame && (
          <div
            className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] relative overflow-hidden mb-6"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-5 blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4 flex-wrap relative z-10">
              {/* Logo */}
              <div
                className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center text-2xl shrink-0"
                style={{ background: "var(--surface-tertiary)" }}
              >
                {selectedGame.logo_url ? (
                  <Image
                    src={selectedGame.logo_url}
                    alt={selectedGame.name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "🎴"
                )}
              </div>

              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    {selectedGame.name}
                  </h2>
                  <Chip variant="soft" color="accent" size="sm">
                    Oficial
                  </Chip>
                </div>
                <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
                  {selectedGame.description || "Este juego está disponible para participar en torneos y seguir tu ranking competitivo en Rankeao."}
                </p>

                {/* Formats inline */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedFormats.map((format) => (
                    <Chip key={format.id || format.slug} variant="secondary" size="sm" className="px-3 border-[var(--border)]">
                      {format.name}
                    </Chip>
                  ))}
                  {selectedFormats.length === 0 && (
                    <span className="text-xs text-[var(--muted)] italic">
                      Sin formatos registrados.
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <Link href={`/juegos/${selectedGame.slug}`}>
                    <Button variant="primary" size="sm" className="font-bold">
                      Ver Comunidad y Rankings &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game grid - 3-4 columns like marketplace */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
