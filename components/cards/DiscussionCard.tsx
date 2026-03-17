"use client";

import { Card, Chip, Avatar } from "@heroui/react";
import ReactionBar from "@/components/ReactionBar";
import { useState } from "react";

export interface FeedDiscussion {
    id: string;
    author: { username: string; avatar_url?: string; rank_badge?: string };
    title: string;
    category: string;
    preview_text: string;
    reply_count: number;
    participant_count: number;
    last_reply?: {
        author: { username: string; avatar_url?: string };
        text: string;
    };
    reactions?: Record<string, number>;
    user_reactions?: string[];
    comments_count?: number;
    created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
    Meta: "#3b82f6",
    Estrategia: "#22c55e",
    Reglas: "#f59e0b",
    "Off-topic": "#a855f7",
};

export default function DiscussionCard({
    discussion,
}: {
    discussion: FeedDiscussion;
}) {
    const [reactions, setReactions] = useState<Record<string, number>>(
        discussion.reactions ?? {}
    );
    const [userReactions, setUserReactions] = useState<string[]>(
        discussion.user_reactions ?? []
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

    const catColor = CATEGORY_COLORS[discussion.category] ?? "var(--accent)";

    return (
        <Card className="surface-card rounded-[22px] overflow-hidden">
            <Card.Content className="p-4 space-y-3">
                {/* Author header */}
                <div className="flex items-center gap-3">
                    <Avatar size="sm">
                        {discussion.author.avatar_url ? (
                            <Avatar.Image
                                alt={discussion.author.username}
                                src={discussion.author.avatar_url}
                            />
                        ) : null}
                        <Avatar.Fallback>
                            {discussion.author.username[0]?.toUpperCase()}
                        </Avatar.Fallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span
                                className="text-sm font-semibold"
                                style={{ color: "var(--foreground)" }}
                            >
                                {discussion.author.username}
                            </span>
                            {discussion.author.rank_badge && (
                                <Chip size="sm" variant="soft" color="accent">
                                    {discussion.author.rank_badge}
                                </Chip>
                            )}
                        </div>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                            inició una discusión
                        </span>
                    </div>
                </div>

                {/* Title + category */}
                <div className="space-y-1.5">
                    <h3 className="font-bold" style={{ color: "var(--foreground)" }}>
                        {discussion.title}
                    </h3>
                    <Chip
                        size="sm"
                        variant="soft"
                        style={{ color: catColor }}
                    >
                        {discussion.category}
                    </Chip>
                </div>

                {/* Preview text */}
                <p
                    className="text-sm leading-relaxed line-clamp-3"
                    style={{ color: "var(--foreground)" }}
                >
                    {discussion.preview_text}
                </p>

                {/* Reply + participant stats */}
                <div
                    className="flex items-center gap-3 text-xs"
                    style={{ color: "var(--muted)" }}
                >
                    <span>{discussion.reply_count} respuestas</span>
                    <span>{discussion.participant_count} participantes</span>
                </div>

                {/* Last reply preview */}
                {discussion.last_reply && (
                    <div
                        className="flex items-start gap-2 p-2.5 rounded-lg"
                        style={{ background: "var(--surface-secondary)" }}
                    >
                        <Avatar size="sm">
                            {discussion.last_reply.author.avatar_url ? (
                                <Avatar.Image
                                    alt={discussion.last_reply.author.username}
                                    src={discussion.last_reply.author.avatar_url}
                                />
                            ) : null}
                            <Avatar.Fallback>
                                {discussion.last_reply.author.username[0]?.toUpperCase()}
                            </Avatar.Fallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <span
                                className="text-xs font-semibold"
                                style={{ color: "var(--foreground)" }}
                            >
                                {discussion.last_reply.author.username}
                            </span>
                            <p
                                className="text-xs line-clamp-2 mt-0.5"
                                style={{ color: "var(--muted)" }}
                            >
                                {discussion.last_reply.text}
                            </p>
                        </div>
                    </div>
                )}

                {/* Reaction bar */}
                <ReactionBar
                    reactions={reactions}
                    userReactions={userReactions}
                    commentCount={discussion.comments_count || discussion.reply_count}
                    onReact={handleReact}
                    onComment={() => {}}
                    onShare={() => {}}
                    onBookmark={() => {}}
                />
            </Card.Content>
        </Card>
    );
}
