"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "@heroui/react";
import { Person, Persons, Magnifier, Xmark } from "@gravity-ui/icons";
import { autocompleteUsers } from "@/lib/api/social";
import { createChannel } from "@/lib/api/chat";
import { useAuth } from "@/context/AuthContext";
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
    bg: "#000000",
    surface: "#1A1A1E",
    surfaceLight: "#222226",
    border: "rgba(255,255,255,0.06)",
    text: "#F2F2F2",
    muted: "#888891",
    accent: "#3B82F6",
    iconBg: "rgba(255,255,255,0.08)",
} as const;

export default function NewChatModal({ isOpen, onOpenChange, onChannelCreated }: NewChatModalProps) {
    const { session } = useAuth();
    const [mode, setMode] = useState<ChatMode>("dm");
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<UserSuggestion[]>([]);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setSearch("");
            setSuggestions([]);
            setSelectedUserId(null);
            setGroupName("");
            setSelectedMembers([]);
            setMode("dm");
        }
    }, [isOpen]);

    useEffect(() => {
        if (!search || search.length < 2) {
            setSuggestions([]);
            return;
        }
        const delay = setTimeout(async () => {
            if (!session?.accessToken) return;
            setIsLoading(true);
            try {
                const val = await autocompleteUsers(search, session.accessToken) as any;
                const users = val?.data?.users || val?.users || (Array.isArray(val) ? val : []);
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
            setSelectedUserId(user.id);
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
        if (mode === "dm" && !selectedUserId) return;
        if (mode === "group" && (selectedMembers.length < 1 || !groupName.trim())) return;

        setIsCreating(true);
        try {
            const payload = mode === "dm"
                ? { type: "DM" as const, user_ids: [selectedUserId!] }
                : { type: "GROUP" as const, name: groupName.trim(), user_ids: selectedMembers.map(m => m.id) };

            const res = await createChannel(payload, session.accessToken);
            toast.success(mode === "dm" ? "Chat creado exitosamente" : "Grupo creado exitosamente");
            onChannelCreated(res.channel || res);
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error al crear chat:", error);
            toast.danger(mode === "dm" ? "Error al iniciar el chat" : "Error al crear el grupo", {
                description: error.message || "No se pudo crear la conversacion."
            });
        } finally {
            setIsCreating(false);
        }
    };

    const isCreateDisabled = mode === "dm"
        ? !selectedUserId
        : selectedMembers.length < 1 || !groupName.trim();

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onOpenChange(false); }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
            }}
        >
            {/* Desktop: centered, Mobile: bottom sheet */}
            <div
                style={{
                    width: "100%",
                    maxWidth: 440,
                    background: C.bg,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    maxHeight: "90vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <div style={{ padding: "16px 20px", borderBottom: `0.5px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 20,
                                background: C.iconBg,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Person style={{ width: 20, height: 20, color: C.text }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Nuevo chat</div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>
                                    Busca un usuario para chatear
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => onOpenChange(false)}
                            style={{
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: 14, fontWeight: 500, color: C.muted, padding: "4px 0",
                            }}
                        >
                            Cancelar
                        </button>
                    </div>

                    {/* Tab toggle */}
                    <div style={{
                        display: "flex", gap: 8, marginTop: 16,
                        background: C.surface, borderRadius: 999, padding: 4,
                    }}>
                        <button
                            onClick={() => setMode("dm")}
                            style={{
                                flex: 1, padding: "8px 16px", borderRadius: 999, border: "none",
                                cursor: "pointer", fontSize: 13, fontWeight: 600,
                                background: mode === "dm" ? C.text : "transparent",
                                color: mode === "dm" ? C.bg : C.muted,
                                transition: "all 0.2s",
                            }}
                        >
                            Chat directo
                        </button>
                        <button
                            onClick={() => { setMode("group"); setSelectedUserId(null); }}
                            style={{
                                flex: 1, padding: "8px 16px", borderRadius: 999, border: "none",
                                cursor: "pointer", fontSize: 13, fontWeight: 600,
                                background: mode === "group" ? C.text : "transparent",
                                color: mode === "group" ? C.bg : C.muted,
                                transition: "all 0.2s",
                            }}
                        >
                            Grupo
                        </button>
                    </div>
                </div>

                {/* Group name input */}
                {mode === "group" && (
                    <div style={{ padding: "12px 20px", borderBottom: `0.5px solid ${C.border}` }}>
                        <input
                            placeholder="Nombre del grupo"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            autoComplete="off"
                            style={{
                                width: "100%", boxSizing: "border-box",
                                background: C.surface, borderRadius: 12,
                                border: `1px solid ${C.border}`,
                                padding: "10px 12px", fontSize: 14,
                                color: C.text, outline: "none",
                            }}
                        />
                        {/* Selected members chips */}
                        {selectedMembers.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
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
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                padding: 0,
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

                {/* Search */}
                <div style={{ padding: "12px 20px" }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: C.surface, borderRadius: 12,
                        border: `1px solid ${C.border}`, padding: "10px 12px",
                    }}>
                        <Magnifier style={{ width: 18, height: 18, color: C.muted, flexShrink: 0 }} />
                        <input
                            placeholder={mode === "dm" ? "Buscar usuario..." : "Buscar miembros..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoComplete="off"
                            style={{
                                flex: 1, background: "transparent", border: "none",
                                fontSize: 14, color: C.text, outline: "none",
                            }}
                        />
                    </div>
                    {isLoading && (
                        <div style={{ fontSize: 12, color: C.accent, marginTop: 8, fontWeight: 500 }}>
                            Buscando...
                        </div>
                    )}
                </div>

                {/* Results */}
                <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 12px" }}>
                    {suggestions.length > 0 ? (
                        suggestions.map((user) => {
                            const isSelectedDM = mode === "dm" && selectedUserId === user.id;
                            const isSelectedGroup = mode === "group" && selectedMembers.some(m => m.id === user.id);
                            const isUserSelected = isSelectedDM || isSelectedGroup;

                            return (
                                <button
                                    key={user.id}
                                    onClick={() => handleAddMember(user)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: 12, borderRadius: 12, width: "100%",
                                        background: isUserSelected ? "rgba(59,130,246,0.1)" : "transparent",
                                        border: "none", cursor: "pointer", textAlign: "left",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isUserSelected) e.currentTarget.style.background = C.surfaceLight;
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isUserSelected) e.currentTarget.style.background = "transparent";
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 20,
                                        background: C.surface, flexShrink: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        overflow: "hidden",
                                    }}>
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.username}
                                                style={{ width: 40, height: 40, objectFit: "cover" }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: 14, fontWeight: 700, color: C.muted }}>
                                                {user.username?.slice(0, 2).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 14, fontWeight: 700, color: C.text,
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                            {user.username}
                                        </div>
                                        {user.name && (
                                            <div style={{
                                                fontSize: 12, color: C.muted,
                                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            }}>
                                                {user.name}
                                            </div>
                                        )}
                                    </div>
                                    {isUserSelected && (
                                        <span style={{ fontSize: 12, fontWeight: 600, color: C.accent, flexShrink: 0 }}>
                                            ✓
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    ) : (
                        <div style={{
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", padding: "40px 0",
                        }}>
                            <Magnifier style={{ width: 32, height: 32, color: C.muted, opacity: 0.3, marginBottom: 8 }} />
                            <div style={{ fontSize: 14, color: C.muted }}>
                                {search.length < 2 ? "Escribe para buscar..." : "No se encontraron usuarios"}
                            </div>
                        </div>
                    )}
                </div>

                {/* Create button */}
                {(mode === "dm" ? selectedUserId : true) && (
                    <div style={{ padding: "12px 20px 20px" }}>
                        <button
                            onClick={handleCreateChat}
                            disabled={isCreateDisabled || isCreating}
                            style={{
                                width: "100%", padding: "14px 0", borderRadius: 999,
                                border: "none", cursor: isCreateDisabled || isCreating ? "not-allowed" : "pointer",
                                background: isCreateDisabled || isCreating ? "rgba(59,130,246,0.4)" : C.accent,
                                color: "#FFFFFF", fontSize: 14, fontWeight: 700,
                                transition: "background 0.2s",
                            }}
                        >
                            {isCreating
                                ? "Creando..."
                                : mode === "dm"
                                    ? "Iniciar Chat"
                                    : `Crear Grupo${selectedMembers.length > 0 ? ` (${selectedMembers.length})` : ""}`
                            }
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
