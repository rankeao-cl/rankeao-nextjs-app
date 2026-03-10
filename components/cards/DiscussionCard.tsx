import { Card, Chip, Avatar, Button } from "@heroui/react";
import { Comment } from "@gravity-ui/icons";

export interface FeedDiscussion {
    id: string;
    title: string;
    category: string;
    preview_text: string;
    author: { username: string; rank_badge?: string };
    replies_count: number;
    participants_count: number;
    last_reply?: { username: string; text: string };
}

const categoryColors: Record<string, "default" | "warning" | "success" | "accent" | "danger"> = {
    Meta: "accent",
    Estrategia: "success",
    Reglas: "warning",
    "Off-topic": "default",
};

export default function DiscussionCard({
    discussion,
}: {
    discussion: FeedDiscussion;
}) {
    return (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Card.Content className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <Comment className="size-5 mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                            {discussion.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Chip
                                variant="soft"
                                size="sm"
                                color={categoryColors[discussion.category] || "default"}
                            >
                                {discussion.category}
                            </Chip>
                            <span className="text-xs" style={{ color: "var(--muted)" }}>
                                por {discussion.author.username}
                                {discussion.author.rank_badge && ` · ${discussion.author.rank_badge}`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <p className="text-sm line-clamp-2" style={{ color: "var(--muted)" }}>
                    {discussion.preview_text}
                </p>

                {/* Last reply */}
                {discussion.last_reply && (
                    <div
                        className="p-2.5 rounded-lg text-xs"
                        style={{
                            background: "var(--surface-secondary)",
                            color: "var(--foreground)",
                        }}
                    >
                        <span className="font-semibold">{discussion.last_reply.username}:</span>{" "}
                        <span style={{ color: "var(--muted)" }}>{discussion.last_reply.text}</span>
                    </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
                    <span>{discussion.replies_count} respuestas</span>
                    <span>{discussion.participants_count} participantes</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto font-medium"
                        style={{ color: "var(--accent)" }}
                    >
                        Participar
                    </Button>
                </div>
            </Card.Content>
        </Card>
    );
}
