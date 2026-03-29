"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "wss://api.rankeao.cl";
const MAX_RETRIES = 5;
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000];

export interface DuelWSMessage {
    type: string;
    payload: unknown;
}

export interface PayloadDuelAccepted {
    duel_id: string;
    status: string;
}

export interface PayloadGameStarted {
    duel_id: string;
    game_id: string;
    game_number: number;
}

interface UseDuelSocketOptions {
    onDuelAccepted?: (payload: PayloadDuelAccepted) => void;
    onGameStarted?: (payload: PayloadGameStarted) => void;
}

/**
 * useDuelSocket — conecta al WebSocket del room del duelo.
 * Emite eventos en tiempo real cuando el oponente acepta el duelo
 * o cuando alguno de los jugadores inicia una partida.
 */
export function useDuelSocket(
    duelID: string | null,
    token: string | null | undefined,
    options: UseDuelSocketOptions = {},
) {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const retryCountRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intentionalCloseRef = useRef(false);

    // Keep stable refs to callbacks so connect() doesn't need them as deps
    const onDuelAcceptedRef = useRef(options.onDuelAccepted);
    const onGameStartedRef = useRef(options.onGameStarted);
    useEffect(() => { onDuelAcceptedRef.current = options.onDuelAccepted; }, [options.onDuelAccepted]);
    useEffect(() => { onGameStartedRef.current = options.onGameStarted; }, [options.onGameStarted]);

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    }, []);

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const msg: DuelWSMessage = JSON.parse(event.data);
            switch (msg.type) {
                case "duel.accepted":
                    onDuelAcceptedRef.current?.(msg.payload as PayloadDuelAccepted);
                    break;
                case "duel.game_started":
                    onGameStartedRef.current?.(msg.payload as PayloadGameStarted);
                    break;
            }
        } catch {
            // ignorar mensajes mal formados
        }
    }, []);

    const connect = useCallback(() => {
        if (!duelID || !token) return;

        if (wsRef.current) {
            intentionalCloseRef.current = true;
            wsRef.current.close();
            wsRef.current = null;
        }
        intentionalCloseRef.current = false;

        const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        const url = `${WS_BASE}/api/v1/social/duels/${encodeURIComponent(duelID)}/ws?token=${encodeURIComponent(cleanToken)}`;

        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                retryCountRef.current = 0;
            };

            ws.onmessage = handleMessage;

            ws.onclose = () => {
                if (wsRef.current !== ws) return;
                setIsConnected(false);
                clearReconnectTimer();
                if (!intentionalCloseRef.current && duelID && token) {
                    if (retryCountRef.current < MAX_RETRIES) {
                        const delay = BACKOFF_DELAYS[retryCountRef.current] ?? BACKOFF_DELAYS[BACKOFF_DELAYS.length - 1];
                        retryCountRef.current += 1;
                        reconnectTimerRef.current = setTimeout(connect, delay);
                    }
                }
            };

            ws.onerror = () => {
                // onclose fires after onerror
            };
        } catch {
            // silenciar errores de construcción del WS
        }
    }, [duelID, token, handleMessage, clearReconnectTimer]);

    useEffect(() => {
        if (!duelID || !token) return;

        retryCountRef.current = 0;
        connect();

        const handleVisibility = () => {
            if (
                document.visibilityState === "visible" &&
                wsRef.current?.readyState !== WebSocket.OPEN
            ) {
                retryCountRef.current = 0;
                connect();
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            intentionalCloseRef.current = true;
            clearReconnectTimer();
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [duelID, token, connect, clearReconnectTimer]);

    return { isConnected };
}
