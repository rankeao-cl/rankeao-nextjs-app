"use client";

import { useState } from "react";
import { ArrowUpRightFromSquare, ShoppingCart } from "@gravity-ui/icons";
import type { ChatMessage, MessageStatus } from "@/lib/types/chat";

interface ChatMessageBubbleProps {
    message: ChatMessage;
    isMine: boolean;
    showHeader: boolean;
    status?: MessageStatus;
    isGroup?: boolean;
}

const IMAGE_URL_REGEX = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?/gi;

function StatusIndicator({ status, isMine }: { status?: MessageStatus; isMine: boolean }) {
    if (!isMine) return null;
    const s = status || "sent";

    if (s === "sent") {
        return <span style={{ color: "#888891", fontSize: 10 }}>&#10003;</span>;
    }
    if (s === "delivered") {
        return <span style={{ color: "#888891", fontSize: 10 }}>&#10003;&#10003;</span>;
    }
    // read
    return <span style={{ color: "#3B82F6", fontSize: 10 }}>&#10003;&#10003;</span>;
}

function ImageThumbnail({ url }: { url: string }) {
    const [previewOpen, setPreviewOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setPreviewOpen(true)}
                style={{
                    display: "block",
                    borderRadius: 12,
                    overflow: "hidden",
                    maxWidth: 260,
                    border: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer",
                    marginTop: 4,
                    padding: 0,
                    background: "transparent",
                }}
            >
                <img
                    src={url}
                    alt="Imagen compartida"
                    style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: 200,
                        objectFit: "cover",
                        display: "block",
                    }}
                    loading="lazy"
                />
            </button>

            {/* Full-screen preview overlay */}
            {previewOpen && (
                <div
                    onClick={() => setPreviewOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(0,0,0,0.85)",
                        backdropFilter: "blur(8px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                    }}
                >
                    <img
                        src={url}
                        alt="Imagen completa"
                        style={{
                            maxWidth: "90vw",
                            maxHeight: "85vh",
                            borderRadius: 12,
                            objectFit: "contain",
                        }}
                    />
                </div>
            )}
        </>
    );
}

function ListingEmbed({ metadata }: { metadata: ChatMessage["metadata"] }) {
    if (!metadata || metadata.embed_type !== "listing") return null;

    return (
        <div style={{
            marginTop: 8,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(26,26,30,0.6)",
            overflow: "hidden",
            maxWidth: 280,
        }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 10 }}>
                {metadata.image_url && (
                    <img
                        src={metadata.image_url}
                        alt={metadata.product_name || "Producto"}
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 8,
                            objectFit: "cover",
                            border: "1px solid rgba(255,255,255,0.06)",
                            flexShrink: 0,
                        }}
                    />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#F2F2F2",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}>
                        {metadata.product_name || "Producto"}
                    </p>
                    {metadata.price && (
                        <p style={{ fontSize: 15, fontWeight: 800, color: "#3B82F6", margin: 0, marginTop: 2 }}>
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
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "8px 10px",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#3B82F6",
                        textDecoration: "none",
                    }}
                >
                    <ShoppingCart style={{ width: 14, height: 14 }} />
                    Ver en Marketplace
                    <ArrowUpRightFromSquare style={{ width: 12, height: 12 }} />
                </a>
            )}
        </div>
    );
}

