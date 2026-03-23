"use client";

import { useMemo, useState } from "react";
import { timeAgo } from "@/lib/utils/format";
import type { Channel, ChannelMember } from "@/lib/types/chat";
import { useAuth } from "@/context/AuthContext";
import NewChatModal from "./NewChatModal";
import ChatSettingsModal from "./ChatSettingsModal";

interface ChatSidebarProps {
    channels: Channel[];
    loading: boolean;
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
    onChannelCreated: (channel: Channel) => void;
    onChannelLeft?: () => void;
    initialFilter?: ChatFilter;
}

function formatLastSeen(member?: ChannelMember): string | null {
    if (!member) return null;
    if (member.is_online) return "en linea";
    return "desconectado";
}


type ChatFilter = "todo" | "dm" | "grupos" | "clanes" | "torneos";

const CHAT_FILTERS: { key: ChatFilter; label: string }[] = [
    { key: "todo", label: "Todo" },
    { key: "dm", label: "Directos" },
    { key: "grupos", label: "Grupos" },
    { key: "clanes", label: "Clanes" },
    { key: "torneos", label: "Torneos" },
];

export default function ChatSidebar({ channels, loading, selectedChannel, onSelectChannel, onChannelCreated, onChannelLeft, initialFilter }: ChatSidebarProps) {
    const { session } = useAuth();
    const myUsername = session?.username;
    const [search, setSearch] = useState("");
    const [chatFilter, setChatFilter] = useState<ChatFilter>(initialFilter || "todo");
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const filteredChannels = useMemo(() => {
        let result = channels;

        if (chatFilter === "dm") result = result.filter(c => c.type === "DM");
        else if (chatFilter === "grupos") result = result.filter(c => c.type === "GROUP");
        else if (chatFilter === "clanes") result = result.filter(c => c.type === "CLAN");
        else if (chatFilter === "torneos") result = result.filter(c => c.type === "TOURNAMENT");

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(c => {
                if (c.name?.toLowerCase().includes(q)) return true;
                if (c.type === "DM" && myUsername) {
                    const otherMember = c.members?.find(m => m.username !== myUsername);
                    if (otherMember?.username?.toLowerCase().includes(q)) return true;
                }
                return false;
            });
        }

        return result;
    }, [channels, search, chatFilter, myUsername]);

    const channelsByType = useMemo(() => {
        return {
            DMs: filteredChannels.filter(c => c.type === "DM"),
            GROUPS: filteredChannels.filter(c => c.type === "GROUP"),
            CLANS: filteredChannels.filter(c => c.type === "CLAN"),
            TOURNAMENTS: filteredChannels.filter(c => c.type === "TOURNAMENT"),
        };
    }, [filteredChannels]);

    const renderChannel = (channel: Channel, index: number, arr: Channel[]) => {
        const isSelected = selectedChannel?.id === channel.id;

        let displayName = channel.name || (channel.type === "DM" ? "Mensaje Directo" : "Sala Global");
        let otherMember: ChannelMember | undefined;
        let isOnline = false;
        const isGroup = channel.type === "GROUP";
        const memberCount = channel.members?.length || 0;

        if (channel.type === "DM" && myUsername) {
            otherMember = channel.members?.find(m => m.username !== myUsername);
            if (otherMember) {
                displayName = otherMember.username;
                isOnline = !!otherMember.is_online;
            }
        }

        const lastSeenText = channel.type === "DM" ? formatLastSeen(otherMember) : null;
        const hasUnread = (channel.unread_count ?? 0) > 0;
        const isLast = index === arr.length - 1;

        // Build initials
        const initials = displayName?.slice(0, 2).toUpperCase() || (channel.type === "DM" ? "DM" : "CH");

        // Build last message display
        let lastMessageContent: string | null = null;
        let lastMessagePrefix = "";
        if (channel.last_message?.content) {
            if (channel.last_message.sender_username && channel.last_message.sender_username !== myUsername) {
                lastMessagePrefix = `${channel.last_message.sender_username}: `;
            } else if (channel.last_message.sender?.username && channel.last_message.sender.username !== myUsername) {
                lastMessagePrefix = `${channel.last_message.sender.username}: `;
            }
            const content = channel.last_message.content;
            lastMessageContent = content.length > 40 ? content.slice(0, 40) + "..." : content;
        }

        return (
            <div key={channel.id}>
                <button
                    onClick={() => onSelectChannel(channel)}
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 16px",
                        background: isSelected ? "rgba(59,130,246,0.08)" : "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                    }}
                >
                    {/* Avatar */}
                    <div style={{ position: "relative", flexShrink: 0, width: 44, height: 44 }}>
                        {isGroup ? (
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: "var(--surface-solid)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                        ) : (
                            <>
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        backgroundColor: "var(--surface-solid)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "var(--foreground)",
                                        fontSize: 14,
                                        fontWeight: 700,
                                        overflow: "hidden",
                                    }}
                                >
                                    {otherMember?.avatar_url ? (
                                        <img
                                            src={otherMember.avatar_url}
                                            alt={displayName}
                                            style={{ width: 44, height: 44, objectFit: "cover" }}
                                        />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                {channel.type === "DM" && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            bottom: 0,
                                            right: 0,
                                            width: 12,
                                            height: 12,
                                            borderRadius: "50%",
                                            border: "2px solid var(--background)",
                                            backgroundColor: isOnline ? "#23A559" : "var(--muted)",
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    {/* Text content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <span
                                style={{
                                    fontSize: 15,
                                    fontWeight: hasUnread ? 700 : 500,
                                    color: hasUnread ? "var(--foreground)" : "var(--muted)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {displayName}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                {channel.last_message?.created_at && (
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: hasUnread ? "var(--foreground)" : "var(--muted)",
                                            fontWeight: hasUnread ? 600 : 400,
                                        }}
                                    >
                                        {timeAgo(channel.last_message.created_at, { fallbackDays: 7 })}
                                    </span>
                                )}
                                {hasUnread && (
                                    <span
                                        style={{
                                            minWidth: 10,
                                            height: 10,
                                            borderRadius: 5,
                                            backgroundColor: "#3B82F6",
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                        <p
                            style={{
                                fontSize: 13,
                                color: hasUnread ? "var(--foreground)" : "var(--muted)",
                                fontWeight: hasUnread ? 500 : 400,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                margin: "2px 0 0 0",
                            }}
                        >
                            {lastMessageContent ? (
                                <>{lastMessagePrefix}{lastMessageContent}</>
                            ) : isGroup ? (
                                <>Grupo ({memberCount})</>
                            ) : channel.type === "CLAN" ? (
                                <>Comunidad</>
                            ) : lastSeenText ? (
                                <span style={isOnline ? { color: "#23A559" } : undefined}>{lastSeenText}</span>
                            ) : (
                                <>Mensaje directo</>
                            )}
                        </p>
                    </div>
                </button>
                {/* Divider */}
                {!isLast && (
                    <div
                        style={{
                            height: 1,
                            backgroundColor: "var(--border)",
                            marginLeft: 72,
                        }}
                    />
                )}
            </div>
        );
    };

    const renderSectionHeader = (title: string) => (
        <div
            style={{
                padding: "20px 16px 8px 16px",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: 1.2,
            }}
        >
            {title}
        </div>
    );

    const renderEmptyState = (message: string, showButton = false) => (
        <div
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                textAlign: "center",
            }}
        >
            <div
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    backgroundColor: "var(--surface-solid)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                }}
            >
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", margin: "0 0 4px 0" }}>
                Sin chats
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                {message}
            </p>
            {showButton && (
                <button
                    onClick={() => setIsNewChatOpen(true)}
                    style={{
                        marginTop: 16,
                        backgroundColor: "#3B82F6",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 999,
                        padding: "10px 20px",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    Iniciar chat
                </button>
            )}
        </div>
    );

    const renderLoadingSkeleton = () => (
        <div style={{ padding: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", alignItems: "center" }}>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: "var(--surface-solid)",
                            flexShrink: 0,
                            animation: "pulse 1.5s ease-in-out infinite",
                        }}
                    />
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                height: 12,
                                width: "70%",
                                borderRadius: 6,
                                backgroundColor: "var(--surface-solid)",
                                marginBottom: 8,
                                animation: "pulse 1.5s ease-in-out infinite",
                            }}
                        />
                        <div
                            style={{
                                height: 12,
                                width: "45%",
                                borderRadius: 6,
                                backgroundColor: "var(--surface-solid)",
                                animation: "pulse 1.5s ease-in-out infinite",
                            }}
                        />
                    </div>
                </div>
            ))}
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        </div>
    );

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--background)" }}>
            {/* Hero header */}
            <div
                style={{
                    margin: "12px 16px 14px 16px",
                    backgroundColor: "var(--surface-solid)",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    padding: 18,
                    minHeight: 120,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Badge */}
                    <span
                        style={{
                            display: "inline-block",
                            backgroundColor: "var(--border)",
                            paddingLeft: 10,
                            paddingRight: 10,
                            paddingTop: 4,
                            paddingBottom: 4,
                            borderRadius: 999,
                            marginBottom: 8,
                            color: "var(--muted)",
                            fontSize: 11,
                            fontWeight: 600,
                        }}
                    >
                        Mensajes
                    </span>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", margin: 0, marginBottom: 4 }}>Tus Chats</h2>
                    <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: "18px", margin: 0 }}>
                        Conversa con jugadores de tu comunidad.
                    </p>
                </div>
                {/* New chat button — same as torneos/marketplace */}
                <button
                    onClick={() => setIsNewChatOpen(true)}
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: "#3B82F6",
                        borderRadius: 12,
                        paddingLeft: 14,
                        paddingRight: 14,
                        paddingTop: 8,
                        paddingBottom: 8,
                        marginLeft: 12,
                        alignSelf: "center",
                        border: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                    }}
                >
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>Nuevo</span>
                </button>
            </div>

            {/* Search bar */}
            <div
                style={{
                    margin: "0 16px 12px 16px",
                    backgroundColor: "var(--surface-solid)",
                    borderRadius: 999,
                    padding: "10px 14px",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}
            >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="text"
                    placeholder="Buscar chats..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 1,
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: 14,
                        color: "var(--foreground)",
                        padding: 0,
                        margin: 0,
                        lineHeight: "normal",
                    }}
                />
            </div>

            {/* Filter pills */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    margin: "0 16px 12px 16px",
                }}
            >
                {CHAT_FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setChatFilter(f.key)}
                        style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            border: chatFilter === f.key ? "1px solid transparent" : "1px solid var(--border)",
                            backgroundColor: chatFilter === f.key ? "var(--foreground)" : "var(--surface-solid)",
                            color: chatFilter === f.key ? "var(--background)" : "var(--muted)",
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Channel list */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                {loading ? (
                    renderLoadingSkeleton()
                ) : channels.length === 0 ? (
                    renderEmptyState("Explora la comunidad o torneos para conectarte.", true)
                ) : filteredChannels.length === 0 ? (
                    renderEmptyState(
                        search.length > 0
                            ? "No se encontraron chats con ese nombre."
                            : `No tienes ${chatFilter === "dm" ? "mensajes directos" : chatFilter === "grupos" ? "grupos" : chatFilter === "clanes" ? "chats de clan" : chatFilter === "torneos" ? "chats de torneo" : "chats"}.`
                    )
                ) : chatFilter !== "todo" ? (
                    <div>
                        {renderSectionHeader(CHAT_FILTERS.find(f => f.key === chatFilter)?.label ?? "")}
                        {filteredChannels.map((ch, i, arr) => renderChannel(ch, i, arr))}
                    </div>
                ) : (
                    <>
                        {channelsByType.DMs.length > 0 && (
                            <div>
                                {renderSectionHeader("Mensajes Directos")}
                                {channelsByType.DMs.map((ch, i, arr) => renderChannel(ch, i, arr))}
                            </div>
                        )}
                        {channelsByType.GROUPS.length > 0 && (
                            <div>
                                {renderSectionHeader("Grupos")}
                                {channelsByType.GROUPS.map((ch, i, arr) => renderChannel(ch, i, arr))}
                            </div>
                        )}
                        {channelsByType.CLANS.length > 0 && (
                            <div>
                                {renderSectionHeader("Clanes")}
                                {channelsByType.CLANS.map((ch, i, arr) => renderChannel(ch, i, arr))}
                            </div>
                        )}
                        {channelsByType.TOURNAMENTS.length > 0 && (
                            <div>
                                {renderSectionHeader("Torneos")}
                                {channelsByType.TOURNAMENTS.map((ch, i, arr) => renderChannel(ch, i, arr))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <NewChatModal
                isOpen={isNewChatOpen}
                onOpenChange={setIsNewChatOpen}
                onChannelCreated={onChannelCreated}
            />

            <ChatSettingsModal
                isOpen={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                channel={selectedChannel}
                onChannelLeft={onChannelLeft}
                onChannelUpdated={(updated) => {
                    onChannelCreated(updated);
                }}
            />
        </div>
    );
}
