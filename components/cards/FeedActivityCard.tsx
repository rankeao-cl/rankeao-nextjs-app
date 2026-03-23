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
    bgColor: string;
}

const ICON_SIZE = { width: 16, height: 16 };

const ACTIVITY_CONFIG: Record<string, ActivityConfig> = {
    // Competitivo (win)
    TOURNAMENT_WIN:  { icon: <Cup {...ICON_SIZE} />,         color: "#F59E0B", bgColor: "rgba(245,158,11,0.12)" },
    TOURNAMENT_TOP:  { icon: <Cup {...ICON_SIZE} />,         color: "#F59E0B", bgColor: "rgba(245,158,11,0.12)" },
    MATCH_WIN:       { icon: <Cup {...ICON_SIZE} />,         color: "#F59E0B", bgColor: "rgba(245,158,11,0.12)" },
    // Competitivo (loss)
    MATCH_LOSS:      { icon: <Cup {...ICON_SIZE} />,         color: "#EF4444", bgColor: "rgba(239,68,68,0.12)" },
    // Registro
    TOURNAMENT_JOIN: { icon: <Cup {...ICON_SIZE} />,         color: "#3B82F6", bgColor: "rgba(59,130,246,0.12)" },
    // Rating
    RATING_UP:       { icon: <ChartColumn {...ICON_SIZE} />, color: "#22C55E", bgColor: "rgba(34,197,94,0.12)" },
    PEAK_RATING:     { icon: <ChartColumn {...ICON_SIZE} />, color: "#22C55E", bgColor: "rgba(34,197,94,0.12)" },
    RATING_DOWN:     { icon: <ChartColumn {...ICON_SIZE} />, color: "#EF4444", bgColor: "rgba(239,68,68,0.12)" },
    // Logros
    BADGE_EARNED:    { icon: <StarFill {...ICON_SIZE} />,    color: "#A855F7", bgColor: "rgba(168,85,247,0.12)" },
    TITLE_EARNED:    { icon: <StarFill {...ICON_SIZE} />,    color: "#A855F7", bgColor: "rgba(168,85,247,0.12)" },
    ACHIEVEMENT:     { icon: <StarFill {...ICON_SIZE} />,    color: "#A855F7", bgColor: "rgba(168,85,247,0.12)" },
    SEASON_RANK:     { icon: <StarFill {...ICON_SIZE} />,    color: "#A855F7", bgColor: "rgba(168,85,247,0.12)" },
    // Nivel
    LEVEL_UP:        { icon: <ArrowUp {...ICON_SIZE} />,     color: "#3B82F6", bgColor: "rgba(59,130,246,0.12)" },
    // Social
    FOLLOW:          { icon: <Person {...ICON_SIZE} />,      color: "#3B82F6", bgColor: "rgba(59,130,246,0.12)" },
    FRIENDSHIP:      { icon: <Person {...ICON_SIZE} />,      color: "#3B82F6", bgColor: "rgba(59,130,246,0.12)" },
    // Clan
    CLAN_JOIN:       { icon: <Shield {...ICON_SIZE} />,      color: "#3B82F6", bgColor: "rgba(59,130,246,0.12)" },
    CLAN_CREATE:     { icon: <Shield {...ICON_SIZE} />,      color: "#3B82F6", bgColor: "rgba(59,130,246,0.12)" },
    CLAN_LEAVE:      { icon: <Shield {...ICON_SIZE} />,      color: "var(--muted)", bgColor: "rgba(255,255,255,0.06)" },
    // Deck
    DECK_PUBLISH:    { icon: <SquareDashed {...ICON_SIZE} />, color: "#8B5CF6", bgColor: "rgba(139,92,246,0.12)" },
};

const FALLBACK_CONFIG: ActivityConfig = {
    icon: <CircleInfo {...ICON_SIZE} />,
    color: "var(--muted)",
    bgColor: "rgba(255,255,255,0.06)",
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

    return (
        <article style={{
            backgroundColor: "var(--surface-solid)",
            borderRadius: 16,
            border: "1px solid var(--border)",
            overflow: "hidden",
        }}>
            {/* Header: avatar + username + time */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 0" }}>
                {activity.user.avatar_url ? (
                    <img
                        src={activity.user.avatar_url}
                        alt={activity.user.username}
                        style={{ width: 32, height: 32, borderRadius: 16, objectFit: "cover" }}
                    />
                ) : (
                    <div style={{
                        width: 32, height: 32, borderRadius: 16,
                        backgroundColor: "rgba(255,255,255,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--muted)", fontSize: 13, fontWeight: 700,
                    }}>
                        {activity.user.username?.charAt(0).toUpperCase()}
                    </div>
                )}
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", flex: 1 }}>
                    @{activity.user.username}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    {timeAgo(activity.created_at)}
                </span>
            </div>

            {/* Activity body: accent bar + icon + title + description */}
            <div style={{ padding: "10px 14px 14px" }}>
                <div style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    backgroundColor: config.bgColor,
                    borderLeft: `3px solid ${config.color}`,
                }}>
                    {/* Icon */}
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: config.color + "20",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: config.color, flexShrink: 0,
                    }}>
                        {config.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            fontSize: 14, fontWeight: 700, color: "var(--foreground)",
                            margin: 0, lineHeight: "20px",
                        }}>
                            {activity.title}
                        </p>
                        {activity.description && (
                            <p style={{
                                fontSize: 12, color: "var(--muted)",
                                margin: "4px 0 0", lineHeight: "16px",
                            }}>
                                {activity.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Entity link */}
                {href && (
                    <Link
                        href={href}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 10,
                            fontSize: 12,
                            fontWeight: 600,
                            color: config.color,
                            textDecoration: "none",
                        }}
                    >
                        {entityLabel}
                        <ChevronRight style={{ width: 12, height: 12 }} />
                    </Link>
                )}
            </div>
        </article>
    );
}
