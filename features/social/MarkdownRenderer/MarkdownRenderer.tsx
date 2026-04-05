"use client";

import dynamic from "next/dynamic";

const MarkdownRendererInner = dynamic(
    () => import("./MarkdownRendererInner"),
    {
        ssr: false,
        loading: () => (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Cargando...</div>
        ),
    },
);

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    if (!content) return null;
    return <MarkdownRendererInner content={content} className={className} />;
}
