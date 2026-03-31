"use client";

import { Card, Chip, Avatar } from "@heroui/react";
import Image from "next/image";
import ReactionBar from "@/features/social/ReactionBar";
import { useState } from "react";

export interface FeedCardShowcase {
    id: string;
    author: { username: string; avatar_url?: string; rank_badge?: string };
    card_name: string;
    edition?: string;
    set?: string;
    rarity?: string;
    condition: "mint" | "NM" | "played" | "damaged";
    image_url: string;
    estimated_price?: number;
    for_sale?: boolean;
    sale_price?: number;
    reactions?: Record<string, number>;
    user_reactions?: string[];
    comments_count?: number;
    created_at: string;
}

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
    mint: { label: "Mint", color: "var(--success)" },
    NM: { label: "Near Mint", color: "var(--accent)" },
    played: { label: "Played", color: "var(--warning)" },
    damaged: { label: "Damaged", color: "var(--danger)" },
};

export default function CardShowcaseCard({
    card,
}: {
    card: FeedCardShowcase;
}) {
    const [reactions, setReactions] = useState<Record<string, number>>(
        card.reactions ?? {}
    );
    const [userReactions, setUserReactions] = useState<string[]>(
        card.user_reactions ?? []
    );

    const handleReact = (type: string) => {
        setUserReactions((prev) => {
            const already = prev.includes(type);
            setReactions((r) => ({
                ...r,
                [type]: Math.max(0, (r[type] || 0) + (already ? -1 : 1)),
            }));
            return already ? prev.filter((t) => t !== type) : [...prev, type];
        });
    };

    const condInfo = CONDITION_LABELS[card.condition] ?? {
        label: card.condition,
        color: "var(--muted)",
    };

    return (
        <Card className="surface-card rounded-[22px] overflow-hidden">
            <Card.Content className="p-4 space-y-3">
                {/* Author header */}
                <div className="flex items-center gap-3">
                    <Avatar size="sm">
                        {card.author.avatar_url ? (
                            <Avatar.Image
                                alt={card.author.username}
                                src={card.author.avatar_url}
                            />
                        ) : null}
                        <Avatar.Fallback>
                            {card.author.username[0]?.toUpperCase()}
                        </Avatar.Fallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span
                                className="text-sm font-semibold"
                                style={{ color: "var(--foreground)" }}
                            >
                                {card.author.username}
                            </span>
                            {card.author.rank_badge && (
                                <Chip size="sm" variant="soft" color="accent">
                                    {card.author.rank_badge}
                                </Chip>
                            )}
                        </div>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                            mostró una carta
                        </span>
                    </div>
                </div>

                {/* Card image */}
                <div
                    className="relative w-full aspect-[2.5/3.5] rounded-xl overflow-hidden border"
                    style={{
                        background: "var(--surface-secondary)",
                        borderColor: "var(--border)",
                    }}
                >
                    <Image
                        src={card.image_url}
                        alt={card.card_name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 400px"
                    />
                    {/* Sale badge overlay */}
                    {card.for_sale && (
                        <div className="absolute top-2 right-2">
                            <Chip
                                size="sm"
                                variant="primary"
                                className="font-bold shadow-lg"
                                style={{
                                    background: "var(--accent)",
                                    color: "var(--accent-foreground)",
                                }}
                            >
                                En venta{" "}
                                {card.sale_price != null &&
                                    `$${card.sale_price.toLocaleString("es-CL")}`}
                            </Chip>
                        </div>
                    )}
                </div>

                {/* Card info */}
                <div className="space-y-1.5">
                    <h3 className="font-bold" style={{ color: "var(--foreground)" }}>
                        {card.card_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {card.edition && (
                            <Chip variant="secondary" size="sm">
                                {card.edition}
                            </Chip>
                        )}
                        {card.set && (
                            <Chip variant="secondary" size="sm">
                                {card.set}
                            </Chip>
                        )}
                        {card.rarity && (
                            <Chip variant="soft" size="sm">
                                {card.rarity}
                            </Chip>
                        )}
                    </div>
                </div>

                {/* Condition + price */}
                <div className="flex items-center gap-2">
                    <Chip
                        size="sm"
                        variant="soft"
                        style={{ color: condInfo.color }}
                    >
                        {condInfo.label}
                    </Chip>
                    {card.estimated_price != null && !card.for_sale && (
                        <span
                            className="text-xs font-medium"
                            style={{ color: "var(--muted)" }}
                        >
                            ~${card.estimated_price.toLocaleString("es-CL")}
                        </span>
                    )}
                </div>

                {/* Reaction bar */}
                <ReactionBar
                    reactions={reactions}
                    userReactions={userReactions}
                    commentCount={card.comments_count || 0}
                    onReact={handleReact}
                    onComment={() => {}}
                    onShare={() => {}}
                    onBookmark={() => {}}
                />
            </Card.Content>
        </Card>
    );
}
