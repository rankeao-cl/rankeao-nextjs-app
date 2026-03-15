"use client";

import { useMemo, useState } from "react";
import { Avatar, Input, ScrollShadow, Skeleton, Button, Badge } from "@heroui/react";
import { Gear, Comment, Persons, Person, ShoppingCart, Headphones, Hierarchy, Plus } from "@gravity-ui/icons";
import type { Channel } from "@/lib/types/chat";
import { useAuth } from "@/context/AuthContext";
import NewChatModal from "./NewChatModal";

interface ChatSidebarProps {
    channels: Channel[];
    loading: boolean;
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
    onChannelCreated: (channel: Channel) => void;
}

export default function ChatSidebar({ channels, loading, selectedChannel, onSelectChannel, onChannelCreated }: ChatSidebarProps) {
    const { session } = useAuth();
    const [search, setSearch] = useState("");
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);

    const filteredChannels = useMemo(() => {
        if (!search.trim()) return channels;
        return channels.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
    }, [channels, search]);

    const channelsByType = useMemo(() => {
        return {
            DMs: filteredChannels.filter(c => c.type === "DM"),
            GROUPS: filteredChannels.filter(c => c.type === "GROUP"),
            COMMUNITIES: filteredChannels.filter(c => c.type === "CLAN" || c.type === "TOURNAMENT"),
        };
    }, [filteredChannels]);

    const renderChannel = (channel: Channel) => {
        const isSelected = selectedChannel?.id === channel.id;
        
        // DEBUG: Inspect channel structure
        if (isSelected) console.log("Canal seleccionado:", channel);

        // Resolve DM name and avatar
        let displayName = channel.name || (channel.type === "DM" ? "Mensaje Directo" : "Sala Global");
        let displayAvatar = channel.name === "Soporte Rankeao" ? undefined : channel.name; // Fallback to existing logic if any

        if (channel.type === "DM" && session?.username) {
            const otherMember = channel.members?.find(m => m.username !== session.username);
            if (otherMember) {
                displayName = otherMember.username;
                displayAvatar = otherMember.avatar_url;
            }
        }

        return (
            <button
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 text-left
          ${isSelected
                        ? "bg-gradient-to-r from-[var(--accent)]/15 to-transparent border border-[var(--accent)]/30 shadow-[0_0_15px_rgba(var(--accent-rgb),0.05)]"
                        : "hover:bg-[var(--surface-secondary)] border border-transparent"}`}
            >
                <div className="relative shrink-0">
                    <Badge.Anchor>
                        <Avatar className="w-11 h-11 text-sm border border-[var(--border)] bg-[var(--surface-tertiary)]">
                            <Avatar.Image src={displayAvatar} alt={displayName} />
                            <Avatar.Fallback>{displayName?.slice(0, 2).toUpperCase() || (channel.type === "DM" ? "DM" : "CH")}</Avatar.Fallback>
                        </Avatar>
                        {(channel.unread_count ?? 0) > 0 && (
                            <Badge color="danger" size="sm" className="border-2 border-[var(--surface)]">
                                {(channel.unread_count ?? 0) > 99 ? '99+' : channel.unread_count}
                            </Badge>
                        )}
                    </Badge.Anchor>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-[var(--foreground)]">
                        {displayName}
                    </p>
                    <p className="text-xs text-[var(--muted)] truncate mt-0.5 font-medium flex items-center gap-1">
                        {channel.type === "GROUP" ? <Persons className="size-3" /> :
                            channel.type === "CLAN" ? <Hierarchy className="size-3" /> :
                                <Person className="size-3" />}
                        {channel.type === "GROUP" ? "Grupo" : channel.type === "CLAN" ? "Comunidad" : "Directo"}
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
                        <Button isIconOnly variant="tertiary" size="sm" className="text-[var(--muted)] min-w-8 w-8 h-8 rounded-lg" aria-label="Ajustes de Chat">
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
            </div>

            <ScrollShadow className="flex-1 p-3 flex flex-col gap-4">
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
                    </div>
                ) : (
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
                        {filteredChannels.length === 0 && search.length > 0 && (
                            <p className="text-center text-sm text-[var(--muted)] mt-10">No se encontraron chats con ese nombre.</p>
                        )}
                    </>
                )}
            </ScrollShadow>

            <NewChatModal 
                isOpen={isNewChatOpen} 
                onOpenChange={setIsNewChatOpen} 
                onChannelCreated={onChannelCreated} 
            />
        </div>
    );
}
