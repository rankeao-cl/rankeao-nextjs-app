"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { timeAgo } from "@/lib/utils/format";
import type { Channel, ChannelMember, Room } from "@/lib/types/chat";
import { getChatRooms } from "@/lib/api/chat";
import { useAuth } from "@/lib/hooks/use-auth";
import dynamic from "next/dynamic";
const NewChatModal = dynamic(() => import("@/features/chat/NewChatModal"), { ssr: false });
const ChatSettingsModal = dynamic(() => import("@/features/chat/ChatSettingsModal"), { ssr: false });

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


type ChatFilter = "todo" | "dm" | "grupos" | "clanes" | "torneos" | "salas";

const CHAT_FILTERS: { key: ChatFilter; label: string }[] = [
    { key: "todo", label: "Todo" },
    { key: "dm", label: "Directos" },
    { key: "grupos", label: "Grupos" },
    { key: "clanes", label: "Clanes" },
    { key: "torneos", label: "Torneos" },
    { key: "salas", label: "Salas" },
];

export default function ChatSidebar({ channels, loading, selectedChannel, onSelectChannel, onChannelCreated, onChannelLeft, initialFilter }: ChatSidebarProps) {
    const { session } = useAuth();
    const myUsername = session?.username;
    const [search, setSearch] = useState("");
    const [chatFilter, setChatFilter] = useState<ChatFilter>(initialFilter || "todo");
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);

    // Fetch public rooms
    useEffect(() => {
        getChatRooms(undefined, session?.accessToken)
            .then((val) => {
                const r = val?.data?.rooms || val?.rooms || (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
                setRooms(r);
            })
            .catch((error: unknown) => {
                setRooms([]);
                console.error("No se pudieron cargar las salas de chat", error);
            });
    }, [session?.accessToken]);

    // Convert rooms to Channel-compatible items
    const roomsAsChannels: Channel[] = useMemo(
        () => rooms.map((r) => ({ id: r.id, type: r.type, name: r.name, created_at: r.created_at })),
        [rooms],
    );

    const filteredChannels = useMemo(() => {
        if (chatFilter === "salas") {
            let result = roomsAsChannels;
            if (search.trim()) {
                const q = search.toLowerCase();
                result = result.filter(c => c.name?.toLowerCase().includes(q));
            }
            return result;
        }

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
    }, [channels, roomsAsChannels, search, chatFilter, myUsername]);

    const channelsByType = useMemo(() => {
        return {
            DMs: filteredChannels.filter(c => c.type === "DM"),
            GROUPS: filteredChannels.filter(c => c.type === "GROUP"),
            CLANS: filteredChannels.filter(c => c.type === "CLAN"),
            TOURNAMENTS: filteredChannels.filter(c => c.type === "TOURNAMENT"),
            ROOMS: chatFilter === "todo" ? roomsAsChannels : [],
        };
    }, [filteredChannels, roomsAsChannels, chatFilter]);

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
                    className="w-full flex items-center gap-3 px-4 py-3 border-none cursor-pointer text-left"
                    style={{
                        background: isSelected ? "rgba(59,130,246,0.08)" : "transparent",
                    }}
                >
                    {/* Avatar */}
                    <div className="relative shrink-0 w-[44px] h-[44px]">
                        {isGroup ? (
                            <div className="w-[44px] h-[44px] rounded-full bg-surface-solid flex items-center justify-center">
                                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                        ) : (
                            <>
                                <div className="w-[44px] h-[44px] rounded-full bg-surface-solid flex items-center justify-center text-foreground text-[14px] font-bold overflow-hidden">
                                    {otherMember?.avatar_url ? (
                                        <Image
                                            src={otherMember.avatar_url}
                                            alt={displayName}
                                            width={44}
                                            height={44}
                                            className="object-cover"
                                        />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                {channel.type === "DM" && (
                                    <span
                                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background"
                                        style={{
                                            backgroundColor: isOnline ? "var(--success)" : "var(--muted)",
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <span
                                className="text-[15px] overflow-hidden text-ellipsis whitespace-nowrap"
                                style={{
                                    fontWeight: hasUnread ? 700 : 500,
                                    color: hasUnread ? "var(--foreground)" : "var(--muted)",
                                }}
                            >
                                {displayName}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {channel.last_message?.created_at && (
                                    <span
                                        className="text-[11px]"
                                        style={{
                                            color: hasUnread ? "var(--foreground)" : "var(--muted)",
                                            fontWeight: hasUnread ? 600 : 400,
                                        }}
                                    >
                                        {timeAgo(channel.last_message.created_at, { fallbackDays: 7 })}
                                    </span>
                                )}
                                {hasUnread && (
                                    <span className="min-w-[10px] h-[10px] rounded-full bg-accent" />
                                )}
                            </div>
                        </div>
                        <p
                            className="text-[13px] overflow-hidden text-ellipsis whitespace-nowrap mt-0.5 mb-0 ml-0 mr-0"
                            style={{
                                color: hasUnread ? "var(--foreground)" : "var(--muted)",
                                fontWeight: hasUnread ? 500 : 400,
                            }}
                        >
                            {lastMessageContent ? (
                                <>{lastMessagePrefix}{lastMessageContent}</>
                            ) : isGroup ? (
                                <>Grupo ({memberCount})</>
                            ) : channel.type === "CLAN" ? (
                                <>Comunidad</>
                            ) : channel.type === "COMMUNITY" ? (
                                <>Sala comunitaria</>
                            ) : lastSeenText ? (
                                <span style={isOnline ? { color: "var(--success)" } : undefined}>{lastSeenText}</span>
                            ) : (
                                <>Mensaje directo</>
                            )}
                        </p>
                    </div>
                </button>
                {/* Divider */}
                {!isLast && (
                    <div className="h-px bg-border ml-[72px]" />
                )}
            </div>
        );
    };

    const renderSectionHeader = (title: string) => (
        <div className="px-4 pt-5 pb-2 text-[11px] font-bold text-muted uppercase tracking-[1.2px]">
            {title}
        </div>
    );

    const renderEmptyState = (message: string, showButton = false) => (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-solid flex items-center justify-center mb-4">
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            </div>
            <h3 className="text-[16px] font-semibold text-foreground m-0 mb-1">
                Sin chats
            </h3>
            <p className="text-[13px] text-muted m-0">
                {message}
            </p>
            {showButton && (
                <button
                    onClick={() => setIsNewChatOpen(true)}
                    className="mt-4 bg-accent text-white border-none rounded-full px-5 py-2.5 text-[14px] font-semibold cursor-pointer"
                >
                    Iniciar chat
                </button>
            )}
        </div>
    );

    const renderLoadingSkeleton = () => (
        <div className="p-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 py-3 items-center">
                    <div
                        className="w-[44px] h-[44px] rounded-full bg-surface-solid shrink-0"
                        style={{ animation: "pulse 1.5s ease-in-out infinite" }}
                    />
                    <div className="flex-1">
                        <div
                            className="h-3 w-[70%] rounded-md bg-surface-solid mb-2"
                            style={{ animation: "pulse 1.5s ease-in-out infinite" }}
                        />
                        <div
                            className="h-3 w-[45%] rounded-md bg-surface-solid"
                            style={{ animation: "pulse 1.5s ease-in-out infinite" }}
                        />
                    </div>
                </div>
            ))}
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col bg-background">
            {/* Hero header */}
            <div className="mx-4 mt-3 mb-3.5 bg-surface-solid rounded-2xl border border-border p-[18px] min-h-[120px] flex items-center">
                <div className="flex-1 min-w-0">
                    {/* Badge */}
                    <span className="inline-block bg-border px-2.5 py-1 rounded-full mb-2 text-muted text-[11px] font-semibold">
                        Mensajes
                    </span>
                    <h2 className="text-[22px] font-extrabold text-foreground m-0 mb-1">Tus Chats</h2>
                    <p className="text-[13px] text-muted leading-[18px] m-0">
                        Conversa con jugadores de tu comunidad.
                    </p>
                </div>
                {/* New chat button -- same as torneos/marketplace */}
                <button
                    onClick={() => setIsNewChatOpen(true)}
                    className="flex flex-row items-center gap-1 bg-accent rounded-xl px-3.5 py-2 ml-3 self-center border-none cursor-pointer shrink-0"
                >
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="text-white text-[12px] font-bold">Nuevo</span>
                </button>
            </div>

            {/* Search bar */}
            <div className="mx-4 mb-3 bg-surface-solid rounded-full px-3.5 py-2.5 border border-border flex items-center gap-2">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="text"
                    placeholder="Buscar chats..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[14px] text-foreground p-0 m-0 leading-normal"
                />
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5 mx-4 mb-3">
                {CHAT_FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setChatFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap cursor-pointer ${
                            chatFilter === f.key
                                ? "border border-transparent bg-foreground text-background"
                                : "border border-border bg-surface-solid text-muted"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Channel list */}
            <div className="flex-1 min-h-0 overflow-y-auto">
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
                        {channelsByType.ROOMS.length > 0 && (
                            <div>
                                {renderSectionHeader("Salas")}
                                {channelsByType.ROOMS.map((ch, i, arr) => renderChannel(ch, i, arr))}
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
