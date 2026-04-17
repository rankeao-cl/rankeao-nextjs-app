"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as chatApi from "@/lib/api/chat";
import type {
    SendMessagePayload,
    CreateChannelPayload,
    RoomListFilters,
    ChatMessage,
    WSOutgoingMessage,
    WSPresenceUser,
} from "@/lib/types/chat";
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

export interface ChatPresenceEvent {
    type: "user_joined" | "user_left";
    channelId: string;
    user: WSPresenceUser;
}

export interface ChatAckEvent {
    channelId: string;
    clientMsgId: string;
    messageId: string;
}

interface ChatWebSocketHandlers {
    onMessage?: (msg: ChatMessage, channelId: string) => void;
    onPresence?: (event: ChatPresenceEvent) => void;
    onAck?: (event: ChatAckEvent) => void;
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isChatMessageData(value: unknown): value is ChatMessage {
    if (!isObjectLike(value)) return false;
    return (
        typeof value.id === "string" &&
        typeof value.channel_id === "string" &&
        typeof value.content === "string" &&
        typeof value.created_at === "string"
    );
}

function isAckData(value: unknown): value is { client_msg_id: string; message_id: string } {
    if (!isObjectLike(value)) return false;
    return typeof value.client_msg_id === "string" && typeof value.message_id === "string";
}

export function useChatWebSocket(
    token: string | null,
    handlers: ChatWebSocketHandlers = {},
    enabled = true,
) {
    const wsRef = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const handlersRef = useRef(handlers);
    const connectRef = useRef<() => void>(() => {});
    const subscriptionsRef = useRef<Set<string>>(new Set());
    const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intentionalCloseRef = useRef(false);

    const clearTimers = useCallback(() => {
        if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    }, []);

    const sendPayload = useCallback((payload: object) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify(payload));
    }, []);

    const resubscribeAll = useCallback(() => {
        for (const channelId of subscriptionsRef.current) {
            sendPayload({ type: "subscribe", channel_id: channelId });
        }
    }, [sendPayload]);

    const connect = useCallback(() => {
        if (!token || !enabled) return;

        // Clean up existing connection
        if (wsRef.current) {
            intentionalCloseRef.current = true;
            wsRef.current.close();
            wsRef.current = null;
        }
        intentionalCloseRef.current = false;

        const url = chatApi.getChatWSUrl(token);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
            resubscribeAll();
        };

        ws.onclose = () => {
            setConnected(false);
            clearTimers();

            // Auto-reconnect with exponential backoff
            if (!intentionalCloseRef.current && token) {
                const delay = reconnectDelayRef.current;
                reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
                reconnectTimerRef.current = setTimeout(() => {
                    connectRef.current();
                }, delay);
            }
        };

        ws.onerror = () => {
            // onclose will fire after onerror, reconnect handled there
        };

        ws.onmessage = (event) => {
            try {
                const parsed: WSOutgoingMessage = JSON.parse(event.data);
                if (parsed.type === "message" && parsed.channel_id && isChatMessageData(parsed.data)) {
                    handlersRef.current.onMessage?.(parsed.data, parsed.channel_id);
                    return;
                }

                if ((parsed.type === "user_joined" || parsed.type === "user_left") && parsed.channel_id && isObjectLike(parsed.data) && "user" in parsed.data) {
                    const rawUser = (parsed.data as { user?: unknown }).user;
                    if (isObjectLike(rawUser) && typeof rawUser.id === "string" && typeof rawUser.username === "string") {
                        handlersRef.current.onPresence?.({
                            type: parsed.type,
                            channelId: parsed.channel_id,
                            user: {
                                id: rawUser.id,
                                username: rawUser.username,
                                avatar_url: typeof rawUser.avatar_url === "string" ? rawUser.avatar_url : undefined,
                            },
                        });
                    }
                    return;
                }

                if (parsed.type === "message_ack" && parsed.channel_id && isAckData(parsed.data)) {
                    handlersRef.current.onAck?.({
                        channelId: parsed.channel_id,
                        clientMsgId: parsed.data.client_msg_id,
                        messageId: parsed.data.message_id,
                    });
                }
            } catch { /* ignore malformed */ }
        };
    }, [token, enabled, clearTimers, resubscribeAll]);

    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

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

    const subscribe = useCallback((channelId: string) => {
        if (!channelId) return;
        subscriptionsRef.current.add(channelId);
        sendPayload({ type: "subscribe", channel_id: channelId });
    }, [sendPayload]);

    const unsubscribe = useCallback((channelId: string) => {
        if (!channelId) return;
        subscriptionsRef.current.delete(channelId);
        sendPayload({ type: "unsubscribe", channel_id: channelId });
    }, [sendPayload]);

    const sendMessage = useCallback((channelId: string, content: string, replyToId?: string, clientMsgId?: string) => {
        if (!channelId) return;
        sendPayload({
            type: "message",
            channel_id: channelId,
            content,
            reply_to_id: replyToId,
            client_msg_id: clientMsgId,
        });
    }, [sendPayload]);

    return { connected, subscribe, unsubscribe, sendMessage };
}
