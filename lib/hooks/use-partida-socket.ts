"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { BASE_URL } from "@/lib/api/client";
import type { Partida, LCSession, PlayResult } from "@/lib/api/play";

const WS_BASE = BASE_URL.replace(/^http/, "ws").replace(/\/api\/v1$/, "");
const MAX_RETRIES = 5;
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000];

// ── Event types from backend ──────────────────────────────────────────────────

// Lobby hub events
export const LOBBY_EVENTS = {
    PARTICIPANT_JOINED: "participant.joined",
    PARTICIPANT_LEFT:   "participant.left",
    TRACKER_STARTED:    "tracker.started",
    RESULT_SUBMITTED:   "result.submitted",
    RESULT_CONFIRMED:   "result.confirmed",
    PARTIDA_CANCELLED:  "partida.cancelled",
    LOBBY_SYNC:         "lobby.sync",
} as const;

// Tracker hub events
export const TRACKER_EVENTS = {
    STATE_SYNC:    "state.sync",
    LIFE_UPDATED:  "life.updated",
    PLAYER_ELIM:   "player.eliminated",
    SESSION_ENDED: "session.ended",
} as const;

// ── Lobby WS ──────────────────────────────────────────────────────────────────

interface UsePartidaSocketOptions {
    onSync?:              (partida: Partida) => void;
    onParticipantJoined?: (partida: Partida) => void;
    onParticipantLeft?:   (partida: Partida) => void;
    onTrackerStarted?:    (partida: Partida) => void;
    onResultSubmitted?:   (result: PlayResult) => void;
    onResultConfirmed?:   (result: PlayResult) => void;
    onCancelled?:         () => void;
}

export function usePartidaSocket(
    partidaId: string | null,
    token: string | null | undefined,
    options: UsePartidaSocketOptions = {}
) {
    const wsRef   = useRef<WebSocket | null>(null);
    const optsRef = useRef(options);
    optsRef.current = options;

    const [isConnected, setIsConnected] = useState(false);
    const retryRef     = useRef(0);
    const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

    const connect = useCallback(() => {
        if (!partidaId || !token) return;

        const url = `${WS_BASE}/api/v1/play/partidas/${partidaId}/ws?token=${token}`;
        const ws  = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            retryRef.current = 0;
        };

        ws.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data) as { type: string; payload: unknown };
                const opts = optsRef.current;
                switch (msg.type) {
                    case LOBBY_EVENTS.LOBBY_SYNC:
                    case LOBBY_EVENTS.TRACKER_STARTED:
                        (msg.type === LOBBY_EVENTS.LOBBY_SYNC
                            ? opts.onSync
                            : opts.onTrackerStarted)?.(msg.payload as Partida);
                        break;
                    case LOBBY_EVENTS.PARTICIPANT_JOINED:
                        opts.onParticipantJoined?.(msg.payload as Partida);
                        break;
                    case LOBBY_EVENTS.PARTICIPANT_LEFT:
                        opts.onParticipantLeft?.(msg.payload as Partida);
                        break;
                    case LOBBY_EVENTS.RESULT_SUBMITTED:
                        opts.onResultSubmitted?.(msg.payload as PlayResult);
                        break;
                    case LOBBY_EVENTS.RESULT_CONFIRMED:
                        opts.onResultConfirmed?.(msg.payload as PlayResult);
                        break;
                    case LOBBY_EVENTS.PARTIDA_CANCELLED:
                        opts.onCancelled?.();
                        break;
                }
            } catch { /* ignore */ }
        };

        ws.onclose = () => {
            setIsConnected(false);
            if (retryRef.current < MAX_RETRIES) {
                const delay = BACKOFF_DELAYS[retryRef.current] ?? 16000;
                retryRef.current++;
                timerRef.current = setTimeout(connect, delay);
            }
        };

        ws.onerror = () => ws.close();
    }, [partidaId, token]);

    useEffect(() => {
        connect();
        return () => {
            timerRef.current && clearTimeout(timerRef.current);
            wsRef.current?.close();
        };
    }, [connect]);

    return { isConnected };
}

// ── Tracker WS ────────────────────────────────────────────────────────────────

interface UseTrackerSocketOptions {
    onStateSync?:  (session: LCSession) => void;
    onLifeUpdated?: (session: LCSession) => void;
    onPlayerElim?: (payload: { seat: number; reason: string }) => void;
    onSessionEnded?: (session: LCSession) => void;
}

export function useTrackerSocket(
    partidaId: string | null,
    enabled: boolean,
    token: string | null | undefined,
    options: UseTrackerSocketOptions = {}
) {
    const wsRef   = useRef<WebSocket | null>(null);
    const optsRef = useRef(options);
    optsRef.current = options;

    const [isConnected, setIsConnected] = useState(false);
    const retryRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const connect = useCallback(() => {
        if (!partidaId || !token || !enabled) return;

        const url = `${WS_BASE}/api/v1/play/partidas/${partidaId}/tracker/ws?token=${token}`;
        const ws  = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            retryRef.current = 0;
        };

        ws.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data) as { type: string; payload: unknown };
                const opts = optsRef.current;
                switch (msg.type) {
                    case TRACKER_EVENTS.STATE_SYNC:
                        opts.onStateSync?.(msg.payload as LCSession);
                        break;
                    case TRACKER_EVENTS.LIFE_UPDATED:
                        opts.onLifeUpdated?.(msg.payload as LCSession);
                        break;
                    case TRACKER_EVENTS.PLAYER_ELIM:
                        opts.onPlayerElim?.(msg.payload as { seat: number; reason: string });
                        break;
                    case TRACKER_EVENTS.SESSION_ENDED:
                        opts.onSessionEnded?.(msg.payload as LCSession);
                        break;
                }
            } catch { /* ignore */ }
        };

        ws.onclose = () => {
            setIsConnected(false);
            if (retryRef.current < MAX_RETRIES) {
                const delay = BACKOFF_DELAYS[retryRef.current] ?? 16000;
                retryRef.current++;
                timerRef.current = setTimeout(connect, delay);
            }
        };

        ws.onerror = () => ws.close();
    }, [partidaId, token, enabled]);

    useEffect(() => {
        connect();
        return () => {
            timerRef.current && clearTimeout(timerRef.current);
            wsRef.current?.close();
        };
    }, [connect]);

    return { isConnected };
}
