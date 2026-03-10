"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, Input, Button, ScrollShadow, Skeleton, toast } from "@heroui/react";
import { PaperPlane, Comment } from "@gravity-ui/icons";
import { getChatMessages, sendChatMessage } from "@/lib/api/chat";
import { useAuth } from "@/context/AuthContext";
import { UserDisplayName, getUserRoleData } from "@/components/UserIdentity";
import type { Channel, ChatMessage } from "@/lib/types/chat";
import ChatMessageBubble from "./ChatMessageBubble";

interface ChatAreaProps {
    selectedChannel: Channel | null;
}

export default function ChatArea({ selectedChannel }: ChatAreaProps) {
    const { session } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    const fetchMessages = async (channelId: string) => {
        if (!session?.accessToken) return;
        try {
            const res = await getChatMessages(channelId, { limit: 50 }, session.accessToken);
            if (res.messages && Array.isArray(res.messages)) {
                setMessages([...res.messages].reverse());
            }
        } catch (err: any) {
            console.error("Error obteniendo mensajes:", err);
        }
    };

    useEffect(() => {
        if (!selectedChannel) return;

        setLoadingMessages(true);
        fetchMessages(selectedChannel.id).finally(() => {
            setLoadingMessages(false);
            setTimeout(scrollToBottom, 100);
        });

        if (pollInterval.current) clearInterval(pollInterval.current);
        pollInterval.current = setInterval(() => {
            fetchMessages(selectedChannel.id);
        }, 3000);

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [selectedChannel?.id]);

    useEffect(() => {
        if (messages.length > 0 && !loadingMessages) {
            scrollToBottom();
        }
    }, [messages, loadingMessages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || !selectedChannel || isSending) return;

        setIsSending(true);

        try {
            if (!session?.accessToken) throw new Error("No hay sesión activa.");
            await sendChatMessage(selectedChannel.id, { content: inputValue.trim() }, session.accessToken);
            setInputValue("");
            await fetchMessages(selectedChannel.id);
            setTimeout(scrollToBottom, 50);
        } catch (err: any) {
            console.error("Error al enviar", err);
            toast.danger("Error al enviar mensaje", {
                description: err.message || "Hubo un problema de conexión con el servidor.",
            });
        } finally {
            setIsSending(false);
        }
    };

    if (!selectedChannel) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 bg-transparent animate-appearance-in">
                <div className="w-24 h-24 rounded-full border border-[var(--border)] flex items-center justify-center bg-[var(--surface-secondary)] text-5xl">
                    <Comment />
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)] mb-2">Rankeao Chat</h3>
                    <p className="text-[var(--muted)] font-medium text-sm max-w-xs leading-relaxed">
                        Selecciona una sala o un mensaje directo para comenzar a conversar con la comunidad.
                    </p>
                </div>
            </div>
        );
    }

    // Comprobar estado online
    const isOnline = selectedChannel.type === "DM"
        ? selectedChannel.members?.some(m => m.username !== session?.username && m.is_online)
        : false;

    return (
        <div className="flex-1 flex flex-col min-w-0 relative bg-[var(--surface)]">
            {/* Header del chat */}
            <div className="h-[73px] border-b border-[var(--border)] flex items-center justify-between px-6 bg-[var(--surface-secondary)]/80 backdrop-blur-xl relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="w-10 h-10 border border-[var(--border)] bg-[var(--surface-tertiary)] text-sm">
                            <Avatar.Fallback>{selectedChannel.name?.slice(0, 2).toUpperCase() || "CH"}</Avatar.Fallback>
                        </Avatar>
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--surface)] rounded-full"></span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--foreground)] leading-tight">
                            {selectedChannel.name || (selectedChannel.type === "DM" ? "Mensaje Directo" : "Sala de Chat")}
                        </h3>
                        <p className="text-[11px] text-[var(--muted)] font-medium tracking-wide uppercase mt-0.5 flex items-center gap-1">
                            {selectedChannel.type === "GROUP" ? "Chat Grupal" : selectedChannel.type}
                            {isOnline && <span className="text-green-500 lowercase normal-case text-[10px] ml-1">• en línea</span>}
                        </p>
                    </div>
                </div>
            </div>

            {/* Historial de Mensajes */}
            <ScrollShadow className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-5 overflow-y-auto w-full max-w-5xl mx-auto custom-scrollbar">
                {loadingMessages && messages.length === 0 ? (
                    <div className="space-y-6">
                        <div className="flex gap-3 w-full max-w-[80%]">
                            <Skeleton className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] shrink-0" />
                            <Skeleton className="w-56 h-16 rounded-2xl rounded-tl-sm bg-[var(--surface-secondary)]" />
                        </div>
                        <div className="flex gap-3 w-full max-w-[80%] self-end flex-row-reverse">
                            <Skeleton className="w-48 h-12 rounded-2xl rounded-tr-sm bg-[var(--surface-secondary)]" />
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-60">
                        <div className="w-16 h-16 bg-[var(--surface-secondary)] rounded-full flex items-center justify-center mb-4 border border-[var(--border)] text-3xl">
                            <Comment />
                        </div>
                        <p className="text-sm font-medium text-[var(--foreground)]">Aún no hay mensajes</p>
                        <p className="text-xs text-[var(--muted)] mt-1">Sé el primero en saludar.</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMine = msg.sender_username === session?.username;
                        const showHeader = i === 0 || messages[i - 1].sender_id !== msg.sender_id;

                        return (
                            <ChatMessageBubble
                                key={msg.id}
                                message={msg}
                                isMine={isMine}
                                showHeader={showHeader}
                            />
                        );
                    })
                )}
                <div ref={messagesEndRef} className="h-1" />
            </ScrollShadow>

            {/* Área de Input */}
            <div className="p-4 md:p-5 bg-[var(--surface)] backdrop-blur-xl border-t border-[var(--border)] relative z-10 shrink-0">
                <form onSubmit={handleSend} className="max-w-5xl mx-auto flex items-end gap-3 bg-[var(--surface-secondary)]/50 border border-[var(--border)] rounded-2xl p-2 focus-within:border-[var(--accent)]/50 focus-within:shadow-[0_0_20px_rgba(var(--accent-rgb),0.08)] focus-within:bg-[var(--surface)] transition-all duration-300">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Escribe tu mensaje o pega un link del marketplace..."
                        className="flex-1 bg-transparent border-none shadow-none focus-within:!bg-transparent hover:!bg-transparent"
                        autoComplete="off"
                    />
                    <Button
                        isIconOnly
                        type="submit"
                        isDisabled={!inputValue.trim() || isSending}
                        className="rounded-xl w-12 h-12 min-w-12 bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white data-[disabled=true]:bg-[var(--surface-secondary)] data-[disabled=true]:text-[var(--muted)] transition-all shadow-lg"
                    >
                        <PaperPlane width={18} />
                    </Button>
                </form>
            </div>
        </div>
    );
}
