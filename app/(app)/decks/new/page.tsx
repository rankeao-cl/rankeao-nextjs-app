"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react/button";
import { Input } from "@heroui/react/input";
import { Label } from "@heroui/react/label";
import { ListBox } from "@heroui/react/list-box";
import { Select } from "@heroui/react/select";
import { TextArea } from "@heroui/react/textarea";
import { TextField } from "@heroui/react/textfield";
import { toast } from "@heroui/react/toast";
import { Xmark } from "@gravity-ui/icons";
import Image from "next/image";

import { useAuth } from "@/lib/hooks/use-auth";
import { apiPost } from "@/lib/api/client";
import { mapErrorMessage } from "@/lib/api/errors";
import { getGames, searchCards, scryfallSearch } from "@/lib/api/catalog";
import type { Card, CatalogGame } from "@/lib/types/catalog";

interface NewDeckPageProps {
    onCloseOverride?: () => void;
}

const solidInputClassName = "[&_[data-slot='input-wrapper']]:border [&_[data-slot='input-wrapper']]:border-[var(--border)] [&_[data-slot='input-wrapper']]:bg-[var(--surface-solid-secondary)] [&_[data-slot='input-wrapper']]:shadow-none [&_[data-slot='input-wrapper']]:backdrop-blur-none [&_[data-slot='input-wrapper']]:data-[hover=true]:bg-[var(--surface-solid-secondary)] [&_[data-slot='input-wrapper']]:group-data-[focus=true]:bg-[var(--surface-solid-secondary)] [&_[data-slot='input']]:text-[var(--foreground)] [&_[data-slot='input']::placeholder]:text-[var(--muted)]";
const solidSelectTriggerClassName = "border border-[var(--border)] bg-[var(--surface-solid-secondary)] shadow-none backdrop-blur-none data-[hover=true]:bg-[var(--surface-solid-secondary)]";
const solidSelectPopoverClassName = "border border-[var(--border)] bg-[var(--surface-solid)] shadow-[var(--shadow-popover)] backdrop-blur-none";

interface DeckCardSuggestion {
    id: string;
    label: string;
    imageUrl?: string;
    detailPrimary?: string;
    detailSecondary?: string;
    source: "catalog" | "scryfall";
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function asCard(value: unknown): Card | null {
    const record = asRecord(value);
    if (!record) return null;
    if (typeof record.id !== "string" || typeof record.name !== "string") return null;
    return {
        id: record.id,
        name: record.name,
        game_id: typeof record.game_id === "string" ? record.game_id : undefined,
        type_line: typeof record.type_line === "string" ? record.type_line : undefined,
        oracle_text: typeof record.oracle_text === "string" ? record.oracle_text : undefined,
        created_at: typeof record.created_at === "string" ? record.created_at : undefined,
        updated_at: typeof record.updated_at === "string" ? record.updated_at : undefined,
    };
}

function extractCatalogCards(payload: Awaited<ReturnType<typeof searchCards>>): Card[] {
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.cards)) return payload.cards;

    const nested = asRecord(payload?.data);
    const nestedCards = nested?.cards;
    if (!Array.isArray(nestedCards)) return [];

    return nestedCards
        .map((item) => asCard(item))
        .filter((item): item is Card => item !== null);
}

