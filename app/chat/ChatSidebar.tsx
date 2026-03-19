"use client";

import { useMemo, useState } from "react";
import { Avatar, Input, ScrollShadow, Skeleton, Button } from "@heroui/react";
import { Gear, Comment, Persons, Person, ShoppingCart, Headphones, Hierarchy, Plus } from "@gravity-ui/icons";
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
}

/** Green pulsing dot for online status, positioned absolute on avatar corner */
function OnlineIndicator({ isOnline, size = "md" }: { isOnline: boolean; size?: "sm" | "md" }) {
    if (!isOnline) {
        return (
            <span className={`absolute bottom-0 right-0 rounded-full border-2 border-[var(--surface)] bg-gray-400 ${size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"}`} />
        );
    }
    return (
        <span className={`absolute bottom-0 right-0 rounded-full border-2 border-[var(--surface)] bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] ${size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"}`}>
            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
        </span>
    );
}

function formatLastSeen(member?: ChannelMember): string | null {
    if (!member) return null;
    if (member.is_online) return "en linea";
    // If we had a last_seen field, we'd use it. For now, show "offline"
    return "desconectado";
}

function timeAgo(dateStr?: string): string {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

type ChatFilter = "todo" | "dm" | "grupos" | "comunidades";

const CHAT_FILTERS: { key: ChatFilter; label: string }[] = [
    { key: "todo", label: "Todo" },
    { key: "dm", label: "Directos" },
    { key: "grupos", label: "Grupos" },
    { key: "comunidades", label: "Comunidades" },
];

export default function ChatSidebar({ channels, loading, selectedChannel, onSelectChannel, onChannelCreated, onChannelLeft }: ChatSidebarProps) {
    const { session } = useAuth();
    const myUsername = session?.username;
    const [search, setSearch] = useState("");
    const [chatFilter, setChatFilter] = useState<ChatFilter>("todo");
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const filteredChannels = useMemo(() => {
        let result = channels;

        // Apply type filter
        if (chatFilter === "dm") result = result.filter(c => c.type === "DM");
        else if (chatFilter === "grupos") result = result.filter(c => c.type === "GROUP");
        else if (chatFilter === "comunidades") result = result.filter(c => c.type === "CLAN" || c.type === "TOURNAMENT");

        // Apply search filter (match channel name or DM member username)
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(c => {
                if (c.name?.toLowerCase().includes(q)) return true;
                // For DMs, also search by the other member's username
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
            COMMUNITIES: filteredChannels.filter(c => c.type === "CLAN" || c.type === "TOURNAMENT"),
        };
    }, [filteredChannels]);

    const renderChannel = (channel: Channel) => {
        const isSelected = selectedChannel?.id === channel.id;

        // Resolve DM name, avatar and online status
        let displayName = channel.name || (channel.type === "DM" ? "Mensaje Directo" : "Sala Global");
        let displayAvatar = channel.name === "Soporte Rankeao" ? undefined : channel.name;
        let otherMember: ChannelMember | undefined;
        let isOnline = false;
        const isGroup = channel.type === "GROUP";
        const memberCount = channel.members?.length || 0;

        if (channel.type === "DM" && myUsername) {
            otherMember = channel.members?.find(m => m.username !== myUsername);
            if (otherMember) {
                displayName = otherMember.username;
                displayAvatar = otherMember.avatar_url;
                isOnline = !!otherMember.is_online;
            }
        }

        const lastSeenText = channel.type === "DM" ? formatLastSeen(otherMember) : null;
        const hasUnread = (channel.unread_count ?? 0) > 0;

        return (
            <button
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 text-left
          ${isSelected
                        ? "bg-[var(--accent)]/10 border border-[var(--accent)]/25"
                        : "hover:bg-[var(--surface-secondary)] border border-transparent"}`}
            >
                <div className="relative shrink-0 w-11 h-11">
                    {isGroup ? (
                        <div className="w-11 h-11 rounded-full border border-[var(--border)] bg-[var(--surface-tertiary)] flex items-center justify-center text-[var(--muted)]">
                            <Persons className="size-5" />
                        </div>
                    ) : (
                        <>
                            <Avatar className="w-11 h-11 text-sm border border-[var(--border)] bg-[var(--surface-tertiary)]">
                                <Avatar.Image src={displayAvatar} alt={displayName} />
                                <Avatar.Fallback>{displayName?.slice(0, 2).toUpperCase() || (channel.type === "DM" ? "DM" : "CH")}</Avatar.Fallback>
                            </Avatar>
                            {channel.type === "DM" && (
                                <OnlineIndicator isOnline={isOnline} size="sm" />
                            )}
                        </>
                    )}
                    {(channel.unread_count ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1 border-2 border-[var(--surface)]">
                            {(channel.unread_count ?? 0) > 99 ? '99+' : channel.unread_count}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${hasUnread ? "font-bold text-[var(--foreground)]" : "font-medium text-[var(--muted)]"}`}>
                            {displayName}
                        </p>
                        {channel.last_message?.created_at && (
                            <span className={`text-[10px] shrink-0 ${hasUnread ? "text-[var(--foreground)] font-semibold" : "text-[var(--muted)] font-medium"}`}>
                                {timeAgo(channel.last_message.created_at)}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-[var(--muted)] truncate mt-0.5 font-medium">
                        {channel.last_message?.content ? (
                            <span className={channel.unread_count ? "text-[var(--foreground)] font-semibold" : ""}>
                                {channel.last_message.sender_username && channel.last_message.sender_username !== myUsername
                                    ? `${channel.last_message.sender_username}: `
                                    : channel.last_message.sender?.username && channel.last_message.sender.username !== myUsername
                                    ? `${channel.last_message.sender.username}: `
                                    : ""}
                                {channel.last_message.content.slice(0, 40)}{channel.last_message.content.length > 40 ? "..." : ""}
                            </span>
                        ) : isGroup ? (
                            <span className="flex items-center gap-1"><Persons className="size-3" /> Grupo ({memberCount})</span>
                        ) : channel.type === "CLAN" ? (
                            <span className="flex items-center gap-1"><Hierarchy className="size-3" /> Comunidad</span>
                        ) : lastSeenText ? (
                            <span className={isOnline ? "text-green-500" : ""}>{lastSeenText}</span>
                        ) : (
                            <span>Mensaje directo</span>
                        )}
                    </p>
                </div>
            </button>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-[var(--surface)] shrink-0 transition-transform">
            <div className="p-5 border-b border-[var(--border)] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[var(--foreground)] tracking-wide">Tus Chats</h2>
                    <div className="flex items-center gap-1">
                        <Button isIconOnly variant="secondary" size="sm" className="w-8 h-8 rounded-lg text-[var(--foreground)]" onPress={() => setIsNewChatOpen(true)} aria-label="Nuevo Chat">
                            <Plus width={18} />
                        </Button>
                        <Button
                            isIconOnly
                            variant="tertiary"
                            size="sm"
                            className={`min-w-8 w-8 h-8 rounded-lg ${selectedChannel ? "text-[var(--muted)]" : "text-[var(--muted)]/40"}`}
                            aria-label="Ajustes de Chat"
                            isDisabled={!selectedChannel}
                            onPress={() => { if (selectedChannel) setIsSettingsOpen(true); }}
                        >
                            <Gear width={18} />
                        </Button>
                    </div>
                </div>
                <Input
                    placeholder="Buscar chats..."
                    className="w-full h-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {/* Filter pills */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {CHAT_FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setChatFilter(f.key)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200
                                ${chatFilter === f.key
                                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
                                    : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--default)]"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <ScrollShadow className="flex-1 min-h-0 p-3 flex flex-col gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-3 p-2">
                            <Skeleton className="w-11 h-11 rounded-full bg-[var(--surface-secondary)] shrink-0" />
                            <div className="flex-1 space-y-2 py-1">
                                <Skeleton className="h-3 w-3/4 rounded-lg bg-[var(--surface-secondary)]" />
                                <Skeleton className="h-3 w-1/2 rounded-lg bg-[var(--surface-secondary)]" />
                            </div>
                        </div>
                    ))
                ) : channels.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-70 p-6 text-center">
                        <div className="text-4xl mb-3"><Comment /></div>
                        <p className="text-sm font-medium text-[var(--muted)]">No tienes chats activos.</p>
                        <p className="text-xs text-[var(--muted)]/70 mt-1">Explora la comunidad o torneos para conectarte.</p>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="mt-4 rounded-full"
                            onPress={() => setIsNewChatOpen(true)}
                        >
                            Iniciar chat
                        </Button>
                    </div>
                ) : filteredChannels.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-60 p-6 text-center">
                        <div className="text-3xl mb-3 text-[var(--muted)]"><Comment /></div>
                        <p className="text-sm text-[var(--muted)]">
                            {search.length > 0
                                ? "No se encontraron chats con ese nombre."
                                : `No tienes ${chatFilter === "dm" ? "mensajes directos" : chatFilter === "grupos" ? "grupos" : chatFilter === "comunidades" ? "comunidades" : "chats"}.`}
                        </p>
                    </div>
                ) : chatFilter !== "todo" ? (
                    /* Single section when a specific filter is active */
                    <div className="space-y-1">
                        <p className="px-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                            {CHAT_FILTERS.find(f => f.key === chatFilter)?.label ?? ""}
                        </p>
                        {filteredChannels.map(renderChannel)}
                    </div>
                ) : (
                    /* Grouped sections for "Todo" filter */
                    <>
                        {channelsByType.DMs.length > 0 && (
                            <div className="space-y-1">
                                <p className="px-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Mensajes Directos</p>
                                {channelsByType.DMs.map(renderChannel)}
                            </div>
                        )}
                        {channelsByType.GROUPS.length > 0 && (
                            <div className="space-y-1">
                                <p className="px-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 mt-4">Grupos</p>
                                {channelsByType.GROUPS.map(renderChannel)}
                            </div>
                        )}
                        {channelsByType.COMMUNITIES.length > 0 && (
                            <div className="space-y-1">
                                <p className="px-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 mt-4">Comunidades y Torneos</p>
                                {channelsByType.COMMUNITIES.map(renderChannel)}
                            </div>
                        )}
                    </>
                )}
            </ScrollShadow>

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
                    // Update the channel in the list
                    onChannelCreated(updated);
                }}
            />
        </div>
    );
}
