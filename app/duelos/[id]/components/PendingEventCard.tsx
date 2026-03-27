"use client";

import { useState, useEffect } from "react";
import type { PendingEvent } from "@/lib/types/game";
import { respondEvent } from "@/lib/api/game";
import { mapErrorMessage } from "@/lib/api/errors";

interface PendingEventCardProps {
    event: PendingEvent;
    duelID: string;
    gameNumber: number;
    myPlayerID: number;
    sourceUsername: string;
    targetUsername: string;
    token: string;
    onResponded?: () => void;
}

function useCountdown(deadline: string | null): number | null {
    const [remaining, setRemaining] = useState<number | null>(() => {
        if (!deadline) return null;
        return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
    });

    useEffect(() => {
        if (!deadline) return;
        const interval = setInterval(() => {
            const secs = Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
            setRemaining(secs);
        }, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    return remaining;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
    damage: "Daño",
    heal: "Cura",
    poison: "Veneno",
    counter: "Contrahechizo",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
    damage: "var(--danger)",
    heal: "#22c55e",
    poison: "#a855f7",
    counter: "var(--accent)",
};

export default function PendingEventCard({
    event,
    duelID,
    gameNumber,
    myPlayerID,
    sourceUsername,
    targetUsername,
    token,
    onResponded,
}: PendingEventCardProps) {
    const secondsLeft = useCountdown(event.response_deadline);
    const isTarget = event.target_player_id === myPlayerID;
    const [responding, setResponding] = useState(false);
    const [showRespondInput, setShowRespondInput] = useState(false);
    const [respondDescription, setRespondDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    const eventColor = EVENT_TYPE_COLORS[event.event_type] ?? "var(--muted)";
    const eventLabel = EVENT_TYPE_LABELS[event.event_type] ?? event.event_type;

    const handlePass = async () => {
        if (responding) return;
        setResponding(true);
        setError(null);
        try {
            await respondEvent(duelID, gameNumber, event.id, { response_type: "pass" }, token);
            onResponded?.();
        } catch (err) {
            setError(mapErrorMessage(err));
        } finally {
            setResponding(false);
        }
    };

    const handleRespond = async () => {
        if (responding) return;
        setResponding(true);
        setError(null);
        try {
            await respondEvent(
                duelID,
                gameNumber,
                event.id,
                {
                    response_type: "respond",
                    description: respondDescription.trim() || undefined,
                },
                token
            );
            onResponded?.();
        } catch (err) {
            setError(mapErrorMessage(err));
        } finally {
            setResponding(false);
        }
    };

    const isUrgent = secondsLeft !== null && secondsLeft <= 10;
    const isPassed = event.status !== "pending";

    return (
        <div style={{
            borderRadius: 14,
            border: `1px solid ${eventColor}40`,
            backgroundColor: `${eventColor}08`,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                        fontSize: 10, fontWeight: 800,
                        color: eventColor,
                        backgroundColor: `${eventColor}18`,
                        padding: "2px 8px", borderRadius: 999,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                    }}>
                        {eventLabel}
                    </span>
                    {isPassed && (
                        <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: "var(--muted)",
                            backgroundColor: "var(--surface-solid)",
                            border: "1px solid var(--border)",
                            padding: "2px 8px", borderRadius: 999,
                        }}>
                            {event.status === "responded" ? "Respondido" : "Resuelto"}
                        </span>
                    )}
                </div>

                {/* Countdown */}
                {secondsLeft !== null && !isPassed && (
                    <span style={{
                        fontSize: 12, fontWeight: 800,
                        color: isUrgent ? "var(--danger)" : "var(--muted)",
                        animation: isUrgent ? "pulse 0.8s ease-in-out infinite" : undefined,
                    }}>
                        {secondsLeft}s
                    </span>
                )}
            </div>

            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 600 }}>
                    <span style={{ color: eventColor }}>{sourceUsername}</span>
                    {" "}declara {eventLabel.toLowerCase()} de{" "}
                    <span style={{ color: eventColor, fontWeight: 800 }}>{event.amount}</span>
                    {event.target_player_id !== null && (
                        <> a <span style={{ color: "var(--foreground)", fontWeight: 700 }}>{targetUsername}</span></>
                    )}
                </span>
                {event.description && (
                    <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                        &ldquo;{event.description}&rdquo;
                    </span>
                )}
            </div>

            {/* Actions (only for target, only when pending) */}
            {isTarget && !isPassed && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {showRespondInput ? (
                        <>
                            <input
                                type="text"
                                placeholder="Descripción de tu respuesta..."
                                value={respondDescription}
                                onChange={(e) => setRespondDescription(e.target.value)}
                                maxLength={200}
                                style={{
                                    backgroundColor: "var(--surface-solid)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 8,
                                    padding: "8px 12px",
                                    color: "var(--foreground)",
                                    fontSize: 13,
                                    outline: "none",
                                    width: "100%",
                                    boxSizing: "border-box",
                                }}
                            />
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => { setShowRespondInput(false); setRespondDescription(""); }}
                                    style={actionBtn("var(--muted)", false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleRespond}
                                    disabled={responding}
                                    style={actionBtn("var(--accent)", responding)}
                                >
                                    {responding ? "..." : "Confirmar"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={handlePass}
                                disabled={responding}
                                style={actionBtn("var(--muted)", responding)}
                            >
                                {responding ? "..." : "PASAR"}
                            </button>
                            <button
                                onClick={() => setShowRespondInput(true)}
                                disabled={responding}
                                style={actionBtn("var(--accent)", responding)}
                            >
                                RESPONDER
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <span style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>{error}</span>
            )}
        </div>
    );
}

function actionBtn(color: string, disabled: boolean): React.CSSProperties {
    return {
        flex: 1,
        padding: "9px 0",
        borderRadius: 10,
        border: `1px solid ${color}40`,
        backgroundColor: `${color}15`,
        color: color,
        fontSize: 12,
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        letterSpacing: "0.5px",
        transition: "opacity 0.15s ease",
    };
}
