"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { timeAgo } from "@/lib/utils/format";
import { useAuth } from "@/lib/hooks/use-auth";
import { usePostComments, useAddComment, useLikeComment } from "@/lib/hooks/use-social";
import { getCommentReplies } from "@/lib/api/social";
import type { PostComment } from "@/lib/api/social";

interface CommentSectionProps {
    postId: string;
    show: boolean;
}

export default function CommentSection({ postId, show }: CommentSectionProps) {
    const { status, session } = useAuth();
    const isAuth = status === "authenticated";
    const token = session?.accessToken;

    const [commentText, setCommentText] = useState("");
    const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Record<string, PostComment[]>>({});
    const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
    const inputRef = useRef<HTMLInputElement>(null);

    const addCommentMutation = useAddComment();
    const likeCommentMutation = useLikeComment();
    const commentsQuery = usePostComments(postId, show);
    const comments: PostComment[] = commentsQuery.data?.data?.comments ?? commentsQuery.data?.comments ?? [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const content = commentText.trim();
        if (!content || !isAuth) return;
        addCommentMutation.mutate(
            {
                postId,
                content,
                token,
                parentCommentId: replyingTo?.commentId,
                replyToUsername: replyingTo?.username,
            },
            {
                onSuccess: () => {
                    setCommentText("");
                    if (replyingTo) {
                        handleLoadReplies(replyingTo.commentId);
                    }
                    setReplyingTo(null);
                },
            }
        );
    };

    const handleReply = useCallback((commentId: string, username: string) => {
        setReplyingTo({ commentId, username });
        setCommentText("");
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const handleCancelReply = useCallback(() => {
        setReplyingTo(null);
        setCommentText("");
    }, []);

    const handleLoadReplies = useCallback(async (commentId: string) => {
        setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
        try {
            const res = await getCommentReplies(commentId);
            const replies: PostComment[] = (res as any)?.data?.comments ?? (res as any)?.comments ?? (res as any)?.data?.replies ?? (res as any)?.replies ?? [];
            setExpandedReplies((prev) => ({ ...prev, [commentId]: replies }));
        } catch {
            // silent
        } finally {
            setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
        }
    }, []);

    const toggleLikeComment = useCallback((commentId: string, currentlyLiked: boolean) => {
        if (!isAuth) return;
        likeCommentMutation.mutate({ commentId, like: !currentlyLiked, token });
    }, [isAuth, token, likeCommentMutation]);

    if (!show) return null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Input */}
            {isAuth && (
                <div>
                    {replyingTo && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            marginBottom: 6, fontSize: 11, color: "var(--muted)",
                        }}>
                            <span>Respondiendo a</span>
                            <span style={{ color: "var(--accent)", fontWeight: 600 }}>@{replyingTo.username}</span>
                            <button
                                type="button"
                                onClick={handleCancelReply}
                                style={{
                                    background: "none", border: "none", cursor: "pointer",
                                    color: "var(--muted)", fontSize: 14, fontWeight: 600,
                                    padding: "0 4px", lineHeight: 1,
                                }}
                            >
                                &times;
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={replyingTo ? `Responder a @${replyingTo.username}...` : "Escribe un comentario..."}
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
                </div>
            )}

            {/* Comments list */}
            {commentsQuery.isLoading ? (
                <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>Cargando...</p>
            ) : comments.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>Sin comentarios aún</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {comments.map((c) => {
                        const repliesCount = c.replies_count ?? 0;
                        const loadedReplies = expandedReplies[c.id] ?? [];
                        const isLoadingR = loadingReplies[c.id] ?? false;
                        const isLiked = c.is_liked ?? false;

                        return (
                            <div key={c.id}>
                                {/* Parent comment — Instagram style */}
                                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <CommentAvatar user={c.user} size={32} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Username + content inline */}
                                        <p style={{ margin: 0, fontSize: 13, color: "var(--foreground)", lineHeight: "18px" }}>
                                            <Link href={`/perfil/${c.user.username}`} style={{ textDecoration: "none" }}>
                                                <span style={{ fontWeight: 700, color: "var(--foreground)" }}>
                                                    {c.user.username}
                                                </span>
                                            </Link>
                                            {" "}{c.content}
                                        </p>
                                        {/* Action row: time · N Me gusta · Responder */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
                                            <span style={{ fontSize: 12, color: "var(--muted)" }}>
                                                {timeAgo(c.created_at)}
                                            </span>
                                            {(c.likes_count ?? 0) > 0 && (
                                                <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                                                    {c.likes_count} Me gusta
                                                </span>
                                            )}
                                            {isAuth && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleReply(c.id, c.user.username)}
                                                    style={{
                                                        background: "none", border: "none", padding: 0,
                                                        fontSize: 12, color: "var(--muted)", fontWeight: 600, cursor: "pointer",
                                                    }}
                                                >
                                                    Responder
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {/* Like heart — right side */}
                                    <button
                                        type="button"
                                        onClick={() => toggleLikeComment(c.id, isLiked)}
                                        style={{
                                            background: "none", border: "none", cursor: isAuth ? "pointer" : "default",
                                            padding: "4px 0 0", flexShrink: 0, display: "flex", flexDirection: "column",
                                            alignItems: "center", gap: 2, opacity: isAuth ? 1 : 0.5,
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24"
                                            fill={isLiked ? "#EF4444" : "none"}
                                            stroke={isLiked ? "#EF4444" : "var(--muted)"}
                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                        >
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Ver / Ocultar respuestas */}
                                {repliesCount > 0 && (
                                    <div style={{ marginLeft: 42, marginTop: 8 }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (loadedReplies.length > 0) {
                                                    setExpandedReplies((prev) => { const n = { ...prev }; delete n[c.id]; return n; });
                                                } else {
                                                    handleLoadReplies(c.id);
                                                }
                                            }}
                                            disabled={isLoadingR}
                                            style={{
                                                background: "none", border: "none", cursor: "pointer",
                                                fontSize: 12, fontWeight: 600, color: "var(--muted)",
                                                padding: 0, display: "flex", alignItems: "center", gap: 10,
                                                opacity: isLoadingR ? 0.5 : 1,
                                            }}
                                        >
                                            <span style={{ width: 24, height: 1, background: "var(--border)", display: "inline-block" }} />
                                            {isLoadingR
                                                ? "Cargando..."
                                                : loadedReplies.length > 0
                                                ? "Ocultar respuestas"
                                                : `Ver ${repliesCount} respuesta${repliesCount > 1 ? "s" : ""}`
                                            }
                                        </button>
                                    </div>
                                )}

                                {/* Replies */}
                                {loadedReplies.length > 0 && (
                                    <div style={{
                                        marginLeft: 42, marginTop: 10,
                                        display: "flex", flexDirection: "column", gap: 14,
                                    }}>
                                        {loadedReplies.map((r) => {
                                            const rLiked = r.is_liked ?? false;
                                            return (
                                                <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                                    <CommentAvatar user={r.user} size={24} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ margin: 0, fontSize: 13, color: "var(--foreground)", lineHeight: "18px" }}>
                                                            <Link href={`/perfil/${r.user.username}`} style={{ textDecoration: "none" }}>
                                                                <span style={{ fontWeight: 700, color: "var(--foreground)" }}>
                                                                    {r.user.username}
                                                                </span>
                                                            </Link>
                                                            {r.reply_to_username && (
                                                                <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                                                                    {" "}@{r.reply_to_username}
                                                                </span>
                                                            )}
                                                            {" "}{r.content}
                                                        </p>
                                                        {/* Reply action row */}
                                                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
                                                            <span style={{ fontSize: 12, color: "var(--muted)" }}>
                                                                {timeAgo(r.created_at)}
                                                            </span>
                                                            {(r.likes_count ?? 0) > 0 && (
                                                                <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                                                                    {r.likes_count} Me gusta
                                                                </span>
                                                            )}
                                                            {isAuth && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleReply(c.id, r.user.username)}
                                                                    style={{
                                                                        background: "none", border: "none", padding: 0,
                                                                        fontSize: 12, color: "var(--muted)", fontWeight: 600, cursor: "pointer",
                                                                    }}
                                                                >
                                                                    Responder
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Like */}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleLikeComment(r.id, rLiked)}
                                                        style={{
                                                            background: "none", border: "none", cursor: isAuth ? "pointer" : "default",
                                                            padding: "4px 0 0", flexShrink: 0, opacity: isAuth ? 1 : 0.5,
                                                        }}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24"
                                                            fill={rLiked ? "#EF4444" : "none"}
                                                            stroke={rLiked ? "#EF4444" : "var(--muted)"}
                                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                        >
                                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function CommentAvatar({ user, size }: { user: PostComment["user"]; size: number }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: size / 2, flexShrink: 0,
            background: "var(--surface)", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: Math.round(size * 0.4), fontWeight: 700, color: "var(--foreground)",
        }}>
            {user.avatar_url ? (
                <Image src={user.avatar_url} alt={user.username} width={size} height={size}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
                user.username[0]?.toUpperCase()
            )}
        </div>
    );
}
