import { Card, Chip, Button } from "@heroui/react";
import { getGames, getCards } from "@/lib/api/catalog";
import type { CatalogGame, Card as CatalogCard } from "@/lib/types/catalog";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalogo de Cartas",
  description: "Explora el catalogo completo de cartas TCG. Busca por juego, set o nombre.",
};

interface CatalogoPageProps {
  searchParams?: Promise<{
    q?: string;
    game?: string;
    page?: string;
  }>;
}

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim();
  const page = Number(params.page || "1") || 1;

  let gamesData;
  let cardsData;
  try {
    [gamesData, cardsData] = await Promise.all([
      getGames().catch(() => null),
      getCards({
        ...(query ? { q: query } : {}),
        ...(params.game ? { game: params.game } : {}),
        page,
        per_page: 24,
      }).catch(() => null),
    ]);
  } catch {
    // silent
  }

  const rawGames = gamesData?.data ?? gamesData?.games;
  const games: CatalogGame[] = Array.isArray(rawGames) ? rawGames : [];
  const cards: CatalogCard[] = cardsData?.data ?? cardsData?.cards ?? [];
  const meta = cardsData?.meta;
  const totalPages = meta?.total_pages ?? 1;

  return (
    <div className="max-w-7xl mx-auto flex flex-col pt-4">
      {/* Header */}
      <section className="px-4 lg:px-6 mb-6">
        <div className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden">
          <div className="relative z-10">
            <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
              Catalogo TCG
            </Chip>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Catalogo de Cartas
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-lg mb-6">
              Explora cartas por juego, busca por nombre y consulta precios e historial.
            </p>

            {/* Search */}
            <form method="get" action="/catalogo" className="flex gap-2 max-w-lg">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Buscar cartas por nombre..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
              />
              {params.game && <input type="hidden" name="game" value={params.game} />}
              <Button type="submit" variant="primary" size="sm" className="rounded-xl px-5">
                Buscar
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Browse by game */}
      {games.length > 0 && !query && (
        <section className="px-4 lg:px-6 mb-8">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Explorar por Juego</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {games.map((game) => (
              <Link key={game.id} href={`/catalogo?game=${game.slug}`}>
                <div className="glass-sm p-4 rounded-2xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors cursor-pointer group">
                  {game.logo_url ? (
                    <img
                      src={game.logo_url}
                      alt={game.name}
                      className="w-12 h-12 object-contain rounded-lg mb-3"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[var(--surface)] flex items-center justify-center mb-3">
                      <span className="text-xl font-bold text-[var(--muted)]">
                        {game.short_name || game.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                    {game.name}
                  </p>
                  {game.publisher && (
                    <p className="text-xs text-[var(--muted)] mt-0.5">{game.publisher}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Active game filter */}
      {params.game && (
        <section className="px-4 lg:px-6 mb-4">
          <div className="flex items-center gap-2">
            <Chip size="sm" className="bg-[var(--accent)] text-white">
              Juego: {params.game}
            </Chip>
            <Link href="/catalogo">
              <Button size="sm" variant="ghost" className="text-xs">
                Limpiar filtro
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Cards grid */}
      <section className="px-4 lg:px-6 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            {query ? `Resultados para "${query}"` : "Cartas"}
            {meta?.total != null && (
              <Chip size="sm" className="bg-[var(--surface-secondary)] text-[var(--muted)] border-0">
                {meta.total.toLocaleString("es-CL")}
              </Chip>
            )}
          </h2>
        </div>

        {cards.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {cards.map((card) => {
                const printing = card.printings?.[0];
                const imageUrl = printing?.image_url ?? printing?.image_url_small;
                return (
                  <Link key={card.id} href={`/catalogo/${card.id}`}>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--accent)] transition-colors group cursor-pointer">
                      <div className="aspect-[2.5/3.5] bg-black/20 relative">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-3xl text-[var(--muted)] opacity-40">?</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                          {card.name}
                        </p>
                        {card.type_line && (
                          <p className="text-[10px] text-[var(--muted)] truncate mt-0.5">
                            {card.type_line}
                          </p>
                        )}
                        {printing?.price_clp != null && (
                          <p className="text-xs font-bold text-[var(--foreground)] mt-1">
                            ${printing.price_clp.toLocaleString("es-CL")} CLP
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 mb-8">
                <div className="flex justify-center py-4 px-6 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] gap-4 items-center">
                  <Link
                    href={`/catalogo?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(params.game ? { game: params.game } : {}), page: String(page - 1) }).toString()}`}
                    className={page <= 1 ? "pointer-events-none opacity-40" : ""}
                  >
                    <Button size="sm" variant="ghost" isDisabled={page <= 1}>
                      Anterior
                    </Button>
                  </Link>
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    Pagina {page} de {totalPages}
                  </span>
                  <Link
                    href={`/catalogo?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(params.game ? { game: params.game } : {}), page: String(page + 1) }).toString()}`}
                    className={page >= totalPages ? "pointer-events-none opacity-40" : ""}
                  >
                    <Button size="sm" variant="ghost" isDisabled={page >= totalPages}>
                      Siguiente
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 flex justify-center">
            <Card className="max-w-md w-full border border-dashed border-[var(--border)] bg-transparent">
              <Card.Content className="py-12 text-center flex flex-col items-center">
                <span className="text-4xl block mb-4">&#128269;</span>
                <p className="text-[var(--foreground)] font-medium mb-1">
                  {query ? "No se encontraron cartas" : "Sin cartas disponibles"}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {query
                    ? "Intenta con otro termino de busqueda."
                    : "Selecciona un juego para explorar su catalogo."}
                </p>
              </Card.Content>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
