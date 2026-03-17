"use client";

import { Card, Chip } from "@heroui/react";
import Image from "next/image";
import type { CatalogGame } from "@/lib/types/catalog";
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

export default function GameCard({
    game,
    onSelect,
}: {
    game: CatalogGame;
    onSelect?: (game: CatalogGame) => void;
}) {
    return (
        <Card
            className="surface-card rounded-[22px] overflow-hidden cursor-pointer"
            onClick={() => onSelect?.(game)}
        >
            <Card.Content className="p-4 gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[var(--border)]">
                        <GameLogo game={game} size={48} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>
                            {game.name}
                        </h3>
                        {game.description && (
                            <p className="text-xs line-clamp-2 mt-0.5" style={{ color: "var(--muted)" }}>
                                {game.description}
                            </p>
                        )}
                    </div>
                </div>

                {game.formats && game.formats.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {game.formats.slice(0, 4).map((f) => (
                            <Chip key={f.id} variant="secondary" size="sm">
                                {f.name}
                            </Chip>
                        ))}
                        {game.formats.length > 4 && (
                            <Chip variant="soft" size="sm">
                                +{game.formats.length - 4}
                            </Chip>
                        )}
                    </div>
                )}
            </Card.Content>
        </Card>
    );
}
