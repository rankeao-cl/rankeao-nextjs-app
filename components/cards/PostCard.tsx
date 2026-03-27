"use client";

import Image from "next/image";
import Link from "next/link";
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
            className="feed-card-hover"
            style={{
                background: "var(--surface-solid)",
                borderRadius: 16,
                border: "1px solid var(--border)",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "box-shadow 0.25s, border-color 0.25s",
            }}
        >
            {/* Author header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Avatar with accent ring */}
                <Link href={`/perfil/${authorUsername}`} style={{ flexShrink: 0, textDecoration: "none" }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 20,
                        background: "var(--accent)",
                        padding: 2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: "var(--background)",
                            overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, fontWeight: 700, color: "var(--foreground)",
                        }}>
                            {authorAvatar ? (
                                <Image src={authorAvatar} alt={authorUsername} width={36} height={36}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                authorUsername[0]?.toUpperCase()
                            )}
                        </div>
                    </div>
                </Link>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Link href={`/perfil/${authorUsername}`} style={{ textDecoration: "none" }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                                {authorUsername}
                            </span>
                        </Link>
                        {authorRankBadge && (
                            <span style={{
                                fontSize: 10, fontWeight: 600, color: "var(--yellow)",
                                background: "rgba(234,179,8,0.15)",
                                padding: "2px 6px", borderRadius: 6,
                            }}>
                                {authorRankBadge}
                            </span>
                        )}
                        {post.game && (
                            <span style={{
                                fontSize: 10, fontWeight: 600, color: "var(--accent)",
                                background: "rgba(59,130,246,0.12)",
                                padding: "2px 6px", borderRadius: 6,
                            }}>
                                {post.game}
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{relativeTime}</span>
                </div>
            </div>

            {/* Text content */}
            {postText && (
                <div style={{ fontSize: 14, lineHeight: "21px" }}>
                    <MarkdownRenderer content={postText} />
                </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {post.tags.map((tag) => (
                        <span
                            key={tag}
                            style={{
                                fontSize: 12, fontWeight: 500,
                                color: "var(--accent)",
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
                    <div style={{
                        position: "relative", height: 380, borderRadius: 12,
                        overflow: "hidden", background: "var(--background)",
                    }}>
                        <Image src={post.images[0]} alt="" fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 50vw" />
                    </div>
                ) : (
                    <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: 4, borderRadius: 12, overflow: "hidden",
                    }}>
                        {post.images.slice(0, 4).map((src, i) => (
                            <div key={i} style={{ position: "relative", aspectRatio: "1 / 1", background: "var(--background)" }}>
                                <Image src={src} alt="" fill style={{ objectFit: "cover" }} sizes="25vw" />
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Reaction bar */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingTop: 8, borderTop: "1px solid var(--border)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {/* Like */}
                    <button type="button" onClick={handleLike} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "none", border: "none", cursor: "pointer",
                        color: liked ? "#EF4444" : "var(--muted)",
                        padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                        transition: "transform 0.15s",
                        transform: liked ? "scale(1.05)" : "scale(1)",
                    }}>
                        <Heart style={{ width: 18, height: 18 }} />
                        <span>{likesCount}</span>
                    </button>

                    {/* Comment */}
                    <button type="button" style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--muted)",
                        padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                    }}>
                        <Comment style={{ width: 18, height: 18 }} />
                        <span>{post.comments_count ?? 0}</span>
                    </button>

                    {/* Share */}
                    <button type="button" style={{
                        display: "flex", alignItems: "center",
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--muted)",
                        padding: "4px 8px", borderRadius: 999,
                    }}>
                        <ArrowShapeTurnUpRight style={{ width: 18, height: 18 }} />
                    </button>
                </div>

                {/* Bookmark */}
                <button type="button" onClick={() => setBookmarked((b) => !b)} style={{
                    display: "flex", alignItems: "center",
                    background: "none", border: "none", cursor: "pointer",
                    color: bookmarked ? "var(--accent)" : "var(--muted)",
                    padding: "4px 8px", borderRadius: 999,
                    transition: "color 0.15s",
                }}>
                    <Bookmark style={{ width: 18, height: 18 }} />
                </button>
            </div>
        </article>
    );
}
