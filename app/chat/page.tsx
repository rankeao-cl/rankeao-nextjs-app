"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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
      })
      .finally(() => setLoadingChannels(false));
  }, [status, session?.accessToken]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          gap: 16,
          padding: 16,
          textAlign: "center",
        }}
      >
        {status === "loading" ? (
          <>
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid rgba(255,255,255,0.06)",
                borderTopColor: "#3B82F6",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        ) : (
          <>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "#1A1A1E",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#F2F2F2", margin: 0 }}>
              Acceso Denegado
            </h2>
            <p style={{ fontSize: 13, color: "#888891", margin: 0 }}>
              Inicia sesión o regístrate para usar el chat.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", backgroundColor: "#000000", color: "#F2F2F2", overflow: "hidden", position: "relative" }}>
      {/* Sidebar */}
      <div
        style={{
          borderRight: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
          height: "100%",
        }}
        className={selectedChannel ? "hidden md:flex md:w-[320px] w-full" : "flex md:w-[320px] w-full"}
      >
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
      {/* Chat area */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: selectedChannel ? "flex" : undefined,
          flexDirection: "column",
          height: "100%",
        }}
        className={selectedChannel ? "flex" : "hidden md:flex"}
      >
        <ChatArea
          selectedChannel={selectedChannel}
          onBack={() => setSelectedChannel(null)}
        />
      </div>
    </div>
  );
}
