"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@heroui/react/button";
import { Spinner } from "@heroui/react/spinner";

import Link from "next/link";
import { addWishlistItem, removeWishlistItem } from "@/lib/api/social";
import { autocompleteCards } from "@/lib/api/catalog";
import type { AutocompleteResult } from "@/lib/types/catalog";
import type { WishlistItem, AddWishlistItemPayload } from "@/lib/types/social";
import {
    Plus,
    Xmark,
    Magnifier,
    TrashBin,
    Star,
} from "@gravity-ui/icons";

const PRIORITIES: { value: number; label: string; color: string }[] = [
    { value: 3, label: "Alta", color: "text-red-500 bg-red-500/15" },
    { value: 2, label: "Media", color: "text-yellow-500 bg-yellow-500/15" },
    { value: 1, label: "Baja", color: "text-emerald-500 bg-emerald-500/15" },
];

const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const;

export default function ProfileWishlistTab({
    wishlist: initialWishlist,
    isOwnProfile,
    token,
}: {
    wishlist: WishlistItem[];
    isOwnProfile: boolean;
    token?: string;
}) {
    const [items, setItems] = useState<WishlistItem[]>(initialWishlist);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (itemId: string) => {
        if (!confirm("¿Eliminar esta carta de tu wishlist?")) return;
        setDeletingId(itemId);
        try {
            await removeWishlistItem(itemId, token);
            setItems((prev) => prev.filter((i) => i.id !== itemId));
        } catch {
            // silent
        }
        setDeletingId(null);
    };

    const handleAdd = async (payload: AddWishlistItemPayload) => {
        try {
            const res = await addWishlistItem(payload, token);
            const newItem = res?.item;
            if (newItem) setItems((prev) => [newItem, ...prev]);
            setShowAddModal(false);
        } catch {
            // silent
        }
    };

    // Empty state
    if (items.length === 0 && !isOwnProfile) {
        return (
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="text-center text-[var(--muted)] py-8 flex flex-col items-center gap-3">
                    <Star className="w-8 h-8 opacity-40 mx-auto text-[var(--muted)]" />
                    <p className="text-sm font-semibold text-[var(--foreground)]">Lista de deseos vacia</p>
                    <p className="text-[10px] text-[var(--muted)] max-w-sm">
                        Este usuario aun no ha agregado cartas a su lista de deseos.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header + Add button */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
                    {items.length} carta{items.length !== 1 ? "s" : ""} en wishlist
                </p>
                {isOwnProfile && (
                    <Button
                        variant="primary"
                        size="sm"
                        className="bg-[var(--accent)] text-white rounded-full px-4 font-semibold shadow-brand-sm"
                        onPress={() => setShowAddModal(true)}
                    >
                        <Plus className="size-4 mr-1" />
                        Agregar
                    </Button>
                )}
            </div>

            {/* Wishlist grid */}
            {items.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {items.map((item) => {
                        const priority = PRIORITIES.find((p) => p.value === item.priority) || PRIORITIES[1];

                        return (
                            <div
                                key={item.id}
                                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--accent)]/50 transition-colors relative"
                            >
                                {/* Card Image */}
                                <div className="relative aspect-[2.5/3.5] w-full overflow-hidden bg-[var(--surface-secondary)]">
                                    {item.image_url ? (
                                        <Image
                                            src={item.image_url}
                                            alt={item.card_name || ""}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-3xl opacity-30">
                                            <Star className="w-8 h-8" />
                                        </div>
                                    )}

                                    {/* Priority badge */}
                                    <div className={`absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${priority.color}`}>
                                        {priority.label}
                                    </div>

                                    {/* Delete button on hover (own profile only) */}
                                    {isOwnProfile && (
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={deletingId === item.id}
                                            className="absolute top-1.5 left-1.5 w-7 h-7 rounded-lg flex items-center justify-center bg-black/60 text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                        >
                                            <TrashBin className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Card Info */}
                                <div className="p-2.5 space-y-1">
                                    <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                                        {item.card_name || "Carta desconocida"}
                                    </p>

                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {item.preferred_condition && (
                                            <span className="text-[10px] font-medium text-[var(--muted)] bg-[var(--surface-secondary)] px-1.5 py-0.5 rounded-full">
                                                {item.preferred_condition}
                                            </span>
                                        )}
                                        {item.max_price != null && (
                                            <span className="text-[10px] font-medium text-[var(--muted)]">
                                                Max. ${item.max_price.toLocaleString("es-CL")}
                                            </span>
                                        )}
                                    </div>

                                    {/* Marketplace link (own profile) */}
                                    {isOwnProfile && (
                                        <Link
                                            href={`/marketplace?q=${encodeURIComponent(item.card_name || "")}`}
                                            className="text-[10px] font-semibold text-[var(--accent)] hover:underline mt-1 inline-block"
                                        >
                                            Buscar en marketplace
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <div className="text-center text-[var(--muted)] py-8 flex flex-col items-center gap-3">
                        <Star className="w-8 h-8 opacity-40 mx-auto text-[var(--muted)]" />
                        <p className="text-sm font-semibold text-[var(--foreground)]">Tu wishlist esta vacia</p>
                        <p className="text-[10px] text-[var(--muted)] max-w-sm">
                            Agrega cartas que estes buscando para encontrarlas mas rapido en el marketplace.
                        </p>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <AddWishlistModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAdd}
                />
            )}
        </div>
    );
}

function AddWishlistModal({
    onClose,
    onAdd,
}: {
    onClose: () => void;
    onAdd: (payload: AddWishlistItemPayload) => Promise<void>;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<AutocompleteResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<AutocompleteResult | null>(null);
    const [condition, setCondition] = useState<string>("NM");
    const [priority, setPriority] = useState(2);
    const [maxPrice, setMaxPrice] = useState("");
    const [saving, setSaving] = useState(false);

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
            card_id: selected.card_id || selected.id,
            printing_id: selected.printing_id || selected.id,
            card_name: selected.name || selected.card_name,
            image_url: selected.image_url,
            preferred_condition: condition,
            priority,
            max_price: maxPrice ? Number(maxPrice) : undefined,
        });
        setSaving(false);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md sm:rounded-2xl rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto border border-[var(--border)] bg-[var(--surface)]"
                style={{ backdropFilter: "blur(20px)" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--foreground)]">Agregar a wishlist</h3>
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
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelected(null);
                        }}
                        placeholder="Buscar carta..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--field-placeholder)] border border-[var(--border)] focus:border-[var(--focus)] outline-none transition-colors"
                        autoFocus
                    />
                </div>

                {/* Results */}
                {!selected && results.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-1">
                        {results.map((card, idx) => (
                            <button
                                key={card.id || idx}
                                onClick={() => {
                                    setSelected(card);
                                    setResults([]);
                                }}
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

                {/* Selected card options */}
                {selected && (
                    <div className="space-y-4">
                        <div className="flex gap-3 items-center p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                            {selected.image_url && (
                                <Image src={selected.image_url} alt="" width={48} height={64} className="object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                                    {selected.name || selected.card_name}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                            >
                                <Xmark className="size-4" />
                            </button>
                        </div>

                        {/* Preferred condition */}
                        <div>
                            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                                Condicion preferida
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

                        {/* Priority */}
                        <div>
                            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                                Prioridad
                            </p>
                            <div className="flex gap-2">
                                {PRIORITIES.map((p) => (
                                    <button
                                        key={p.value}
                                        onClick={() => setPriority(p.value)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                            priority === p.value
                                                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                                                : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Max price */}
                        <div>
                            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                                Precio maximo (opcional)
                            </p>
                            <input
                                type="number"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                placeholder="Ej: 5000"
                                className="w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--field-placeholder)] border border-[var(--border)] focus:border-[var(--focus)] outline-none transition-colors"
                            />
                        </div>

                        <Button
                            variant="primary"
                            className="w-full bg-[var(--accent)] text-white rounded-full font-semibold"
                            onPress={handleSave}
                            isPending={saving}
                        >
                            Agregar a wishlist
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
