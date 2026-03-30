"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
    Cup,
    ChartColumn,
    StarFill,
    Person,
    Shield,
    SquareDashed,
    ArrowUp,
    ChevronRight,
    CircleInfo,
    Comment,
    Flame,
} from "@gravity-ui/icons";
import { Heart } from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useLikePost, useFirePost, usePostComments, useAddComment } from "@/lib/hooks/use-social";
import { timeAgo as timeAgoLib } from "@/lib/utils/format";
import type { PostComment } from "@/lib/api/social";

// ── Activity data shape (from backend ActivityFeedItem) ──

export interface ActivityData {
    id: string;
    type: string;
    user: { username: string; avatar_url?: string };
    title: string;
    description?: string;
    image_url?: string;
    entity_type?: string;
    entity_id?: string;
    metadata?: Record<string, unknown>;
    likes_count?: number;
    is_liked?: boolean;
    fires_count?: number;
    is_fired?: boolean;
    comments_count?: number;
    created_at: string;
}

// ── Visual config per activity type ──

interface ActivityConfig {
    icon: ReactNode;
    color: string;
    label: string;
}

const ICON_SIZE = { width: 14, height: 14 };

const ACTIVITY_CONFIG: Record<string, ActivityConfig> = {
    TOURNAMENT_WIN:  { icon: <Cup {...ICON_SIZE} />,         color: "var(--warning)", label: "Victoria" },
    TOURNAMENT_TOP:  { icon: <Cup {...ICON_SIZE} />,         color: "var(--warning)", label: "Top" },
    MATCH_WIN:       { icon: <Cup {...ICON_SIZE} />,         color: "var(--warning)", label: "Victoria" },
    MATCH_LOSS:      { icon: <Cup {...ICON_SIZE} />,         color: "var(--danger)",  label: "Derrota" },
    TOURNAMENT_JOIN: { icon: <Cup {...ICON_SIZE} />,         color: "var(--accent)",  label: "Inscripción" },
    RATING_UP:       { icon: <ChartColumn {...ICON_SIZE} />, color: "var(--success)", label: "Rating" },
    PEAK_RATING:     { icon: <ChartColumn {...ICON_SIZE} />, color: "var(--success)", label: "Nuevo peak" },
    RATING_DOWN:     { icon: <ChartColumn {...ICON_SIZE} />, color: "var(--danger)",  label: "Rating" },
    BADGE_EARNED:    { icon: <StarFill {...ICON_SIZE} />,    color: "var(--purple)",  label: "Logro" },
    TITLE_EARNED:    { icon: <StarFill {...ICON_SIZE} />,    color: "var(--purple)",  label: "Título" },
    ACHIEVEMENT:     { icon: <StarFill {...ICON_SIZE} />,    color: "var(--purple)",  label: "Logro" },
    SEASON_RANK:     { icon: <StarFill {...ICON_SIZE} />,    color: "var(--purple)",  label: "Temporada" },
    LEVEL_UP:        { icon: <ArrowUp {...ICON_SIZE} />,     color: "var(--accent)",  label: "Nivel" },
    FOLLOW:          { icon: <Person {...ICON_SIZE} />,      color: "var(--accent)",  label: "Social" },
    FRIENDSHIP:      { icon: <Person {...ICON_SIZE} />,      color: "var(--accent)",  label: "Amistad" },
    CLAN_JOIN:       { icon: <Shield {...ICON_SIZE} />,      color: "var(--accent)",  label: "Clan" },
    CLAN_CREATE:     { icon: <Shield {...ICON_SIZE} />,      color: "var(--accent)",  label: "Clan" },
    CLAN_LEAVE:      { icon: <Shield {...ICON_SIZE} />,      color: "var(--muted)",   label: "Clan" },
    DECK_PUBLISH:    { icon: <SquareDashed {...ICON_SIZE} />, color: "var(--purple)", label: "Mazo" },
};

const FALLBACK_CONFIG: ActivityConfig = {
    icon: <CircleInfo {...ICON_SIZE} />,
    color: "var(--muted)",
    label: "Actividad",
};

// ── Entity link resolver ──

function getEntityHref(entityType?: string, entityId?: string): string | null {
    if (!entityType || !entityId) return null;
    const t = entityType.toLowerCase();
    if (t === "tournament") return `/torneos/${entityId}`;
    if (t === "clan") return `/clanes/${entityId}`;
    if (t === "user") return `/perfil/${entityId}`;
    if (t === "deck") return `/decks/${entityId}`;
    if (t === "duel") return `/duelos/${entityId}`;
    return null;
}

const ENTITY_LABELS: Record<string, string> = {
    tournament: "Ver torneo",
    clan: "Ver clan",
    user: "Ver perfil",
    deck: "Ver mazo",
    duel: "Ver duelo",
};

// ── Component ──

