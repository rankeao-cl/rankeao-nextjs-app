"use client";

import { Avatar } from "@heroui/react";
import { UserDisplayName, getUserRoleData } from "@/components/UserIdentity";
import type { ChatMessage } from "@/lib/types/chat";

interface ChatMessageBubbleProps {
    message: ChatMessage;
    isMine: boolean;
    showHeader: boolean;
}

export default function ChatMessageBubble({ message, isMine, showHeader }: ChatMessageBubbleProps) {
    // Parsing simple de URLs para dar "cards" embebidas visualmente
    const renderContent = (text: string) => {
        if (!text.includes("http")) return <p>{text}</p>;

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);

        return (
            <div className="space-y-2">
                {parts.map((part, idx) => {
                    if (part.match(urlRegex)) {
                        const isMarketplace = part.includes("/marketplace/");
                        const isComunidad = part.includes("/comunidades/");

                        return (
                            <a
                                key={idx}
                                href={part}
                                target="_blank"
                                rel="noreferrer"
                                className="block p-3 rounded-xl border transition-colors
                  bg-[var(--surface-secondary)]/50 hover:bg-[var(--surface-secondary)]
                  border-[var(--border)] text-sm group-hover:border-[var(--accent)]/50"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl">{isMarketplace ? "🛒" : isComunidad ? "⚔️" : "🔗"}</span>
                                    <span className="font-bold text-[var(--accent)]">
                                        {isMarketplace ? "Producto de Tienda" : isComunidad ? "Comunidad / Torneo" : "Enlace Externo"}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--muted)] truncate max-w-[200px] md:max-w-xs block">
                                    {part}
                                </p>
                                <p className="text-xs font-semibold mt-2 text-[var(--foreground)] opacity-80 group-hover:opacity-100 transition-opacity">
                                    Ver detalle &rarr;
                                </p>
                            </a>
                        );
                    }
                    return <span key={idx} className="whitespace-pre-wrap">{part}</span>;
                })}
            </div>
        );
    };

    return (
        <div className={`flex gap-3 max-w-[90%] md:max-w-[75%] ${isMine ? "self-end flex-row-reverse" : "self-start"}`}>
            {!isMine && (
                <div className="w-8 flex-shrink-0 flex flex-col justify-end pb-1">
                    {showHeader ? (
                        <Avatar className="w-8 h-8 text-[11px] font-bold bg-[var(--surface-secondary)] border border-[var(--border)] select-none">
                            <Avatar.Image src={message.sender_avatar_url} alt={message.sender_username} />
                            <Avatar.Fallback>{message.sender_username?.charAt(0).toUpperCase() || "U"}</Avatar.Fallback>
                        </Avatar>
                    ) : <div className="w-8 h-8" />}
                </div>
            )}

            <div className={`flex flex-col group ${isMine ? "items-end" : "items-start"}`}>
                {!isMine && showHeader && (
                    <div className="ml-1 mb-1">
                        <UserDisplayName
                            user={{
                                name: message.sender_username || "Usuario"
                            }}
                            className="text-[11px] text-[var(--muted)] tracking-wide"
                        />
                    </div>
                )}
                <div
                    className={`px-4 py-2.5 shadow-sm text-[15px] leading-relaxed relative
            ${isMine
                            ? "bg-[var(--accent)] text-[var(--accent-foreground)] rounded-2xl rounded-tr-sm shadow-[0_4px_15px_rgba(var(--accent-rgb),0.2)]"
                            : "bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl rounded-tl-sm"
                        }`}
                >
                    {renderContent(message.content)}
                </div>

                {/* Timestamp y metadata */}
                <div className={`flex items-center gap-1 text-[10px] mt-1 mx-1 font-medium transition-opacity opacity-0 group-hover:opacity-100 ${isMine ? "justify-end" : "justify-start text-[var(--muted)]"}`}>
                    <span className={isMine ? "text-[var(--accent)]" : ""}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {/* MVP: Always show double check if mine, since we lack read_receipts in API */}
                    {isMine && <span className="text-[var(--accent)] saturate-150">✓✓</span>}
                </div>
            </div>
        </div>
    );
}
