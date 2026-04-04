"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "@gravity-ui/icons";
import PostCard from "@/features/social/PostCard";
import type { FeedPost } from "@/features/social/PostCard";
import { getPost } from "@/lib/api/social";
import { useAuth } from "@/lib/hooks/use-auth";

export default function PostDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { session } = useAuth();
    const [post, setPost] = useState<FeedPost | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getPost(id, { token: session?.accessToken } as any)
            .then((res: any) => {
                const item = res?.data?.post ?? res?.post;
                if (!item) {
                    setError(true);
                    return;
                }
                const user = item.user ?? {};
                setPost({
                    id: String(item.id),
                    username: user.username ?? item.username,
                    avatar_url: user.avatar_url ?? item.avatar_url,
                    text: item.description ?? item.text ?? item.content ?? "",
                    images: item.images ?? (item.image_url ? [item.image_url] : undefined),
                    likes_count: item.likes_count ?? 0,
                    is_liked: item.is_liked ?? false,
                    comments_count: item.comments_count ?? 0,
                    created_at: item.created_at ?? "",
                });
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id, session?.accessToken]);

    return (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
            <button
                type="button"
                onClick={() => router.back()}
                style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--muted)", fontSize: 14, marginBottom: 16,
                    padding: 0,
                }}
            >
                <ArrowLeft style={{ width: 18, height: 18 }} />
                Volver
            </button>

            {loading && (
                <p style={{ color: "var(--muted)", textAlign: "center", marginTop: 40 }}>
                    Cargando publicación...
                </p>
            )}

            {error && (
                <p style={{ color: "var(--muted)", textAlign: "center", marginTop: 40 }}>
                    Publicación no encontrada.
                </p>
            )}

            {post && <PostCard post={post} />}
        </div>
    );
}
