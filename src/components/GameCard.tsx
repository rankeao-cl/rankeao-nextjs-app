"use client";

import { Card, CardContent, Chip } from "@heroui/react";
import Image from "next/image";
import type { CatalogGame } from "@/lib/api";

export default function GameCard({
  game,
  onSelect,
}: {
  game: CatalogGame;
  onSelect?: (game: CatalogGame) => void;
}) {
  const formatCount = game.formats?.filter((f) => f.is_active !== false).length ?? 0;

  return (
    <Card
      className="surface-card card-hover cursor-pointer"
      onClick={() => onSelect?.(game)}
    >
      <CardContent className="p-5 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-700/30 to-zinc-400/30 flex items-center justify-center text-2xl shrink-0">
            {game.logo_url ? (
              <Image src={game.logo_url} alt={game.name} width={48} height={48} className="object-cover w-full h-full" />
            ) : (
              "🎴"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-lg truncate">
              {game.name}
            </h3>
            <Chip size="sm" variant="soft" color="accent" className="text-xs mt-1 font-semibold">
              {formatCount} formato{formatCount !== 1 ? "s" : ""}
            </Chip>
          </div>
        </div>

        {game.description && (
          <p className="text-gray-400 text-xs line-clamp-2">{game.description}</p>
        )}

        {game.formats && game.formats.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {game.formats
              .filter((f) => f.is_active !== false)
              .slice(0, 4)
              .map((f) => (
                <Chip
                  key={f.id}
                  size="sm"
                  variant="secondary"
                  className="border-zinc-600/40 text-zinc-200 text-xs"
                >
                  {f.name}
                </Chip>
              ))}
            {formatCount > 4 && (
              <Chip size="sm" variant="soft" className="text-xs text-gray-300">
                +{formatCount - 4} más
              </Chip>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