export default function NewDeckPage({ onCloseOverride }: NewDeckPageProps = {}) {
    const router = useRouter();
    const { session, status } = useAuth();
    const [loading, setLoading] = useState(false);
    const [games, setGames] = useState<CatalogGame[]>([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [gameId, setGameId] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [deckList, setDeckList] = useState("");
    const [cardSearch, setCardSearch] = useState("");
    const [cardResults, setCardResults] = useState<DeckCardSuggestion[]>([]);
    const [searchingCards, setSearchingCards] = useState(false);

    useEffect(() => {
        getGames()
            .then((res) => {
                const list = res?.data ?? res?.games ?? [];
                if (Array.isArray(list)) setGames(list);
            })
            .catch((error: unknown) => {
                toast.danger("Error", { description: mapErrorMessage(error) });
            });
    }, []);

    useEffect(() => {
        const query = cardSearch.trim();
        if (query.length < 2) {
            setCardResults([]);
            setSearchingCards(false);
            return;
        }
        const timeout = setTimeout(() => {
            setSearchingCards(true);
            Promise.allSettled([
                searchCards({ q: query, page: 1, per_page: 8 }),
                scryfallSearch(query, 1, 10),
            ])
                .then(([catalogRes, scryfallRes]) => {
                    const merged: DeckCardSuggestion[] = [];
                    const seen = new Set<string>();

                    if (catalogRes.status === "fulfilled") {
                        const catalogItems = extractCatalogCards(catalogRes.value);
                        for (const item of catalogItems) {
                            const label = item.name.trim();
                            if (!label) continue;
                            const key = label.toLowerCase();
                            if (seen.has(key)) continue;
                            seen.add(key);
                            merged.push({
                                id: item.id || key,
                                label,
                                imageUrl: "",
                                detailPrimary: "Catalogo local",
                                detailSecondary: "",
                                source: "catalog",
                            });
                        }
                    }

                    if (scryfallRes.status === "fulfilled") {
                        const raw = scryfallRes.value?.data?.cards;
                        const scryfallItems = Array.isArray(raw) ? raw : [];
                        for (const card of scryfallItems) {
                            const label = String(card?.name || "").trim();
                            if (!label) continue;
                            const key = label.toLowerCase();
                            const detailPrimary = [card?.game_name, card?.set_name].filter(Boolean).join(" · ");
                            const detailSecondary = [card?.set_code?.toUpperCase(), card?.rarity].filter(Boolean).join(" · ");
                            if (seen.has(key)) {
                                const existing = merged.find((item) => item.label.toLowerCase() === key);
                                if (existing && !existing.imageUrl && (card?.image_url_small || card?.image_url)) {
                                    existing.imageUrl = card.image_url_small || card.image_url;
                                    if (!existing.detailPrimary) existing.detailPrimary = detailPrimary;
                                    if (!existing.detailSecondary) existing.detailSecondary = detailSecondary;
                                }
                                continue;
                            }
                            seen.add(key);
                            merged.push({
                                id: `scryfall-${key}`,
                                label,
                                imageUrl: card?.image_url_small || card?.image_url,
                                detailPrimary,
                                detailSecondary,
                                source: "scryfall",
                            });
                        }
                    }

                    setCardResults(merged.slice(0, 12));
                })
                .catch(() => {
                    setCardResults([]);
                })
                .finally(() => {
                    setSearchingCards(false);
                });
        }, 250);

        return () => clearTimeout(timeout);
    }, [cardSearch]);

    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    const closeModal = () => {
        if (onCloseOverride) {
            onCloseOverride();
            return;
        }
        if (window.history.length > 1) {
            router.back();
            return;
        }
        router.push("/decks");
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.danger("El nombre del mazo es requerido");
            return;
        }
        if (!gameId) {
            toast.danger("Selecciona un juego");
            return;
        }
        if (!session?.accessToken) {
            toast.danger("Tu sesion expiro. Inicia sesion nuevamente.");
            return;
        }

        // Parse deck list: "4 Lightning Bolt" format
        const cards = deckList
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const match = line.match(/^(\d+)\s+(.+)$/);
                if (match) return { card_name: match[2].trim(), quantity: parseInt(match[1], 10), board: "MAIN" };
                return { card_name: line, quantity: 1, board: "MAIN" };
            });

        setLoading(true);
        try {
            await apiPost(
                "/social/decks",
                {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    game_id: gameId,
                    is_public: isPublic,
                    cards,
                },
                { token: session.accessToken }
            );
            toast.success("Mazo publicado");
            if (onCloseOverride) {
                onCloseOverride();
                return;
            }
            router.push("/");
        } catch (err: unknown) {
            toast.danger(mapErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const appendCardToDeck = (cardName: string) => {
        const nextLine = `1 ${cardName}`;
        const current = deckList.trimEnd();
        setDeckList(current ? `${current}\n${nextLine}` : nextLine);
        setCardSearch("");
        setCardResults([]);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Cerrar modal"
                onClick={closeModal}
                className="absolute inset-0"
                style={{
                    backgroundColor: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(4px)",
                }}
            />
            <div
                className="relative flex w-full max-w-[560px] max-h-[90vh] flex-col overflow-visible rounded-2xl border"
                style={{
                    backgroundColor: "var(--surface-solid)",
                    borderColor: "var(--overlay)",
                }}
            >
                <div className="flex items-center justify-between border-b border-[var(--surface)] px-4 py-3.5">
                    <h2 className="m-0 text-base font-bold text-[var(--foreground)]">Publicar mazo</h2>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                    >
                        <Xmark className="size-4" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    <p className="text-sm text-[var(--muted)]">Comparte tu deck con la comunidad.</p>

                    <TextField className="flex flex-col space-y-1">
                        <Label className="text-xs text-[var(--muted)]">Nombre del mazo</Label>
                        <Input
                            placeholder="ej: Charizard ex Aggro"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={solidInputClassName}
                        />
                    </TextField>

                    <Select
                        selectedKey={gameId}
                        onSelectionChange={(key) => {
                            setGameId(String(key || ""));
                            setCardSearch("");
                            setCardResults([]);
                        }}
                    >
                        <Label>Juego</Label>
                        <Select.Trigger className={solidSelectTriggerClassName}>
                            <Select.Value />
                            <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className={solidSelectPopoverClassName}>
                            <ListBox className="bg-[var(--surface-solid)]">
                                {games.map((g) => (
                                    <ListBox.Item key={g.id} id={g.id} textValue={g.name}>
                                        {g.name}
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                ))}
                            </ListBox>
                        </Select.Popover>
                    </Select>

                    <TextField className="flex flex-col space-y-1">
                        <Label className="text-xs text-[var(--muted)]">Descripcion (opcional)</Label>
                        <TextArea
                            placeholder="Estrategia, matchups, notas..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className={solidInputClassName}
                        />
                    </TextField>

                    <TextField className="flex flex-col space-y-1">
                        <Label className="text-xs text-[var(--muted)]">Agregar carta (autocompletado)</Label>
                        <Input
                            placeholder="Busca cartas para agregarlas al mazo..."
                            value={cardSearch}
                            onChange={(e) => setCardSearch(e.target.value)}
                            className={solidInputClassName}
                        />
                        {cardSearch.trim().length >= 2 && (
                            <div className="mt-1 max-h-56 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] shadow-[var(--shadow-popover)]">
                                {searchingCards ? (
                                    <p className="px-3 py-2 text-xs text-[var(--muted)]">Buscando cartas...</p>
                                ) : cardResults.length > 0 ? (
                                    cardResults.map((card) => (
                                        <button
                                            key={card.id}
                                            type="button"
                                            className="flex w-full cursor-pointer items-center gap-3 border-b border-[var(--surface)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--surface-solid-secondary)]"
                                            onClick={() => appendCardToDeck(card.label)}
                                        >
                                            {card.imageUrl ? (
                                                <Image
                                                    src={card.imageUrl}
                                                    alt={card.label}
                                                    width={28}
                                                    height={38}
                                                    className="h-[38px] w-[28px] shrink-0 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="h-[38px] w-[28px] shrink-0 rounded bg-[var(--surface)]" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm text-[var(--foreground)]">{card.label}</p>
                                                {card.detailPrimary && <p className="truncate text-[11px] text-[var(--muted)]">{card.detailPrimary}</p>}
                                                {card.detailSecondary && <p className="truncate text-[10px] text-[var(--muted)]">{card.detailSecondary}</p>}
                                            </div>
                                            <span className="shrink-0 rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
                                                {card.source === "catalog" ? "Catalogo" : "Scryfall"}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="px-3 py-2 text-xs text-[var(--muted)]">Sin coincidencias para &quot;{cardSearch.trim()}&quot;.</p>
                                )}
                            </div>
                        )}
                        <p className="mt-1 text-[11px] text-[var(--muted)]">Selecciona una carta y se agrega automaticamente a la lista como &quot;1 carta&quot;.</p>
                    </TextField>

                    <TextField className="flex flex-col space-y-1">
                        <Label className="text-xs text-[var(--muted)]">Lista de cartas</Label>
                        <TextArea
                            placeholder={"4 Lightning Bolt\n4 Counterspell\n2 Charizard ex\n..."}
                            value={deckList}
                            onChange={(e) => setDeckList(e.target.value)}
                            rows={8}
                            className={`font-mono text-xs ${solidInputClassName}`}
                        />
                        <p className="mt-1 text-[11px] text-[var(--muted)]">Formato: cantidad + nombre. Una carta por linea.</p>
                    </TextField>

                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            size="sm"
                            variant={isPublic ? "primary" : "secondary"}
                            onPress={() => setIsPublic(!isPublic)}
                        >
                            {isPublic ? "Publico" : "Privado"}
                        </Button>
                        <span className="text-xs text-[var(--muted)]">
                            {isPublic ? "Visible para todos" : "Solo tu puedes verlo"}
                        </span>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            className="flex-1 font-semibold"
                            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                            onPress={handleSubmit}
                            isPending={loading}
                            isDisabled={!name.trim() || !gameId}
                        >
                            Publicar mazo
                        </Button>
                        <Button type="button" variant="tertiary" onPress={closeModal}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
