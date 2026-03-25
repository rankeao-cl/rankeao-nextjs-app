"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as chatApi from "@/lib/api/chat";
import type { SendMessagePayload, CreateChannelPayload, RoomListFilters, ChatMessage, WSOutgoingMessage } from "@/lib/types/chat";
import type { Params } from "@/lib/types/api";

export function useChatChannels(params?: Params, token?: string) {
    return useQuery({
        queryKey: ["chat", "channels", params],
        queryFn: () => chatApi.getChatChannels(params, token),
    });
}

export function useChatMessages(channelId: string, params?: Params, token?: string) {
    return useQuery({
        queryKey: ["chat", "messages", channelId, params],
        queryFn: () => chatApi.getChatMessages(channelId, params, token),
        enabled: !!channelId,
        refetchInterval: 5000, // Poll for new messages
    });
}

export function useSendMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ channelId, payload }: { channelId: string; payload: SendMessagePayload }) =>
            chatApi.sendChatMessage(channelId, payload),
        onSuccess: (_, { channelId }) => qc.invalidateQueries({ queryKey: ["chat", "messages", channelId] }),
    });
}

export function useCreateChannel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateChannelPayload) => chatApi.createChannel(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "channels"] }),
    });
}

export function useDeleteMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (messageId: string) => chatApi.deleteChatMessage(messageId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "messages"] }),
    });
}

// ── Rooms ──

export function useChatRooms(filters?: RoomListFilters, token?: string) {
    return useQuery({
        queryKey: ["chat", "rooms", filters],
        queryFn: () => chatApi.getChatRooms(filters, token),
    });
}

export function useJoinRoom() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (roomId: string) => chatApi.joinRoom(roomId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["chat", "rooms"] });
            qc.invalidateQueries({ queryKey: ["chat", "channels"] });
        },
    });
}

// ── WebSocket ──

export function useChatWebSocket(
    roomId: string | null,
    token: string | null,
    onMessage: (msg: ChatMessage) => void,
) {
    const wsRef = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    useEffect(() => {
        if (!roomId || !token) return;

        const url = chatApi.getChatRoomWSUrl(roomId, token);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onerror = () => setConnected(false);

        ws.onmessage = (event) => {
            try {
                const parsed: WSOutgoingMessage = JSON.parse(event.data);
                if (parsed.type === "message" && parsed.data && "id" in parsed.data) {
                    onMessageRef.current(parsed.data as ChatMessage);
                }
            } catch { /* ignore malformed */ }
        };

        return () => {
            ws.close();
            wsRef.current = null;
            setConnected(false);
        };
    }, [roomId, token]);

    const sendMessage = useCallback((content: string, replyToId?: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "message",
                content,
                reply_to_id: replyToId,
            }));
        }
    }, []);

    return { connected, sendMessage };
}
