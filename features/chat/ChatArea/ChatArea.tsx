import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "@heroui/react/toast";

import { PaperPlane, Comment, ChevronLeft, ChevronsDown, Paperclip, Xmark, Persons, Gear, Shield } from "@gravity-ui/icons";
import { mapErrorMessage } from "@/lib/api/errors";
import { getChatMessages, sendChatMessage } from "@/lib/api/chat";
import { useChatWebSocket, type ChatPresenceEvent, type ChatAckEvent } from "@/lib/hooks/use-chat";
import { useAuth } from "@/lib/hooks/use-auth";
import type { Channel, ChannelMember, ChatMessage } from "@/lib/types/chat";
import ChatMessageBubble from "@/features/chat/ChatMessageBubble";
import ChatSettingsModal, { type ChatSettings, DEFAULT_CHAT_SETTINGS } from "@/features/chat/ChatSettingsModal";

function loadChatSettings(): ChatSettings {
    try {
        const raw = localStorage.getItem("rankeao.chat.settings");
        if (raw) return { ...DEFAULT_CHAT_SETTINGS, ...JSON.parse(raw) };
    } catch (error: unknown) {
        console.warn("No se pudo cargar la configuracion del chat", error);
    }
    return DEFAULT_CHAT_SETTINGS;
}