export default function FeedActivityCard({ activity }: { activity: ActivityData }) {
    const config = ACTIVITY_CONFIG[activity.type] ?? FALLBACK_CONFIG;
    const href = getEntityHref(activity.entity_type, activity.entity_id);
    const entityLabel = activity.entity_type ? ENTITY_LABELS[activity.entity_type.toLowerCase()] ?? "Ver detalle" : "Ver detalle";

    const { status, session } = useAuth();
    const isAuth = status === "authenticated";
    const accessToken = session?.accessToken;

    const [liked, setLiked] = useState(activity.is_liked ?? false);
    const [likesCount, setLikesCount] = useState(activity.likes_count ?? 0);
    const [fired, setFired] = useState(activity.is_fired ?? false);
    const [firesCount, setFiresCount] = useState(activity.fires_count ?? 0);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");

    const likeMutation = useLikePost();
    const fireMutation = useFirePost();
    const addCommentMutation = useAddComment();
    const commentsQuery = usePostComments(activity.id, showComments);
    const comments: PostComment[] = commentsQuery.data?.comments ?? [];

    useEffect(() => {
        if (!likeMutation.isPending) {
            setLiked(activity.is_liked ?? false);
            setLikesCount(activity.likes_count ?? 0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activity.is_liked, activity.likes_count]);

    useEffect(() => {
        if (!fireMutation.isPending) {
            setFired(activity.is_fired ?? false);
            setFiresCount(activity.fires_count ?? 0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activity.is_fired, activity.fires_count]);

    const handleLike = () => {
        if (!isAuth) return;
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikesCount(c => c + (wasLiked ? -1 : 1));
        likeMutation.mutate(
            { postId: activity.id, like: !wasLiked, token: accessToken },
            {
                onSuccess: (data) => {
                    if (data?.likes_count != null) setLikesCount(data.likes_count);
                },
                onError: () => {
                    setLiked(wasLiked);
                    setLikesCount(c => c + (wasLiked ? 1 : -1));
                },
            }
        );
    };

    const handleFire = () => {
        if (!isAuth) return;
        const wasFired = fired;
        setFired(!wasFired);
        setFiresCount(c => c + (wasFired ? -1 : 1));
        fireMutation.mutate(
            { postId: activity.id, fire: !wasFired, token: accessToken },
            {
                onSuccess: (data) => {
                    if (data?.fires_count != null) setFiresCount(data.fires_count);
                },
                onError: () => {
                    setFired(wasFired);
                    setFiresCount(c => c + (wasFired ? 1 : -1));
                },
            }
        );
    };

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        const content = commentText.trim();
        if (!content || !isAuth) return;
        addCommentMutation.mutate(
            { postId: activity.id, content, token: accessToken },
            { onSuccess: () => setCommentText("") }
        );
    };

    return (
        <article className="feed-card-hover" style={{
            backgroundColor: "var(--surface-solid)",
            borderRadius: 16,
            border: "1px solid var(--border)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            transition: "box-shadow 0.25s, border-color 0.25s",
        }}>
            {/* Header: avatar + username + badge + time */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Avatar with accent ring */}
                <Link href={`/perfil/${activity.user.username}`} style={{ flexShrink: 0, textDecoration: "none" }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 20,
                        background: "var(--accent)", padding: 2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: "var(--background)", overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, fontWeight: 700, color: "var(--foreground)",
                        }}>
                            {activity.user.avatar_url ? (
                                <img src={activity.user.avatar_url} alt={activity.user.username}
                                    style={{ width: 36, height: 36, objectFit: "cover" }} />
                            ) : (
                                activity.user.username?.charAt(0).toUpperCase()
                            )}
                        </div>
                    </div>
                </Link>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Link href={`/perfil/${activity.user.username}`} style={{ textDecoration: "none" }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                                {activity.user.username}
                            </span>
                        </Link>
                        <span style={{
                            fontSize: 10, fontWeight: 600, color: config.color,
                            background: `color-mix(in srgb, ${config.color} 12%, transparent)`,
                            padding: "2px 6px", borderRadius: 6,
                            display: "inline-flex", alignItems: "center", gap: 3,
                        }}>
                            {config.icon}
                            {config.label}
                        </span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{timeAgoLib(activity.created_at)}</span>
                </div>
            </div>

            {/* Activity content */}
            <div style={{ fontSize: 14, lineHeight: "21px", color: "var(--foreground)", fontWeight: 600 }}>
                {activity.title}
            </div>
            {activity.description && (
                <div style={{ fontSize: 13, lineHeight: "19px", color: "var(--muted)" }}>
                    {activity.description}
                </div>
            )}

            {/* Image if present */}
            {activity.image_url && (
                <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
                    <img src={activity.image_url} alt="" style={{ width: "100%", display: "block" }} />
                </div>
            )}

            {/* Entity link */}
            {href && (
                <Link
                    href={href}
                    style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 13, fontWeight: 600, color: config.color,
                        textDecoration: "none",
                    }}
                >
                    {entityLabel}
                    <ChevronRight style={{ width: 12, height: 12 }} />
                </Link>
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
                        <Heart style={{ width: 16, height: 16 }} />
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
                        <Flame style={{ width: 16, height: 16 }} />
                        <span>{firesCount}</span>
                    </button>

                    {/* Comment */}
                    <button type="button" onClick={() => setShowComments(v => !v)} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "none", border: "none", cursor: "pointer",
                        color: showComments ? "var(--accent)" : "var(--muted)",
                        padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                    }}>
                        <Comment style={{ width: 16, height: 16 }} />
                        <span>{activity.comments_count ?? 0}</span>
                    </button>
                </div>
            </div>

            {/* Comments section */}
            {showComments && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {isAuth && (
                        <form onSubmit={handleSubmitComment} style={{ display: "flex", gap: 8 }}>
                            <input
                                type="text"
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
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
                    {commentsQuery.isLoading ? (
                        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>Cargando...</p>
                    ) : comments.length === 0 ? (
                        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>Sin comentarios aún</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {comments.map(c => (
                                <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 14, flexShrink: 0,
                                        background: "var(--accent)", overflow: "hidden",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 700, color: "#fff",
                                    }}>
                                        {c.user.avatar_url ? (
                                            <img src={c.user.avatar_url} alt={c.user.username}
                                                style={{ width: 28, height: 28, objectFit: "cover" }} />
                                        ) : c.user.username[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <Link href={`/perfil/${c.user.username}`} style={{ textDecoration: "none" }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>
                                                    {c.user.username}
                                                </span>
                                            </Link>
                                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{timeAgoLib(c.created_at)}</span>
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
