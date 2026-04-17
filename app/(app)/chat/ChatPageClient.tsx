"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { getChatChannels, createChannel } from "@/lib/api/chat";
import { autocompleteUsers, extractUserSearchResults } from "@/lib/api/social";
import type { Channel } from "@/lib/types/chat";
import ChatSidebar from "./ChatSidebar";
import ChatArea from "./ChatArea";

export default function ChatPageClient() {
  const { session, status } = useAuth();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") as "clanes" | "torneos" | null;
  const targetUser = searchParams.get("user");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [loadingChannels, setLoadingChannels] = useState(true);

  const handlePresenceUpdate = useCallback((channelId: string, user: { id: string; username: string }, isOnline: boolean) => {
    const applyPresence = (channel: Channel): Channel => {
      if (channel.id !== channelId || !channel.members?.length) return channel;
      return {
        ...channel,
        members: channel.members.map((member) => {
          const memberId = member.user_id || member.id;
          if (!memberId) return member;
          if (memberId !== user.id && member.username !== user.username) return member;
          return { ...member, is_online: isOnline };
        }),
      };
    };

    setChannels((prev) => prev.map(applyPresence));
    setSelectedChannel((prev) => (prev ? applyPresence(prev) : prev));
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;
    const token = session.accessToken;

    setLoadingChannels(true);
    getChatChannels(undefined, token)
      .then(async (val) => {
        const chList: Channel[] = val?.data?.channels || val?.channels || (Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
        setChannels(chList);

        // If ?user=X param, find or create DM with that user
        if (targetUser) {
          // Check if DM already exists
          const existing = chList.find(
            (c) => c.type === "DM" && c.members?.some((m) => m.username === targetUser)
          );
          if (existing) {
            setSelectedChannel(existing);
          } else {
            // Look up user ID
            try {
              const res = await autocompleteUsers(targetUser, token);
              const users = extractUserSearchResults(res);
              const user = users.find((u) => u.username === targetUser);
              if (user) {
                const dmRes = await createChannel({ type: "DM", user_ids: [user.id] }, token);
                const newChannel = dmRes?.data?.channel || dmRes?.channel;
                if (newChannel) {
                  setChannels((prev) => [newChannel, ...prev.filter((c) => c.id !== newChannel.id)]);
                  setSelectedChannel(newChannel);
                }
              }
            } catch (err) {
              console.error("Error creating DM:", err);
            }
          }
        }
      })
      .catch((err: unknown) => {
        console.error("Error obteniendo canales:", err);
      })
      .finally(() => setLoadingChannels(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          backgroundColor: "var(--background)",
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
                border: "3px solid var(--border)",
                borderTopColor: "var(--accent)",
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
                backgroundColor: "var(--surface-solid)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
              Acceso Denegado
            </h2>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
              Inicia sesión o regístrate para usar el chat.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", backgroundColor: "var(--background)", color: "var(--foreground)", overflow: "hidden", position: "relative" }}>
      {/* Sidebar */}
      <div
        style={{
          borderRight: "1px solid var(--border)",
          flexShrink: 0,
          height: "100%",
        }}
        className={selectedChannel ? "hidden md:flex md:w-[320px] w-full" : "flex md:w-[320px] w-full"}
      >
        <ChatSidebar
          channels={channels}
          loading={loadingChannels}
          selectedChannel={selectedChannel}
          initialFilter={initialFilter || undefined}
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
          onPresenceUpdate={handlePresenceUpdate}
        />
      </div>
    </div>
  );
}
