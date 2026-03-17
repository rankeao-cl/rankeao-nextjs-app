import { useEffect, useRef, useState } from "react";
import { Avatar, Input, Button, ScrollShadow, Skeleton, toast, Badge } from "@heroui/react";
import { PaperPlane, Comment, ChevronLeft, ChevronsDown, Paperclip, Xmark, Persons } from "@gravity-ui/icons";
import { getChatMessages, sendChatMessage } from "@/lib/api/chat";
import { useAuth } from "@/context/AuthContext";
import { UserDisplayName, getUserRoleData } from "@/components/UserIdentity";
import type { Channel, ChatMessage } from "@/lib/types/chat";
import ChatMessageBubble from "./ChatMessageBubble";

interface ChatAreaProps {
    selectedChannel: Channel | null;
    onBack?: () => void;
}

function getJwtField(token: string | undefined, field: string): string | undefined {
    if (!token) return undefined;
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return undefined;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        return payload[field] as string | undefined;
    } catch {
        return undefined;
    }
}

export default function ChatArea({ selectedChannel, onBack }: ChatAreaProps) {
    const { session } = useAuth();

    // Resolve current user identity robustly (survives page reload)
    const myUsername = session?.username || getJwtField(session?.accessToken, "usr") || getJwtField(session?.accessToken, "username");
    const myUserId = getJwtField(session?.accessToken, "sub") || getJwtField(session?.accessToken, "user_id");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const isAtBottomRef = useRef(true);

    // Image attachment state
    const [attachedImage, setAttachedImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Typing indicator state
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Textarea ref for auto-resize
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<ChatMessage[]>([]); // To avoid stale closures in comparison
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    const fetchMessages = async (channelId: string, isInitial = false) => {
        if (!session?.accessToken) return;
        try {
            const val = await getChatMessages(channelId, { limit: 50 }, session.accessToken) as any;
            const rawMessages = val?.data?.messages || val?.messages || (Array.isArray(val) ? val : []);

            if (Array.isArray(rawMessages)) {
                const formattedMessages = [...rawMessages].map((msg: any) => ({
                    ...msg,
                    sender_id: msg.sender?.id || msg.sender_id,
                    sender_username: msg.sender?.username || msg.sender_username,
                    sender_avatar_url: msg.sender?.avatar_url || msg.sender_avatar_url
                })).reverse();

                // 1. Calculate new messages before updating state
                if (!isInitial && messagesRef.current.length > 0) {
                    const newMsgs = formattedMessages.filter(msg => !messagesRef.current.some(p => p.id === msg.id));

                    if (newMsgs.length > 0) {
                        const lastMsg = formattedMessages[formattedMessages.length - 1];
                        const isMyMessage = (myUsername && lastMsg.sender_username === myUsername) || (myUserId && lastMsg.sender_id === myUserId);

                        if (isMyMessage || isAtBottomRef.current) {
                            setTimeout(scrollToBottom, 50);
                        } else {
                            setNewMessagesCount(prev => prev + newMsgs.length);
                        }
                    }
                }

                // 2. Update state and ref
                setMessages(formattedMessages);
                messagesRef.current = formattedMessages;
            }
        } catch (err: any) {
            console.error("Error obteniendo mensajes:", err);
        }
    };

    useEffect(() => {
        if (!selectedChannel) return;

        setNewMessagesCount(0);
        setIsAtBottom(true);
        isAtBottomRef.current = true;
        messagesRef.current = []; // Reset reference list
        setLoadingMessages(true);
        setAttachedImage(null);
        setImagePreviewUrl(null);
        fetchMessages(selectedChannel.id, true).finally(() => {
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

    // Clean up image preview URL on unmount
    useEffect(() => {
        return () => {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        };
    }, [imagePreviewUrl]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setNewMessagesCount(0);
        setIsAtBottom(true);
        isAtBottomRef.current = true;
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 80;
        setIsAtBottom(isBottom);
        isAtBottomRef.current = isBottom;
        if (isBottom) {
            setNewMessagesCount(0);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.danger("Solo se permiten imagenes");
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.danger("La imagen no puede superar los 10MB");
            return;
        }

        // Clean up previous preview
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);

        setAttachedImage(file);
        setImagePreviewUrl(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setAttachedImage(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleInputChange = (value: string) => {
        setInputValue(value);

        // Simulate typing indicator
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const autoResizeTextarea = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const hasContent = inputValue.trim() || attachedImage;
        if (!hasContent || !selectedChannel || isSending) return;

        setIsSending(true);

        try {
            if (!session?.accessToken) throw new Error("No hay sesion activa.");

            // Build message content
            let content = inputValue.trim();

            // If there's an attached image, append it as a placeholder URL
            // In a real implementation, the image would be uploaded first and its URL added
            if (attachedImage) {
                const imageNote = imagePreviewUrl
                    ? `[Imagen adjunta: ${attachedImage.name}]`
                    : "";
                content = content ? `${content}\n${imageNote}` : imageNote;
            }

            await sendChatMessage(selectedChannel.id, { content }, session.accessToken);
            setInputValue("");
            handleRemoveImage();

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }

            await fetchMessages(selectedChannel.id);
            setTimeout(scrollToBottom, 50);
        } catch (err: any) {
            console.error("Error al enviar", err);
            toast.danger("Error al enviar mensaje", {
                description: err.message || "Hubo un problema de conexion con el servidor.",
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
        ? selectedChannel.members?.some(m => m.username !== myUsername && m.is_online)
        : false;

    const isGroup = selectedChannel.type === "GROUP";
    const memberCount = selectedChannel.members?.length || 0;

    // Resolve DM name and avatar
    let displayName = selectedChannel.name || (selectedChannel.type === "DM" ? "Mensaje Directo" : "Sala de Chat");
    let displayAvatar = selectedChannel.name === "Soporte Rankeao" ? undefined : selectedChannel.name;

    if (selectedChannel.type === "DM" && myUsername) {
        const otherMember = selectedChannel.members?.find(m => m.username !== myUsername);
        if (otherMember) {
            displayName = otherMember.username;
            displayAvatar = otherMember.avatar_url;
        }
    }

    return (
        <div className="flex-1 flex flex-col min-w-0 h-full max-h-full overflow-hidden relative bg-[var(--surface)]">
            {/* Header del chat */}
            <div className="h-[73px] border-b border-[var(--border)] flex items-center justify-between px-6 bg-[var(--surface-secondary)]/80 backdrop-blur-xl relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                    {/* Back button for mobile */}
                    <Button
                        isIconOnly
                        variant="tertiary"
                        size="sm"
                        className="md:hidden -ml-2 text-[var(--foreground)]"
                        onPress={onBack}
                        aria-label="Volver"
                    >
                        <ChevronLeft className="size-5" />
                    </Button>

                    <div className="relative">
                        {isGroup ? (
                            <div className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface-tertiary)] flex items-center justify-center text-[var(--muted)]">
                                <Persons className="size-5" />
                            </div>
                        ) : (
                            <>
                                <Avatar className="w-10 h-10 border border-[var(--border)] bg-[var(--surface-tertiary)] text-sm">
                                    <Avatar.Image src={displayAvatar} alt={displayName} />
                                    <Avatar.Fallback>{displayName?.slice(0, 2).toUpperCase() || "CH"}</Avatar.Fallback>
                                </Avatar>
                                {selectedChannel.type === "DM" && (
                                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--surface-secondary)] ${isOnline ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-gray-400"}`}>
                                        {isOnline && <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--foreground)] leading-tight">
                            {displayName}
                        </h3>
                        <p className="text-[11px] text-[var(--muted)] font-medium tracking-wide uppercase mt-0.5 flex items-center gap-1">
                            {isGroup ? (
                                <>
                                    <span>Chat Grupal</span>
                                    <span className="text-[var(--muted)]/70 lowercase normal-case text-[10px]">({memberCount} miembros)</span>
                                </>
                            ) : (
                                <>
                                    <span>{selectedChannel.type}</span>
                                    {isOnline && <span className="text-green-500 lowercase normal-case text-[10px] ml-1">en linea</span>}
                                    {!isOnline && selectedChannel.type === "DM" && <span className="text-[var(--muted)]/60 lowercase normal-case text-[10px] ml-1">desconectado</span>}
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Historial de Mensajes */}
            <div className="flex-1 relative min-h-0">
                <ScrollShadow
                    onScroll={handleScroll}
                    className="h-full px-4 md:px-8 py-6 flex flex-col gap-5 overflow-y-auto w-full max-w-5xl mx-auto custom-scrollbar"
                >
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
                            <p className="text-sm font-medium text-[var(--foreground)]">Aun no hay mensajes</p>
                            <p className="text-xs text-[var(--muted)] mt-1">Se el primero en saludar.</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMine = !!(myUsername && msg.sender_username === myUsername) || !!(myUserId && msg.sender_id === myUserId);
                            const showHeader = i === 0 || messages[i - 1].sender_id !== msg.sender_id;

                            return (
                                <ChatMessageBubble
                                    key={msg.id}
                                    message={msg}
                                    isMine={isMine}
                                    showHeader={showHeader}
                                    status={msg.status}
                                />
                            );
                        })
                    )}
                    <div ref={messagesEndRef} className="h-1" />
                </ScrollShadow>

                {/* Floating "Scroll to Bottom" Button (WhatsApp Style) */}
                {!isAtBottom && (
                    <div className="absolute bottom-4 right-4 md:right-8 z-20 animate-appearance-in">
                        <Button
                            isIconOnly
                            onPress={scrollToBottom}
                            className={`rounded-full shadow-xl border border-[var(--border)] font-bold transition-all duration-300 w-10 h-10 min-w-10
                                ${newMessagesCount > 0
                                    ? "bg-white text-black border-gray-300 scale-110"
                                    : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]"
                                }`}
                        >
                            {newMessagesCount > 0 ? (
                                <span className="text-xs">{newMessagesCount}</span>
                            ) : (
                                <ChevronsDown className="size-5" />
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Typing indicator */}
            {isTyping && (
                <div className="px-4 md:px-5 pt-2 shrink-0">
                    <div className="max-w-5xl mx-auto">
                        <p className="text-xs text-[var(--muted)] font-medium animate-pulse flex items-center gap-1.5">
                            <span className="inline-flex gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce" style={{ animationDelay: "300ms" }} />
                            </span>
                            escribiendo...
                        </p>
                    </div>
                </div>
            )}

            {/* Image preview */}
            {imagePreviewUrl && (
                <div className="px-4 md:px-5 pt-2 shrink-0">
                    <div className="max-w-5xl mx-auto">
                        <div className="inline-flex items-start gap-2 p-2 rounded-xl bg-[var(--surface-secondary)]/50 border border-[var(--border)]">
                            <img
                                src={imagePreviewUrl}
                                alt="Vista previa"
                                className="w-16 h-16 rounded-lg object-cover border border-[var(--border)]"
                            />
                            <button
                                onClick={handleRemoveImage}
                                className="w-5 h-5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-500 transition-colors text-[var(--muted)]"
                            >
                                <Xmark className="size-3" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Area de Input */}
            <div className="p-4 md:p-5 bg-[var(--surface)] backdrop-blur-xl border-t border-[var(--border)] relative z-10 shrink-0">
                <form onSubmit={handleSend} className="max-w-5xl mx-auto flex items-end gap-3 bg-[var(--surface-secondary)]/50 border border-[var(--border)] rounded-2xl p-2 focus-within:border-[var(--accent)]/50 focus-within:shadow-[0_0_20px_rgba(var(--accent-rgb),0.08)] focus-within:bg-[var(--surface)] transition-all duration-300">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                    />

                    {/* Attachment button */}
                    <Button
                        isIconOnly
                        type="button"
                        variant="tertiary"
                        onPress={() => fileInputRef.current?.click()}
                        className="rounded-xl w-10 h-10 min-w-10 text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all shrink-0"
                        aria-label="Adjuntar imagen"
                    >
                        <Paperclip width={18} />
                    </Button>

                    {/* Textarea for multiline input */}
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => {
                            handleInputChange(e.target.value);
                            autoResizeTextarea();
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe tu mensaje o pega un link del marketplace..."
                        rows={1}
                        className="flex-1 bg-transparent border-none shadow-none outline-none resize-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] py-2.5 px-2 max-h-[120px] custom-scrollbar"
                        autoComplete="off"
                    />

                    {/* Send button */}
                    <Button
                        isIconOnly
                        type="submit"
                        isDisabled={(!inputValue.trim() && !attachedImage) || isSending}
                        className="rounded-xl w-12 h-12 min-w-12 bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] data-[disabled=true]:bg-[var(--surface-secondary)] data-[disabled=true]:text-[var(--muted)] transition-all shadow-lg shrink-0"
                    >
                        <PaperPlane width={18} />
                    </Button>
                </form>
            </div>
        </div>
    );
}
