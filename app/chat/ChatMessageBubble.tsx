"use client";

import { useState } from "react";
import { Avatar, Button, Modal } from "@heroui/react";
import { ArrowUpRightFromSquare, ShoppingCart } from "@gravity-ui/icons";
import { UserDisplayName } from "@/components/UserIdentity";
import type { ChatMessage, MessageStatus } from "@/lib/types/chat";

interface ChatMessageBubbleProps {
    message: ChatMessage;
    isMine: boolean;
    showHeader: boolean;
    status?: MessageStatus;
}

const IMAGE_URL_REGEX = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?/gi;

function StatusIndicator({ status, isMine }: { status?: MessageStatus; isMine: boolean }) {
    if (!isMine) return null;
    const s = status || "sent";

    if (s === "sent") {
        return <span className="text-[var(--muted)]">&#10003;</span>;
    }
    if (s === "delivered") {
        return <span className="text-[var(--muted)]">&#10003;&#10003;</span>;
    }
    // read
    return <span className="text-[var(--accent)] saturate-150">&#10003;&#10003;</span>;
}

function ImageThumbnail({ url }: { url: string }) {
    const [previewOpen, setPreviewOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setPreviewOpen(true)}
                className="block rounded-xl overflow-hidden max-w-[260px] border border-[var(--border)] hover:opacity-90 transition-opacity cursor-pointer mt-1"
            >
                <img
                    src={url}
                    alt="Imagen compartida"
                    className="w-full h-auto max-h-[200px] object-cover"
                    loading="lazy"
                />
            </button>

            <Modal isOpen={previewOpen} onOpenChange={setPreviewOpen}>
                <Modal.Backdrop className="bg-black/70 backdrop-blur-md">
                    <Modal.Container>
                        <Modal.Dialog className="bg-transparent shadow-none border-none max-w-[90vw] max-h-[90vh] p-0">
                            <Modal.CloseTrigger className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-1.5 z-10 hover:bg-black/70" />
                            <Modal.Body className="p-0 flex items-center justify-center">
                                <img
                                    src={url}
                                    alt="Imagen completa"
                                    className="max-w-full max-h-[85vh] rounded-xl object-contain"
                                />
                            </Modal.Body>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    );
}

function ListingEmbed({ metadata }: { metadata: ChatMessage["metadata"] }) {
    if (!metadata || metadata.embed_type !== "listing") return null;

    return (
        <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/60 overflow-hidden max-w-[280px]">
            <div className="flex items-start gap-3 p-3">
                {metadata.image_url && (
                    <img
                        src={metadata.image_url}
                        alt={metadata.product_name || "Producto"}
                        className="w-14 h-14 rounded-lg object-cover border border-[var(--border)] shrink-0"
                    />
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--foreground)] truncate">
                        {metadata.product_name || "Producto"}
                    </p>
                    {metadata.price && (
                        <p className="text-base font-extrabold text-[var(--accent)] mt-0.5">
                            {metadata.price}
                        </p>
                    )}
                </div>
            </div>
            {metadata.listing_url && (
                <a
                    href={metadata.listing_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2 border-t border-[var(--border)] text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
                >
                    <ShoppingCart className="size-3.5" />
                    Ver en Marketplace
                    <ArrowUpRightFromSquare className="size-3" />
                </a>
            )}
        </div>
    );
}

function PostEmbed({ metadata }: { metadata: ChatMessage["metadata"] }) {
    if (!metadata || metadata.embed_type !== "post") return null;

    return (
        <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/60 p-3 max-w-[280px]">
            {metadata.author_name && (
                <p className="text-xs font-bold text-[var(--foreground)] mb-1">
                    {metadata.author_name}
                </p>
            )}
            {metadata.post_text && (
                <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                    {metadata.post_text}
                </p>
            )}
            {metadata.post_url && (
                <a
                    href={metadata.post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] mt-2 hover:underline"
                >
                    Ver publicacion
                    <ArrowUpRightFromSquare className="size-3" />
                </a>
            )}
        </div>
    );
}

export default function ChatMessageBubble({ message, isMine, showHeader, status }: ChatMessageBubbleProps) {
    // Detect image URLs in content
    const imageUrls: string[] = [];
    const textContent = message.content.replace(IMAGE_URL_REGEX, (url) => {
        imageUrls.push(url);
        return "";
    }).trim();

    // Also include explicit image_url field
    if (message.image_url && !imageUrls.includes(message.image_url)) {
        imageUrls.unshift(message.image_url);
    }

    // Resolve effective status: prop > message field > fallback
    const effectiveStatus = status || message.status || "sent";

    // Parsing simple de URLs para dar "cards" embebidas visualmente
    const renderContent = (text: string) => {
        if (!text) return null;
        if (!text.includes("http")) return <p className="whitespace-pre-wrap">{text}</p>;

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
                    return part ? <span key={idx} className="whitespace-pre-wrap">{part}</span> : null;
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
                    {/* Text content */}
                    {renderContent(textContent)}

                    {/* Image thumbnails */}
                    {imageUrls.length > 0 && (
                        <div className={`flex flex-col gap-2 ${textContent ? "mt-2" : ""}`}>
                            {imageUrls.map((url, idx) => (
                                <ImageThumbnail key={idx} url={url} />
                            ))}
                        </div>
                    )}

                    {/* Listing embed */}
                    {message.metadata?.embed_type === "listing" && (
                        <ListingEmbed metadata={message.metadata} />
                    )}

                    {/* Post embed */}
                    {message.metadata?.embed_type === "post" && (
                        <PostEmbed metadata={message.metadata} />
                    )}
                </div>

                {/* Timestamp, metadata & status */}
                <div className={`flex items-center gap-1 text-[10px] mt-1 mx-1 font-medium transition-opacity opacity-0 group-hover:opacity-100 ${isMine ? "justify-end" : "justify-start text-[var(--muted)]"}`}>
                    <span className={isMine ? "text-[var(--accent)]" : ""}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <StatusIndicator status={effectiveStatus} isMine={isMine} />
                </div>
            </div>
        </div>
    );
}
