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

import { useAuth } from "@/lib/hooks/use-auth";
import { mapErrorMessage } from "@/lib/api/errors";
import { createListing } from "@/lib/api/marketplace";
import { getGames, searchCards, getCardPrintings, scryfallSearch } from "@/lib/api/catalog";
import type { CatalogGame, Card, Printing } from "@/lib/types/catalog";
import Image from "next/image";

const CONDITIONS = [
    { id: "NM", label: "Near Mint (NM)" },
    { id: "LP", label: "Lightly Played (LP)" },
    { id: "MP", label: "Moderately Played (MP)" },
    { id: "HP", label: "Heavily Played (HP)" },
    { id: "DMG", label: "Damaged (DMG)" },
];

interface NewListingPageProps {
    onCloseOverride?: () => void;
}

interface ListingCardSuggestion {
    id: string;
    label: string;
    image_url?: string;
    detail_primary?: string;
    detail_secondary?: string;
    source: "catalog" | "scryfall";
    catalogCard?: {
        id: string;
        name: string;
    };
}

const solidInputClassName = "[&_[data-slot='input-wrapper']]:border [&_[data-slot='input-wrapper']]:border-[var(--border)] [&_[data-slot='input-wrapper']]:bg-[var(--surface-solid-secondary)] [&_[data-slot='input-wrapper']]:shadow-none [&_[data-slot='input-wrapper']]:backdrop-blur-none [&_[data-slot='input-wrapper']]:data-[hover=true]:bg-[var(--surface-solid-secondary)] [&_[data-slot='input-wrapper']]:group-data-[focus=true]:bg-[var(--surface-solid-secondary)] [&_[data-slot='input']]:text-[var(--foreground)] [&_[data-slot='input']::placeholder]:text-[var(--muted)]";
const solidSelectTriggerClassName = "border border-[var(--border)] bg-[var(--surface-solid-secondary)] shadow-none backdrop-blur-none data-[hover=true]:bg-[var(--surface-solid-secondary)]";
const solidSelectPopoverClassName = "border border-[var(--border)] bg-[var(--surface-solid)] shadow-[var(--shadow-popover)] backdrop-blur-none";

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asCard(value: unknown): Card | null {
    const record = asRecord(value);
    if (!record) return null;
    if (typeof record.id !== "string" || typeof record.name !== "string") return null;
    return {
        id: record.id,
        name: record.name,
        game_id: asString(record.game_id),
        type_line: asString(record.type_line),
        oracle_text: asString(record.oracle_text),
        created_at: asString(record.created_at),
        updated_at: asString(record.updated_at),
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

export default function NewListingPage({ onCloseOverride }: NewListingPageProps = {}) {
    const router = useRouter();
    const { session, status } = useAuth();
    const [loading, setLoading] = useState(false);
    const [games, setGames] = useState<CatalogGame[]>([]);

    // Form state
    const [gameId, setGameId] = useState("");
    const [cardSearch, setCardSearch] = useState("");
    const [cardResults, setCardResults] = useState<ListingCardSuggestion[]>([]);
    const [selectedCard, setSelectedCard] = useState<{ id: string; name: string } | null>(null);
    const [searchingCards, setSearchingCards] = useState(false);
    const [printings, setPrintings] = useState<Printing[]>([]);
    const [printingId, setPrintingId] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [condition, setCondition] = useState("NM");
    const [language, setLanguage] = useState("es");
    const [isFoil, setIsFoil] = useState(false);
    const [quantity, setQuantity] = useState("1");
    const [city, setCity] = useState("");
    const [region, setRegion] = useState("");

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

    // Card autocomplete
    useEffect(() => {
        if (cardSearch.length < 2) {
            setCardResults([]);
            setSearchingCards(false);
            return;
        }
        const timer = setTimeout(() => {
            setSearchingCards(true);
            Promise.allSettled([
                searchCards({ q: cardSearch, page: 1, per_page: 10 }),
                scryfallSearch(cardSearch, 1, 10),
            ])
                .then(([catalogRes, scryfallRes]) => {
                    const merged: ListingCardSuggestion[] = [];
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
                                image_url: undefined,
                                detail_primary: "Catalogo local",
                                detail_secondary: undefined,
                                source: "catalog",
                                catalogCard: {
                                    id: item.id,
                                    name: label,
                                },
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
                                if (existing && !existing.image_url && (card?.image_url_small || card?.image_url)) {
                                    existing.image_url = card.image_url_small || card.image_url;
                                    if (!existing.detail_primary) existing.detail_primary = detailPrimary;
                                    if (!existing.detail_secondary) existing.detail_secondary = detailSecondary;
                                }
                                continue;
                            }
                            seen.add(key);
                            merged.push({
                                id: `scryfall-${key}`,
                                label,
                                image_url: card?.image_url_small || card?.image_url,
                                detail_primary: detailPrimary,
                                detail_secondary: detailSecondary,
                                source: "scryfall",
                            });
                        }
                    }

                    setCardResults(merged.slice(0, 12));
                })
                .catch(() => setCardResults([]))
                .finally(() => {
                    setSearchingCards(false);
                });
        }, 300);
        return () => clearTimeout(timer);
    }, [cardSearch]);

    // Load printings when card selected
    useEffect(() => {
        if (!selectedCard) {
            setPrintings([]);
            setPrintingId("");
            return;
        }
        getCardPrintings(selectedCard.id)
            .then((res) => {
                const list = res?.data ?? res?.printings ?? [];
                if (Array.isArray(list)) {
                    setPrintings(list);
                    if (list.length === 1) setPrintingId(list[0].id);
                }
            })
            .catch(() => setPrintings([]));
    }, [selectedCard]);

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
        router.push("/marketplace");
    };

    const selectCard = (suggestion: ListingCardSuggestion) => {
        const cardName = suggestion.label;
        setCardSearch(cardName);
        setCardResults([]);
        setPrintingId("");
        if (suggestion.catalogCard) {
            setSelectedCard(suggestion.catalogCard);
            if (!title) setTitle(cardName);
            return;
        }

        setSelectedCard(null);
        toast.danger("Esa opcion es solo referencia Scryfall. Para vender, selecciona una opcion con etiqueta Catalogo.");
    };

    const handleSubmit = async () => {
        if (!gameId) {
            toast.danger("Selecciona un juego");
            return;
        }
        if (!selectedCard) {
            toast.danger("Selecciona una carta del catalogo");
            return;
        }
        if (!printingId) {
            toast.danger("Selecciona una carta y edicion");
            return;
        }
        if (!price || Number(price) < 100) {
            toast.danger("El precio minimo es $100 CLP");
            return;
        }
        if (!title.trim() || title.trim().length < 5) {
            toast.danger("El titulo debe tener al menos 5 caracteres");
            return;
        }
        if (!city.trim() || !region.trim()) {
            toast.danger("Ciudad y region son requeridos");
            return;
        }
        const parsedQuantity = Number(quantity);
        if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 99) {
            toast.danger("La cantidad debe estar entre 1 y 99");
            return;
        }
        if (!session?.accessToken) {
            toast.danger("Tu sesion expiro. Inicia sesion nuevamente.");
            return;
        }

        setLoading(true);
        try {
            const selectedPrinting = printings.find((printing) => printing.id === printingId);
            if (!selectedPrinting) {
                toast.danger("La edicion seleccionada no es valida.");
                return;
            }

            await createListing({
                card_public_id: selectedCard.id,
                printing_public_id: printingId,
                game_public_id: gameId,
                title: title.trim(),
                price: Number(price),
                currency: "CLP",
                card_condition: condition,
                card_language: language,
                is_foil: isFoil,
                quantity: parsedQuantity,
                description: description.trim() || undefined,
                accepts_offers: true,
                accepts_shipping: true,
                accepts_in_person: true,
                city: city.trim(),
                region: region.trim(),
                card_name: selectedCard?.name,
                set_name: selectedPrinting.set_name,
                set_code: selectedPrinting.set_code,
                card_image_url: selectedPrinting.image_url || selectedPrinting.image_url_small,
            });
            toast.success("Publicacion creada exitosamente");
            if (onCloseOverride) {
                onCloseOverride();
                return;
            }
            router.push("/marketplace");
        } catch (err: unknown) {
            toast.danger(mapErrorMessage(err));
        } finally {
            setLoading(false);
        }
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
                    <h2 className="m-0 text-base font-bold text-[var(--foreground)]">Vender carta</h2>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                    >
                        <Xmark className="size-4" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    <p className="text-sm text-[var(--muted)]">Publica tu carta en el marketplace para que otros jugadores la encuentren.</p>

                    {/* Game selection */}
                    <Select
                        selectedKey={gameId}
                        onSelectionChange={(key) => {
                            setGameId(String(key || ""));
                            setSelectedCard(null);
                            setCardSearch("");
                            setPrintingId("");
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

                    {/* Card search */}
                    <div className="space-y-1">
                        <TextField className="flex flex-col space-y-1">
                            <Label className="text-xs text-[var(--muted)]">Buscar carta</Label>
                            <Input
                                placeholder="Escribe el nombre de la carta..."
                                value={cardSearch}
                                    onChange={(e) => {
                                        setCardSearch(e.target.value);
                                        if (selectedCard && e.target.value !== selectedCard.name) {
                                            setSelectedCard(null);
                                            setPrintingId("");
                                        }
                                    }}
                                    className={solidInputClassName}
                                />
                            </TextField>
                        {cardSearch.trim().length >= 2 && (
                            <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                                {searchingCards ? (
                                    <p className="px-3 py-2 text-xs text-[var(--muted)]">Buscando cartas...</p>
                                ) : cardResults.length > 0 ? (
                                    cardResults.map((card) => (
                                        <button
                                            key={card.id}
                                            type="button"
                                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                                                card.source === "catalog"
                                                    ? "cursor-pointer hover:bg-[var(--surface-secondary)]"
                                                    : "cursor-not-allowed opacity-80"
                                            }`}
                                            onClick={() => selectCard(card)}
                                        >
                                            {card.image_url ? (
                                                <Image src={card.image_url} alt={card.label} width={28} height={38} className="h-[38px] w-[28px] shrink-0 rounded object-cover" />
                                            ) : (
                                                <div className="h-[38px] w-[28px] shrink-0 rounded bg-[var(--surface)]" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <span className="block truncate text-[var(--foreground)]">{card.label}</span>
                                                {card.detail_primary && <span className="block truncate text-[11px] text-[var(--muted)]">{card.detail_primary}</span>}
                                                {card.detail_secondary && <span className="block truncate text-[10px] text-[var(--muted)]">{card.detail_secondary}</span>}
                                            </div>
                                            <span className="shrink-0 rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
                                                {card.source === "catalog" ? "Catalogo" : "Scryfall (solo referencia)"}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="px-3 py-2 text-xs text-[var(--muted)]">Sin coincidencias para &quot;{cardSearch.trim()}&quot;.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Printing selection */}
                    {selectedCard && printings.length > 0 && (
                        <Select
                            selectedKey={printingId}
                            onSelectionChange={(key) => setPrintingId(String(key || ""))}
                        >
                            <Label>Edicion / Set</Label>
                            <Select.Trigger className={solidSelectTriggerClassName}>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover className={solidSelectPopoverClassName}>
                                <ListBox className="bg-[var(--surface-solid)]">
                                    {printings.map((p) => (
                                        <ListBox.Item key={p.id} id={p.id} textValue={`${p.set_name || p.set_code || "?"} #${p.collector_number || "?"}`}>
                                            {p.set_name || p.set_code} #{p.collector_number} ({p.rarity || "?"})
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Select.Popover>
                        </Select>
                    )}

                    {/* Title */}
                    <TextField className="flex flex-col space-y-1">
                        <Label className="text-xs text-[var(--muted)]">Titulo de la publicacion</Label>
                        <Input
                            placeholder="ej: Charizard ex NM - Paldean Fates"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={solidInputClassName}
                        />
                    </TextField>

                    {/* Price & Condition */}
                    <div className="grid grid-cols-2 gap-3">
                        <TextField className="flex flex-col space-y-1">
                            <Label className="text-xs text-[var(--muted)]">Precio (CLP)</Label>
                            <Input
                                type="number"
                                placeholder="5000"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                min={100}
                                className={solidInputClassName}
                            />
                        </TextField>

                        <Select
                            selectedKey={condition}
                            onSelectionChange={(key) => setCondition(String(key || "NM"))}
                        >
                            <Label>Condicion</Label>
                            <Select.Trigger className={solidSelectTriggerClassName}>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover className={solidSelectPopoverClassName}>
                                <ListBox className="bg-[var(--surface-solid)]">
                                    {CONDITIONS.map((c) => (
                                        <ListBox.Item key={c.id} id={c.id} textValue={c.label}>
                                            {c.label}
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Select.Popover>
                        </Select>
                    </div>

                    {/* Language, Foil, Quantity */}
                    <div className="grid grid-cols-3 gap-3">
                        <Select
                            selectedKey={language}
                            onSelectionChange={(key) => setLanguage(String(key || "es"))}
                        >
                            <Label>Idioma</Label>
                            <Select.Trigger className={solidSelectTriggerClassName}>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover className={solidSelectPopoverClassName}>
                                <ListBox className="bg-[var(--surface-solid)]">
                                    <ListBox.Item id="es" textValue="Espanol">Espanol<ListBox.ItemIndicator /></ListBox.Item>
                                    <ListBox.Item id="en" textValue="Ingles">Ingles<ListBox.ItemIndicator /></ListBox.Item>
                                    <ListBox.Item id="ja" textValue="Japones">Japones<ListBox.ItemIndicator /></ListBox.Item>
                                    <ListBox.Item id="ko" textValue="Coreano">Coreano<ListBox.ItemIndicator /></ListBox.Item>
                                    <ListBox.Item id="pt" textValue="Portugues">Portugues<ListBox.ItemIndicator /></ListBox.Item>
                                </ListBox>
                            </Select.Popover>
                        </Select>

                        <div className="flex flex-col justify-end">
                            <Button
                                type="button"
                                size="sm"
                                variant={isFoil ? "primary" : "secondary"}
                                onPress={() => setIsFoil(!isFoil)}
                                className="w-full"
                            >
                                {isFoil ? "Foil" : "No Foil"}
                            </Button>
                        </div>

                        <TextField className="flex flex-col space-y-1">
                            <Label className="text-xs text-[var(--muted)]">Cantidad</Label>
                            <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                min={1}
                                max={99}
                                className={solidInputClassName}
                            />
                        </TextField>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-2 gap-3">
                        <TextField className="flex flex-col space-y-1">
                            <Label className="text-xs text-[var(--muted)]">Ciudad</Label>
                            <Input
                                placeholder="Santiago"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className={solidInputClassName}
                            />
                        </TextField>
                        <TextField className="flex flex-col space-y-1">
                            <Label className="text-xs text-[var(--muted)]">Region</Label>
                            <Input
                                placeholder="Metropolitana"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className={solidInputClassName}
                            />
                        </TextField>
                    </div>

                    {/* Description */}
                    <TextField className="flex flex-col space-y-1">
                        <Label className="text-xs text-[var(--muted)]">Descripcion (opcional)</Label>
                        <TextArea
                            placeholder="Estado de la carta, detalles de envio, notas..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className={solidInputClassName}
                        />
                    </TextField>

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            className="flex-1 font-semibold"
                            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                            onPress={handleSubmit}
                            isPending={loading}
                            isDisabled={!printingId || !price || !title.trim()}
                        >
                            Publicar venta
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
