"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { Spinner } from "@heroui/react/spinner";

import { Plus, Xmark, Magnifier, TrashBin } from "@gravity-ui/icons";
import { addCollectionItem, removeCollectionItem } from "@/lib/api/social";
import { autocompleteCards } from "@/lib/api/catalog";
import type { AutocompleteResult } from "@/lib/types/catalog";
import type { AddCollectionItemPayload } from "@/lib/types/social";

const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const;

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
    set_code?: string;
    rarity?: string;
    is_foil?: boolean;
}

export default function ProfileCollectionTab({
    collection: initialCollection,
    isOwnProfile,
    token,
}: {
    collection: CollectionItem[];
    isOwnProfile: boolean;
    token?: string;
}) {
    const [collection, setCollection] = useState<CollectionItem[]>(initialCollection);
    const [gameFilter, setGameFilter] = useState<string>("all");
    const [setFilter, setSetFilter] = useState<string>("all");
    const [showAddModal, setShowAddModal] = useState(false);
    const [, setDeletingId] = useState<string | null>(null);

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

    const handleDelete = async (itemId: string) => {
        if (!confirm("¿Eliminar esta carta de tu colección?")) return;
        setDeletingId(itemId);
        try {
            await removeCollectionItem(itemId, token);
            setCollection((prev) => prev.filter((i) => i.id !== itemId));
        } catch {
            // silent
        }
        setDeletingId(null);
    };

    const handleAdd = async (payload: AddCollectionItemPayload & Record<string, unknown>) => {
        try {
            const res = await addCollectionItem(payload, token);
            const newItem = res?.item;
            if (newItem) setCollection((prev) => [newItem, ...prev]);
            setShowAddModal(false);
        } catch {
            // silent
        }
    };

    if (collection.length === 0 && !isOwnProfile) {
        return (
            <Card className="bg-surface border border-border">
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
            {/* Add button (own profile only) */}
            {isOwnProfile && (
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                        {collection.length} carta{collection.length !== 1 ? "s" : ""} en colección
                    </p>
                    <Button
                        variant="primary"
                        size="sm"
                        className="bg-[var(--accent)] text-white rounded-full px-4 font-semibold shadow-brand-sm"
                        onPress={() => setShowAddModal(true)}
                    >
                        <Plus className="size-4 mr-1" />
                        Agregar carta
                    </Button>
                </div>
            )}

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

            {/* Collection count (when not own profile, since own profile shows it above) */}
            {!isOwnProfile && (
                <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
                    {filtered.length} carta{filtered.length !== 1 ? "s" : ""} en coleccion
                </p>
            )}

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
                                        <Image
                                            src={imageUrl}
                                            alt={name}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-3xl opacity-30">🃏</div>
                                    )}

                                    {/* Delete button (own profile, on hover) */}
                                    {isOwnProfile && item.id && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id!); }}
                                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            <TrashBin className="size-3.5 text-red-400" />
                                        </button>
                                    )}

                                    {/* Quantity badge */}
                                    {item.quantity != null && item.quantity > 1 && (
                                        <div className="absolute top-1.5 left-1.5 bg-[var(--accent)] text-[var(--accent-foreground)] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                            x{item.quantity}
                                        </div>
                                    )}

                                    {/* Foil indicator */}
                                    {item.is_foil && (
                                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-yellow-500/80 text-[9px] font-bold text-black uppercase">
                                            Foil
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
                <div className="text-center py-8">
                    {isOwnProfile && collection.length === 0 ? (
                        <div>
                            <p className="text-4xl mb-4">🃏</p>
                            <p className="text-base font-medium text-[var(--foreground)]">
                                Tu colección está vacía
                            </p>
                            <p className="text-sm mt-1 text-[var(--muted)]">
                                Agrega cartas para empezar a registrar tu colección.
                            </p>
                        </div>
                    ) : (
                        <p className="text-xs text-[var(--muted)] italic">No se encontraron cartas con los filtros seleccionados.</p>
                    )}
                </div>
            )}

            {/* Add Card Modal */}
            {showAddModal && (
                <AddCardModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAdd}
                />
            )}
        </div>
    );
}

