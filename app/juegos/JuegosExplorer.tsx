"use client";

import Link from "next/link";
import Image from "next/image";
import type { CatalogGame, CatalogFormat } from "@/lib/types/catalog";
import { getGameBrand } from "@/lib/gameLogos";

function GameLogo({ game, size = 48 }: { game: CatalogGame; size?: number }) {
  const brand = getGameBrand(game.slug);
  const src = game.logo_url || brand.logo;
  if (src) {
    return (
      <Image
        src={src}
        alt={game.name}
        width={size}
        height={size}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center font-black text-xs"
      style={{ background: brand.bg, color: brand.color }}
    >
      {game.short_name || game.slug.toUpperCase().slice(0, 3)}
    </div>
  );
}

function FormatPill({ format }: { format: CatalogFormat }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[var(--accent)]/20 bg-[var(--accent)]/8 text-[var(--accent)]">
      {format.name}
    </span>
  );
}

interface Props {
  games: CatalogGame[];
}

export default function JuegosExplorer({ games }: Props) {
  return (
    <div className="px-4 lg:px-6 mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => {
          const formats = Array.isArray(game.formats) ? game.formats : [];

          return (
            <Link
              key={game.slug}
              href={`/juegos/${game.slug}`}
              className="group relative flex flex-col rounded-2xl border border-[var(--border)] overflow-hidden transition-all hover:border-[var(--accent)]/40 hover:shadow-lg hover:shadow-[var(--accent)]/5"
              style={{ background: "var(--surface)" }}
            >
              {/* Top accent bar */}
              <div className="h-1.5 w-full bg-[var(--accent)]" />

              {/* Card body */}
              <div className="p-5 flex flex-col gap-4 flex-1">
                {/* Logo + Title row */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl overflow-hidden border border-[var(--border)] flex-shrink-0 transition-transform group-hover:scale-105"
                  >
                    <GameLogo game={game} size={56} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                      {game.name}
                    </h3>
                    {game.publisher && (
                      <p className="text-xs text-[var(--muted)] truncate">{game.publisher}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {game.description && (
                  <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-2">
                    {game.description}
                  </p>
                )}

                {/* Formats */}
                {formats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formats.slice(0, 5).map((f) => (
                      <FormatPill key={f.id || f.slug} format={f} />
                    ))}
                    {formats.length > 5 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold text-[var(--muted)] bg-[var(--surface-secondary)]">
                        +{formats.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer stats */}
                <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                    <span>
                      <span className="font-bold text-[var(--foreground)]">{formats.length}</span> formatos
                    </span>
                    {game.formats_count != null && game.formats_count !== formats.length && (
                      <span>
                        <span className="font-bold text-[var(--foreground)]">{game.formats_count}</span> registrados
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent)]">
                    Explorar &rarr;
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
