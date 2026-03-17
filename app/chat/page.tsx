"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton, toast } from "@heroui/react";
import { ShieldExclamation } from "@gravity-ui/icons";
import { getChatChannels } from "@/lib/api/chat";
import type { Channel } from "@/lib/types/chat";
import ChatSidebar from "./ChatSidebar";
import ChatArea from "./ChatArea";

export default function ChatPage() {
  const { session, status } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [loadingChannels, setLoadingChannels] = useState(true);

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;

    setLoadingChannels(true);
    getChatChannels(undefined, session.accessToken)
      .then((val: any) => {
        const channels = val?.data?.channels || val?.channels || (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
        setChannels(channels);
      })
      .catch((err: any) => {
        console.error("Error obteniendo canales:", err);
        toast.danger("Error al cargar chats", {
          description: err.message || "Error desconocido",
        });
      })
      .finally(() => setLoadingChannels(false));
  }, [status, session?.accessToken]);

  if (status === "loading") {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--surface-secondary)]/20">
        <Skeleton className="w-16 h-16 rounded-full bg-[var(--surface-secondary)]" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--surface-secondary)]/10 gap-4 p-4 text-center">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl">
          <ShieldExclamation width={48} height={48} className="text-[var(--muted)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">Acceso Denegado</h2>
        <p className="text-[var(--muted)] font-medium">Inicia sesión o regístrate para usar el chat.</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex bg-[var(--surface)] text-[var(--foreground)] overflow-hidden relative">
      <div className={`${selectedChannel ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] border-r border-[var(--border)] shrink-0 h-full`}>
        <ChatSidebar
          channels={channels}
          loading={loadingChannels}
          selectedChannel={selectedChannel}
          onSelectChannel={(channel) => {
            setSelectedChannel(channel);
            if (channel.unread_count && channel.unread_count > 0) {
              setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, unread_count: 0 } : c));
            }
          }}
          onChannelCreated={(newChannel) => {
            setChannels(prev => [newChannel, ...prev.filter(c => c.id !== newChannel.id)]);
            setSelectedChannel(newChannel);
          }}
          onChannelLeft={() => {
            if (selectedChannel) {
              setChannels(prev => prev.filter(c => c.id !== selectedChannel.id));
              setSelectedChannel(null);
            }
          }}
        />
      </div>
      <div className={`${selectedChannel ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col h-full`}>
        <ChatArea 
          selectedChannel={selectedChannel} 
          onBack={() => setSelectedChannel(null)}
        />
      </div>
    </div>
  );
}