function AddCardModal({
    onClose,
    onAdd,
}: {
    onClose: () => void;
    onAdd: (payload: AddCollectionItemPayload & Record<string, unknown>) => Promise<void>;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<AutocompleteResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<AutocompleteResult | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [condition, setCondition] = useState<string>("NM");
    const [isFoil, setIsFoil] = useState(false);
    const [saving, setSaving] = useState(false);

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await autocompleteCards(searchQuery);
                const raw = res?.results ?? [];
                setResults(Array.isArray(raw) ? raw : []);
            } catch {
                setResults([]);
            }
            setSearching(false);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        await onAdd({
            printing_id: selected.printing_id || selected.id,
            card_name: selected.name || selected.card_name,
            image_url: selected.image_url,
            set_code: selected.set_code,
            quantity,
            condition,
            is_foil: isFoil,
        });
        setSaving(false);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md sm:rounded-2xl rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto bg-surface border border-border"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--foreground)]">Agregar carta</h3>
                    <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer">
                        <Xmark className="size-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Magnifier className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSelected(null); }}
                        placeholder="Buscar carta por nombre..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--field-placeholder)] border border-[var(--border)] focus:border-[var(--focus)] outline-none transition-colors"
                        autoFocus
                    />
                </div>

                {/* Search results */}
                {!selected && results.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-1">
                        {results.map((card, idx) => (
                            <button
                                key={card.id || idx}
                                onClick={() => { setSelected(card); setResults([]); }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--default)] transition-colors text-left cursor-pointer"
                            >
                                {card.image_url && (
                                    <Image src={card.image_url} alt="" width={32} height={44} className="object-cover rounded" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                                        {card.name || card.card_name}
                                    </p>
                                    {card.set_code && (
                                        <p className="text-[11px] text-[var(--muted)]">{card.set_code}</p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {searching && (
                    <div className="flex justify-center py-4">
                        <Spinner size="sm" />
                    </div>
                )}

                {/* Selected card preview + options */}
                {selected && (
                    <div className="space-y-4">
                        {/* Preview */}
                        <div className="flex gap-3 items-center p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                            {selected.image_url && (
                                <Image src={selected.image_url} alt="" width={48} height={64} className="object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                                    {selected.name || selected.card_name}
                                </p>
                                {selected.set_code && (
                                    <p className="text-xs text-[var(--muted)]">{selected.set_code}</p>
                                )}
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                            >
                                <Xmark className="size-4" />
                            </button>
                        </div>

                        {/* Quantity */}
                        <div>
                            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                                Cantidad
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-9 h-9 rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)] font-bold flex items-center justify-center hover:bg-[var(--default)] transition-colors cursor-pointer"
                                >
                                    -
                                </button>
                                <span className="text-lg font-bold text-[var(--foreground)] w-8 text-center">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-9 h-9 rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)] font-bold flex items-center justify-center hover:bg-[var(--default)] transition-colors cursor-pointer"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Condition */}
                        <div>
                            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                                Condición
                            </p>
                            <div className="flex gap-2">
                                {CONDITIONS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setCondition(c)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                            condition === c
                                                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                                                : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
                                        }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Foil toggle */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div
                                className={`w-10 h-6 rounded-full transition-colors relative ${
                                    isFoil ? "bg-[var(--accent)]" : "bg-[var(--surface-secondary)]"
                                }`}
                                onClick={() => setIsFoil(!isFoil)}
                            >
                                <div
                                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                        isFoil ? "translate-x-4" : "translate-x-0.5"
                                    }`}
                                />
                            </div>
                            <span className="text-sm text-[var(--foreground)]">Foil / Holográfica</span>
                        </label>

                        {/* Save */}
                        <Button
                            variant="primary"
                            className="w-full bg-[var(--accent)] text-white rounded-full font-semibold"
                            onPress={handleSave}
                            isPending={saving}
                        >
                            Agregar a colección
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
