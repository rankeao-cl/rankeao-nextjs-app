"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip, Input, Label, TextArea, TextField, toast } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { createPost } from "@/lib/api/social";

export default function NewPostPage() {
    const router = useRouter();
    const { session, status } = useAuth();
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.danger("Escribe algo para publicar");
            return;
        }
        if (!session?.accessToken) return;

        setLoading(true);
        try {
            await createPost({ content: content.trim() }, session.accessToken);
            toast.success("Post publicado");
            router.push("/");
        } catch {
            toast.danger("No se pudo publicar el post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
            <div>
                <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">Feed</Chip>
                <h1 className="text-2xl font-bold text-[var(--foreground)]">Crear Post</h1>
                <p className="text-sm text-[var(--muted)] mt-1">Comparte algo con la comunidad de Rankeao.</p>
            </div>

            <Card className="surface-card rounded-2xl overflow-hidden">
                <Card.Content className="p-5 space-y-4">
                    <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Contenido</Label>
                        <TextArea
                            placeholder="Que estas jugando hoy? Comparte tu experiencia, resultado de torneo, combo favorito..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={5}
                            className="text-sm"
                        />
                    </TextField>

                    <p className="text-xs text-[var(--muted)]">
                        {content.length}/500 caracteres
                    </p>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            className="flex-1 font-semibold"
                            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                            onPress={handleSubmit}
                            isPending={loading}
                            isDisabled={!content.trim()}
                        >
                            Publicar
                        </Button>
                        <Button type="button" variant="tertiary" onPress={() => router.back()}>
                            Cancelar
                        </Button>
                    </div>
                </Card.Content>
            </Card>
        </div>
    );
}
