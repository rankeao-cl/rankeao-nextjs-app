"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { toast } from "@heroui/react/toast";

import { Comment, Pencil, Xmark, ChevronLeft, PaperPlane, ArrowUpRightFromSquare } from "@gravity-ui/icons";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
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
            .then((val) => {
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
            .then((val) => {
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
                const val = await autocompleteUsers(newChatSearch, session.accessToken);
                const users = val?.data || val?.users || [];
                setNewChatSuggestions(users.filter((u: UserSuggestion) => u.username !== session.username));
            } catch {
            } finally {
                setNewChatLoading(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [newChatSearch, session?.accessToken, session?.username]);

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
        } catch (error: unknown) {
            toast.danger("Error al crear el chat", { description: error instanceof Error ? error.message : "" });
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
        <div
            className="bg-surface-solid flex items-center justify-center text-foreground font-bold overflow-hidden shrink-0"
            style={{
                width: size, height: size, borderRadius: size / 2,
                fontSize: size * 0.3,
            }}
        >
            {url ? <Image src={url} alt="" width={size} height={size} className="object-cover" /> : initials}
        </div>
    );

    return (
        <>
            {/* Instagram-style pill FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed right-5 lg:bottom-5 z-50 hidden lg:flex items-center gap-3 h-[52px] rounded-full bg-surface-solid border border-border cursor-pointer px-6"
                style={{
                    boxShadow: "var(--shadow-popover)",
                    transition: "transform 0.15s, box-shadow 0.15s, bottom 0.2s",
                }}
                aria-label="Mensajes"
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
                {/* Icon with badge */}
                <div className="relative shrink-0">
                    <PaperPlane className="w-[22px] h-[22px] text-foreground" />
                    {totalUnread > 0 && (
                        <span className="absolute -top-1.5 -right-[10px] min-w-[18px] h-[18px] rounded-[9px] bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-surface-solid">
                            {totalUnread > 99 ? "99+" : totalUnread}
                        </span>
                    )}
                </div>

                {/* Label */}
                <span className="text-[15px] font-bold text-foreground whitespace-nowrap">
                    Mensajes
                </span>

                {/* Recent avatars */}
                {recentAvatars.length > 0 && (
                    <div className="flex ml-1">
                        {recentAvatars.map((a, i) => (
                            <div key={i} className="w-[30px] h-[30px] rounded-full bg-background flex items-center justify-center overflow-hidden shrink-0 border-2 border-surface-solid text-[10px] font-bold text-muted" style={{ marginLeft: i > 0 ? -8 : 0 }}>
                                {a.url
                                    ? <Image src={a.url} alt="" width={30} height={30} className="object-cover" />
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
                    className="fixed right-5 lg:bottom-[4.5rem] z-[49] hidden lg:flex flex-col rounded-2xl border border-border overflow-hidden"
                    style={{
                        width: "calc(100vw - 32px)", maxWidth: 360,
                        height: "65vh",
                        backgroundColor: "var(--background)",
                        boxShadow: "var(--shadow-popover)",
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
                            <div className="flex items-center justify-between px-4 py-[14px] border-b border-border">
                                <div className="flex items-center gap-2">
                                    <span className="text-[17px] font-extrabold text-foreground">Mensajes</span>
                                    {totalUnread > 0 && (
                                        <span className="min-w-[20px] h-5 rounded-[10px] bg-[#EF4444] text-white text-[11px] font-bold flex items-center justify-center px-[5px]">
                                            {totalUnread > 99 ? "99+" : totalUnread}
                                        </span>
                                    )}
                                    <button onClick={() => setView("newchat")} className="w-8 h-8 rounded-full bg-surface-solid border-none cursor-pointer flex items-center justify-center" aria-label="Nuevo mensaje">
                                        <Pencil className="w-[15px] h-[15px] text-foreground" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Link href="/chat" onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-surface-solid border-none cursor-pointer flex items-center justify-center no-underline" aria-label="Abrir chat completo">
                                        <ArrowUpRightFromSquare className="w-3.5 h-3.5 text-foreground" />
                                    </Link>
                                    <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-surface-solid border-none cursor-pointer flex items-center justify-center" aria-label="Cerrar">
                                        <Xmark className="w-[15px] h-[15px] text-foreground" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto min-h-0">
                                {loading ? (
                                    <div className="p-4">
                                        {[0,1,2,3].map(i => (
                                            <div key={i} className="flex gap-[10px] py-[10px] items-center">
                                                <div className="w-[44px] h-[44px] rounded-[22px] bg-surface-solid shrink-0" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
                                                <div className="flex-1">
                                                    <div className="h-3 w-[65%] rounded-[6px] bg-surface-solid mb-1.5" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
                                                    <div className="h-[10px] w-[40%] rounded-[5px] bg-surface-solid" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : channels.length === 0 ? (
                                    <div className="px-4 py-10 text-center">
                                        <Comment className="w-7 h-7 text-muted opacity-40 mb-2" />
                                        <p className="text-[13px] text-muted m-0">No tienes conversaciones</p>
                                        <button onClick={() => setView("newchat")} className="mt-3 bg-accent text-white border-none rounded-full px-4 py-2 text-[13px] font-semibold cursor-pointer">
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
                                                className="w-full flex items-center gap-[10px] px-4 py-[10px] bg-transparent border-none cursor-pointer text-left transition-colors duration-150"
                                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-solid)"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                            >
                                                <div className="relative shrink-0 w-[44px] h-[44px]">
                                                    {info.isGroup ? (
                                                        <div className="w-[44px] h-[44px] rounded-[22px] bg-surface-solid flex items-center justify-center">
                                                            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                            </svg>
                                                        </div>
                                                    ) : renderAvatar(info.avatarUrl, info.initials, 44)}
                                                    {channel.type === "DM" && (
                                                        <span
                                                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background"
                                                            style={{ backgroundColor: info.isOnline ? "var(--success)" : "var(--muted)" }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1.5">
                                                        <span className="text-sm text-foreground truncate" style={{ fontWeight: hasUnread ? 700 : 500 }}>{info.displayName}</span>
                                                        {channel.last_message?.created_at && (
                                                            <span className="text-[11px] shrink-0" style={{
                                                                color: hasUnread ? "var(--accent)" : "var(--muted)",
                                                                fontWeight: hasUnread ? 600 : 400,
                                                            }}>{timeAgo(channel.last_message.created_at, { fallbackDays: 7 })}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs truncate flex-1" style={{
                                                            color: hasUnread ? "var(--foreground)" : "var(--muted)",
                                                            fontWeight: hasUnread ? 500 : 400,
                                                        }}>{info.lastMsg}</span>
                                                        {hasUnread && <span className="min-w-[8px] h-2 rounded-full bg-accent shrink-0" />}
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
                            <div className="flex items-center gap-[10px] px-3 py-[10px] border-b border-border">
                                <button onClick={() => { setView("list"); setActiveChannel(null); setMessages([]); }} className="w-8 h-8 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center shrink-0" aria-label="Volver">
                                    <ChevronLeft className="w-5 h-5 text-foreground" />
                                </button>
                                {renderAvatar(activeInfo?.avatarUrl, activeInfo?.initials || "CH", 32)}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-foreground truncate">{activeInfo?.displayName}</div>
                                    {activeInfo?.isOnline && (
                                        <div className="text-[11px] text-success font-medium">Activo/a ahora</div>
                                    )}
                                </div>
                                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center shrink-0" aria-label="Cerrar">
                                    <Xmark className="w-4 h-4 text-muted" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto min-h-0 px-3 pt-3 pb-1">
                                {loadingMessages ? (
                                    <div className="flex justify-center p-5">
                                        <div className="w-6 h-6 rounded-full border-2 border-border" style={{ borderTopColor: "var(--accent)", animation: "spin 0.6s linear infinite" }} />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-[13px] text-muted m-0">Envía el primer mensaje</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMine = msg.sender_username === myUsername || msg.sender?.username === myUsername;
                                        return (
                                            <div key={msg.id} className="flex mb-1.5" style={{ justifyContent: isMine ? "flex-end" : "flex-start" }}>
                                                <div
                                                    className="max-w-[80%] px-3 py-2 rounded-2xl"
                                                    style={{
                                                        borderBottomRightRadius: isMine ? 4 : 16,
                                                        borderBottomLeftRadius: isMine ? 16 : 4,
                                                        backgroundColor: isMine ? "var(--accent)" : "var(--surface-solid)",
                                                        color: isMine ? "#FFFFFF" : "var(--foreground)",
                                                    }}
                                                >
                                                    {msg.image_url && (
                                                        <Image src={msg.image_url} alt="" width={260} height={180} className="object-cover block rounded-[10px] max-w-full" style={{ marginBottom: msg.content ? 6 : 0 }} />
                                                    )}
                                                    {msg.content && (
                                                        <span className="text-[13px] leading-[18px] break-words">{msg.content}</span>
                                                    )}
                                                    <div className="text-[10px] mt-0.5 text-right" style={{
                                                        color: isMine ? "rgba(255,255,255,0.6)" : "var(--muted)",
                                                    }}>{timeAgo(msg.created_at, { fallbackDays: 7 })}</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="px-3 pb-3 pt-2 border-t border-border">
                                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2 bg-surface-solid rounded-full border border-border" style={{ padding: "6px 6px 6px 14px" }}>
                                    <input
                                        ref={inputRef}
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Envía un mensaje..."
                                        autoComplete="off"
                                        className="flex-1 bg-transparent border-none text-[13px] text-foreground outline-none min-w-0"
                                    />
                                    <button type="submit" disabled={!messageInput.trim() || sending} className="w-8 h-8 rounded-full border-none flex items-center justify-center shrink-0 transition-colors duration-150" style={{
                                        backgroundColor: messageInput.trim() ? "var(--accent)" : "transparent",
                                        cursor: messageInput.trim() ? "pointer" : "default",
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
                            <div className="flex items-center justify-between px-3 py-[14px] border-b border-border">
                                <button onClick={() => { setView("list"); setNewChatSearch(""); setNewChatSuggestions([]); setNewChatSelected(null); }} className="w-8 h-8 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center" aria-label="Volver">
                                    <ChevronLeft className="w-5 h-5 text-foreground" />
                                </button>
                                <span className="text-base font-bold text-foreground">
                                    Nuevo mensaje
                                </span>
                                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center" aria-label="Cerrar">
                                    <Xmark className="w-[18px] h-[18px] text-foreground" />
                                </button>
                            </div>

                            {/* "Para:" search */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                                <span className="text-sm font-semibold text-foreground shrink-0">Para:</span>
                                {newChatSelected && (
                                    <span className="inline-flex items-center gap-1 pl-2 pr-1 py-[3px] rounded-full text-[13px] font-semibold text-accent shrink-0" style={{ background: "rgba(59,130,246,0.15)" }}>
                                        {newChatSelected.username}
                                        <button onClick={() => setNewChatSelected(null)} className="w-4 h-4 rounded-full border-none cursor-pointer flex items-center justify-center p-0" style={{ background: "rgba(59,130,246,0.25)" }}>
                                            <Xmark className="w-[9px] h-[9px] text-accent" />
                                        </button>
                                    </span>
                                )}
                                <input
                                    ref={newChatInputRef}
                                    placeholder="Busca..."
                                    value={newChatSearch}
                                    onChange={(e) => setNewChatSearch(e.target.value)}
                                    autoComplete="off"
                                    className="flex-1 bg-transparent border-none text-sm text-foreground outline-none min-w-0"
                                />
                                {newChatLoading && (
                                    <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" style={{ borderTopColor: "var(--accent)", animation: "spin 0.6s linear infinite" }} />
                                )}
                            </div>

                            {/* Section header */}
                            <div className="px-4 pt-3 pb-1.5 text-[13px] font-bold text-foreground">
                                Sugerencias
                            </div>

                            {/* User results */}
                            <div className="flex-1 overflow-y-auto min-h-0 px-2">
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
                                                className="flex items-center gap-3 px-2 py-[10px] rounded-xl w-full bg-transparent border-none cursor-pointer text-left transition-colors duration-150"
                                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-solid)"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                            >
                                                {renderAvatar(user.avatar_url, user.username?.slice(0, 2).toUpperCase() || "??", 48)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-foreground truncate">{user.name || user.username}</div>
                                                    <div className="text-[13px] text-muted truncate">{user.username}</div>
                                                </div>
                                                <div
                                                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-all duration-150"
                                                    style={{
                                                        border: isSelected ? "none" : "2px solid var(--muted)",
                                                        background: isSelected ? "var(--accent)" : "transparent",
                                                    }}
                                                >
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
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <div className="text-[13px] text-muted">
                                            {newChatSearch.length < 2 ? "Escribe para buscar usuarios..." : "No se encontraron usuarios"}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat button */}
                            <div className="px-4 pt-3 pb-4">
                                <button
                                    onClick={handleCreateChat}
                                    disabled={!newChatSelected || newChatCreating}
                                    className="w-full rounded-[10px] border-none text-white text-sm font-bold transition-colors duration-200"
                                    style={{
                                        padding: "13px 0",
                                        cursor: !newChatSelected || newChatCreating ? "not-allowed" : "pointer",
                                        background: !newChatSelected || newChatCreating ? "rgba(59,130,246,0.35)" : "var(--accent)",
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
