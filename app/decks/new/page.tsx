"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip, Input, Label, ListBox, Select, TextArea, TextField, toast } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { apiPost } from "@/lib/api/client";
import { getGames } from "@/lib/api/catalog";
import type { CatalogGame } from "@/lib/types/catalog";

export default function NewDeckPage() {
    const router = useRouter();
    const { session, status } = useAuth();
    const [loading, setLoading] = useState(false);
    const [games, setGames] = useState<CatalogGame[]>([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [gameId, setGameId] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [deckList, setDeckList] = useState("");

    useEffect(() => {
        getGames()
            .then((res) => {
                const list = res?.data ?? res?.games ?? [];
                if (Array.isArray(list)) setGames(list);
            })
            .catch(() => {});
    }, []);

    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.danger("El nombre del mazo es requerido");
            return;
        }
        if (!gameId) {
            toast.danger("Selecciona un juego");
            return;
        }
        if (!session?.accessToken) return;

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
            router.push("/");
        } catch {
            toast.danger("No se pudo publicar. Esta funcion estara disponible pronto.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
            <div>
                <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">Deckbuilder</Chip>
                <h1 className="text-2xl font-bold text-[var(--foreground)]">Publicar Mazo</h1>
                <p className="text-sm text-[var(--muted)] mt-1">Comparte tu deck con la comunidad.</p>
            </div>

            <Card className="surface-card rounded-2xl overflow-hidden">
                <Card.Content className="p-5 space-y-4">
                    <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Nombre del mazo</Label>
                        <Input
                            placeholder="ej: Charizard ex Aggro"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </TextField>

                    <Select
                        selectedKey={gameId}
                        onSelectionChange={(key) => setGameId(String(key || ""))}
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

                    <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Descripcion (opcional)</Label>
                        <TextArea
                            placeholder="Estrategia, matchups, notas..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </TextField>

                    <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Lista de cartas</Label>
                        <TextArea
                            placeholder={"4 Lightning Bolt\n4 Counterspell\n2 Charizard ex\n..."}
                            value={deckList}
                            onChange={(e) => setDeckList(e.target.value)}
                            rows={8}
                            className="font-mono text-xs"
                        />
                        <p className="text-[11px] text-[var(--muted)] mt-1">Formato: cantidad + nombre. Una carta por linea.</p>
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
                        <Button type="button" variant="tertiary" onPress={() => router.back()}>
                            Cancelar
                        </Button>
                    </div>
                </Card.Content>
            </Card>
        </div>
    );
}
