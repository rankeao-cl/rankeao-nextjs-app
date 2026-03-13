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
import { Person, Magnifier } from "@gravity-ui/icons";
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

export default function NewChatModal({ isOpen, onOpenChange, onChannelCreated }: NewChatModalProps) {
    const { session } = useAuth();
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSearch("");
            setSuggestions([]);
            setSelectedUserId(null);
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
                const res = await autocompleteUsers(search, session.accessToken);
                if (res && res.users) {
                    const filtered = res.users.filter((u: UserSuggestion) => u.username !== session.username);
                    setSuggestions(filtered);
                } else if (Array.isArray(res)) {
                    const filtered = res.filter((u: UserSuggestion) => u.username !== session.username);
                    setSuggestions(filtered);
                }
            } catch (error) {
                console.error("Error searching users", error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(delay);
    }, [search, session]);

    const handleCreateChat = async () => {
        if (!selectedUserId || !session?.accessToken) return;

        setIsCreating(true);
        try {
            const res = await createChannel({
                type: "DM",
                member_ids: [selectedUserId]
            }, session.accessToken);

            toast.success("Chat creado exitosamente");
            onChannelCreated(res.channel || res);
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error al crear chat:", error);
            toast.danger("Error al iniciar el chat", {
                description: error.message || "No se pudo crear la conversación."
            });
        } finally {
            setIsCreating(false);
        }
    };

    return (        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <Modal.Backdrop className="bg-black/50 backdrop-blur-md">
                <Modal.Container>
                    <Modal.Dialog className="bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl p-0 shadow-2xl max-w-md w-full overflow-hidden">
                        <Modal.CloseTrigger className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] bg-[var(--surface-secondary)] rounded-full p-1 z-10" />
                        
                        <Modal.Header className="px-6 pt-6 pb-4 border-b border-[var(--separator)] items-center text-center">
                            <Modal.Icon className="bg-[var(--accent)]/10 text-[var(--accent)]">
                                <Person className="size-5" />
                            </Modal.Icon>
                            <Modal.Heading className="text-xl font-bold">Nuevo Chat</Modal.Heading>
                            <p className="text-sm font-medium text-[var(--muted)] mt-1 w-full text-center">Busca un usuario para empezar a conversar</p>
                        </Modal.Header>
                        
                        <Modal.Body className="p-0">
                            <div className="p-4 border-b border-[var(--separator)] bg-[var(--surface-secondary)]/30">
                                <Input
                                    placeholder="Nombre de usuario..."
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
                                        {suggestions.map((user) => (
                                            <button
                                                key={user.id}
                                                onClick={() => setSelectedUserId(user.id)}
                                                className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left
                                                    ${selectedUserId === user.id ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30" : "hover:bg-[var(--surface-secondary)] border border-transparent"}
                                                `}
                                            >
                                                <Avatar className="w-10 h-10 border border-[var(--border)] shrink-0">
                                                    <Avatar.Image src={user.avatar_url} alt={user.username} />
                                                    <Avatar.Fallback>{user.username?.slice(0, 2).toUpperCase()}</Avatar.Fallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{user.username}</span>
                                                    {user.name && <span className="text-xs text-[var(--muted)]">{user.name}</span>}
                                                </div>
                                            </button>
                                        ))}
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
                            <Button variant="secondary" onPress={handleCreateChat} isDisabled={!selectedUserId || isCreating}>
                                {isCreating ? "Iniciando..." : "Iniciar Chat"}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
