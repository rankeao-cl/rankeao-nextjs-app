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

// ── WebSocket with auto-reconnect ──

const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 1_000;
const PING_INTERVAL = 25_000;

export function useChatWebSocket(
    roomId: string | null,
    token: string | null,
    onMessage: (msg: ChatMessage) => void,
) {
    const wsRef = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;
    const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const intentionalCloseRef = useRef(false);

    const clearTimers = useCallback(() => {
        if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
        if (pingTimerRef.current) { clearInterval(pingTimerRef.current); pingTimerRef.current = null; }
    }, []);

    const connect = useCallback(() => {
        if (!roomId || !token) return;

        // Clean up existing connection
        if (wsRef.current) {
            intentionalCloseRef.current = true;
            wsRef.current.close();
            wsRef.current = null;
        }
        intentionalCloseRef.current = false;

        const url = chatApi.getChatRoomWSUrl(roomId, token);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

            // Heartbeat ping to keep connection alive
            pingTimerRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    try { ws.send(JSON.stringify({ type: "ping" })); } catch {}
                }
            }, PING_INTERVAL);
        };

        ws.onclose = () => {
            setConnected(false);
            clearTimers();

            // Auto-reconnect with exponential backoff
            if (!intentionalCloseRef.current && roomId && token) {
                const delay = reconnectDelayRef.current;
                reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
                reconnectTimerRef.current = setTimeout(connect, delay);
            }
        };

        ws.onerror = () => {
            // onclose will fire after onerror, reconnect handled there
        };

        ws.onmessage = (event) => {
            try {
                const parsed: WSOutgoingMessage = JSON.parse(event.data);
                if (parsed.type === "message" && parsed.data && "id" in parsed.data) {
                    onMessageRef.current(parsed.data as ChatMessage);
                }
            } catch { /* ignore malformed */ }
        };
    }, [roomId, token, clearTimers]);

    useEffect(() => {
        connect();

        // Reconnect when tab becomes visible again
        const handleVisibility = () => {
            if (document.visibilityState === "visible" && wsRef.current?.readyState !== WebSocket.OPEN) {
                reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
                connect();
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            intentionalCloseRef.current = true;
            clearTimers();
            if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
            setConnected(false);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [connect, clearTimers]);

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
