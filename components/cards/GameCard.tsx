"use client";

import { Card, Chip } from "@heroui/react";
import Image from "next/image";
import type { CatalogGame } from "@/lib/types/catalog";

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
                    {/* Logo */}
                    <div
                        className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-2xl shrink-0"
                        style={{ background: "var(--surface-tertiary)" }}
                    >
                        {game.logo_url ? (
                            <Image
                                src={game.logo_url}
                                alt={game.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            "🎴"
                        )}
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

                {/* Formats */}
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
