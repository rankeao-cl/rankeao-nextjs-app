"use client";

import { useState, useMemo } from "react";
import { Card, Chip } from "@heroui/react";
import Image from "next/image";

const conditionColors: Record<string, string> = {
    mint: "text-[var(--success)]",
    near_mint: "text-[var(--success)]",
    NM: "text-[var(--success)]",
    M: "text-[var(--success)]",
    excellent: "text-[var(--warning)]",
    good: "text-[var(--warning)]",
    LP: "text-[var(--warning)]",
    MP: "text-[var(--warning)]",
    played: "text-[var(--danger)]",
    HP: "text-[var(--danger)]",
    damaged: "text-[var(--danger)]",
    DMG: "text-[var(--danger)]",
};

interface CollectionItem {
    id?: string;
    card_name?: string;
    name?: string;
    image_url?: string;
    card_image_url?: string;
    thumbnail_url?: string;
    condition?: string;
    card_condition?: string;
    quantity?: number;
    game?: string;
    game_name?: string;
    set_name?: string;
    rarity?: string;
}

export default function ProfileCollectionTab({
    collection,
    wishlist,
}: {
    collection: CollectionItem[];
    wishlist: any[];
}) {
    const [gameFilter, setGameFilter] = useState<string>("all");
    const [setFilter, setSetFilter] = useState<string>("all");

    const games = useMemo(() => {
        const g = new Set<string>();
        collection.forEach((item) => {
            const game = item.game || item.game_name;
            if (game) g.add(game);
        });
        return Array.from(g);
    }, [collection]);

    const sets = useMemo(() => {
        const s = new Set<string>();
        collection.forEach((item) => {
            if (item.set_name) s.add(item.set_name);
        });
        return Array.from(s);
    }, [collection]);

    const filtered = useMemo(() => {
        return collection.filter((item) => {
            if (gameFilter !== "all") {
                const game = item.game || item.game_name;
                if (game !== gameFilter) return false;
            }
            if (setFilter !== "all") {
                if (item.set_name !== setFilter) return false;
            }
            return true;
        });
    }, [collection, gameFilter, setFilter]);

    if (collection.length === 0 && wishlist.length === 0) {
        return (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="py-14 text-center">
                    <p className="text-3xl mb-3 opacity-50">📦</p>
                    <p className="text-sm font-medium text-[var(--foreground)]">Coleccion vacia</p>
                    <p className="text-xs mt-1 text-[var(--muted)]">Su coleccion es privada o no tiene cartas publicas.</p>
                </Card.Content>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            {(games.length > 0 || sets.length > 0) && (
                <div className="flex flex-wrap gap-2">
                    {/* Game filter */}
                    <Chip
                        size="sm"
                        className={`cursor-pointer transition-colors ${gameFilter === "all" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)]"}`}
                        onClick={() => setGameFilter("all")}
                    >
                        Todos los juegos
                    </Chip>
                    {games.map((game) => (
                        <Chip
                            key={game}
                            size="sm"
                            className={`cursor-pointer transition-colors ${gameFilter === game ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)]"}`}
                            onClick={() => setGameFilter(game === gameFilter ? "all" : game)}
                        >
                            {game}
                        </Chip>
                    ))}

                    {/* Set filter */}
                    {sets.length > 0 && (
                        <>
                            <div className="w-px h-6 bg-[var(--border)] self-center mx-1" />
                            <Chip
                                size="sm"
                                className={`cursor-pointer transition-colors ${setFilter === "all" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)]"}`}
                                onClick={() => setSetFilter("all")}
                            >
                                Todas las sets
                            </Chip>
                            {sets.slice(0, 10).map((s) => (
                                <Chip
                                    key={s}
                                    size="sm"
                                    className={`cursor-pointer transition-colors ${setFilter === s ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)]"}`}
                                    onClick={() => setSetFilter(s === setFilter ? "all" : s)}
                                >
                                    {s}
                                </Chip>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Collection count */}
            <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
                {filtered.length} carta{filtered.length !== 1 ? "s" : ""} en coleccion
            </p>

            {/* Collection Grid */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {filtered.map((item, i) => {
                        const imageUrl = item.image_url || item.card_image_url || item.thumbnail_url;
                        const name = item.card_name || item.name || "Carta";
                        const condition = item.condition || item.card_condition;
                        const condClass = condition ? (conditionColors[condition] || "text-[var(--muted)]") : "";

                        return (
                            <div
                                key={item.id || i}
                                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--accent)]/50 transition-colors"
                            >
                                {/* Card Image */}
                                <div className="relative aspect-[2.5/3.5] w-full overflow-hidden bg-[var(--surface-secondary)]">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-3xl opacity-30">🃏</div>
                                    )}

                                    {/* Quantity badge */}
                                    {item.quantity != null && item.quantity > 1 && (
                                        <div className="absolute top-1.5 right-1.5 bg-[var(--accent)] text-[var(--accent-foreground)] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                            x{item.quantity}
                                        </div>
                                    )}
                                </div>

                                {/* Card Info */}
                                <div className="p-2.5 space-y-1">
                                    <p className="text-xs font-semibold text-[var(--foreground)] truncate">{name}</p>

                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {condition && (
                                            <span className={`text-[10px] font-bold uppercase ${condClass}`}>
                                                {condition}
                                            </span>
                                        )}
                                        {item.rarity && (
                                            <span className="text-[10px] text-[var(--muted)]">{item.rarity}</span>
                                        )}
                                    </div>

                                    {item.set_name && (
                                        <p className="text-[10px] text-[var(--muted)] truncate">{item.set_name}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-xs text-[var(--muted)] italic text-center py-8">No se encontraron cartas con los filtros seleccionados.</p>
            )}

            {/* Wishlist */}
            <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide mb-3">
                    Lista de Deseos ({wishlist.length})
                </h3>
                {wishlist.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {wishlist.map((item: any, i: number) => (
                            <div key={item.id || i} className="p-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-center hover:border-[var(--accent)]/50 transition-colors">
                                {item.image_url && <Image src={item.image_url} alt={item.card_name} width={200} height={280} className="w-full h-auto rounded-lg mb-2" />}
                                <p className="text-xs font-semibold text-[var(--foreground)] truncate">{item.card_name || "Carta"}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-[var(--muted)] italic">Sin cartas en la lista de deseos.</p>
                )}
            </div>
        </div>
    );
}
