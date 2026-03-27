"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type {
    GameStateSnapshot,
    GameWSMessage,
    PlayerState,
    PendingEvent,
} from "@/lib/types/game";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "wss://api.rankeao.cl";
const MAX_RETRIES = 5;
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000];

export function useGameState(
    duelID: string,
    gameNumber: number | null,
    token: string | undefined,
    initialState?: GameStateSnapshot | null,
) {
    const wsRef = useRef<WebSocket | null>(null);
    const [gameState, setGameState] = useState<GameStateSnapshot | null>(initialState ?? null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const retryCountRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intentionalCloseRef = useRef(false);

    // Sync state when initialState is provided (e.g. after REST fetch)
    useEffect(() => {
        if (initialState) {
            setGameState(initialState);
        }
    }, [initialState]);

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    }, []);

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const msg: GameWSMessage = JSON.parse(event.data);

            setGameState((prev) => {
                if (!prev) return prev;

                switch (msg.type) {
                    case "game.started":
                    case "game.state": {
                        return msg.payload as GameStateSnapshot;
                    }

                    case "game.ended": {
                        const payload = msg.payload as { winner_id: number; final_states: PlayerState[] };
                        return {
                            ...prev,
                            game: {
                                ...prev.game,
                                status: "completed",
                                winner_id: payload.winner_id,
                            },
                            player_states: payload.final_states ?? prev.player_states,
                        };
                    }

                    case "life.updated": {
                        const payload = msg.payload as { player_id: number; new_total: number; delta: number };
                        return {
                            ...prev,
                            player_states: prev.player_states.map((ps) =>
                                ps.player_id === payload.player_id
                                    ? { ...ps, life_total: payload.new_total }
                                    : ps
                            ),
                        };
                    }

                    case "event.declared": {
                        const payload = msg.payload as {
                            event_id: string;
                            source_id: number;
                            target_id: number;
                            event_type: string;
                            amount: number;
                            description: string;
                            deadline: string;
                        };
                        const newEvent: PendingEvent = {
                            id: payload.event_id,
                            game_id: prev.game.id,
                            source_player_id: payload.source_id,
                            target_player_id: payload.target_id,
                            event_type: payload.event_type as PendingEvent["event_type"],
                            amount: payload.amount,
                            description: payload.description || null,
                            status: "pending",
                            response_deadline: payload.deadline || null,
                            created_at: new Date().toISOString(),
                        };
                        return {
                            ...prev,
                            pending_events: [...prev.pending_events, newEvent],
                        };
                    }

                    case "event.passed":
                    case "event.resolved": {
                        const payload = msg.payload as { event_id: string; player_states: PlayerState[] };
                        return {
                            ...prev,
                            pending_events: prev.pending_events.filter((e) => e.id !== payload.event_id),
                            player_states: payload.player_states ?? prev.player_states,
                        };
                    }

                    case "event.responded": {
                        const payload = msg.payload as { event_id: string; description: string };
                        return {
                            ...prev,
                            pending_events: prev.pending_events.map((e) =>
                                e.id === payload.event_id ? { ...e, status: "responded" as const } : e
                            ),
                        };
                    }

                    default:
                        return prev;
                }
            });
        } catch {
            // ignore malformed messages
        }
    }, []);

    const connect = useCallback(() => {
        if (!duelID || gameNumber === null || !token) return;

        // Clean up existing connection
        if (wsRef.current) {
            intentionalCloseRef.current = true;
            wsRef.current.close();
            wsRef.current = null;
        }
        intentionalCloseRef.current = false;

        const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        const url = `${WS_BASE}/api/v1/social/duels/${encodeURIComponent(duelID)}/games/${gameNumber}/ws?token=${encodeURIComponent(cleanToken)}`;

        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                setError(null);
                retryCountRef.current = 0;
            };

            ws.onmessage = handleMessage;

            ws.onclose = () => {
                setIsConnected(false);
                clearReconnectTimer();

                if (!intentionalCloseRef.current && duelID && gameNumber !== null && token) {
                    if (retryCountRef.current < MAX_RETRIES) {
                        const delay = BACKOFF_DELAYS[retryCountRef.current] ?? BACKOFF_DELAYS[BACKOFF_DELAYS.length - 1];
                        retryCountRef.current += 1;
                        reconnectTimerRef.current = setTimeout(connect, delay);
                    } else {
                        setError("No se pudo reconectar al servidor. Recarga la página.");
                    }
                }
            };

            ws.onerror = () => {
                // onclose will fire after onerror
            };
        } catch (err) {
            setError("Error al conectar al servidor en tiempo real.");
        }
    }, [duelID, gameNumber, token, handleMessage, clearReconnectTimer]);

    useEffect(() => {
        if (!duelID || gameNumber === null || !token) return;

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
    }, [duelID, gameNumber, token, connect, clearReconnectTimer]);

    return { gameState, isConnected, error };
}
