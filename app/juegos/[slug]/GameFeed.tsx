"use client";

import { useFeedDiscover } from "@/lib/hooks/use-social";
import { PostCard } from "@/components/cards";
import { Card } from "@heroui/react";

interface Props {
    gameSlug: string;
    gameName: string;
}

export default function GameFeed({ gameSlug, gameName }: Props) {
    const { data, isLoading } = useFeedDiscover({ game: gameSlug, per_page: 10 });
    const items = data?.items ?? [];
    const posts = Array.isArray(items) ? items : [];

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold">Feed de {gameName}</h2>

            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl bg-[var(--surface-secondary)] animate-pulse" />
                    ))}
                </div>
            ) : posts.length > 0 ? (
                <div className="flex flex-col gap-4 max-w-3xl">
                    {posts.map((post: any) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Card.Content className="py-12 text-center">
                        <p className="text-3xl mb-3 opacity-50">📰</p>
                        <p className="text-lg font-medium text-[var(--foreground)]">Sin publicaciones</p>
                        <p className="text-sm mt-1 text-[var(--muted)]">
                            Aún no hay posts relacionados con {gameName}. Sé el primero en publicar.
                        </p>
                    </Card.Content>
                </Card>
            )}
        </div>
    );
}
