"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, Button, Input, ScrollShadow, Skeleton, toast } from "@heroui/react";
import { PaperPlane, Gear, Magnifier, ShieldExclamation, Comment, ShoppingCart, Headphones, Persons, Person } from "@gravity-ui/icons";
import { getChatChannels, getChatMessages, sendChatMessage } from "@/lib/api/chat";
import { UserDisplayName, getUserRoleData } from "@/components/UserIdentity";

type Channel = {
  id: string; // Public ID string
  type: string;
  name?: string;
  avatar_url?: string;
  message_count: number;
  unread_count: number;
};

type Message = {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  created_at: string;
};

export default function ChatPage() {
  const { session, status } = useAuth();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;

    setLoadingChannels(true);
    getChatChannels(undefined, session.accessToken)
      .then((res: any) => {
        if (res.channels) {
          setChannels(res.channels);
        } else if (Array.isArray(res)) {
          setChannels(res);
        }
      })
      .catch((err: any) => {
        console.error("Error obteniendo canales:", err);
        toast.danger("Error al cargar chats", {
          description: err.message || "Error desconocido",
        });
      })
      .finally(() => setLoadingChannels(false));
  }, [status]);

  const fetchMessages = async (channelId: string) => {
    if (!session?.accessToken) return;
    try {
      const res = await getChatMessages(channelId, { limit: 50 }, session.accessToken);
      if (res.messages && Array.isArray(res.messages)) {
        setMessages([...res.messages].reverse());
      }
    } catch (err: any) {
      console.error("Error obteniendo mensajes:", err);
      toast.danger("Error de conexión", {
        description: err.message || "Error desconocido",
      });
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
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
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

  if (status === "loading") {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-black">
        <Skeleton className="w-16 h-16 rounded-full bg-zinc-900" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-black gap-4 p-4 text-center">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-[0_0_30px_rgba(255,255,255,0.03)]">
          <ShieldExclamation width={48} height={48} className="text-zinc-500" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Acceso Denegado</h2>
        <p className="text-zinc-400 font-medium">Inicia sesión o regístrate para usar el chat.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-black text-zinc-100 overflow-hidden">
      <div className="w-full md:w-[320px] border-r border-zinc-800/60 flex flex-col bg-zinc-950/50 backdrop-blur-md shrink-0 transition-transform">
        <div className="p-5 border-b border-zinc-800/60 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-wide">Tus Chats</h2>
            <Button isIconOnly variant="tertiary" className="text-zinc-400 min-w-8 w-8 h-8 rounded-lg border-transparent">
              <Gear width={18} />
            </Button>
          </div>
          <Input
            placeholder="Buscar chats..."
            className="w-full h-8"
          />
        </div>

        <ScrollShadow className="flex-1 p-3 flex flex-col gap-1.5">
          {loadingChannels ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-2">
                <Skeleton className="w-11 h-11 rounded-full bg-zinc-900 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-3 w-3/4 rounded-lg bg-zinc-900" />
                  <Skeleton className="h-3 w-1/2 rounded-lg bg-zinc-900" />
                </div>
              </div>
            ))
          ) : channels.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-70 p-6 text-center">
              <div className="text-4xl mb-3"><Comment /></div>
              <p className="text-sm font-medium text-zinc-400">No tienes chats activos.</p>
              <p className="text-xs text-zinc-500 mt-1">Explora la comunidad o torneos para conectarte.</p>
            </div>
          ) : (
            channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 text-left
                  ${selectedChannel?.id === channel.id
                    ? "bg-gradient-to-r from-rankeao-neon-cyan/15 to-transparent border border-rankeao-neon-cyan/30 shadow-[0_0_15px_rgba(34,211,238,0.05)]"
                    : "hover:bg-zinc-900 border border-transparent"}`}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-11 h-11 text-sm border border-zinc-700/50 bg-zinc-800">
                    <Avatar.Image src={channel.avatar_url} alt={channel.name} />
                    <Avatar.Fallback>{channel.name || (channel.type === "DM" ? "DM" : "G")}</Avatar.Fallback>
                  </Avatar>
                  {channel.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 rounded-full border-2 border-black flex items-center justify-center shadow-lg">
                      <span className="text-[10px] font-bold text-white">{channel.unread_count > 99 ? '99+' : channel.unread_count}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-zinc-100">
                    {channel.name || (channel.type === "DM" ? "Mensaje Directo" : "Sala Global")}
                  </p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5 font-medium flex items-center gap-1">
                    {channel.type === "GROUP" ? <Persons className="size-3" /> :
                      channel.type === "STORE" ? <ShoppingCart className="size-3" /> :
                        channel.type === "SUPPORT" ? <Headphones className="size-3" /> :
                          <Person className="size-3" />}
                    {channel.type === "GROUP" ? "Grupo" : channel.type === "STORE" ? "Tienda" : channel.type === "SUPPORT" ? "Soporte" : "Directo"} • {channel.message_count} mensajes
                  </p>
                </div>
              </button>
            ))
          )}
        </ScrollShadow>
      </div>

      {/* ÁREA DE MENSAJES */}
      <div className={`flex-1 flex flex-col min-w-0 relative bg-black/40 ${!selectedChannel ? 'hidden md:flex' : 'flex'}`}>
        {selectedChannel ? (
          <>
            {/* Header del chat */}
            <div className="h-[73px] border-b border-zinc-800/60 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-xl relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-zinc-700/80 bg-zinc-800 text-sm">
                  <Avatar.Image src={selectedChannel.avatar_url} alt={selectedChannel.name} />
                  <Avatar.Fallback>{selectedChannel.name?.slice(0, 2) || "CH"}</Avatar.Fallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-zinc-100 leading-tight">
                    {selectedChannel.name || (selectedChannel.type === "DM" ? "Mensaje Directo" : "Sala de Chat")}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-medium tracking-wide uppercase mt-0.5">
                    {selectedChannel.type === "GROUP" ? "Chat Grupal" : selectedChannel.type}
                  </p>
                </div>
              </div>
            </div>

            {/* Historial de Mensajes */}
            <ScrollShadow className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-5 overflow-y-auto w-full max-w-5xl mx-auto custom-scrollbar">
              {loadingMessages && messages.length === 0 ? (
                <div className="space-y-6">
                  <div className="flex gap-3 w-full max-w-[80%]">
                    <Skeleton className="w-8 h-8 rounded-full bg-zinc-900 shrink-0" />
                    <Skeleton className="w-56 h-16 rounded-2xl rounded-tl-sm bg-zinc-900" />
                  </div>
                  <div className="flex gap-3 w-full max-w-[80%] self-end flex-row-reverse">
                    <Skeleton className="w-48 h-12 rounded-2xl rounded-tr-sm bg-zinc-900" />
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-60">
                  <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800 text-3xl">
                    <Comment />
                  </div>
                  <p className="text-sm font-medium text-zinc-300">Aún no hay mensajes</p>
                  <p className="text-xs text-zinc-500 mt-1">Sé el primero en saludar.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.sender.username === session?.username;
                  const showHeader = i === 0 || messages[i - 1].sender.username !== msg.sender.username;

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[90%] md:max-w-[75%] ${isMine ? "self-end flex-row-reverse" : "self-start"}`}
                    >
                      {!isMine && (
                        <div className="w-8 flex-shrink-0 flex flex-col justify-end pb-1">
                          {showHeader ? (
                            <Avatar className="w-8 h-8 text-[11px] font-bold bg-zinc-800 border border-zinc-700 select-none">
                              <Avatar.Image src={msg.sender.avatar_url} alt={msg.sender.username} />
                              <Avatar.Fallback>{msg.sender.username?.charAt(0).toUpperCase()}</Avatar.Fallback>
                            </Avatar>
                          ) : <div className="w-8 h-8" />}
                        </div>
                      )}

                      <div className={`flex flex-col group ${isMine ? "items-end" : "items-start"}`}>
                        {!isMine && showHeader && (
                          <div className="ml-1 mb-1">
                            <UserDisplayName
                              user={getUserRoleData(msg.sender)}
                              className="text-[11px] text-zinc-400 tracking-wide"
                            />
                          </div>
                        )}
                        <div
                          className={`px-4 py-2.5 shadow-sm text-[15px] whitespace-pre-wrap leading-relaxed relative
                            ${isMine
                              ? "bg-gradient-to-br from-rankeao-neon-cyan/90 to-blue-600/90 text-white rounded-2xl rounded-tr-sm shadow-[0_4px_15px_rgba(34,211,238,0.15)]"
                              : "bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded-2xl rounded-tl-sm"
                            }`}
                        >
                          {/* Basic URL parsing for MVP Rich Embeds */}
                          {msg.content.includes("http") ? (
                            <div>
                              <p>{msg.content.split(/https?:\/\/[^\s]+/)[0]}</p>
                              {msg.content.match(/https?:\/\/[^\s]+/g)?.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noreferrer" className="block mt-2 p-2 bg-black/30 rounded-lg border border-white/10 text-sm hover:bg-black/50 transition">
                                  🔗 {url.length > 35 ? url.substring(0, 35) + "..." : url}
                                </a>
                              ))}
                              <p>{msg.content.split(/https?:\/\/[^\s]+/)[1]}</p>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] mt-1 mx-1 font-medium transition-opacity opacity-0 group-hover:opacity-100 ${isMine ? "justify-end" : "justify-start text-zinc-600"}`}>
                          <span className={isMine ? "text-white/70" : ""}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMine && <span className="text-rankeao-neon-cyan/80">✓✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} className="h-1" />
            </ScrollShadow>

            {/* Área de Input */}
            <div className="p-4 md:p-5 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/60 relative z-10 shrink-0">
              <form onSubmit={handleSend} className="max-w-5xl mx-auto flex items-end gap-3 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-2 focus-within:border-rankeao-neon-cyan/50 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.08)] focus-within:bg-zinc-900 transition-all duration-300">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1"
                  autoComplete="off"
                />
                <Button
                  isIconOnly
                  type="submit"
                  isDisabled={!inputValue.trim() || isSending}
                  className="rounded-xl w-12 h-12 min-w-12 bg-rankeao-neon-cyan/15 text-rankeao-neon-cyan hover:bg-rankeao-neon-cyan hover:text-black data-[disabled=true]:bg-zinc-800 data-[disabled=true]:text-zinc-600 transition-all shadow-lg"
                >
                  <PaperPlane width={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-5 p-6 animate-appearance-in">
            <div className="w-24 h-24 rounded-full border border-zinc-800/60 flex items-center justify-center bg-black/40 shadow-[0_0_40px_rgba(255,255,255,0.02)] text-5xl">
              <Comment />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold tracking-tight text-white mb-2">Rankeao Chat</h3>
              <p className="text-zinc-400 font-medium text-sm max-w-xs leading-relaxed">
                Selecciona una sala o un mensaje directo para comenzar a conversar con la comunidad.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}