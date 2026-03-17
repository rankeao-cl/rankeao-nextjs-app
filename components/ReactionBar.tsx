"use client";

import { Button } from "@heroui/react";
import { Comment, ArrowShapeTurnUpRight, BookmarkFill } from "@gravity-ui/icons";

export interface ReactionBarProps {
    reactions: Record<string, number>;
    userReactions: string[];
    commentCount: number;
    onReact: (type: string) => void;
    onComment: () => void;
    onShare: () => void;
    onBookmark: () => void;
}

const REACTION_CONFIG: {
    key: string;
    emoji: string;
    label: string;
    color: string;
    activeColor: string;
    activeBg: string;
}[] = [
    {
        key: "fire",
        emoji: "\u{1F525}",
        label: "Fire",
        color: "var(--muted)",
        activeColor: "#f97316",
        activeBg: "rgba(249,115,22,0.12)",
    },
    {
        key: "challenge",
        emoji: "\u2694\uFE0F",
        label: "Challenge",
        color: "var(--muted)",
        activeColor: "#ef4444",
        activeBg: "rgba(239,68,68,0.12)",
    },
    {
        key: "crown",
        emoji: "\u{1F451}",
        label: "GG",
        color: "var(--muted)",
        activeColor: "#eab308",
        activeBg: "rgba(234,179,8,0.12)",
    },
    {
        key: "rekt",
        emoji: "\u{1F480}",
        label: "Rekt",
        color: "var(--muted)",
        activeColor: "#a855f7",
        activeBg: "rgba(168,85,247,0.12)",
    },
    {
        key: "love",
        emoji: "\u2764\uFE0F",
        label: "Love",
        color: "var(--muted)",
        activeColor: "#ec4899",
        activeBg: "rgba(236,72,153,0.12)",
    },
];

export default function ReactionBar({
    reactions,
    userReactions,
    commentCount,
    onReact,
    onComment,
    onShare,
    onBookmark,
}: ReactionBarProps) {
    return (
        <div
            className="flex items-center gap-0.5 pt-2 flex-wrap"
            style={{ borderTop: "1px solid var(--separator)" }}
        >
            {/* Reaction buttons */}
            <div className="flex items-center gap-0.5 flex-1 min-w-0 flex-wrap">
                {REACTION_CONFIG.map((r) => {
                    const isActive = userReactions.includes(r.key);
                    const count = reactions[r.key] || 0;

                    return (
                        <button
                            key={r.key}
                            type="button"
                            onClick={() => onReact(r.key)}
                            title={r.label}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                            style={{
                                color: isActive ? r.activeColor : "var(--muted)",
                                background: isActive ? r.activeBg : "transparent",
                                border: "none",
                            }}
                        >
                            <span className="text-sm leading-none">{r.emoji}</span>
                            {count > 0 && <span>{count}</span>}
                        </button>
                    );
                })}
            </div>

            {/* Comment + Share + Bookmark */}
            <div className="flex items-center gap-0.5 shrink-0">
                <Button
                    variant="tertiary"
                    size="sm"
                    className="gap-1 text-[var(--muted)]"
                    onPress={onComment}
                >
                    <Comment className="size-3.5" />
                    <span className="text-xs">{commentCount || 0}</span>
                </Button>
                <Button
                    variant="tertiary"
                    size="sm"
                    className="text-[var(--muted)]"
                    onPress={onShare}
                >
                    <ArrowShapeTurnUpRight className="size-3.5" />
                </Button>
                <Button
                    variant="tertiary"
                    size="sm"
                    className="text-[var(--muted)]"
                    onPress={onBookmark}
                >
                    <BookmarkFill className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}
