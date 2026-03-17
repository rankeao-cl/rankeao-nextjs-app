"use client";

import { useState, useCallback, useEffect } from "react";
import {
    Modal,
    Button,
    Avatar,
    Input,
    ScrollShadow,
} from "@heroui/react";
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

export default function NewChatModal({ isOpen, onOpenChange, onChannelCreated }: NewChatModalProps) {
    const { session } = useAuth();
    const [mode, setMode] = useState<ChatMode>("dm");
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // DM mode state
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Group mode state
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<UserSuggestion[]>([]);

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
            // Group mode: toggle member
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

    // Group avatar: show initials
    const groupInitials = groupName.trim()
        ? groupName.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "GR";

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <Modal.Backdrop className="bg-black/50 backdrop-blur-md">
                <Modal.Container>
                    <Modal.Dialog className="bg-[var(--bg-solid)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl p-0 shadow-2xl max-w-md w-full overflow-hidden">
                        <Modal.CloseTrigger className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] bg-[var(--surface-secondary)] rounded-full p-1 z-10" />

                        <Modal.Header className="px-6 pt-6 pb-4 border-b border-[var(--separator)] items-center text-center">
                            <Modal.Icon className="bg-[var(--accent)]/10 text-[var(--accent)]">
                                {mode === "dm" ? <Person className="size-5" /> : <Persons className="size-5" />}
                            </Modal.Icon>
                            <Modal.Heading className="text-xl font-bold">
                                {mode === "dm" ? "Nuevo Chat" : "Nuevo Grupo"}
                            </Modal.Heading>
                            <p className="text-sm font-medium text-[var(--muted)] mt-1 w-full text-center">
                                {mode === "dm"
                                    ? "Busca un usuario para empezar a conversar"
                                    : "Crea un grupo con multiples miembros"}
                            </p>

                            {/* Mode toggle */}
                            <div className="flex w-full mt-3 bg-[var(--surface-secondary)] rounded-xl p-1 gap-1">
                                <button
                                    onClick={() => setMode("dm")}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5
                                        ${mode === "dm"
                                            ? "bg-[var(--accent)]/15 text-[var(--accent)] shadow-sm"
                                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                                        }`}
                                >
                                    <Person className="size-3.5" />
                                    Chat directo
                                </button>
                                <button
                                    onClick={() => { setMode("group"); setSelectedUserId(null); }}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5
                                        ${mode === "group"
                                            ? "bg-[var(--accent)]/15 text-[var(--accent)] shadow-sm"
                                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                                        }`}
                                >
                                    <Persons className="size-3.5" />
                                    Grupo
                                </button>
                            </div>
                        </Modal.Header>

                        <Modal.Body className="p-0">
                            {/* Group name input (only in group mode) */}
                            {mode === "group" && (
                                <div className="px-4 pt-4 pb-2 border-b border-[var(--separator)] bg-[var(--surface-secondary)]/20">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent)] shrink-0">
                                            {groupInitials}
                                        </div>
                                        <Input
                                            placeholder="Nombre del grupo..."
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            className="flex-1 bg-[var(--surface)]"
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Selected members chips */}
                                    {selectedMembers.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pb-2">
                                            {selectedMembers.map(member => (
                                                <span
                                                    key={member.id}
                                                    className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-xs font-bold text-[var(--accent)]"
                                                >
                                                    {member.username}
                                                    <button
                                                        onClick={() => handleRemoveMember(member.id)}
                                                        className="w-4 h-4 rounded-full bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 flex items-center justify-center transition-colors"
                                                    >
                                                        <Xmark className="size-2.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* User search */}
                            <div className="p-4 border-b border-[var(--separator)] bg-[var(--surface-secondary)]/30">
                                <Input
                                    placeholder={mode === "dm" ? "Nombre de usuario..." : "Buscar miembros..."}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-[var(--surface)]"
                                    autoComplete="off"
                                />
                                {isLoading && <div className="text-xs text-[var(--accent)] mt-2 font-medium">Buscando...</div>}
                            </div>

                            <ScrollShadow className="max-h-[300px] bg-[var(--surface)] p-2">
                                {suggestions.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                        {suggestions.map((user) => {
                                            const isSelectedDM = mode === "dm" && selectedUserId === user.id;
                                            const isSelectedGroup = mode === "group" && selectedMembers.some(m => m.id === user.id);
                                            const isUserSelected = isSelectedDM || isSelectedGroup;

                                            return (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleAddMember(user)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left
                                                        ${isUserSelected ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30" : "hover:bg-[var(--surface-secondary)] border border-transparent"}
                                                    `}
                                                >
                                                    <Avatar className="w-10 h-10 border border-[var(--border)] shrink-0">
                                                        <Avatar.Image src={user.avatar_url} alt={user.username} />
                                                        <Avatar.Fallback>{user.username?.slice(0, 2).toUpperCase()}</Avatar.Fallback>
                                                    </Avatar>
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span className="text-sm font-bold truncate">{user.username}</span>
                                                        {user.name && <span className="text-xs text-[var(--muted)] truncate">{user.name}</span>}
                                                    </div>
                                                    {isUserSelected && (
                                                        <span className="text-xs font-bold text-[var(--accent)] shrink-0">Seleccionado</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-[var(--muted)] flex flex-col items-center">
                                        <Magnifier className="size-8 opacity-30 mb-2" />
                                        <p className="text-sm">
                                            {search.length < 2 ? "Escribe para buscar..." : "No se encontraron usuarios"}
                                        </p>
                                    </div>
                                )}
                            </ScrollShadow>
                        </Modal.Body>

                        <Modal.Footer className="px-6 py-4 flex justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-secondary)]">
                            <Button variant="outline" onPress={() => onOpenChange(false)} isDisabled={isCreating}>
                                Cancelar
                            </Button>
                            <Button variant="secondary" onPress={handleCreateChat} isDisabled={isCreateDisabled || isCreating}>
                                {isCreating
                                    ? "Creando..."
                                    : mode === "dm"
                                        ? "Iniciar Chat"
                                        : `Crear Grupo${selectedMembers.length > 0 ? ` (${selectedMembers.length})` : ""}`
                                }
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
