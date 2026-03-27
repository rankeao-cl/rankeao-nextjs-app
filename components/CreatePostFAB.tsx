"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "@heroui/react";
import { Comment, Pencil, Xmark, ChevronLeft, PaperPlane } from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import { getChatChannels, getChatMessages, sendChatMessage, createChannel } from "@/lib/api/chat";
import { autocompleteUsers } from "@/lib/api/social";
import { timeAgo } from "@/lib/utils/format";
import type { Channel, ChannelMember, ChatMessage } from "@/lib/types/chat";

type PanelView = "list" | "chat" | "newchat";

interface UserSuggestion {
    id: string;
    username: string;
    avatar_url?: string;
    name?: string;
}

export default function CreatePostFAB() {
    const { session, status } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<PanelView>("list");

    // Chat view state
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [messageInput, setMessageInput] = useState("");
    const [sending, setSending] = useState(false);

    // New chat view state
    const [newChatSearch, setNewChatSearch] = useState("");
    const [newChatSuggestions, setNewChatSuggestions] = useState<UserSuggestion[]>([]);
    const [newChatLoading, setNewChatLoading] = useState(false);
    const [newChatSelected, setNewChatSelected] = useState<UserSuggestion | null>(null);
    const [newChatCreating, setNewChatCreating] = useState(false);

    const panelRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const newChatInputRef = useRef<HTMLInputElement>(null);
    const myUsername = session?.username;

    // Fetch channels on mount + when panel opens (refresh)
    const fetchChannels = useCallback(() => {
        if (!session?.accessToken) return;
        setLoading(true);
        getChatChannels(undefined, session.accessToken)
            .then((val: any) => {
                const ch = val?.data?.channels || val?.channels || (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
                setChannels(ch);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [session?.accessToken]);

    // Initial fetch for pill button data (avatars + unread count)
    useEffect(() => { fetchChannels(); }, [fetchChannels]);

    // Refresh when panel opens
    useEffect(() => { if (isOpen) fetchChannels(); }, [isOpen, fetchChannels]);

    // Fetch messages when a channel is selected
    useEffect(() => {
        if (!activeChannel || !session?.accessToken) return;
        setLoadingMessages(true);
        getChatMessages(activeChannel.id, undefined, session.accessToken)
            .then((val: any) => {
                const msgs = val?.data?.messages || val?.messages || (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
                setMessages(msgs);
            })
            .catch(() => {})
            .finally(() => setLoadingMessages(false));
    }, [activeChannel, session?.accessToken]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus inputs
    useEffect(() => {
        if (view === "chat") setTimeout(() => inputRef.current?.focus(), 150);
        if (view === "newchat") setTimeout(() => newChatInputRef.current?.focus(), 150);
    }, [view]);

    // New chat user search
    useEffect(() => {
        if (!newChatSearch || newChatSearch.length < 2) {
            setNewChatSuggestions([]);
            return;
        }
        const delay = setTimeout(async () => {
            if (!session?.accessToken) return;
            setNewChatLoading(true);
            try {
                const val = await autocompleteUsers(newChatSearch, session.accessToken) as any;
                const users = val?.data?.users || val?.users || (Array.isArray(val) ? val : []);
                setNewChatSuggestions(users.filter((u: UserSuggestion) => u.username !== session.username));
            } catch {
            } finally {
                setNewChatLoading(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [newChatSearch, session]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handle = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        const timer = setTimeout(() => document.addEventListener("mousedown", handle), 10);
        return () => { clearTimeout(timer); document.removeEventListener("mousedown", handle); };
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handle = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (view === "chat" || view === "newchat") { setView("list"); setActiveChannel(null); setMessages([]); }
                else setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handle);
        return () => window.removeEventListener("keydown", handle);
    }, [isOpen, view]);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setView("list");
            setActiveChannel(null);
            setMessages([]);
            setMessageInput("");
            setNewChatSearch("");
            setNewChatSuggestions([]);
            setNewChatSelected(null);
        }
    }, [isOpen]);

    const totalUnread = useMemo(() => channels.reduce((sum, c) => sum + (c.unread_count ?? 0), 0), [channels]);

    const getDisplayInfo = useCallback((channel: Channel) => {
        let displayName = channel.name || "Chat";
        let avatarUrl: string | undefined;
        let initials = "CH";
        let isOnline = false;
        const isGroup = channel.type === "GROUP";

        if (channel.type === "DM" && myUsername) {
            const other = channel.members?.find((m: ChannelMember) => m.username !== myUsername);
            if (other) {
                displayName = other.username;
                avatarUrl = other.avatar_url;
                initials = other.username.slice(0, 2).toUpperCase();
                isOnline = !!other.is_online;
            }
        } else {
            initials = (channel.name || "CH").slice(0, 2).toUpperCase();
        }

        let lastMsg = "";
        if (channel.last_message?.content) {
            const content = channel.last_message.content;
            const sender = channel.last_message.sender_username || channel.last_message.sender?.username;
            const prefix = sender && sender !== myUsername ? `${sender}: ` : "";
            lastMsg = prefix + (content.length > 35 ? content.slice(0, 35) + "..." : content);
        } else if (channel.type === "DM") {
            lastMsg = isOnline ? "En línea" : "Mensaje directo";
        } else if (isGroup) {
            lastMsg = `Grupo (${channel.members?.length || 0})`;
        } else {
            lastMsg = "Comunidad";
        }

        return { displayName, avatarUrl, initials, isOnline, isGroup, lastMsg };
    }, [myUsername]);

    const handleOpenChat = (channel: Channel) => {
        setActiveChannel(channel);
        setView("chat");
    };

    const handleSend = async () => {
        if (!messageInput.trim() || !activeChannel || !session?.accessToken || sending) return;
        const content = messageInput.trim();
        setMessageInput("");
        setSending(true);

        const optimistic: ChatMessage = {
            id: `temp-${Date.now()}`,
            channel_id: activeChannel.id,
            sender_id: "",
            sender_username: myUsername,
            content,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);

        try {
            const res = await sendChatMessage(activeChannel.id, { content }, session.accessToken);
            const msg = res?.data?.message ?? res?.message;
            if (msg) setMessages(prev => prev.map(m => m.id === optimistic.id ? msg : m));
        } catch {
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setMessageInput(content);
        } finally {
            setSending(false);
        }
    };

    const handleCreateChat = async () => {
        if (!newChatSelected || !session?.accessToken || newChatCreating) return;
        setNewChatCreating(true);
        try {
            const res = await createChannel({ type: "DM", user_ids: [newChatSelected.id] }, session.accessToken);
            const channel = res?.data?.channel ?? res?.channel;
            if (channel) {
                setChannels(prev => [channel, ...prev.filter(c => c.id !== channel.id)]);
                toast.success("Chat creado");
                handleOpenChat(channel);
            }
        } catch (error: any) {
            toast.danger("Error al crear el chat", { description: error.message || "" });
        } finally {
            setNewChatCreating(false);
            setNewChatSearch("");
            setNewChatSuggestions([]);
            setNewChatSelected(null);
        }
    };

    // Recent avatars for the pill button (up to 3 DM contacts)
    const recentAvatars = useMemo(() => {
        const avatars: { url?: string; initials: string }[] = [];
        for (const ch of channels) {
            if (avatars.length >= 3) break;
            if (ch.type === "DM" && myUsername) {
                const other = ch.members?.find((m: ChannelMember) => m.username !== myUsername);
                if (other) avatars.push({ url: other.avatar_url, initials: other.username.slice(0, 2).toUpperCase() });
            }
        }
        return avatars;
    }, [channels, myUsername]);

    if (status !== "authenticated") return null;

    const activeInfo = activeChannel ? getDisplayInfo(activeChannel) : null;

    // ── Shared avatar helper ──
    const renderAvatar = (url: string | undefined, initials: string, size: number) => (
        <div style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: "var(--surface-solid)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--foreground)", fontSize: size * 0.3, fontWeight: 700,
            overflow: "hidden", flexShrink: 0,
        }}>
            {url ? <img src={url} alt="" style={{ width: size, height: size, objectFit: "cover" }} /> : initials}
        </div>
    );

    return (
        <>
            {/* Instagram-style pill FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed right-5 lg:bottom-5 z-50 hidden lg:flex"
                style={{
                    height: 52, borderRadius: 999,
                    backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 1px 8px rgba(0,0,0,0.15)",
                    cursor: "pointer", alignItems: "center", gap: 12,
                    padding: "0 24px",
                    transition: "transform 0.15s, box-shadow 0.15s, bottom 0.2s",
                }}
                aria-label="Mensajes"
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
                {/* Icon with badge */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <PaperPlane style={{ width: 22, height: 22, color: "#FFFFFF" }} />
                    {totalUnread > 0 && (
                        <span style={{
                            position: "absolute", top: -6, right: -10,
                            minWidth: 18, height: 18, borderRadius: 9,
                            backgroundColor: "#EF4444", color: "#FFFFFF",
                            fontSize: 10, fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: "0 4px", border: "2px solid var(--surface-solid)",
                        }}>
                            {totalUnread > 99 ? "99+" : totalUnread}
                        </span>
                    )}
                </div>

                {/* Label */}
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", whiteSpace: "nowrap" }}>
                    Mensajes
                </span>

                {/* Recent avatars */}
                {recentAvatars.length > 0 && (
                    <div style={{ display: "flex", marginLeft: 4 }}>
                        {recentAvatars.map((a, i) => (
                            <div key={i} style={{
                                width: 30, height: 30, borderRadius: 15,
                                backgroundColor: "var(--background)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                overflow: "hidden", flexShrink: 0,
                                marginLeft: i > 0 ? -8 : 0,
                                border: "2px solid var(--surface-solid)",
                                fontSize: 10, fontWeight: 700, color: "var(--muted)",
                            }}>
                                {a.url
                                    ? <img src={a.url} alt="" style={{ width: 30, height: 30, objectFit: "cover" }} />
                                    : a.initials
                                }
                            </div>
                        ))}
                    </div>
                )}
            </button>

            {/* Floating panel */}
            {isOpen && (
                <div
                    ref={panelRef}
                    className="fixed right-5 lg:bottom-[4.5rem] z-[49] hidden lg:flex"
                    style={{
                        width: "calc(100vw - 32px)", maxWidth: 360,
                        height: "65vh",
                        backgroundColor: "var(--background)",
                        borderRadius: 16, border: "1px solid var(--border)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)",
                        flexDirection: "column", overflow: "hidden",
                        animation: "chatPanelIn 0.2s ease-out",
                    }}
                >
                    <style>{`
                        @keyframes chatPanelIn { from { opacity:0; transform:translateY(12px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
                        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
                        @keyframes spin { to { transform:rotate(360deg); } }
                    `}</style>

                    {/* ═══════ LIST VIEW ═══════ */}
                    {view === "list" && (
                        <>
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "14px 16px", borderBottom: "1px solid var(--border)",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 17, fontWeight: 800, color: "var(--foreground)" }}>Mensajes</span>
                                    {totalUnread > 0 && (
                                        <span style={{
                                            minWidth: 20, height: 20, borderRadius: 10,
                                            backgroundColor: "#EF4444", color: "#FFF",
                                            fontSize: 11, fontWeight: 700,
                                            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
                                        }}>
                                            {totalUnread > 99 ? "99+" : totalUnread}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <button onClick={() => setView("newchat")} style={{
                                        width: 32, height: 32, borderRadius: 16,
                                        backgroundColor: "var(--surface-solid)", border: "none",
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                    }} aria-label="Nuevo mensaje">
                                        <Pencil style={{ width: 15, height: 15, color: "var(--foreground)" }} />
                                    </button>
                                    <button onClick={() => setIsOpen(false)} style={{
                                        width: 32, height: 32, borderRadius: 16,
                                        backgroundColor: "var(--surface-solid)", border: "none",
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                    }} aria-label="Cerrar">
                                        <Xmark style={{ width: 15, height: 15, color: "var(--foreground)" }} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                                {loading ? (
                                    <div style={{ padding: 16 }}>
                                        {[0,1,2,3].map(i => (
                                            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", alignItems: "center" }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "var(--surface-solid)", flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ height: 12, width: "65%", borderRadius: 6, backgroundColor: "var(--surface-solid)", marginBottom: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
                                                    <div style={{ height: 10, width: "40%", borderRadius: 5, backgroundColor: "var(--surface-solid)", animation: "pulse 1.5s ease-in-out infinite" }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : channels.length === 0 ? (
                                    <div style={{ padding: "40px 16px", textAlign: "center" }}>
                                        <Comment style={{ width: 28, height: 28, color: "var(--muted)", opacity: 0.4, marginBottom: 8 }} />
                                        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>No tienes conversaciones</p>
                                        <button onClick={() => setView("newchat")} style={{
                                            marginTop: 12, backgroundColor: "var(--accent)", color: "#FFF",
                                            border: "none", borderRadius: 999, padding: "8px 16px",
                                            fontSize: 13, fontWeight: 600, cursor: "pointer",
                                        }}>
                                            Iniciar chat
                                        </button>
                                    </div>
                                ) : (
                                    channels.map((channel) => {
                                        const info = getDisplayInfo(channel);
                                        const hasUnread = (channel.unread_count ?? 0) > 0;
                                        return (
                                            <button
                                                key={channel.id}
                                                onClick={() => handleOpenChat(channel)}
                                                style={{
                                                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                                                    padding: "10px 16px", background: "transparent", border: "none",
                                                    cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-solid)"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                            >
                                                <div style={{ position: "relative", flexShrink: 0, width: 44, height: 44 }}>
                                                    {info.isGroup ? (
                                                        <div style={{
                                                            width: 44, height: 44, borderRadius: 22, backgroundColor: "var(--surface-solid)",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                        }}>
                                                            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                            </svg>
                                                        </div>
                                                    ) : renderAvatar(info.avatarUrl, info.initials, 44)}
                                                    {channel.type === "DM" && (
                                                        <span style={{
                                                            position: "absolute", bottom: 0, right: 0,
                                                            width: 12, height: 12, borderRadius: 6,
                                                            backgroundColor: info.isOnline ? "var(--success)" : "var(--muted)",
                                                            border: "2px solid var(--background)",
                                                        }} />
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                                                        <span style={{
                                                            fontSize: 14, fontWeight: hasUnread ? 700 : 500, color: "var(--foreground)",
                                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                        }}>{info.displayName}</span>
                                                        {channel.last_message?.created_at && (
                                                            <span style={{
                                                                fontSize: 11, flexShrink: 0,
                                                                color: hasUnread ? "var(--accent)" : "var(--muted)",
                                                                fontWeight: hasUnread ? 600 : 400,
                                                            }}>{timeAgo(channel.last_message.created_at, { fallbackDays: 7 })}</span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <span style={{
                                                            fontSize: 12,
                                                            color: hasUnread ? "var(--foreground)" : "var(--muted)",
                                                            fontWeight: hasUnread ? 500 : 400,
                                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                                                        }}>{info.lastMsg}</span>
                                                        {hasUnread && <span style={{ minWidth: 8, height: 8, borderRadius: 4, backgroundColor: "var(--accent)", flexShrink: 0 }} />}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}

                    {/* ═══════ CHAT VIEW ═══════ */}
                    {view === "chat" && activeChannel && (
                        <>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "10px 12px", borderBottom: "1px solid var(--border)",
                            }}>
                                <button onClick={() => { setView("list"); setActiveChannel(null); setMessages([]); }} style={{
                                    width: 32, height: 32, borderRadius: 16,
                                    background: "none", border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }} aria-label="Volver">
                                    <ChevronLeft style={{ width: 20, height: 20, color: "var(--foreground)" }} />
                                </button>
                                {renderAvatar(activeInfo?.avatarUrl, activeInfo?.initials || "CH", 32)}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 14, fontWeight: 700, color: "var(--foreground)",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>{activeInfo?.displayName}</div>
                                    {activeInfo?.isOnline && (
                                        <div style={{ fontSize: 11, color: "var(--success)", fontWeight: 500 }}>Activo/a ahora</div>
                                    )}
                                </div>
                                <button onClick={() => setIsOpen(false)} style={{
                                    width: 32, height: 32, borderRadius: 16,
                                    background: "none", border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }} aria-label="Cerrar">
                                    <Xmark style={{ width: 16, height: 16, color: "var(--muted)" }} />
                                </button>
                            </div>

                            <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "12px 12px 4px" }}>
                                {loadingMessages ? (
                                    <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 12,
                                            border: "2px solid var(--border)", borderTopColor: "var(--accent)",
                                            animation: "spin 0.6s linear infinite",
                                        }} />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                                        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Envía el primer mensaje</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMine = msg.sender_username === myUsername || msg.sender?.username === myUsername;
                                        return (
                                            <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 6 }}>
                                                <div style={{
                                                    maxWidth: "80%", padding: "8px 12px", borderRadius: 16,
                                                    borderBottomRightRadius: isMine ? 4 : 16,
                                                    borderBottomLeftRadius: isMine ? 16 : 4,
                                                    backgroundColor: isMine ? "var(--accent)" : "var(--surface-solid)",
                                                    color: isMine ? "#FFFFFF" : "var(--foreground)",
                                                }}>
                                                    {msg.image_url && (
                                                        <img src={msg.image_url} alt="" style={{
                                                            maxWidth: "100%", borderRadius: 10,
                                                            marginBottom: msg.content ? 6 : 0, display: "block",
                                                        }} />
                                                    )}
                                                    {msg.content && (
                                                        <span style={{ fontSize: 13, lineHeight: "18px", wordBreak: "break-word" }}>{msg.content}</span>
                                                    )}
                                                    <div style={{
                                                        fontSize: 10, marginTop: 2, textAlign: "right",
                                                        color: isMine ? "rgba(255,255,255,0.6)" : "var(--muted)",
                                                    }}>{timeAgo(msg.created_at, { fallbackDays: 7 })}</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div style={{ padding: "8px 12px 12px", borderTop: "1px solid var(--border)" }}>
                                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    backgroundColor: "var(--surface-solid)", borderRadius: 999,
                                    padding: "6px 6px 6px 14px", border: "1px solid var(--border)",
                                }}>
                                    <input
                                        ref={inputRef}
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Envía un mensaje..."
                                        autoComplete="off"
                                        style={{
                                            flex: 1, background: "transparent", border: "none",
                                            fontSize: 13, color: "var(--foreground)", outline: "none", minWidth: 0,
                                        }}
                                    />
                                    <button type="submit" disabled={!messageInput.trim() || sending} style={{
                                        width: 32, height: 32, borderRadius: 16,
                                        backgroundColor: messageInput.trim() ? "var(--accent)" : "transparent",
                                        border: "none", cursor: messageInput.trim() ? "pointer" : "default",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, transition: "background 0.15s",
                                    }}>
                                        <PaperPlane style={{ width: 15, height: 15, color: messageInput.trim() ? "#FFF" : "var(--muted)" }} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}

                    {/* ═══════ NEW CHAT VIEW ═══════ */}
                    {view === "newchat" && (
                        <>
                            {/* Header */}
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "14px 12px", borderBottom: "1px solid var(--border)",
                            }}>
                                <button onClick={() => { setView("list"); setNewChatSearch(""); setNewChatSuggestions([]); setNewChatSelected(null); }} style={{
                                    width: 32, height: 32, borderRadius: 16,
                                    background: "none", border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }} aria-label="Volver">
                                    <ChevronLeft style={{ width: 20, height: 20, color: "var(--foreground)" }} />
                                </button>
                                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>
                                    Nuevo mensaje
                                </span>
                                <button onClick={() => setIsOpen(false)} style={{
                                    width: 32, height: 32, borderRadius: 16,
                                    background: "none", border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }} aria-label="Cerrar">
                                    <Xmark style={{ width: 18, height: 18, color: "var(--foreground)" }} />
                                </button>
                            </div>

                            {/* "Para:" search */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "12px 16px", borderBottom: "1px solid var(--border)",
                            }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", flexShrink: 0 }}>Para:</span>
                                {newChatSelected && (
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: 4,
                                        paddingLeft: 8, paddingRight: 4, paddingTop: 3, paddingBottom: 3,
                                        borderRadius: 999, background: "rgba(59,130,246,0.15)",
                                        fontSize: 13, fontWeight: 600, color: "var(--accent)", flexShrink: 0,
                                    }}>
                                        {newChatSelected.username}
                                        <button onClick={() => setNewChatSelected(null)} style={{
                                            width: 16, height: 16, borderRadius: 999, border: "none",
                                            background: "rgba(59,130,246,0.25)", cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                                        }}>
                                            <Xmark style={{ width: 9, height: 9, color: "var(--accent)" }} />
                                        </button>
                                    </span>
                                )}
                                <input
                                    ref={newChatInputRef}
                                    placeholder="Busca..."
                                    value={newChatSearch}
                                    onChange={(e) => setNewChatSearch(e.target.value)}
                                    autoComplete="off"
                                    style={{
                                        flex: 1, background: "transparent", border: "none",
                                        fontSize: 14, color: "var(--foreground)", outline: "none", minWidth: 0,
                                    }}
                                />
                                {newChatLoading && (
                                    <div style={{
                                        width: 16, height: 16, borderRadius: 8,
                                        border: "2px solid var(--border)", borderTopColor: "var(--accent)",
                                        animation: "spin 0.6s linear infinite", flexShrink: 0,
                                    }} />
                                )}
                            </div>

                            {/* Section header */}
                            <div style={{ padding: "12px 16px 6px", fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                                Sugerencias
                            </div>

                            {/* User results */}
                            <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "0 8px" }}>
                                {newChatSuggestions.length > 0 ? (
                                    newChatSuggestions.map((user) => {
                                        const isSelected = newChatSelected?.id === user.id;
                                        return (
                                            <button
                                                key={user.id}
                                                onClick={() => {
                                                    setNewChatSelected(isSelected ? null : user);
                                                    setNewChatSearch("");
                                                    setNewChatSuggestions([]);
                                                }}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 12,
                                                    padding: "10px 8px", borderRadius: 12, width: "100%",
                                                    background: "transparent", border: "none",
                                                    cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-solid)"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                            >
                                                {renderAvatar(user.avatar_url, user.username?.slice(0, 2).toUpperCase() || "??", 48)}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontSize: 14, fontWeight: 600, color: "var(--foreground)",
                                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                    }}>{user.name || user.username}</div>
                                                    <div style={{
                                                        fontSize: 13, color: "var(--muted)",
                                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                    }}>{user.username}</div>
                                                </div>
                                                <div style={{
                                                    width: 24, height: 24, borderRadius: 12, flexShrink: 0,
                                                    border: isSelected ? "none" : "2px solid var(--muted)",
                                                    background: isSelected ? "var(--accent)" : "transparent",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    transition: "all 0.15s",
                                                }}>
                                                    {isSelected && (
                                                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0" }}>
                                        <div style={{ fontSize: 13, color: "var(--muted)" }}>
                                            {newChatSearch.length < 2 ? "Escribe para buscar usuarios..." : "No se encontraron usuarios"}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat button */}
                            <div style={{ padding: "12px 16px 16px" }}>
                                <button
                                    onClick={handleCreateChat}
                                    disabled={!newChatSelected || newChatCreating}
                                    style={{
                                        width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
                                        cursor: !newChatSelected || newChatCreating ? "not-allowed" : "pointer",
                                        background: !newChatSelected || newChatCreating ? "rgba(59,130,246,0.35)" : "var(--accent)",
                                        color: "#FFFFFF", fontSize: 14, fontWeight: 700, transition: "background 0.2s",
                                    }}
                                >
                                    {newChatCreating ? "Creando..." : "Chat"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
