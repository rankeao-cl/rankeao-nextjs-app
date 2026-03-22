"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { useCreatePostModal } from "@/context/CreatePostModalContext";
import { createPost } from "@/lib/api/social";
import MarkdownToolbar from "./MarkdownToolbar";
import MarkdownRenderer from "./MarkdownRenderer";

type Tab = "write" | "preview";
const MAX_LENGTH = 2000;

export default function CreatePostModal() {
    const { isOpen, closeCreatePost } = useCreatePostModal();
    const { session } = useAuth();

    const [content, setContent] = useState("");
    const [tab, setTab] = useState<Tab>("write");
    const [posting, setPosting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setContent("");
            setTab("write");
            setPosting(false);
        }
    }, [isOpen]);

    // Focus textarea on open
    useEffect(() => {
        if (isOpen && tab === "write") {
            requestAnimationFrame(() => textareaRef.current?.focus());
        }
    }, [isOpen, tab]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!content.trim() || posting) return;
        setPosting(true);
        try {
            await createPost({ content: content.trim() }, session?.accessToken);
            toast.success("Post publicado");
            closeCreatePost();
        } catch {
            toast.danger("No se pudo publicar el post");
        } finally {
            setPosting(false);
        }
    };

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) closeCreatePost(); }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                padding: 16,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 560,
                    maxHeight: "90vh",
                    backgroundColor: "#1A1A1E",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F2F2F2", margin: 0 }}>Crear Post</h2>
                    <button
                        onClick={closeCreatePost}
                        style={{
                            background: "none", border: "none", cursor: "pointer", padding: 4,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: "flex",
                    gap: 4,
                    padding: "8px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                    {(["write", "preview"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                padding: "6px 14px",
                                borderRadius: 8,
                                border: "none",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                backgroundColor: tab === t ? "rgba(59,130,246,0.15)" : "transparent",
                                color: tab === t ? "#3B82F6" : "#888891",
                                transition: "all 0.15s",
                            }}
                        >
                            {t === "write" ? "Escribir" : "Vista previa"}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    {tab === "write" ? (
                        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                            <MarkdownToolbar textareaRef={textareaRef} content={content} onChange={setContent} />
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
                                placeholder="Escribe tu post... Usa **markdown** para dar formato"
                                rows={10}
                                style={{
                                    flex: 1,
                                    width: "100%",
                                    backgroundColor: "transparent",
                                    border: "none",
                                    outline: "none",
                                    resize: "none",
                                    padding: "12px 16px",
                                    fontSize: 14,
                                    lineHeight: 1.6,
                                    color: "#F2F2F2",
                                    fontFamily: "inherit",
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{ padding: "12px 16px", minHeight: 200 }}>
                            {content.trim() ? (
                                <MarkdownRenderer content={content} />
                            ) : (
                                <p style={{ color: "#888891", fontSize: 14 }}>Nada que mostrar...</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "10px 16px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <span style={{ fontSize: 12, color: content.length > MAX_LENGTH * 0.9 ? "#EF4444" : "#888891" }}>
                        {content.length}/{MAX_LENGTH}
                    </span>
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || posting}
                        style={{
                            padding: "10px 24px",
                            borderRadius: 10,
                            border: "none",
                            backgroundColor: !content.trim() || posting ? "rgba(59,130,246,0.3)" : "#3B82F6",
                            color: "#FFFFFF",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: !content.trim() || posting ? "not-allowed" : "pointer",
                            transition: "all 0.15s",
                        }}
                    >
                        {posting ? "Publicando..." : "Publicar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