function PostEmbed({ metadata }: { metadata: ChatMessage["metadata"] }) {
    if (!metadata || metadata.embed_type !== "post") return null;

    return (
        <div style={{
            marginTop: 8,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(26,26,30,0.6)",
            padding: 10,
            maxWidth: 280,
        }}>
            {metadata.author_name && (
                <p style={{ fontSize: 12, fontWeight: 700, color: "#F2F2F2", margin: 0, marginBottom: 4 }}>
                    {metadata.author_name}
                </p>
            )}
            {metadata.post_text && (
                <p style={{
                    fontSize: 12,
                    color: "#888891",
                    margin: 0,
                    lineHeight: "18px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                }}>
                    {metadata.post_text}
                </p>
            )}
            {metadata.post_url && (
                <a
                    href={metadata.post_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#3B82F6",
                        marginTop: 8,
                        textDecoration: "none",
                    }}
                >
                    Ver publicacion
                    <ArrowUpRightFromSquare style={{ width: 12, height: 12 }} />
                </a>
            )}
        </div>
    );
}

export default function ChatMessageBubble({ message, isMine, showHeader, status, isGroup }: ChatMessageBubbleProps) {
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

    const effectiveStatus = status || message.status || "sent";

    const isDeleted = message.is_deleted;
    const isGrouped = !showHeader; // same sender as previous

    // Parsing URLs to show as clickable links
    const renderContent = (text: string) => {
        if (!text) return null;
        if (!text.includes("http")) {
            return (
                <p style={{
                    whiteSpace: "pre-wrap",
                    margin: 0,
                    fontSize: 15,
                    lineHeight: "21px",
                    color: isMine ? "#FFFFFF" : "#F2F2F2",
                }}>
                    {text}
                </p>
            );
        }

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);

        return (
            <div>
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
                                style={{
                                    display: "block",
                                    padding: 10,
                                    borderRadius: 12,
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    background: "rgba(26,26,30,0.5)",
                                    fontSize: 13,
                                    textDecoration: "none",
                                    marginTop: 4,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <span style={{ fontSize: 16 }}>{isMarketplace ? "🛒" : isComunidad ? "⚔️" : "🔗"}</span>
                                    <span style={{ fontWeight: 700, color: "#3B82F6", fontSize: 13 }}>
                                        {isMarketplace ? "Producto de Tienda" : isComunidad ? "Comunidad / Torneo" : "Enlace Externo"}
                                    </span>
                                </div>
                                <p style={{
                                    fontSize: 11,
                                    color: "#888891",
                                    margin: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: 220,
                                }}>
                                    {part}
                                </p>
                                <p style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#F2F2F2",
                                    margin: 0,
                                    marginTop: 6,
                                    opacity: 0.8,
                                }}>
                                    Ver detalle &rarr;
                                </p>
                            </a>
                        );
                    }
                    return part ? (
                        <span key={idx} style={{
                            whiteSpace: "pre-wrap",
                            fontSize: 15,
                            lineHeight: "21px",
                            color: isMine ? "#FFFFFF" : "#F2F2F2",
                        }}>
                            {part}
                        </span>
                    ) : null;
                })}
            </div>
        );
    };

    // Deleted message
    if (isDeleted) {
        return (
            <div style={{
                display: "flex",
                flexDirection: isMine ? "row-reverse" : "row",
                gap: isMine ? 0 : 8,
                marginBottom: isGrouped ? 2 : 6,
                maxWidth: "80%",
                alignSelf: isMine ? "flex-end" : "flex-start",
                marginLeft: isMine ? "auto" : 8,
                marginRight: isMine ? 0 : "auto",
            }}>
                <div style={{
                    background: "rgba(26,26,30,0.50)",
                    borderRadius: 18,
                    paddingLeft: 14,
                    paddingRight: 14,
                    paddingTop: 8,
                    paddingBottom: 8,
                }}>
                    <p style={{
                        margin: 0,
                        color: "#888891",
                        fontStyle: "italic",
                        fontSize: 14,
                    }}>
                        Mensaje eliminado
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: isMine ? "row-reverse" : "row",
            gap: isMine ? 0 : 8,
            marginBottom: isGrouped ? 2 : 6,
            maxWidth: "80%",
            alignSelf: isMine ? "flex-end" : "flex-start",
            marginLeft: isMine ? "auto" : 8,
            marginRight: isMine ? 0 : "auto",
        }}>
            {/* Avatar (other only) */}
            {!isMine && (
                <div style={{ width: 32, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    {showHeader ? (
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            background: "#1A1A1E",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                        }}>
                            {message.sender_avatar_url ? (
                                <img
                                    src={message.sender_avatar_url}
                                    alt={message.sender_username || ""}
                                    style={{ width: 32, height: 32, borderRadius: 16, objectFit: "cover" }}
                                />
                            ) : (
                                <span style={{ color: "#F2F2F2", fontSize: 12, fontWeight: 600 }}>
                                    {message.sender_username?.charAt(0).toUpperCase() || "U"}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div style={{ width: 32, height: 32 }} />
                    )}
                </div>
            )}

            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMine ? "flex-end" : "flex-start",
            }}>
                {/* Sender name (other, group/showHeader) */}
                {!isMine && showHeader && (
                    <span style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#888891",
                        marginBottom: 3,
                        marginLeft: 4,
                        letterSpacing: 0.3,
                    }}>
                        {message.sender_username || "Usuario"}
                    </span>
                )}

                {/* Bubble */}
                <div style={{
                    background: isMine ? "#2C2C30" : "#1A1A1E",
                    borderRadius: 18,
                    ...(showHeader
                        ? { borderBottomRightRadius: isMine ? 4 : 18, borderBottomLeftRadius: isMine ? 18 : 4 }
                        : {}),
                    paddingLeft: 14,
                    paddingRight: 14,
                    paddingTop: 8,
                    paddingBottom: 8,
                    border: isMine ? "none" : "1px solid rgba(255,255,255,0.06)",
                }}>
                    {/* Text content */}
                    {renderContent(textContent)}

                    {/* Image thumbnails */}
                    {imageUrls.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: textContent ? 6 : 0 }}>
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

                    {/* Meta row: time + status — INSIDE bubble */}
                    <div style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: isMine ? "flex-end" : "flex-start",
                        gap: 4,
                        marginTop: 4,
                    }}>
                        <span style={{ fontSize: 10, fontWeight: 500, color: isMine ? "rgba(255,255,255,0.60)" : "#888891" }}>
                            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <StatusIndicator status={effectiveStatus} isMine={isMine} />
                    </div>
                </div>
            </div>
        </div>
    );
}
