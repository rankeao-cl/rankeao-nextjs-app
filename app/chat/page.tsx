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
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[var(--surface-secondary)]/20">
        <Skeleton className="w-16 h-16 rounded-full bg-[var(--surface-secondary)]" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
    <div className="h-[calc(100vh-128px)] md:h-[calc(100vh-64px)] p-0 md:p-6 bg-[var(--surface-secondary)]/30 overflow-hidden">
      <div className="h-full max-w-7xl mx-auto flex flex-col items-center justify-center bg-[var(--surface)] text-[var(--foreground)] overflow-hidden rounded-none md:rounded-3xl border-0 md:border border-[var(--border)] shadow-none md:shadow-[0_8px_30px_rgb(0,0,0,0.12)] gap-4 p-4 text-center">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl">
          <ShieldExclamation width={48} height={48} className="text-[var(--muted)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">Acceso Denegado</h2>
        <p className="text-[var(--muted)] font-medium">Inicia sesión o regístrate para usar el chat.</p>
      </div>
    </div>
    );
  }

  return (
    <div className="h-[calc(100vh-128px)] md:h-[calc(100vh-64px)] p-0 md:p-6 bg-[var(--surface-secondary)]/30 overflow-hidden">
      <div className="h-full max-w-7xl mx-auto flex bg-[var(--surface)] text-[var(--foreground)] overflow-hidden rounded-none md:rounded-3xl border-0 md:border border-[var(--border)] shadow-none md:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className={`${selectedChannel ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] shrink-0 border-r border-[var(--border)]`}>
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
          />
        </div>
        <div className={`flex-1 flex flex-col min-w-0 relative ${!selectedChannel ? 'hidden md:flex' : 'flex'}`}>
          <ChatArea 
            selectedChannel={selectedChannel} 
            onBack={() => setSelectedChannel(null)}
          />
        </div>
      </div>
    </div>
  );
}