interface ChatAreaProps {
    selectedChannel: Channel | null;
    onBack?: () => void;
    onPresenceUpdate?: (channelId: string, user: { id: string; username: string }, isOnline: boolean) => void;
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

function createClientMessageId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ChatArea({ selectedChannel, onBack, onPresenceUpdate }: ChatAreaProps) {
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

    const activeBubbleBg = chatSettings.theme === "green" ? "#25D366" : "var(--surface)";

    // Members panel state (CLAN rooms)
    const [showMembersPanel, setShowMembersPanel] = useState(false);

    // Typing indicator state
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Textarea ref for auto-resize
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<ChatMessage[]>([]);
    const pendingAcksRef = useRef<Map<string, { tempId: string; channelId: string }>>(new Map());
    const pollInterval = useRef<NodeJS.Timeout | null>(null);
    const [presenceByChannel, setPresenceByChannel] = useState<Record<string, Record<string, boolean>>>({});

    const wsToken = session?.accessToken ?? null;

    const handleWsMessage = useCallback((msg: ChatMessage, channelId: string) => {
        if (!selectedChannel?.id || channelId !== selectedChannel.id) return;

        const formatted: ChatMessage = {
            ...msg,
            sender_id: msg.sender?.id || msg.sender_id,
            sender_username: msg.sender?.username || msg.sender_username,
            sender_avatar_url: msg.sender?.avatar_url || msg.sender_avatar_url,
        };

        setMessages(prev => {
            if (prev.some(m => m.id === formatted.id)) return prev;
            const updated = [...prev, formatted];
            messagesRef.current = updated;
            return updated;
        });

        const isMyMessage = (myUsername && formatted.sender_username === myUsername) || (myUserId && formatted.sender_id === myUserId);
        if (isMyMessage || isAtBottomRef.current) {
            setTimeout(scrollToBottom, 50);
        } else {
            setNewMessagesCount(prev => prev + 1);
        }
    }, [myUsername, myUserId, selectedChannel?.id]);

    const handleWsPresence = useCallback((event: ChatPresenceEvent) => {
        if (!event.channelId || !event.user?.id) return;

        const isOnline = event.type === "user_joined";
        setPresenceByChannel(prev => {
            const currentChannel = prev[event.channelId] || {};
            if (currentChannel[event.user.id] === isOnline) return prev;
            return {
                ...prev,
                [event.channelId]: {
                    ...currentChannel,
                    [event.user.id]: isOnline,
                },
            };
        });

        onPresenceUpdate?.(
            event.channelId,
            { id: event.user.id, username: event.user.username },
            isOnline,
        );
    }, [onPresenceUpdate]);

    const handleWsAck = useCallback((event: ChatAckEvent) => {
        const pending = pendingAcksRef.current.get(event.clientMsgId);
        if (!pending) return;
        pendingAcksRef.current.delete(event.clientMsgId);
        if (pending.channelId !== event.channelId) return;

        setMessages(prev => {
            const tempIndex = prev.findIndex(m => m.id === pending.tempId);
            if (tempIndex === -1) return prev;

            if (prev.some(m => m.id === event.messageId)) {
                const withoutTemp = prev.filter(m => m.id !== pending.tempId);
                messagesRef.current = withoutTemp;
                return withoutTemp;
            }

            const updated = [...prev];
            updated[tempIndex] = {
                ...updated[tempIndex],
                id: event.messageId,
                status: "delivered",
            };
            messagesRef.current = updated;
            return updated;
        });
    }, []);

    const wsEnabled = !!selectedChannel?.id;
    const { connected: wsConnected, subscribe, unsubscribe, sendMessage: wsSendMessage } = useChatWebSocket(
        wsToken,
        {
            onMessage: handleWsMessage,
            onPresence: handleWsPresence,
            onAck: handleWsAck,
        },
        wsEnabled,
    );

    const fetchMessages = useCallback(async (channelId: string, isInitial = false) => {
        if (!session?.accessToken) return;
        try {
            const val = await getChatMessages(channelId, { limit: 50 }, session.accessToken);
            const rawMessages = val?.data?.messages || val?.messages || (Array.isArray(val) ? val : []);

            if (Array.isArray(rawMessages)) {
                const formattedMessages = [...rawMessages].map((msg: ChatMessage) => ({
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
        } catch (err: unknown) {
            console.error("Error obteniendo mensajes:", err);
        }
    }, [session?.accessToken, myUsername, myUserId]);

    useEffect(() => {
        if (!selectedChannel?.id) return;
        subscribe(selectedChannel.id);
        return () => unsubscribe(selectedChannel.id);
    }, [selectedChannel?.id, subscribe, unsubscribe]);

    useEffect(() => {
        const channelId = selectedChannel?.id;
        if (!channelId) return;

        setNewMessagesCount(0);
        setIsAtBottom(true);
        isAtBottomRef.current = true;
        messagesRef.current = [];
        pendingAcksRef.current.clear();
        setLoadingMessages(true);
        setAttachedImage(null);
        setImagePreviewUrl(null);
        fetchMessages(channelId, true).finally(() => {
            setLoadingMessages(false);
            setTimeout(scrollToBottom, 100);
        });

        // Fallback polling while socket is disconnected.
        if (pollInterval.current) clearInterval(pollInterval.current);
        if (!wsConnected) {
            pollInterval.current = setInterval(() => {
                fetchMessages(channelId);
            }, 3000);
        }

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [selectedChannel?.id, wsConnected, fetchMessages]);

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
        if (!chatSettings.enterToSend) return;
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

            // Use WebSocket for all channels when connected, fallback to REST otherwise.
            if (wsConnected) {
                const clientMsgId = createClientMessageId();
                const tempId = `temp-${clientMsgId}`;
                const optimistic: ChatMessage = {
                    id: tempId,
                    channel_id: selectedChannel.id,
                    sender_id: myUserId || "",
                    sender_username: myUsername,
                    content,
                    status: "sent",
                    created_at: new Date().toISOString(),
                };

                setMessages(prev => {
                    const updated = [...prev, optimistic];
                    messagesRef.current = updated;
                    return updated;
                });
                pendingAcksRef.current.set(clientMsgId, { tempId, channelId: selectedChannel.id });
                wsSendMessage(selectedChannel.id, content, undefined, clientMsgId);
            } else {
                await sendChatMessage(selectedChannel.id, { content }, session.accessToken);
                await fetchMessages(selectedChannel.id);
            }

            setInputValue("");
            handleRemoveImage();

            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }

            setTimeout(scrollToBottom, 50);
        } catch (err: unknown) {
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
                background: "var(--background)",
            }}>
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    border: "1px solid var(--border)",
                    background: "var(--surface-solid)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--muted)",
                    fontSize: 28,
                }}>
                    <Comment />
                </div>
                <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
                        Rankeao Chat
                    </p>
                    <p style={{ fontSize: 12, color: "var(--muted)", maxWidth: 240, lineHeight: "18px" }}>
                        Selecciona una sala o un mensaje directo para comenzar a conversar.
                    </p>
                </div>
            </div>
        );
    }

    // ── Resolve channel metadata ──
    const channelPresence = presenceByChannel[selectedChannel.id] || {};
    const channelMembers: ChannelMember[] = (selectedChannel.members || []).map((member) => {
        const memberId = member.user_id || member.id;
        if (!memberId || channelPresence[memberId] === undefined) return member;
        return {
            ...member,
            is_online: channelPresence[memberId],
        };
    });

    const isOnline = selectedChannel.type === "DM"
        ? channelMembers.some(m => m.username !== myUsername && m.is_online)
        : false;

    const isGroup = selectedChannel.type === "GROUP";
    const isClan = selectedChannel.type === "CLAN";
    const isCommunity = selectedChannel.type === "COMMUNITY";
    const memberCount = channelMembers.length || 0;

    let displayName = selectedChannel.name || (selectedChannel.type === "DM" ? "Mensaje Directo" : "Sala de Chat");
    let displayAvatar: string | undefined = undefined;

    if (selectedChannel.type === "DM" && myUsername) {
        const otherMember = channelMembers.find(m => m.username !== myUsername);
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
            background: "var(--background)",
        }}>
            {/* ── Header ── */}
            <div style={{
                height: 64,
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                paddingRight: 12,
                gap: 10,
                background: "var(--background)",
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
                        background: "var(--surface-solid)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                    }}
                    className="md:hidden"
                >
                    <ChevronLeft style={{ width: 20, height: 20, color: "var(--foreground)" }} />
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
                            color: "var(--accent)",
                        }}>
                            <Shield style={{ width: 20, height: 20 }} />
                        </div>
                    ) : isGroup ? (
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            background: "var(--surface-solid)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--muted)",
                        }}>
                            <Persons style={{ width: 20, height: 20 }} />
                        </div>
                    ) : (
                        <>
                            {displayAvatar ? (
                                <Image
                                    src={displayAvatar}
                                    alt={displayName}
                                    width={40}
                                    height={40}
                                    unoptimized
                                    style={{
                                        borderRadius: 20,
                                        objectFit: "cover",
                                        background: "var(--surface-solid)",
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    background: "var(--surface-solid)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--foreground)",
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
                                    border: "2px solid var(--background)",
                                    background: isOnline ? "var(--success)" : "var(--muted)",
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
                            color: "var(--foreground)",
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
                                color: "var(--accent)",
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
                        color: isClan ? "var(--accent)" : isGroup ? "var(--muted)" : (isOnline ? "var(--success)" : "var(--muted)"),
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        margin: 0,
                        marginTop: 2,
                    }}>
                        {isCommunity
                            ? `Sala comunitaria${wsConnected ? " · En vivo" : ""}`
                            : isClan
                                ? `Chat del Clan · ${memberCount} miembros${wsConnected ? " · En vivo" : ""}`
                                : isGroup
                                    ? `Chat Grupal (${memberCount} miembros)`
                                    : (isOnline ? "En línea" : (selectedChannel.type === "DM" ? "Desconectado" : selectedChannel.type))
                        }
                    </p>
                </div>

                {/* Members panel toggle (CLAN only) */}
                {isClan && (
                    <button
                        onClick={() => setShowMembersPanel(!showMembersPanel)}
                        aria-label="Miembros"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            background: showMembersPanel ? "rgba(59,130,246,0.15)" : "var(--surface-solid)",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                        }}
                    >
                        <Persons style={{ width: 18, height: 18, color: showMembersPanel ? "var(--accent)" : "var(--muted)" }} />
                    </button>
                )}

                {/* Settings button */}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    aria-label="Configuración"
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        background: "var(--surface-solid)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                    }}
                >
                    <Gear style={{ width: 18, height: 18, color: "var(--muted)" }} />
                </button>
            </div>

            {/* ── Messages + Members panel ── */}
            <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

            {/* Messages area */}
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
                                <div style={{ width: 32, height: 32, borderRadius: 16, background: "var(--surface-solid)", flexShrink: 0 }} />
                                <div style={{ width: 200, height: 48, borderRadius: 18, background: "var(--surface-solid)" }} />
                            </div>
                            <div style={{ display: "flex", gap: 8, maxWidth: "70%", alignSelf: "flex-end", flexDirection: "row-reverse" }}>
                                <div style={{ width: 180, height: 40, borderRadius: 18, background: "var(--surface-solid)" }} />
                            </div>
                            <div style={{ display: "flex", gap: 8, maxWidth: "70%" }}>
                                <div style={{ width: 32, height: 32, borderRadius: 16, background: "var(--surface-solid)", flexShrink: 0 }} />
                                <div style={{ width: 240, height: 56, borderRadius: 18, background: "var(--surface-solid)" }} />
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
                                background: "var(--surface-solid)",
                                border: "1px solid var(--border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--muted)",
                                fontSize: 28,
                                marginBottom: 12,
                            }}>
                                <Comment />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                                Aún no hay mensajes
                            </p>
                            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, marginTop: 4 }}>
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
                                        color: "var(--muted)",
                                        background: "var(--surface-solid)",
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
                                border: "1px solid var(--border)",
                                background: newMessagesCount > 0 ? "var(--foreground)" : "var(--surface-solid)",
                                color: newMessagesCount > 0 ? "var(--background)" : "var(--foreground)",
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

            {/* ── Members panel (CLAN only) ── */}
            {isClan && showMembersPanel && (() => {
                const members = channelMembers;
                const online = members.filter(m => m.is_online);
                const offline = members.filter(m => !m.is_online);

                const renderMember = (m: import("@/lib/types/chat").ChannelMember) => (
                    <div key={m.user_id || m.id || m.username} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px" }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            {m.avatar_url ? (
                                <Image src={m.avatar_url} alt={m.username} width={32} height={32} className="object-cover rounded-full" />
                            ) : (
                                <div style={{ width: 32, height: 32, borderRadius: 16, background: "var(--surface-solid)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>
                                    {m.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span style={{
                                position: "absolute", bottom: 0, right: 0,
                                width: 10, height: 10, borderRadius: 5,
                                border: "2px solid var(--background)",
                                background: m.is_online ? "var(--success)" : "var(--muted)",
                            }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {m.username}
                            </p>
                            {m.role && m.role !== "MEMBER" && (
                                <span style={{
                                    fontSize: 9, fontWeight: 700, color: m.role === "ADMIN" ? "var(--warning)" : "var(--accent)",
                                    backgroundColor: m.role === "ADMIN" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)",
                                    padding: "1px 5px", borderRadius: 3,
                                }}>
                                    {m.role}
                                </span>
                            )}
                        </div>
                    </div>
                );

                return (
                    <div className="hidden md:flex" style={{
                        width: 240, flexShrink: 0,
                        borderLeft: "1px solid var(--border)",
                        background: "var(--background)",
                        flexDirection: "column",
                        overflowY: "auto",
                    }}>
                        <div style={{ padding: "14px 12px 8px", borderBottom: "1px solid var(--border)" }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Miembros ({members.length})
                            </p>
                        </div>
                        {online.length > 0 && (
                            <div style={{ paddingTop: 8 }}>
                                <p style={{ fontSize: 10, fontWeight: 600, color: "var(--success)", padding: "0 12px 4px", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    En linea — {online.length}
                                </p>
                                {online.map(renderMember)}
                            </div>
                        )}
                        {offline.length > 0 && (
                            <div style={{ paddingTop: 8 }}>
                                <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", padding: "0 12px 4px", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    Desconectados — {offline.length}
                                </p>
                                {offline.map(renderMember)}
                            </div>
                        )}
                    </div>
                );
            })()}

            </div>

            {/* ── Typing indicator ── */}
            {isTyping && (
                <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8, flexShrink: 0 }}>
                    <p style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        fontWeight: 500,
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                    }}>
                        <span style={{ display: "inline-flex", gap: 2 }}>
                            <span className="animate-bounce" style={{ width: 5, height: 5, borderRadius: 3, background: "var(--muted)", animationDelay: "0ms" }} />
                            <span className="animate-bounce" style={{ width: 5, height: 5, borderRadius: 3, background: "var(--muted)", animationDelay: "150ms" }} />
                            <span className="animate-bounce" style={{ width: 5, height: 5, borderRadius: 3, background: "var(--muted)", animationDelay: "300ms" }} />
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
                        background: "var(--surface-solid)",
                        border: "1px solid var(--border)",
                    }}>
                        <Image
                            src={imagePreviewUrl}
                            alt="Vista previa"
                            width={64}
                            height={64}
                            unoptimized
                            style={{
                                borderRadius: 8,
                                objectFit: "cover",
                                border: "1px solid var(--border)",
                            }}
                        />
                        <button
                            onClick={handleRemoveImage}
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                background: "var(--surface-solid)",
                                border: "1px solid var(--border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: "var(--muted)",
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
                borderTop: "1px solid var(--border)",
                background: "var(--background)",
                flexShrink: 0,
            }}>
                <form
                    onSubmit={handleSend}
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 0,
                        background: "var(--surface-solid)",
                        border: "1px solid var(--border)",
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
                            color: "var(--muted)",
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
                            color: "var(--foreground)",
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
                            background: hasText ? "var(--foreground)" : "transparent",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: hasText ? "pointer" : "default",
                            color: hasText ? "var(--background)" : "var(--muted)",
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
