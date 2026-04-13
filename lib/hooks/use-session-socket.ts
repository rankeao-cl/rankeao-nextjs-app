"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Session, SessionPlayer } from "@/lib/api/sessions";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "wss://api.rankeao.cl";
const MAX_RETRIES = 5;
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000];

// ── Message types ──

export interface SessionWSMessage {
    type: string;
    payload: unknown;
}

export interface PayloadLifeUpdated {
    player: SessionPlayer;
}

export interface PayloadPlayerEliminated {
    player: SessionPlayer;
}

export interface PayloadSessionReset {
    session: Session;
}

export interface PayloadSessionEnded {
    winner_player_id?: string;
}

export interface PayloadStateSync {
    session: Session;
}

// ── Options ──

interface UseSessionSocketOptions {
    onLifeUpdated?: (payload: PayloadLifeUpdated) => void;
    onPlayerEliminated?: (payload: PayloadPlayerEliminated) => void;
    onSessionReset?: (payload: PayloadSessionReset) => void;
    onSessionEnded?: (payload: PayloadSessionEnded) => void;
    onStateSync?: (payload: PayloadStateSync) => void;
}

/**
 * useSessionSocket — conecta al WebSocket de la sesión de life counter.
 * Proporciona sincronización en tiempo real de vida, counters y estado de sesión.
 */
export function useSessionSocket(
    duelId: string | null,
    gameNumber: number | null,
    token: string | null | undefined,
    options: UseSessionSocketOptions = {}
) {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const retryCountRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intentionalCloseRef = useRef(false);

    // Stable refs for callbacks
    const onLifeUpdatedRef = useRef(options.onLifeUpdated);
    const onPlayerEliminatedRef = useRef(options.onPlayerEliminated);
    const onSessionResetRef = useRef(options.onSessionReset);
    const onSessionEndedRef = useRef(options.onSessionEnded);
    const onStateSyncRef = useRef(options.onStateSync);

    useEffect(() => { onLifeUpdatedRef.current = options.onLifeUpdated; }, [options.onLifeUpdated]);
    useEffect(() => { onPlayerEliminatedRef.current = options.onPlayerEliminated; }, [options.onPlayerEliminated]);
    useEffect(() => { onSessionResetRef.current = options.onSessionReset; }, [options.onSessionReset]);
    useEffect(() => { onSessionEndedRef.current = options.onSessionEnded; }, [options.onSessionEnded]);
    useEffect(() => { onStateSyncRef.current = options.onStateSync; }, [options.onStateSync]);

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    }, []);

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const msg: SessionWSMessage = JSON.parse(event.data as string);
            switch (msg.type) {
                case "life.updated":
                    onLifeUpdatedRef.current?.(msg.payload as PayloadLifeUpdated);
                    break;
                case "player.eliminated":
                    onPlayerEliminatedRef.current?.(msg.payload as PayloadPlayerEliminated);
                    break;
                case "session.reset":
                    onSessionResetRef.current?.(msg.payload as PayloadSessionReset);
                    break;
                case "session.ended":
                    onSessionEndedRef.current?.(msg.payload as PayloadSessionEnded);
                    break;
                case "state.sync":
                    onStateSyncRef.current?.(msg.payload as PayloadStateSync);
                    break;
            }
        } catch {
            // ignorar mensajes mal formados
        }
    }, []);

    const sendMessage = useCallback((type: string, payload: unknown) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, payload }));
        }
    }, []);

    const connect = useCallback(() => {
        if (!duelId || gameNumber === null || !token) return;

        if (wsRef.current) {
            intentionalCloseRef.current = true;
            wsRef.current.close();
            wsRef.current = null;
        }
        intentionalCloseRef.current = false;

        const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        const url = `${WS_BASE}/api/v1/duels/${encodeURIComponent(duelId)}/games/${gameNumber}/ws?token=${encodeURIComponent(cleanToken)}`;

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
                if (!intentionalCloseRef.current && duelId && token) {
                    if (retryCountRef.current < MAX_RETRIES) {
                        const delay =
                            BACKOFF_DELAYS[retryCountRef.current] ??
                            BACKOFF_DELAYS[BACKOFF_DELAYS.length - 1];
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
    }, [duelId, gameNumber, token, handleMessage, clearReconnectTimer]);

    useEffect(() => {
        if (!duelId || gameNumber === null || !token) return;

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
    }, [duelId, gameNumber, token, connect, clearReconnectTimer]);

    return { isConnected, sendMessage };
}
