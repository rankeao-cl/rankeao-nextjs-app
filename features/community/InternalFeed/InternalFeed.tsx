"use client";

import { useState } from "react";
import { Button, Select, ListBox } from "@heroui/react";
import { Plus } from "@gravity-ui/icons";
import PostCard from "@/features/social/PostCard";

interface FeedProps {
    posts: any[];
}

const POST_TYPES = [
    { value: "all", label: "Todo" },
    { value: "announcement", label: "Anuncios (Admin)" },
    { value: "general", label: "General" },
    { value: "tournament", label: "Torneos" },
    { value: "trade", label: "Intercambios" },
];

export default function InternalFeed({ posts }: FeedProps) {
    const [filter, setFilter] = useState("all");

    // Eventually map this to real API types
    const filteredPosts = posts.filter(post => {
        if (filter === "all") return true;
        return post.type === filter;
    });

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-4 border-b border-[var(--border)]">
                <Select
                    selectedKey={filter}
                    onSelectionChange={(k) => setFilter(String(k))}
                    className="w-full sm:max-w-xs"
                    aria-label="Filtrar Publicaciones"
                >
                    <Select.Trigger className="bg-[var(--surface)] border border-[var(--border)] rounded-xl min-h-10 text-sm" />
                    <Select.Popover>
                        <ListBox>
                            {POST_TYPES.map((type) => (
                                <ListBox.Item key={type.value} id={type.value} textValue={type.label}>{type.label}</ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                <Button variant="primary" className="bg-[var(--accent)] text-[var(--accent-foreground)] font-bold w-full sm:w-auto shadow-md">
                    <Plus className="size-4 mr-1" />
                    Nueva Publicación
                </Button>
            </div>

            {/* Feed List */}
            <div className="flex flex-col gap-4">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-sm text-center">
                        <div className="size-16 bg-[var(--surface-tertiary)] rounded-2xl flex items-center justify-center text-3xl mb-4">
                            📰
                        </div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Sin publicaciones</h3>
                        <p className="text-[var(--muted)] max-w-md">No hay publicaciones con este filtro. Sé el primero en iniciar una conversación.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
