"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "@heroui/react";
import { Xmark, ChevronLeft } from "@gravity-ui/icons";
import { autocompleteUsers } from "@/lib/api/social";
import { createChannel } from "@/lib/api/chat";
import { useAuth } from "@/lib/hooks/use-auth";
import type { Channel } from "@/lib/types/chat";

interface NewChatModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onChannelCreated: (channel: Channel) => void;
}

interface UserSuggestion {
    id: string;
    username: string;
    avatar_url?: string;
    name?: string;
}

type ChatMode = "dm" | "group";

const C = {
    bg: "var(--background)",
    surface: "var(--surface-solid)",
    border: "var(--border)",
    borderLight: "var(--surface)",
    text: "var(--foreground)",
    muted: "var(--muted)",
    accent: "var(--accent)",
} as const;

export default function NewChatModal({ isOpen, onOpenChange, onChannelCreated }: NewChatModalProps) {
    const { session } = useAuth();
    const [mode, setMode] = useState<ChatMode>("dm");
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null);
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<UserSuggestion[]>([]);
    const overlayRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setSearch("");
            setSuggestions([]);
            setSelectedUser(null);
            setGroupName("");
            setSelectedMembers([]);
            setMode("dm");
        } else {
            setTimeout(() => searchRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onOpenChange]);

    useEffect(() => {
        if (!search || search.length < 2) {
            setSuggestions([]);
            return;
        }
        const delay = setTimeout(async () => {
            if (!session?.accessToken) return;
            setIsLoading(true);
            try {
                const val = await autocompleteUsers(search, session.accessToken);
                const users = val?.data || val?.users || [];
                const filtered = users.filter((u: UserSuggestion) => u.username !== session.username);
                setSuggestions(filtered);
            } catch (error) {
                console.error("Error searching users", error);
            } finally {
                setIsLoading(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search, session]);

    const handleAddMember = (user: UserSuggestion) => {
        if (mode === "dm") {
            if (selectedUser?.id === user.id) {
                setSelectedUser(null);
            } else {
                setSelectedUser(user);
                setSearch("");
                setSuggestions([]);
            }
        } else {
            if (selectedMembers.some(m => m.id === user.id)) {
                setSelectedMembers(prev => prev.filter(m => m.id !== user.id));
            } else {
                setSelectedMembers(prev => [...prev, user]);
            }
            setSearch("");
        }
    };

    const handleRemoveMember = (userId: string) => {
        setSelectedMembers(prev => prev.filter(m => m.id !== userId));
    };

    const handleCreateChat = async () => {
        if (!session?.accessToken) return;
        if (mode === "dm" && !selectedUser) return;
        if (mode === "group" && (selectedMembers.length < 1 || !groupName.trim())) return;

        setIsCreating(true);
        try {
            const payload = mode === "dm"
                ? { type: "DM" as const, user_ids: [selectedUser!.id] }
                : { type: "GROUP" as const, name: groupName.trim(), user_ids: selectedMembers.map(m => m.id) };

            const res = await createChannel(payload, session.accessToken);
            toast.success(mode === "dm" ? "Chat creado exitosamente" : "Grupo creado exitosamente");
            const channel = res?.data?.channel ?? res?.channel;
            if (channel) onChannelCreated(channel);
            onOpenChange(false);
        } catch (error: unknown) {
            console.error("Error al crear chat:", error);
            toast.danger(mode === "dm" ? "Error al iniciar el chat" : "Error al crear el grupo", {
                description: error instanceof Error ? error.message : "No se pudo crear la conversacion."
            });
        } finally {
            setIsCreating(false);
        }
    };

    const isCreateDisabled = mode === "dm"
        ? !selectedUser
        : selectedMembers.length < 1 || !groupName.trim();

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onOpenChange(false); }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 440,
                    height: "100%",
                    maxHeight: 560,
                    background: C.bg,
                    borderRadius: 16,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    margin: 16,
                    animation: "newChatModalIn 0.2s ease-out",
                }}
            >
                <style>{`
                    @keyframes newChatModalIn {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                    }
                `}</style>

                {/* Header */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 12px",
                    borderBottom: `1px solid ${C.borderLight}`,
                }}>
                    <button
                        onClick={() => onOpenChange(false)}
                        style={{
                            width: 32, height: 32, borderRadius: 16,
                            background: "none", border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        aria-label="Volver"
                    >
                        <ChevronLeft style={{ width: 20, height: 20, color: C.text }} />
                    </button>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                        Nuevo mensaje
                    </span>
                    <button
                        onClick={() => onOpenChange(false)}
                        style={{
                            width: 32, height: 32, borderRadius: 16,
                            background: "none", border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        aria-label="Cerrar"
                    >
                        <Xmark style={{ width: 18, height: 18, color: C.text }} />
                    </button>
                </div>

                {/* Tab toggle */}
                <div style={{
                    display: "flex", gap: 6, margin: "12px 16px 0",
                    background: C.surface, borderRadius: 999, padding: 3,
                }}>
                    <button
                        onClick={() => setMode("dm")}
                        style={{
                            flex: 1, padding: "7px 14px", borderRadius: 999, border: "none",
                            cursor: "pointer", fontSize: 12, fontWeight: 600,
                            background: mode === "dm" ? C.text : "transparent",
                            color: mode === "dm" ? C.bg : C.muted,
                            transition: "all 0.2s",
                        }}
                    >
                        Chat directo
                    </button>
                    <button
                        onClick={() => { setMode("group"); setSelectedUser(null); }}
                        style={{
                            flex: 1, padding: "7px 14px", borderRadius: 999, border: "none",
                            cursor: "pointer", fontSize: 12, fontWeight: 600,
                            background: mode === "group" ? C.text : "transparent",
                            color: mode === "group" ? C.bg : C.muted,
                            transition: "all 0.2s",
                        }}
                    >
                        Grupo
                    </button>
                </div>

                {/* Group name input */}
                {mode === "group" && (
                    <div style={{ padding: "10px 16px 0" }}>
                        <input
                            placeholder="Nombre del grupo"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            autoComplete="off"
                            style={{
                                width: "100%", boxSizing: "border-box",
                                background: C.surface, borderRadius: 10,
                                border: `1px solid ${C.borderLight}`,
                                padding: "9px 12px", fontSize: 14,
                                color: C.text, outline: "none",
                            }}
                        />
                        {selectedMembers.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                {selectedMembers.map(member => (
                                    <span
                                        key={member.id}
                                        style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            paddingLeft: 10, paddingRight: 4, paddingTop: 4, paddingBottom: 4,
                                            borderRadius: 999, background: "rgba(59,130,246,0.15)",
                                            fontSize: 12, fontWeight: 600, color: C.accent,
                                        }}
                                    >
                                        {member.username}
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            style={{
                                                width: 18, height: 18, borderRadius: 999, border: "none",
                                                background: "rgba(59,130,246,0.25)", cursor: "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                                            }}
                                        >
                                            <Xmark style={{ width: 10, height: 10, color: C.accent }} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* "Para:" search row */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 16px",
                    borderBottom: `1px solid ${C.borderLight}`,
                }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flexShrink: 0 }}>
                        Para:
                    </span>
                    {/* Selected user chip inline */}
                    {mode === "dm" && selectedUser && (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            paddingLeft: 8, paddingRight: 4, paddingTop: 3, paddingBottom: 3,
                            borderRadius: 999, background: "rgba(59,130,246,0.15)",
                            fontSize: 13, fontWeight: 600, color: C.accent, flexShrink: 0,
                        }}>
                            {selectedUser.username}
                            <button
                                onClick={() => setSelectedUser(null)}
                                style={{
                                    width: 16, height: 16, borderRadius: 999, border: "none",
                                    background: "rgba(59,130,246,0.25)", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                                }}
                            >
                                <Xmark style={{ width: 9, height: 9, color: C.accent }} />
                            </button>
                        </span>
                    )}
                    <input
                        ref={searchRef}
                        placeholder="Busca..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoComplete="off"
                        style={{
                            flex: 1, background: "transparent", border: "none",
                            fontSize: 14, color: C.text, outline: "none",
                            minWidth: 0,
                        }}
                    />
                    {isLoading && (
                        <div style={{
                            width: 16, height: 16, borderRadius: 8,
                            border: `2px solid ${C.borderLight}`,
                            borderTopColor: C.accent,
                            animation: "spin 0.6s linear infinite", flexShrink: 0,
                        }} />
                    )}
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>

                {/* Section header */}
                <div style={{
                    padding: "12px 16px 6px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.text,
                }}>
                    Sugerencias
                </div>

                {/* User results */}
                <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "0 8px" }}>
                    {suggestions.length > 0 ? (
                        suggestions.map((user) => {
                            const isSelectedDM = mode === "dm" && selectedUser?.id === user.id;
                            const isSelectedGroup = mode === "group" && selectedMembers.some(m => m.id === user.id);
                            const isUserSelected = isSelectedDM || isSelectedGroup;

                            return (
                                <button
                                    key={user.id}
                                    onClick={() => handleAddMember(user)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "10px 8px",
                                        borderRadius: 12,
                                        width: "100%",
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 24,
                                        background: C.surface, flexShrink: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        overflow: "hidden",
                                    }}>
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.username}
                                                style={{ width: 48, height: 48, objectFit: "cover" }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: 15, fontWeight: 700, color: C.muted }}>
                                                {user.username?.slice(0, 2).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 14, fontWeight: 600, color: C.text,
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                            {user.name || user.username}
                                        </div>
                                        <div style={{
                                            fontSize: 13, color: C.muted,
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                            {user.username}
                                        </div>
                                    </div>

                                    {/* Radio circle */}
                                    <div style={{
                                        width: 24, height: 24, borderRadius: 12, flexShrink: 0,
                                        border: isUserSelected ? "none" : `2px solid ${C.muted}`,
                                        background: isUserSelected ? C.accent : "transparent",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all 0.15s",
                                    }}>
                                        {isUserSelected && (
                                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div style={{
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", padding: "32px 0",
                        }}>
                            <div style={{ fontSize: 13, color: C.muted }}>
                                {search.length < 2 ? "Escribe para buscar usuarios..." : "No se encontraron usuarios"}
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat button */}
                <div style={{ padding: "12px 16px 16px" }}>
                    <button
                        onClick={handleCreateChat}
                        disabled={isCreateDisabled || isCreating}
                        style={{
                            width: "100%",
                            padding: "13px 0",
                            borderRadius: 10,
                            border: "none",
                            cursor: isCreateDisabled || isCreating ? "not-allowed" : "pointer",
                            background: isCreateDisabled || isCreating ? "rgba(59,130,246,0.35)" : C.accent,
                            color: "#FFFFFF",
                            fontSize: 14,
                            fontWeight: 700,
                            transition: "background 0.2s",
                        }}
                    >
                        {isCreating
                            ? "Creando..."
                            : mode === "dm"
                                ? "Chat"
                                : `Crear Grupo${selectedMembers.length > 0 ? ` (${selectedMembers.length})` : ""}`
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
