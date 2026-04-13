"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const DeckFanModal = dynamic(() => import("@/features/deck/DeckFanModal"), { ssr: false });
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
    ArrowShapeTurnUpRight,
} from "@gravity-ui/icons";
import { Heart } from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLikePost } from "@/lib/hooks/use-social";
import { toast } from "@heroui/react/toast";
import CommentSection from "@/features/social/CommentSection";
import { timeAgo as timeAgoLib } from "@/lib/utils/format";
// PostComment type used indirectly via CommentSection

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

function getEntityHref(entityType?: string, entityId?: string, metadata?: Record<string, unknown>): string | null {
    if (!entityType || !entityId) return null;
    const t = entityType.toLowerCase();
    if (t === "tournament") return `/torneos/${entityId}`;
    if (t === "clan") return `/clanes/${entityId}`;
    if (t === "user") return `/perfil/${entityId}`;
    if (t === "deck") return `/decks/${entityId}`;
    return null;
}

const ENTITY_LABELS: Record<string, string> = {
    tournament: "Ver torneo",
    clan: "Ver clan",
    user: "Ver perfil",
    deck: "Ver mazo",
};

// ── Component ──

export default function FeedActivityCard({ activity }: { activity: ActivityData }) {
    const config = ACTIVITY_CONFIG[activity.type] ?? FALLBACK_CONFIG;
    const href = getEntityHref(activity.entity_type, activity.entity_id, activity.metadata);
    const entityLabel = activity.entity_type ? ENTITY_LABELS[activity.entity_type.toLowerCase()] ?? "Ver detalle" : "Ver detalle";

    const { status, session } = useAuth();
    const isAuth = status === "authenticated";
    const accessToken = session?.accessToken;

    const [deckFanOpen, setDeckFanOpen] = useState(false);
    const [liked, setLiked] = useState(activity.is_liked ?? false);
    const [likesCount, setLikesCount] = useState(activity.likes_count ?? 0);
    const [showComments, setShowComments] = useState(false);

    const likeMutation = useLikePost();

    useEffect(() => {
        if (!likeMutation.isPending) {
            setLiked(activity.is_liked ?? false);
            setLikesCount(activity.likes_count ?? 0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activity.is_liked, activity.likes_count]);

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

    const handleShare = () => {
        const entityHref = getEntityHref(activity.entity_type, activity.entity_id, activity.metadata);
        const url = `https://rankeao.cl${entityHref || '/feed'}`;
        if (navigator.share) navigator.share({ title: activity.title, url }).catch(() => {});
        else navigator.clipboard.writeText(url).then(() => toast.success("Enlace copiado")).catch(() => {});
    };


    return (
        <article className="feed-card-hover bg-surface-solid rounded-2xl border border-border p-[14px] flex flex-col gap-2.5 transition-[box-shadow,border-color] duration-[0.25s]">
            {/* Header: avatar + username + badge + time */}
            <div className="flex items-center gap-2.5">
                {/* Avatar with accent ring */}
                <Link href={`/perfil/${activity.user.username}`} className="shrink-0 no-underline">
                    <div className="w-10 h-10 rounded-full bg-accent p-0.5 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-background overflow-hidden flex items-center justify-center text-sm font-bold text-foreground">
                            {activity.user.avatar_url ? (
                                <Image src={activity.user.avatar_url} alt={activity.user.username}
                                    width={36} height={36} className="object-cover" />
                            ) : (
                                activity.user.username?.charAt(0).toUpperCase()
                            )}
                        </div>
                    </div>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <Link href={`/perfil/${activity.user.username}`} className="no-underline">
                            <span className="text-sm font-bold text-foreground">
                                {activity.user.username}
                            </span>
                        </Link>
                        <span className="text-[10px] font-semibold inline-flex items-center gap-[3px] rounded-[6px] px-1.5 py-0.5"
                            style={{
                                color: config.color,
                                background: `color-mix(in srgb, ${config.color} 12%, transparent)`,
                            }}>
                            {config.icon}
                            {config.label}
                        </span>
                    </div>
                    <span className="text-[11px] text-muted">{timeAgoLib(activity.created_at)}</span>
                </div>
            </div>

            {/* Activity content */}
            <div className="text-sm leading-[21px] text-foreground font-semibold">
                {activity.title}
            </div>
            {activity.description && (
                <div className="text-[13px] leading-[19px] text-muted">
                    {activity.description}
                </div>
            )}

            {/* Image if present */}
            {activity.image_url && (
                <div className="rounded-xl overflow-hidden border border-border">
                    <Image src={activity.image_url} alt="" width={600} height={400} sizes="(max-width: 640px) 100vw, 600px" className="w-full block h-auto" />
                </div>
            )}

            {/* Entity link / deck fan trigger */}
            {activity.type === "DECK_PUBLISH" && (activity.entity_id ?? (activity.metadata?.deck_id as string | undefined)) ? (
                <button
                    type="button"
                    onClick={() => setDeckFanOpen(true)}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0"
                    style={{ color: config.color }}
                >
                    {entityLabel}
                    <ChevronRight style={{ width: 12, height: 12 }} />
                </button>
            ) : href ? (
                <Link
                    href={href}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold no-underline"
                    style={{ color: config.color }}
                >
                    {entityLabel}
                    <ChevronRight style={{ width: 12, height: 12 }} />
                </Link>
            ) : null}

            {/* Modal fan de cartas */}
            {deckFanOpen && (activity.entity_id ?? (activity.metadata?.deck_id as string | undefined)) && (
                <DeckFanModal
                    deckId={String(activity.entity_id ?? (activity.metadata?.deck_id as string | undefined))}
                    onClose={() => setDeckFanOpen(false)}
                />
            )}

            {/* Reaction bar */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-1">
                    {/* Like */}
                    <button type="button" onClick={handleLike}
                        className={`flex items-center gap-[5px] bg-transparent border-none px-2 py-1 rounded-full text-xs font-semibold transition-transform duration-150 ${isAuth ? "cursor-pointer" : "cursor-default"}`}
                        style={{
                            color: liked ? "#EF4444" : "var(--muted)",
                            transform: liked ? "scale(1.05)" : "scale(1)",
                            opacity: likeMutation.isPending ? 0.6 : 1,
                        }}>
                        <Heart style={{ width: 16, height: 16 }} />
                        <span>{likesCount}</span>
                    </button>

                    {/* Comment */}
                    <button type="button" onClick={() => setShowComments(v => !v)}
                        className="flex items-center gap-[5px] bg-transparent border-none cursor-pointer px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                            color: showComments ? "var(--accent)" : "var(--muted)",
                        }}>
                        <Comment style={{ width: 16, height: 16 }} />
                        <span>{activity.comments_count ?? 0}</span>
                    </button>

                    {/* Share */}
                    <button type="button" onClick={handleShare}
                        className="flex items-center bg-transparent border-none cursor-pointer px-2 py-1 rounded-full text-muted">
                        <ArrowShapeTurnUpRight style={{ width: 16, height: 16 }} />
                    </button>
                </div>
            </div>

            {/* Comments section */}
            <CommentSection postId={activity.id} show={showComments} />

        </article>
    );
}
