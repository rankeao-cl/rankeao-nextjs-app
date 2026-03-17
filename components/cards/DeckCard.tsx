import { Card, Chip, Avatar, Button } from "@heroui/react";
import { Copy, BookmarkFill } from "@gravity-ui/icons";
import Image from "next/image";

export interface FeedDeck {
    id: string;
    author: { username: string; avatar_url?: string; rank_badge?: string };
    deck_name: string;
    game: string;
    format: string;
    card_count: number;
    preview_images?: string[];
    created_at: string;
}

export default function DeckCard({ deck }: { deck: FeedDeck }) {
    return (
        <Card className="surface-card rounded-[22px] overflow-hidden">
            <Card.Content className="p-4 space-y-3">
                {/* Author */}
                <div className="flex items-center gap-3">
                    <Avatar size="sm">
                        <Avatar.Fallback>{deck.author.username[0]?.toUpperCase()}</Avatar.Fallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                {deck.author.username}
                            </span>
                            {deck.author.rank_badge && (
                                <Chip size="sm" variant="soft" color="accent">{deck.author.rank_badge}</Chip>
                            )}
                        </div>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>publicó un mazo</span>
                    </div>
                </div>

                {/* Deck name + game/format */}
                <div>
                    <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{deck.deck_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Chip variant="secondary" size="sm">{deck.game}</Chip>
                        <Chip variant="secondary" size="sm">{deck.format}</Chip>
                        <span className="text-xs ml-1" style={{ color: "var(--muted)" }}>
                            {deck.card_count} cartas
                        </span>
                    </div>
                </div>

                {/* Card previews */}
                {deck.preview_images && deck.preview_images.length > 0 && (
                    <div className="flex gap-1.5 overflow-hidden">
                        {deck.preview_images.slice(0, 4).map((src, i) => (
                            <div
                                key={i}
                                className="relative w-16 h-22 rounded-md overflow-hidden border shrink-0"
                                style={{
                                    background: "var(--surface-secondary)",
                                    borderColor: "var(--border)",
                                }}
                            >
                                <Image src={src} alt={`Carta extraída de mazo ${deck.deck_name}`} fill className="object-cover" sizes="(max-width: 768px) 64px, 64px" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1" style={{ borderTop: "1px solid var(--separator)" }}>
                    <Button variant="tertiary" size="sm" className="gap-1.5 text-[var(--muted)]">
                        <Copy className="size-3.5" /> Copiar mazo
                    </Button>
                    <Button variant="tertiary" size="sm" className="gap-1.5 text-[var(--muted)]">
                        <BookmarkFill className="size-3.5" /> Guardar
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="ml-auto font-medium"
                    >
                        Ver completo
                    </Button>
                </div>
            </Card.Content>
        </Card>
    );
}
