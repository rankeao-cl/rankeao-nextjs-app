import { Card, Chip, Avatar, Button } from "@heroui/react";
import Image from "next/image";
import { Comment, Heart, ArrowShapeTurnUpRight } from "@gravity-ui/icons";

export interface FeedPost {
    id: string;
    author: { username: string; avatar_url?: string; rank_badge?: string };
    text: string;
    images?: string[];
    tags?: string[];
    game?: string;
    likes_count?: number;
    comments_count?: number;
    created_at: string;
}

export default function PostCard({ post }: { post: FeedPost }) {
    const timeAgo = getTimeAgo(post.created_at);

    return (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Card.Content className="p-4 space-y-3">
                {/* Author header */}
                <div className="flex items-center gap-3">
                    <Avatar size="sm">
                        {post.author.avatar_url ? (
                            <Avatar.Image alt={post.author.username} src={post.author.avatar_url} />
                        ) : null}
                        <Avatar.Fallback>{post.author.username[0]?.toUpperCase()}</Avatar.Fallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                {post.author.username}
                            </span>
                            {post.author.rank_badge && (
                                <Chip size="sm" variant="soft" color="accent">{post.author.rank_badge}</Chip>
                            )}
                        </div>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo}</span>
                    </div>
                </div>

                {/* Text */}
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {post.text}
                </p>

                {/* Images */}
                {post.images && post.images.length > 0 && (
                    <div className={`grid gap-1 rounded-lg overflow-hidden ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                        }`}>
                        {post.images.slice(0, 4).map((src, i) => (
                            <div key={i} className="relative aspect-square" style={{ background: "var(--surface-secondary)" }}>
                                <Image src={src} alt="" fill className="object-cover" sizes="50vw" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Tags */}
                {(post.tags || post.game) && (
                    <div className="flex flex-wrap gap-1">
                        {post.game && <Chip variant="secondary" size="sm">{post.game}</Chip>}
                        {post.tags?.map((tag) => (
                            <Chip key={tag} variant="soft" size="sm">#{tag}</Chip>
                        ))}
                    </div>
                )}

                {/* Interaction bar */}
                <div className="flex items-center gap-1 pt-1" style={{ borderTop: "1px solid var(--separator)" }}>
                    <Button variant="tertiary" size="sm" className="gap-1.5 text-[var(--muted)]">
                        <Heart className="size-4" /> {post.likes_count || 0}
                    </Button>
                    <Button variant="tertiary" size="sm" className="gap-1.5 text-[var(--muted)]">
                        <Comment className="size-4" /> {post.comments_count || 0}
                    </Button>
                    <Button variant="tertiary" size="sm" className="ml-auto text-[var(--muted)]">
                        <ArrowShapeTurnUpRight className="size-4" />
                    </Button>
                </div>
            </Card.Content>
        </Card>
    );
}

function getTimeAgo(dateStr: string): string {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}
