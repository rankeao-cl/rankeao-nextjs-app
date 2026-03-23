"use client";

import Image from "next/image";
import { useState } from "react";
import { timeAgo } from "@/lib/utils/format";
import { Heart, Comment, ArrowShapeTurnUpRight, Bookmark } from "@gravity-ui/icons";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export interface FeedPost {
    id: string;
    user_id?: string;
    username?: string;
    avatar_url?: string;
    author?: { username: string; avatar_url?: string; rank_badge?: string };
    content?: string;
    text?: string;
    images?: string[];
    tags?: string[];
    game?: string;
    likes_count?: number;
    comments_count?: number;
    rank_badge?: string;
    created_at: string;
}

export default function PostCard({ post }: { post: FeedPost }) {
    const relativeTime = timeAgo(post.created_at);

    const authorUsername = post.author?.username || post.username || "Usuario";
    const authorAvatar = post.author?.avatar_url || post.avatar_url;
    const authorRankBadge = post.author?.rank_badge || post.rank_badge;
    const postText = post.text || post.content || "";

    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
    const [bookmarked, setBookmarked] = useState(false);

    const handleLike = () => {
        setLiked((prev) => {
            setLikesCount((c) => c + (prev ? -1 : 1));
            return !prev;
        });
    };

    return (
        <article
            style={{
                background: "var(--surface-solid)",
                borderRadius: 16,
                border: "1px solid var(--border)",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 12,
            }}
        >
            {/* Author header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Avatar 36px */}
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "var(--surface-solid)",
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--foreground)",
                    }}
                >
                    {authorAvatar ? (
                        <Image
                            src={authorAvatar}
                            alt={authorUsername}
                            width={36}
                            height={36}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        authorUsername[0]?.toUpperCase()
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--foreground)",
                            }}
                        >
                            {authorUsername}
                        </span>
                        {authorRankBadge && (
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: "#eab308",
                                    background: "rgba(234,179,8,0.15)",
                                    padding: "2px 6px",
                                    borderRadius: 6,
                                }}
                            >
                                {authorRankBadge}
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{relativeTime}</span>
                </div>
            </div>

            {/* Text content */}
            {postText && (
                <MarkdownRenderer content={postText} />
            )}

            {/* Tags */}
            {(post.tags || post.game) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {post.game && (
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: "#3B82F6",
                                background: "rgba(59,130,246,0.2)",
                                padding: "3px 8px",
                                borderRadius: 8,
                            }}
                        >
                            {post.game}
                        </span>
                    )}
                    {post.tags?.map((tag) => (
                        <span
                            key={tag}
                            style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: "#a855f7",
                                background: "rgba(168,85,247,0.15)",
                                padding: "3px 8px",
                                borderRadius: 8,
                            }}
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Image gallery */}
            {post.images && post.images.length > 0 && (
                post.images.length === 1 ? (
                    <div
                        style={{
                            position: "relative",
                            height: 380,
                            borderRadius: 10,
                            overflow: "hidden",
                            background: "var(--background)",
                        }}
                    >
                        <Image src={post.images[0]} alt="" fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 50vw" />
                    </div>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 4,
                            borderRadius: 10,
                            overflow: "hidden",
                        }}
                    >
                        {post.images.slice(0, 4).map((src, i) => (
                            <div
                                key={i}
                                style={{
                                    position: "relative",
                                    aspectRatio: "1 / 1",
                                    background: "var(--background)",
                                }}
                            >
                                <Image src={src} alt="" fill style={{ objectFit: "cover" }} sizes="25vw" />
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Reaction bar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 8,
                    borderTop: "1px solid var(--border)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--muted)" }}>
                    <button
                        type="button"
                        onClick={handleLike}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "none",
                            border: "none",
                            color: liked ? "#ef4444" : "var(--muted)",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "inherit",
                        }}
                    >
                        <Heart style={{ width: 18, height: 18 }} />
                        {likesCount > 0 && <span>{likesCount}</span>}
                    </button>
                    <button
                        type="button"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "none",
                            border: "none",
                            color: "var(--muted)",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "inherit",
                        }}
                    >
                        <Comment style={{ width: 18, height: 18 }} />
                        {(post.comments_count ?? 0) > 0 && <span>{post.comments_count}</span>}
                    </button>
                    <button
                        type="button"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "none",
                            border: "none",
                            color: "var(--muted)",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "inherit",
                        }}
                    >
                        <ArrowShapeTurnUpRight style={{ width: 18, height: 18 }} />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setBookmarked((b) => !b)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        background: "none",
                        border: "none",
                        color: bookmarked ? "#3B82F6" : "var(--muted)",
                        cursor: "pointer",
                        padding: 0,
                    }}
                >
                    <Bookmark style={{ width: 18, height: 18 }} />
                </button>
            </div>
        </article>
    );
}

