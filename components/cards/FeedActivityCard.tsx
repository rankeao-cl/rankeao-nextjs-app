"use client";

import { useState } from "react";
import Link from "next/link";
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
    Heart,
    Comment,
    ArrowShapeTurnUpRight,
    Bookmark,
} from "@gravity-ui/icons";

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

// ── Inline timeAgo (compact) ──

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

// ── Component ──

export default function FeedActivityCard({ activity }: { activity: ActivityData }) {
    const config = ACTIVITY_CONFIG[activity.type] ?? FALLBACK_CONFIG;
    const href = getEntityHref(activity.entity_type, activity.entity_id);
    const entityLabel = activity.entity_type ? ENTITY_LABELS[activity.entity_type.toLowerCase()] ?? "Ver detalle" : "Ver detalle";

    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [bookmarked, setBookmarked] = useState(false);

    const handleLike = () => {
        setLiked((prev) => {
            setLikesCount((c) => c + (prev ? -1 : 1));
            return !prev;
        });
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
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{timeAgo(activity.created_at)}</span>
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
                    <button type="button" style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--muted)",
                        padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                    }}>
                        <Comment style={{ width: 18, height: 18 }} />
                        <span>0</span>
                    </button>
                    <button type="button" style={{
                        display: "flex", alignItems: "center",
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--muted)",
                        padding: "4px 8px", borderRadius: 999,
                    }}>
                        <ArrowShapeTurnUpRight style={{ width: 18, height: 18 }} />
                    </button>
                </div>
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
