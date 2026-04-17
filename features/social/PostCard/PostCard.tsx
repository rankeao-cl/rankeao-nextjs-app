"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useState, useEffect } from "react";
import { timeAgo } from "@/lib/utils/format";
import { Heart, Comment, ArrowShapeTurnUpRight } from "@gravity-ui/icons";
import MarkdownRenderer from "@/features/social/MarkdownRenderer";
import CommentSection from "@/features/social/CommentSection";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLikePost } from "@/lib/hooks/use-social";
import { toast } from "@heroui/react/toast";

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
    comments_count?: number;
    rank_badge?: string;
    created_at: string;
}

function PostCard({ post }: { post: FeedPost }) {
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
    const [showComments, setShowComments] = useState(false);

    const likeMutation = useLikePost();

    // Sync server state into local state when the feed refreshes (e.g. after stale cache expires).
    // Skip sync while a mutation is in flight to avoid overriding optimistic updates.
    useEffect(() => {
        if (!likeMutation.isPending) {
            setLiked(post.is_liked ?? false);
            setLikesCount(post.likes_count ?? 0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [post.is_liked, post.likes_count]);
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

    const handleShare = () => {
        const url = `https://rankeao.cl/feed`;
        if (navigator.share) {
            navigator.share({ title: postText.slice(0, 60), url }).catch((error: unknown) => {
                console.warn("No se pudo compartir post", error);
            });
        } else {
            navigator.clipboard.writeText(url)
                .then(() => toast.success("Enlace copiado"))
                .catch((error: unknown) => {
                    console.warn("No se pudo copiar enlace del post", error);
                });
        }
    };

    return (
        <article
            className="feed-card-hover bg-surface-solid rounded-2xl border border-border p-[14px] flex flex-col gap-3 transition-[box-shadow,border-color] duration-[0.25s]"
        >
            {/* Author header */}
            <div className="flex items-center gap-2.5">
                {/* Avatar with accent ring */}
                <Link href={`/perfil/${authorUsername}`} className="shrink-0 no-underline">
                    <div className="w-10 h-10 rounded-full bg-accent p-0.5 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-background overflow-hidden flex items-center justify-center text-sm font-bold text-foreground">
                            {authorAvatar ? (
                                <Image src={authorAvatar} alt={authorUsername} width={36} height={36}
                                    className="w-full h-full object-cover" />
                            ) : (
                                authorUsername[0]?.toUpperCase()
                            )}
                        </div>
                    </div>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <Link href={`/perfil/${authorUsername}`} className="no-underline">
                            <span className="text-sm font-bold text-foreground">
                                {authorUsername}
                            </span>
                        </Link>
                        {authorRankBadge && (
                            <span className="text-[10px] font-semibold text-yellow rounded-[6px] px-1.5 py-0.5"
                                style={{ background: "rgba(234,179,8,0.15)" }}>
                                {authorRankBadge}
                            </span>
                        )}
                        {post.game && (
                            <span className="text-[10px] font-semibold text-accent rounded-[6px] px-1.5 py-0.5"
                                style={{ background: "rgba(59,130,246,0.12)" }}>
                                {post.game}
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] text-muted">{relativeTime}</span>
                </div>
            </div>

            {/* Text content */}
            {postText && (
                <div className="text-sm leading-[21px]">
                    <MarkdownRenderer content={postText} />
                </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                        <span
                            key={tag}
                            className="text-xs font-medium text-accent"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Image gallery */}
            {post.images && post.images.length > 0 && (
                post.images.length === 1 ? (
                    <div className="relative h-[380px] rounded-xl overflow-hidden bg-background">
                        <Image src={post.images[0]} alt={`Imagen publicada por ${post.author?.username || "usuario"}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
                        {post.images.slice(0, 4).map((src, i) => (
                            <div key={i} className="relative aspect-square bg-background">
                                <Image src={src} alt={`Imagen ${i + 1} publicada por ${post.author?.username || "usuario"}`} fill className="object-cover" sizes="25vw" />
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Reaction bar */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-1">
                    {/* Like */}
                    <button type="button" onClick={handleLike} aria-label={liked ? `Quitar Me gusta, ${likesCount}` : `Me gusta, ${likesCount}`} aria-pressed={liked}
                        className={`flex items-center gap-[5px] bg-transparent border-none px-2 py-1 rounded-full text-xs font-semibold transition-transform duration-150 ${isAuth ? "cursor-pointer" : "cursor-default"}`}
                        style={{
                            color: liked ? "#EF4444" : "var(--muted)",
                            transform: liked ? "scale(1.05)" : "scale(1)",
                            opacity: likeMutation.isPending ? 0.6 : 1,
                        }}>
                        <Heart style={{ width: 18, height: 18 }} />
                        <span>{likesCount}</span>
                    </button>

                    {/* Comment */}
                    <button type="button" onClick={() => setShowComments((v) => !v)} aria-label={`Comentarios, ${post.comments_count ?? 0}`} aria-expanded={showComments}
                        className="flex items-center gap-[5px] bg-transparent border-none cursor-pointer px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                            color: showComments ? "var(--accent)" : "var(--muted)",
                        }}>
                        <Comment style={{ width: 18, height: 18 }} />
                        <span>{post.comments_count ?? 0}</span>
                    </button>

                    {/* Share */}
                    <button type="button" onClick={handleShare} aria-label="Compartir"
                        className="flex items-center bg-transparent border-none cursor-pointer px-2 py-1 rounded-full text-muted">
                        <ArrowShapeTurnUpRight style={{ width: 18, height: 18 }} />
                    </button>
                </div>
            </div>

            {/* Comments section */}
            <CommentSection postId={post.id} show={showComments} />
        </article>
    );
}

export default memo(PostCard);
