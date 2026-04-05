"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Button, Card, Chip, Input, Label, ListBox, Select, TextArea, TextField, toast,
} from "@heroui/react";
import { useAuth } from "@/lib/hooks/use-auth";
import { mapErrorMessage } from "@/lib/api/errors";
import { createListing } from "@/lib/api/marketplace";
import { getGames, autocompleteCards, getCardPrintings } from "@/lib/api/catalog";
import type { CatalogGame } from "@/lib/types/catalog";
import Image from "next/image";

interface CardResult {
    id: string;
    name: string;
    image_url?: string;
}

interface PrintingResult {
    id: string;
    set_name?: string;
    set_code?: string;
    rarity?: string;
    image_url?: string;
    image_url_small?: string;
    collector_number?: string;
}

const CONDITIONS = [
    { id: "NM", label: "Near Mint (NM)" },
    { id: "LP", label: "Lightly Played (LP)" },
    { id: "MP", label: "Moderately Played (MP)" },
    { id: "HP", label: "Heavily Played (HP)" },
    { id: "DMG", label: "Damaged (DMG)" },
];

export default function NewListingPage() {
    const router = useRouter();
    const { session, status } = useAuth();
    const [loading, setLoading] = useState(false);
    const [games, setGames] = useState<CatalogGame[]>([]);

    // Form state
    const [gameId, setGameId] = useState("");
    const [cardSearch, setCardSearch] = useState("");
    const [cardResults, setCardResults] = useState<CardResult[]>([]);
    const [selectedCard, setSelectedCard] = useState<CardResult | null>(null);
    const [printings, setPrintings] = useState<PrintingResult[]>([]);
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
            .catch(() => {});
    }, []);

    // Card autocomplete
    useEffect(() => {
        if (cardSearch.length < 2) {
            setCardResults([]);
            return;
        }
        const timer = setTimeout(() => {
            autocompleteCards(cardSearch, gameId || undefined)
                .then((res) => {
                    const results = res?.results ?? [];
                    if (Array.isArray(results)) setCardResults(results);
                })
                .catch(() => setCardResults([]));
        }, 300);
        return () => clearTimeout(timer);
    }, [cardSearch, gameId]);

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

    const selectCard = (card: CardResult) => {
        setSelectedCard(card);
        setCardSearch(card.name);
        setCardResults([]);
        if (!title) setTitle(card.name);
    };

    const handleSubmit = async () => {
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
        if (!session?.accessToken) return;

        setLoading(true);
        try {
            await createListing({
                printing_id: printingId,
                price: Number(price),
                card_condition: condition,
                card_language: language,
                is_foil: isFoil,
                quantity: Number(quantity) || 1,
                description: description.trim() || undefined,
            });
            toast.success("Publicacion creada exitosamente");
            router.push("/marketplace");
        } catch (err: unknown) {
            toast.danger(mapErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
            <div>
                <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">Marketplace</Chip>
                <h1 className="text-2xl font-bold text-[var(--foreground)]">Vender Carta</h1>
                <p className="text-sm text-[var(--muted)] mt-1">Publica tu carta en el marketplace para que otros jugadores la encuentren.</p>
            </div>

            <Card className="surface-card rounded-2xl overflow-hidden">
                <Card.Content className="p-5 space-y-4">
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
                        <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox>
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
                        <TextField className="space-y-1 flex flex-col">
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
                            />
                        </TextField>
                        {cardResults.length > 0 && (
                            <div className="border border-[var(--border)] rounded-lg bg-[var(--surface)] max-h-48 overflow-y-auto">
                                {cardResults.map((card) => (
                                    <button
                                        key={card.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer flex items-center gap-2"
                                        onClick={() => selectCard(card)}
                                    >
                                        {card.image_url && (
                                            <Image src={card.image_url} alt="" width={24} height={32} className="object-cover rounded" />
                                        )}
                                        <span className="text-[var(--foreground)]">{card.name}</span>
                                    </button>
                                ))}
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
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
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
                    <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Titulo de la publicacion</Label>
                        <Input
                            placeholder="ej: Charizard ex NM - Paldean Fates"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </TextField>

                    {/* Price & Condition */}
                    <div className="grid grid-cols-2 gap-3">
                        <TextField className="space-y-1 flex flex-col">
                            <Label className="text-xs text-[var(--muted)]">Precio (CLP)</Label>
                            <Input
                                type="number"
                                placeholder="5000"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                min={100}
                            />
                        </TextField>

                        <Select
                            selectedKey={condition}
                            onSelectionChange={(key) => setCondition(String(key || "NM"))}
                        >
                            <Label>Condicion</Label>
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
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
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
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

                        <TextField className="space-y-1 flex flex-col">
                            <Label className="text-xs text-[var(--muted)]">Cantidad</Label>
                            <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                min={1}
                                max={99}
                            />
                        </TextField>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-2 gap-3">
                        <TextField className="space-y-1 flex flex-col">
                            <Label className="text-xs text-[var(--muted)]">Ciudad</Label>
                            <Input
                                placeholder="Santiago"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </TextField>
                        <TextField className="space-y-1 flex flex-col">
                            <Label className="text-xs text-[var(--muted)]">Region</Label>
                            <Input
                                placeholder="Metropolitana"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                            />
                        </TextField>
                    </div>

                    {/* Description */}
                    <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Descripcion (opcional)</Label>
                        <TextArea
                            placeholder="Estado de la carta, detalles de envio, notas..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
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
                        <Button type="button" variant="tertiary" onPress={() => router.back()}>
                            Cancelar
                        </Button>
                    </div>
                </Card.Content>
            </Card>
        </div>
    );
}
