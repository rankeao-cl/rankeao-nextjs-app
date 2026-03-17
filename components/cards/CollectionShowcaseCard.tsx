"use client";

import { Card, Chip, Avatar } from "@heroui/react";
import Image from "next/image";
import ReactionBar from "@/components/ReactionBar";
import { useState } from "react";

export interface FeedCollectionShowcase {
    id: string;
    author: { username: string; avatar_url?: string; rank_badge?: string };
    title: string;
    thumbnails: string[];
    card_count: number;
    conditions?: Record<string, number>;
    estimated_value?: number;
    reactions?: Record<string, number>;
    user_reactions?: string[];
    comments_count?: number;
    created_at: string;
}

const CONDITION_COLORS: Record<string, string> = {
    mint: "#22c55e",
    NM: "#3b82f6",
    played: "#f59e0b",
    damaged: "#ef4444",
};

export default function CollectionShowcaseCard({
    collection,
}: {
    collection: FeedCollectionShowcase;
}) {
    const [reactions, setReactions] = useState<Record<string, number>>(
        collection.reactions ?? {}
    );
    const [userReactions, setUserReactions] = useState<string[]>(
        collection.user_reactions ?? []
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

    return (
        <Card className="surface-card rounded-[22px] overflow-hidden">
            <Card.Content className="p-4 space-y-3">
                {/* Author header */}
                <div className="flex items-center gap-3">
                    <Avatar size="sm">
                        {collection.author.avatar_url ? (
                            <Avatar.Image
                                alt={collection.author.username}
                                src={collection.author.avatar_url}
                            />
                        ) : null}
                        <Avatar.Fallback>
                            {collection.author.username[0]?.toUpperCase()}
                        </Avatar.Fallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span
                                className="text-sm font-semibold"
                                style={{ color: "var(--foreground)" }}
                            >
                                {collection.author.username}
                            </span>
                            {collection.author.rank_badge && (
                                <Chip size="sm" variant="soft" color="accent">
                                    {collection.author.rank_badge}
                                </Chip>
                            )}
                        </div>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                            compartió una colección
                        </span>
                    </div>
                </div>

                {/* Collection title */}
                <h3 className="font-bold" style={{ color: "var(--foreground)" }}>
                    {collection.title}
                </h3>

                {/* Thumbnail grid */}
                {collection.thumbnails.length > 0 && (
                    <div className="grid grid-cols-4 gap-1.5 rounded-lg overflow-hidden">
                        {collection.thumbnails.slice(0, 4).map((src, i) => (
                            <div
                                key={i}
                                className="relative aspect-[2.5/3.5] rounded-md overflow-hidden border"
                                style={{
                                    background: "var(--surface-secondary)",
                                    borderColor: "var(--border)",
                                }}
                            >
                                <Image
                                    src={src}
                                    alt={`Carta ${i + 1} de ${collection.title}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 25vw, 120px"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats row */}
                <div
                    className="flex items-center gap-3 text-xs"
                    style={{ color: "var(--muted)" }}
                >
                    <span>{collection.card_count} cartas</span>
                    {collection.estimated_value != null && (
                        <span
                            className="font-semibold"
                            style={{ color: "var(--accent)" }}
                        >
                            ~${collection.estimated_value.toLocaleString("es-CL")}
                        </span>
                    )}
                </div>

                {/* Condition badges */}
                {collection.conditions &&
                    Object.keys(collection.conditions).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {Object.entries(collection.conditions).map(
                                ([cond, count]) => (
                                    <Chip
                                        key={cond}
                                        variant="soft"
                                        size="sm"
                                        style={{
                                            color:
                                                CONDITION_COLORS[cond] ??
                                                "var(--muted)",
                                            borderColor:
                                                CONDITION_COLORS[cond] ??
                                                "var(--border)",
                                        }}
                                    >
                                        {cond}: {count}
                                    </Chip>
                                )
                            )}
                        </div>
                    )}

                {/* Reaction bar */}
                <ReactionBar
                    reactions={reactions}
                    userReactions={userReactions}
                    commentCount={collection.comments_count || 0}
                    onReact={handleReact}
                    onComment={() => {}}
                    onShare={() => {}}
                    onBookmark={() => {}}
                />
            </Card.Content>
        </Card>
    );
}
