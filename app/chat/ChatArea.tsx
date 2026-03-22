import { useEffect, useRef, useState } from "react";
import { toast } from "@heroui/react";
import { PaperPlane, Comment, ChevronLeft, ChevronsDown, Paperclip, Xmark, Persons, Gear, Shield } from "@gravity-ui/icons";
import { mapErrorMessage } from "@/lib/api/errors";
import { getChatMessages, sendChatMessage } from "@/lib/api/chat";
import { useAuth } from "@/context/AuthContext";
import type { Channel, ChatMessage } from "@/lib/types/chat";
import ChatMessageBubble from "./ChatMessageBubble";
import ChatSettingsModal, { type ChatSettings, DEFAULT_CHAT_SETTINGS } from "./ChatSettingsModal";

function loadChatSettings(): ChatSettings {
    try {
        const raw = localStorage.getItem("rankeao.chat.settings");
        if (raw) return { ...DEFAULT_CHAT_SETTINGS, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_CHAT_SETTINGS;
}

interface ChatAreaProps {
    selectedChannel: Channel | null;
    onBack?: () => void;
}

function getJwtField(token: string | undefined, field: string): string | undefined {
    if (!token) return undefined;
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return undefined;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        return payload[field] as string | undefined;
    } catch {
        return undefined;
    }
}

/** Group messages by date for date separator rendering */
function groupMessagesByDate(messages: ChatMessage[]): { date: string; messages: ChatMessage[] }[] {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";
    for (const msg of messages) {
        const d = new Date(msg.created_at).toLocaleDateString("es-CL", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        if (d !== currentDate) {
            currentDate = d;
            groups.push({ date: d, messages: [msg] });
        } else {
            groups[groups.length - 1].messages.push(msg);
        }
    }
    return groups;
}

export default function ChatArea({ selectedChannel, onBack }: ChatAreaProps) {
    const { session } = useAuth();

    const myUsername = session?.username || getJwtField(session?.accessToken, "usr") || getJwtField(session?.accessToken, "username");
    const myUserId = getJwtField(session?.accessToken, "sub") || getJwtField(session?.accessToken, "user_id");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const isAtBottomRef = useRef(true);

    // Image attachment state
    const [attachedImage, setAttachedImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Settings modal + chat settings
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [chatSettings, setChatSettings] = useState<ChatSettings>(DEFAULT_CHAT_SETTINGS);

    useEffect(() => {
        setChatSettings(loadChatSettings());
    }, []);

    const handleChatSettingsChange = (s: ChatSettings) => {
        setChatSettings(s);
    };

    const activeFontSize = (() => {
        const map: Record<string, number> = { small: 13, medium: 15, large: 17, xlarge: 20 };
        return map[chatSettings.fontSize] ?? 15;
    })();

    const activeBubbleBg = chatSettings.theme === "green" ? "#25D366" : "#2C2C30";

    // Typing indicator state
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Textarea ref for auto-resize
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<ChatMessage[]>([]);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    const fetchMessages = async (channelId: string, isInitial = false) => {
        if (!session?.accessToken) return;
        try {
            const val = await getChatMessages(channelId, { limit: 50 }, session.accessToken) as any;
            const rawMessages = val?.data?.messages || val?.messages || (Array.isArray(val) ? val : []);

            if (Array.isArray(rawMessages)) {
                const formattedMessages = [...rawMessages].map((msg: any) => ({
                    ...msg,
                    sender_id: msg.sender?.id || msg.sender_id,
                    sender_username: msg.sender?.username || msg.sender_username,
                    sender_avatar_url: msg.sender?.avatar_url || msg.sender_avatar_url
                })).reverse();

                if (!isInitial && messagesRef.current.length > 0) {
                    const newMsgs = formattedMessages.filter(msg => !messagesRef.current.some(p => p.id === msg.id));

                    if (newMsgs.length > 0) {
                        const lastMsg = formattedMessages[formattedMessages.length - 1];
                        const isMyMessage = (myUsername && lastMsg.sender_username === myUsername) || (myUserId && lastMsg.sender_id === myUserId);

                        if (isMyMessage || isAtBottomRef.current) {
                            setTimeout(scrollToBottom, 50);
                        } else {
                            setNewMessagesCount(prev => prev + newMsgs.length);
                        }
                    }
                }

                setMessages(formattedMessages);
                messagesRef.current = formattedMessages;
            }
        } catch (err: any) {
            console.error("Error obteniendo mensajes:", err);
        }
    };

    useEffect(() => {
        if (!selectedChannel) return;

        setNewMessagesCount(0);
        setIsAtBottom(true);
        isAtBottomRef.current = true;
        messagesRef.current = [];
        setLoadingMessages(true);
        setAttachedImage(null);
        setImagePreviewUrl(null);
        fetchMessages(selectedChannel.id, true).finally(() => {
            setLoadingMessages(false);
            setTimeout(scrollToBottom, 100);
        });

        if (pollInterval.current) clearInterval(pollInterval.current);
        pollInterval.current = setInterval(() => {
            fetchMessages(selectedChannel.id);
        }, 3000);

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [selectedChannel?.id]);

    useEffect(() => {
        return () => {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        };
    }, [imagePreviewUrl]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setNewMessagesCount(0);
        setIsAtBottom(true);
        isAtBottomRef.current = true;
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 80;
        setIsAtBottom(isBottom);
        isAtBottomRef.current = isBottom;
        if (isBottom) {
            setNewMessagesCount(0);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.danger("Solo se permiten imagenes");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.danger("La imagen no puede superar los 10MB");
            return;
        }

        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);

        setAttachedImage(file);
        setImagePreviewUrl(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setAttachedImage(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleInputChange = (value: string) => {
        setInputValue(value);
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const autoResizeTextarea = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const hasContent = inputValue.trim() || attachedImage;
        if (!hasContent || !selectedChannel || isSending) return;

        setIsSending(true);

        try {
            if (!session?.accessToken) throw new Error("No hay sesion activa.");

            let content = inputValue.trim();

            if (attachedImage) {
                const imageNote = imagePreviewUrl
                    ? `[Imagen adjunta: ${attachedImage.name}]`
                    : "";
                content = content ? `${content}\n${imageNote}` : imageNote;
            }

            await sendChatMessage(selectedChannel.id, { content }, session.accessToken);
            setInputValue("");
            handleRemoveImage();

            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }

            await fetchMessages(selectedChannel.id);
            setTimeout(scrollToBottom, 50);
        } catch (err: any) {
            console.error("Error al enviar", err);
            toast.danger("Error al enviar mensaje", {
                description: mapErrorMessage(err),
            });
        } finally {
            setIsSending(false);
        }
    };

    // ── No channel selected ──
    if (!selectedChannel) {
        return (
            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: 24,
                background: "#000000",
            }}>
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "#1A1A1E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#888891",
                    fontSize: 28,
                }}>
                    <Comment />
                </div>
                <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#F2F2F2", marginBottom: 4 }}>
                        Rankeao Chat
                    </p>
                    <p style={{ fontSize: 12, color: "#888891", maxWidth: 240, lineHeight: "18px" }}>
                        Selecciona una sala o un mensaje directo para comenzar a conversar.
                    </p>
                </div>
            </div>
        );
    }

    // ── Resolve channel metadata ──
    const isOnline = selectedChannel.type === "DM"
        ? selectedChannel.members?.some(m => m.username !== myUsername && m.is_online)
        : false;

    const isGroup = selectedChannel.type === "GROUP";
    const isClan = selectedChannel.type === "CLAN";
    const memberCount = selectedChannel.members?.length || 0;

    let displayName = selectedChannel.name || (selectedChannel.type === "DM" ? "Mensaje Directo" : "Sala de Chat");
    let displayAvatar: string | undefined = undefined;

    if (selectedChannel.type === "DM" && myUsername) {
        const otherMember = selectedChannel.members?.find(m => m.username !== myUsername);
        if (otherMember) {
            displayName = otherMember.username;
            displayAvatar = otherMember.avatar_url;
        }
    }

    const initials = displayName?.slice(0, 2).toUpperCase() || "CH";

    const hasText = inputValue.trim().length > 0 || !!attachedImage;

    const dateGroups = groupMessagesByDate(messages);

    return (
        <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            height: "100%",
            maxHeight: "100%",
            overflow: "hidden",
            position: "relative",
            background: "#000000",
        }}>
            {/* ── Header ── */}
            <div style={{
                height: 64,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                paddingRight: 12,
                gap: 10,
                background: "#000000",
                flexShrink: 0,
            }}>
                {/* Back button */}
                <button
                    onClick={onBack}
                    aria-label="Volver"
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        background: "#1A1A1E",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                    }}
                    className="md:hidden"
                >
                    <ChevronLeft style={{ width: 20, height: 20, color: "#F2F2F2" }} />
                </button>

                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                    {isClan ? (
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            background: "rgba(59,130,246,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#3B82F6",
                        }}>
                            <Shield style={{ width: 20, height: 20 }} />
                        </div>
                    ) : isGroup ? (
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            background: "#1A1A1E",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#888891",
                        }}>
                            <Persons style={{ width: 20, height: 20 }} />
                        </div>
                    ) : (
                        <>
                            {displayAvatar ? (
                                <img
                                    src={displayAvatar}
                                    alt={displayName}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        objectFit: "cover",
                                        background: "#1A1A1E",
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    background: "#1A1A1E",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#FFFFFF",
                                    fontSize: 14,
                                    fontWeight: 700,
                                }}>
                                    {initials}
                                </div>
                            )}
                            {selectedChannel.type === "DM" && (
                                <span style={{
                                    position: "absolute",
                                    bottom: 0,
                                    right: 0,
                                    width: 12,
                                    height: 12,
                                    borderRadius: 6,
                                    border: "2px solid #000000",
                                    background: isOnline ? "#23A559" : "#888891",
                                }} />
                            )}
                        </>
                    )}
                </div>

                {/* Name & status */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#F2F2F2",
                            lineHeight: "18px",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}>
                            {displayName}
                        </p>
                        {isClan && (
                            <span style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: "#3B82F6",
                                backgroundColor: "rgba(59,130,246,0.15)",
                                padding: "2px 6px",
                                borderRadius: 4,
                                flexShrink: 0,
                            }}>
                                CLAN
                            </span>
                        )}
                    </div>
                    <p style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: isClan ? "#3B82F6" : isGroup ? "#888891" : (isOnline ? "#23A559" : "#888891"),
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        margin: 0,
                        marginTop: 2,
                    }}>
                        {isClan
                            ? `Chat del Clan · ${memberCount} miembros`
                            : isGroup
                                ? `Chat Grupal (${memberCount} miembros)`
                                : (isOnline ? "En línea" : (selectedChannel.type === "DM" ? "Desconectado" : selectedChannel.type))
                        }
                    </p>
                </div>

                {/* Settings button */}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    aria-label="Configuración"
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        background: "#1A1A1E",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                    }}
                >
                    <Gear style={{ width: 18, height: 18, color: "#888891" }} />
                </button>
            </div>

            {/* ── Messages area ── */}
            <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    style={{
                        height: "100%",
                        overflowY: "auto",
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 12,
                        paddingBottom: 12,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {loadingMessages && messages.length === 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" }}>
                            {/* Skeleton placeholders */}
                            <div style={{ display: "flex", gap: 8, maxWidth: "70%" }}>
                                <div style={{ width: 32, height: 32, borderRadius: 16, background: "#1A1A1E", flexShrink: 0 }} />
                                <div style={{ width: 200, height: 48, borderRadius: 18, background: "#1A1A1E" }} />
                            </div>
                            <div style={{ display: "flex", gap: 8, maxWidth: "70%", alignSelf: "flex-end", flexDirection: "row-reverse" }}>
                                <div style={{ width: 180, height: 40, borderRadius: 18, background: "#2C2C30" }} />
                            </div>
                            <div style={{ display: "flex", gap: 8, maxWidth: "70%" }}>
                                <div style={{ width: 32, height: 32, borderRadius: 16, background: "#1A1A1E", flexShrink: 0 }} />
                                <div style={{ width: 240, height: 56, borderRadius: 18, background: "#1A1A1E" }} />
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        /* Empty messages state */
                        <div style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                background: "#1A1A1E",
                                border: "1px solid rgba(255,255,255,0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#888891",
                                fontSize: 28,
                                marginBottom: 12,
                            }}>
                                <Comment />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "#F2F2F2", margin: 0 }}>
                                Aún no hay mensajes
                            </p>
                            <p style={{ fontSize: 12, color: "#888891", margin: 0, marginTop: 4 }}>
                                Sé el primero en saludar.
                            </p>
                        </div>
                    ) : (
                        dateGroups.map((group) => (
                            <div key={group.date}>
                                {/* Date separator */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    marginTop: 12,
                                    marginBottom: 12,
                                }}>
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: "#888891",
                                        background: "#1A1A1E",
                                        paddingLeft: 10,
                                        paddingRight: 10,
                                        paddingTop: 4,
                                        paddingBottom: 4,
                                        borderRadius: 999,
                                    }}>
                                        {group.date}
                                    </span>
                                </div>
                                {group.messages.map((msg, i) => {
                                    const isMine = !!(myUsername && msg.sender_username === myUsername) || !!(myUserId && msg.sender_id === myUserId);
                                    const prevMsg = i > 0 ? group.messages[i - 1] : null;
                                    const showHeader = !prevMsg || prevMsg.sender_id !== msg.sender_id;

                                    return (
                                        <ChatMessageBubble
                                            key={msg.id}
                                            message={msg}
                                            isMine={isMine}
                                            showHeader={showHeader}
                                            status={msg.status}
                                            fontSize={activeFontSize}
                                            showTimestamps={chatSettings.showTimestamps}
                                            showAvatars={chatSettings.showAvatars}
                                            bubbleBg={activeBubbleBg}
                                            compactMode={chatSettings.compactMode}
                                            isGroup={isGroup}
                                        />
                                    );
                                })}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} style={{ height: 1 }} />
                </div>

                {/* Scroll to bottom button */}
                {!isAtBottom && (
                    <div style={{
                        position: "absolute",
                        bottom: 12,
                        right: 16,
                        zIndex: 20,
                    }}>
                        <button
                            onClick={scrollToBottom}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                border: "1px solid rgba(255,255,255,0.06)",
                                background: newMessagesCount > 0 ? "#F2F2F2" : "#1A1A1E",
                                color: newMessagesCount > 0 ? "#000000" : "#F2F2F2",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                                fontSize: 12,
                                fontWeight: 700,
                            }}
                        >
                            {newMessagesCount > 0 ? (
                                <span>{newMessagesCount}</span>
                            ) : (
                                <ChevronsDown style={{ width: 20, height: 20 }} />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* ── Typing indicator ── */}
            {isTyping && (
                <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8, flexShrink: 0 }}>
                    <p style={{
                        fontSize: 12,
                        color: "#888891",
                        fontWeight: 500,
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                    }}>
                        <span style={{ display: "inline-flex", gap: 2 }}>
                            <span className="animate-bounce" style={{ width: 5, height: 5, borderRadius: 3, background: "#888891", animationDelay: "0ms" }} />
                            <span className="animate-bounce" style={{ width: 5, height: 5, borderRadius: 3, background: "#888891", animationDelay: "150ms" }} />
                            <span className="animate-bounce" style={{ width: 5, height: 5, borderRadius: 3, background: "#888891", animationDelay: "300ms" }} />
                        </span>
                        escribiendo...
                    </p>
                </div>
            )}

            {/* ── Image preview ── */}
            {imagePreviewUrl && (
                <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8, flexShrink: 0 }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: 8,
                        borderRadius: 12,
                        background: "rgba(26,26,30,0.5)",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                        <img
                            src={imagePreviewUrl}
                            alt="Vista previa"
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 8,
                                objectFit: "cover",
                                border: "1px solid rgba(255,255,255,0.06)",
                            }}
                        />
                        <button
                            onClick={handleRemoveImage}
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                background: "#1A1A1E",
                                border: "1px solid rgba(255,255,255,0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: "#888891",
                            }}
                        >
                            <Xmark style={{ width: 12, height: 12 }} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Input bar ── */}
            <div style={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 12,
                paddingBottom: 16,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                background: "#000000",
                flexShrink: 0,
            }}>
                <form
                    onSubmit={handleSend}
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 0,
                        background: "#1A1A1E",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 999,
                        paddingLeft: 4,
                        paddingRight: 4,
                        paddingTop: 4,
                        paddingBottom: 4,
                    }}
                >
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageSelect}
                        style={{ display: "none" }}
                    />

                    {/* Attachment button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Adjuntar imagen"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            background: "transparent",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#888891",
                            flexShrink: 0,
                        }}
                    >
                        <Paperclip style={{ width: 18, height: 18 }} />
                    </button>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => {
                            handleInputChange(e.target.value);
                            autoResizeTextarea();
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un mensaje..."
                        rows={1}
                        style={{
                            flex: 1,
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            resize: "none",
                            color: "#F2F2F2",
                            fontSize: 14,
                            paddingLeft: 12,
                            paddingRight: 12,
                            paddingTop: 8,
                            paddingBottom: 8,
                            maxHeight: 120,
                            lineHeight: "20px",
                        }}
                        autoComplete="off"
                    />

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={(!inputValue.trim() && !attachedImage) || isSending}
                        aria-label="Enviar"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            background: hasText ? "#F2F2F2" : "transparent",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: hasText ? "pointer" : "default",
                            color: hasText ? "#000000" : "#888891",
                            flexShrink: 0,
                            transition: "background 0.15s, color 0.15s",
                        }}
                    >
                        <PaperPlane style={{ width: 18, height: 18 }} />
                    </button>
                </form>
            </div>

            {/* Settings modal */}
            <ChatSettingsModal
                isOpen={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                channel={selectedChannel}
                onChannelLeft={onBack}
                chatSettings={chatSettings}
                onChatSettingsChange={handleChatSettingsChange}
            />
        </div>
    );
}
