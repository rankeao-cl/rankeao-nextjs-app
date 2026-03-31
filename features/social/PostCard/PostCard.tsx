"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { timeAgo } from "@/lib/utils/format";
import { Heart, Flame, Comment, ArrowShapeTurnUpRight, Bookmark } from "@gravity-ui/icons";
import MarkdownRenderer from "@/features/social/MarkdownRenderer";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLikePost, useFirePost, usePostComments, useAddComment } from "@/lib/hooks/use-social";
import type { PostComment } from "@/lib/api/social";

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
    is_liked?: boolean;
    fires_count?: number;
    is_fired?: boolean;
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

    const { status, session } = useAuth();
    const isAuth = status === "authenticated";
    const accessToken = session?.accessToken;

    const [liked, setLiked] = useState(post.is_liked ?? false);
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
    const [fired, setFired] = useState(post.is_fired ?? false);
    const [firesCount, setFiresCount] = useState(post.fires_count ?? 0);
    const [bookmarked, setBookmarked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");

    const likeMutation = useLikePost();
    const fireMutation = useFirePost();

    // Sync server state into local state when the feed refreshes (e.g. after stale cache expires).
    // Skip sync while a mutation is in flight to avoid overriding optimistic updates.
    useEffect(() => {
        if (!likeMutation.isPending) {
            setLiked(post.is_liked ?? false);
            setLikesCount(post.likes_count ?? 0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [post.is_liked, post.likes_count]);

    useEffect(() => {
        if (!fireMutation.isPending) {
            setFired(post.is_fired ?? false);
            setFiresCount(post.fires_count ?? 0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [post.is_fired, post.fires_count]);
    const addCommentMutation = useAddComment();
    const commentsQuery = usePostComments(post.id, showComments);

    const handleLike = () => {
        if (!isAuth) return;
        const wasLiked = liked;
        // Optimistic update
        setLiked(!wasLiked);
        setLikesCount((c) => c + (wasLiked ? -1 : 1));
        likeMutation.mutate(
            { postId: post.id, like: !wasLiked, token: accessToken },
            {
                onSuccess: (data) => {
                    // Sync with server count if available
                    if (data?.likes_count != null) setLikesCount(data.likes_count);
                },
                onError: () => {
                    // Revert on error
                    setLiked(wasLiked);
                    setLikesCount((c) => c + (wasLiked ? 1 : -1));
                },
            }
        );
    };

    const handleFire = () => {
        if (!isAuth) return;
        const wasFired = fired;
        setFired(!wasFired);
        setFiresCount((c) => c + (wasFired ? -1 : 1));
        fireMutation.mutate(
            { postId: post.id, fire: !wasFired, token: accessToken },
            {
                onSuccess: (data) => {
                    if (data?.fires_count != null) setFiresCount(data.fires_count);
                },
                onError: () => {
                    setFired(wasFired);
                    setFiresCount((c) => c + (wasFired ? 1 : -1));
                },
            }
        );
    };

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        const content = commentText.trim();
        if (!content || !isAuth) return;
        addCommentMutation.mutate(
            { postId: post.id, content, token: accessToken },
            {
                onSuccess: () => setCommentText(""),
            }
        );
    };

    const comments: PostComment[] = commentsQuery.data?.data?.comments ?? commentsQuery.data?.comments ?? [];

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
                        background: "none", border: "none", cursor: isAuth ? "pointer" : "default",
                        color: liked ? "#EF4444" : "var(--muted)",
                        padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                        transition: "transform 0.15s",
                        transform: liked ? "scale(1.05)" : "scale(1)",
                        opacity: likeMutation.isPending ? 0.6 : 1,
                    }}>
                        <Heart style={{ width: 18, height: 18 }} />
                        <span>{likesCount}</span>
                    </button>

                    {/* Fire reaction */}
                    <button type="button" onClick={handleFire} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: fired ? "rgba(249,115,22,0.12)" : "none",
                        border: "none", cursor: isAuth ? "pointer" : "default",
                        color: fired ? "#F97316" : "var(--muted)",
                        padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                        transition: "transform 0.15s, background 0.15s",
                        transform: fired ? "scale(1.05)" : "scale(1)",
                        opacity: fireMutation.isPending ? 0.6 : 1,
                    }}>
                        <Flame style={{ width: 18, height: 18 }} />
                        <span>{firesCount}</span>
                    </button>

                    {/* Comment */}
                    <button type="button" onClick={() => setShowComments((v) => !v)} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "none", border: "none", cursor: "pointer",
                        color: showComments ? "var(--accent)" : "var(--muted)",
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

            {/* Comments section */}
            {showComments && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Comment input */}
                    {isAuth && (
                        <form onSubmit={handleSubmitComment} style={{ display: "flex", gap: 8 }}>
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Escribe un comentario..."
                                maxLength={500}
                                style={{
                                    flex: 1, fontSize: 13, padding: "6px 12px",
                                    borderRadius: 999, border: "1px solid var(--border)",
                                    background: "var(--surface)", color: "var(--foreground)",
                                    outline: "none",
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim() || addCommentMutation.isPending}
                                style={{
                                    padding: "6px 14px", borderRadius: 999, border: "none",
                                    background: "var(--accent)", color: "#fff",
                                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                                    opacity: !commentText.trim() || addCommentMutation.isPending ? 0.5 : 1,
                                }}
                            >
                                {addCommentMutation.isPending ? "..." : "Enviar"}
                            </button>
                        </form>
                    )}

                    {/* Comments list */}
                    {commentsQuery.isLoading ? (
                        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>Cargando...</p>
                    ) : comments.length === 0 ? (
                        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>Sin comentarios aún</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {comments.map((c) => (
                                <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 14, flexShrink: 0,
                                        background: "var(--accent)", overflow: "hidden",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 700, color: "#fff",
                                    }}>
                                        {c.user.avatar_url ? (
                                            <Image src={c.user.avatar_url} alt={c.user.username} width={28} height={28}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            c.user.username[0]?.toUpperCase()
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <Link href={`/perfil/${c.user.username}`} style={{ textDecoration: "none" }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>
                                                    {c.user.username}
                                                </span>
                                            </Link>
                                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{timeAgo(c.created_at)}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 13, color: "var(--foreground)", lineHeight: "18px" }}>
                                            {c.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}
