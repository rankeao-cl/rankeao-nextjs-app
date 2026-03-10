import { Card, Chip } from "@heroui/react";
import Image from "next/image";

export interface FeedSingleCard {
    id: string;
    name: string;
    image_url?: string;
    edition?: string;
    set_name?: string;
    rarity?: string;
    condition?: string;
    estimated_price?: number;
    marketplace_price?: number;
    is_for_sale?: boolean;
}

export default function SingleCardShowcase({ card }: { card: FeedSingleCard }) {
    return (
        <Card
            className="overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
            <Card.Content className="p-0">
                {/* Sale badge */}
                {card.is_for_sale && (
                    <div
                        className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase"
                        style={{ background: "var(--success)", color: "var(--success-foreground)" }}
                    >
                        En venta
                    </div>
                )}

                {/* Card image */}
                <div className="relative aspect-[2.5/3.5] w-full max-w-[260px] mx-auto p-4">
                    {card.image_url ? (
                        <Image
                            src={card.image_url}
                            alt={card.name}
                            fill
                            className="object-contain drop-shadow-lg"
                            sizes="260px"
                        />
                    ) : (
                        <div
                            className="w-full h-full rounded-xl flex items-center justify-center text-4xl"
                            style={{ background: "var(--surface-secondary)" }}
                        >
                            🃏
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                    <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{card.name}</h3>

                    <div className="flex flex-wrap gap-1 text-xs">
                        {card.edition && <Chip variant="secondary" size="sm">{card.edition}</Chip>}
                        {card.set_name && <Chip variant="secondary" size="sm">{card.set_name}</Chip>}
                        {card.rarity && (
                            <Chip
                                variant="soft"
                                size="sm"
                                color={
                                    card.rarity === "legendary" || card.rarity === "secret"
                                        ? "warning"
                                        : card.rarity === "rare" || card.rarity === "ultra"
                                            ? "accent"
                                            : "default"
                                }
                            >
                                {card.rarity}
                            </Chip>
                        )}
                        {card.condition && (
                            <Chip variant="soft" size="sm">{card.condition}</Chip>
                        )}
                    </div>

                    {/* Price */}
                    {(card.estimated_price || card.marketplace_price) && (
                        <p className="text-lg font-extrabold" style={{ color: "var(--accent)" }}>
                            ${(card.marketplace_price || card.estimated_price)?.toLocaleString("es-CL")}
                        </p>
                    )}
                </div>
            </Card.Content>
        </Card>
    );
}
