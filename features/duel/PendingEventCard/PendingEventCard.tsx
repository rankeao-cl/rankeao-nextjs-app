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
    life_change: "Cambio de vida",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
    damage: "var(--danger)",
    heal: "#22c55e",
    poison: "#a855f7",
    counter: "var(--accent)",
    life_change: "var(--foreground)",
};

const STATUS_LABELS: Record<string, string> = {
    responded: "Respondido",
    countered: "Contrarrestado",
    disputed: "En disputa",
    passed: "Pasado",
    resolved: "Resuelto",
    cancelled: "Cancelado",
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
    const canRespond = event.source_player_id !== myPlayerID;
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

    const handleCounter = async () => {
        if (responding) return;
        setResponding(true);
        setError(null);
        try {
            await respondEvent(duelID, gameNumber, event.id, { response_type: "counter" }, token);
            onResponded?.();
        } catch (err) {
            setError(mapErrorMessage(err));
        } finally {
            setResponding(false);
        }
    };

    const handleDispute = async () => {
        if (responding) return;
        const reason = prompt("¿Por qué disputas esta acción? (opcional)") ?? "";
        setResponding(true);
        setError(null);
        try {
            await respondEvent(duelID, gameNumber, event.id, { response_type: "dispute", description: reason }, token);
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
                            color: event.status === "disputed" ? "var(--warning)" : event.status === "countered" ? "var(--accent)" : "var(--muted)",
                            backgroundColor: event.status === "disputed" ? "rgba(245,158,11,0.1)" : event.status === "countered" ? "rgba(59,130,246,0.1)" : "var(--surface-solid)",
                            border: `1px solid ${event.status === "disputed" ? "rgba(245,158,11,0.3)" : event.status === "countered" ? "rgba(59,130,246,0.3)" : "var(--border)"}`,
                            padding: "2px 8px", borderRadius: 999,
                        }}>
                            {STATUS_LABELS[event.status] ?? event.status}
                        </span>
                    )}
                    {event.chain_depth > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", backgroundColor: "rgba(59,130,246,0.08)", padding: "2px 6px", borderRadius: 999 }}>
                            cadena ×{event.chain_depth}
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

            {/* Actions (only for opponent/non-source, only when pending) */}
            {canRespond && !isPassed && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {showRespondInput ? (
                        <>
                            <input
                                type="text"
                                placeholder="Descripción (opcional)..."
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
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {/* Primary: pass or counter */}
                            <div style={{ display: "flex", gap: 6 }}>
                                <button
                                    onClick={handlePass}
                                    disabled={responding}
                                    style={actionBtn("var(--muted)", responding)}
                                >
                                    {responding ? "..." : "✓ Pasar"}
                                </button>
                                <button
                                    onClick={handleCounter}
                                    disabled={responding}
                                    style={actionBtn("var(--accent)", responding)}
                                >
                                    🛡 Contrahechizo
                                </button>
                            </div>
                            {/* Secondary: respond or dispute */}
                            <div style={{ display: "flex", gap: 6 }}>
                                <button
                                    onClick={() => setShowRespondInput(true)}
                                    disabled={responding}
                                    style={{ ...actionBtn("var(--foreground)", responding), fontSize: 11 }}
                                >
                                    💬 Responder
                                </button>
                                <button
                                    onClick={handleDispute}
                                    disabled={responding}
                                    style={{ ...actionBtn("var(--danger)", responding), fontSize: 11 }}
                                >
                                    ⚑ Disputar
                                </button>
                            </div>
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
