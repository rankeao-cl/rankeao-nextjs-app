"use client";

import { useState, useCallback } from "react";
import { toast } from "@heroui/react";
import { useGameState } from "@/lib/hooks/use-game-state";
import { updateLife, declareEvent, endGame } from "@/lib/api/game";
import { mapErrorMessage } from "@/lib/api/errors";
import type { GameMode, GameStateSnapshot } from "@/lib/types/game";
import PlayerLifePanel from "./PlayerLifePanel";
import PendingEventCard from "./PendingEventCard";

interface GameTrackerProps {
    duelID: string;
    myPlayerID: number;
    opponentPlayerID: number;
    myUsername: string;
    opponentUsername: string;
    myAvatarUrl?: string;
    opponentAvatarUrl?: string;
    token: string;
    gameNumber: number;
    initialSnapshot?: GameStateSnapshot | null;
    onGameEnd?: (winnerID: number) => void;
}

// Advanced action form state
interface AdvancedFormState {
    event_type: string;
    amount: string;
    description: string;
    target: "self" | "opponent";
}

const EVENT_TYPES = [
    { value: "damage", label: "Daño" },
    { value: "heal", label: "Cura" },
    { value: "poison", label: "Veneno" },
    { value: "counter", label: "Contrahechizo" },
];

export default function GameTracker({
    duelID,
    myPlayerID,
    opponentPlayerID,
    myUsername,
    opponentUsername,
    myAvatarUrl,
    opponentAvatarUrl,
    token,
    gameNumber,
    initialSnapshot,
    onGameEnd,
}: GameTrackerProps) {
    const { gameState, isConnected, error } = useGameState(duelID, gameNumber, token, initialSnapshot);
    const [mode, setMode] = useState<GameMode>("simple");
    const [loading, setLoading] = useState<string | null>(null);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
    const [advForm, setAdvForm] = useState<AdvancedFormState>({
        event_type: "damage",
        amount: "",
        description: "",
        target: "opponent",
    });

    const myState = gameState?.player_states.find((ps) => ps.player_id === myPlayerID);
    const oppState = gameState?.player_states.find((ps) => ps.player_id === opponentPlayerID);
    const rules = gameState?.game.game_rules;
    const pendingEvents = gameState?.pending_events ?? [];
    const isCompleted = gameState?.game.status === "completed";

    // ── Life update (simple mode) ──
    const handleDeltaLife = useCallback(
        async (delta: number) => {
            if (!token || loading) return;
            setLoading("life");
            try {
                await updateLife(duelID, gameNumber, { delta }, token);
            } catch (err) {
                toast.danger("Error", { description: mapErrorMessage(err) });
            } finally {
                setLoading(null);
            }
        },
        [duelID, gameNumber, token, loading]
    );

    // ── Declare event (advanced mode) ──
    const handleDeclareEvent = async () => {
        const amount = parseInt(advForm.amount, 10);
        if (!amount || amount <= 0) {
            toast.danger("Error", { description: "Ingresa una cantidad válida" });
            return;
        }
        const targetID = advForm.target === "opponent" ? opponentPlayerID : myPlayerID;
        setLoading("event");
        try {
            await declareEvent(
                duelID,
                gameNumber,
                {
                    target_player_id: targetID,
                    event_type: advForm.event_type,
                    amount,
                    description: advForm.description.trim() || undefined,
                },
                token
            );
            setAdvForm((prev) => ({ ...prev, amount: "", description: "" }));
        } catch (err) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    };

    // ── End game ──
    const handleEndGame = async () => {
        if (selectedWinner === null) {
            toast.danger("Error", { description: "Selecciona un ganador" });
            return;
        }
        setLoading("end");
        try {
            await endGame(duelID, gameNumber, { winner_id: selectedWinner }, token);
            setShowEndConfirm(false);
            onGameEnd?.(selectedWinner);
        } catch (err) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    };

    // ── Render ──

    if (error) {
        return (
            <div style={{
                backgroundColor: "var(--surface-solid)",
                borderRadius: 16, border: "1px solid var(--border)",
                padding: 20, textAlign: "center",
                margin: "0 20px 16px",
            }}>
                <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>
            </div>
        );
    }

    if (!gameState || !rules) {
        return (
            <div style={{
                backgroundColor: "var(--surface-solid)",
                borderRadius: 16, border: "1px solid var(--border)",
                padding: 32, textAlign: "center",
                margin: "0 20px 16px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
                <div className="animate-spin" style={{
                    width: 18, height: 18,
                    border: "2px solid var(--border)",
                    borderTopColor: "var(--accent)",
                    borderRadius: 999,
                }} />
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Cargando partida...</span>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: "var(--surface-solid)",
            borderRadius: 20,
            border: "1px solid var(--border)",
            overflow: "hidden",
            margin: "0 20px 16px",
        }}>
            {/* Header bar */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                backgroundColor: "var(--surface-solid)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--foreground)" }}>
                        Partida #{gameNumber}
                    </span>
                    <span style={{
                        fontSize: 9, fontWeight: 700,
                        color: isCompleted ? "var(--muted)" : (isConnected ? "#22c55e" : "var(--warning)"),
                        backgroundColor: isCompleted
                            ? "var(--surface-solid)"
                            : isConnected
                                ? "rgba(34,197,94,0.12)"
                                : "rgba(245,158,11,0.12)",
                        border: `1px solid ${isCompleted ? "var(--border)" : isConnected ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`,
                        padding: "2px 8px", borderRadius: 999,
                        textTransform: "uppercase", letterSpacing: "0.5px",
                    }}>
                        {isCompleted ? "Finalizada" : isConnected ? "En vivo" : "Conectando..."}
                    </span>
                </div>

                {/* Mode toggle */}
                {!isCompleted && (
                    <div style={{
                        display: "flex",
                        backgroundColor: "var(--background)",
                        borderRadius: 999, padding: 3,
                        border: "1px solid var(--border)",
                        gap: 2,
                    }}>
                        {(["simple", "advanced"] as GameMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                style={{
                                    padding: "4px 12px", borderRadius: 999, border: "none",
                                    backgroundColor: mode === m ? "var(--accent)" : "transparent",
                                    color: mode === m ? "#fff" : "var(--muted)",
                                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {m === "simple" ? "Simple" : "Avanzado"}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Completed winner banner */}
            {isCompleted && gameState.game.winner_id !== null && (
                <div style={{
                    padding: "12px 16px",
                    backgroundColor: "rgba(34,197,94,0.06)",
                    borderBottom: "1px solid rgba(34,197,94,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                    <span style={{ fontSize: 16 }}>🏆</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#22c55e" }}>
                        {gameState.game.winner_id === myPlayerID
                            ? `¡${myUsername} gana la partida!`
                            : `${opponentUsername} gana la partida`}
                    </span>
                </div>
            )}

            {/* Player panels */}
            <div style={{ display: "flex", position: "relative" }}>
                {/* Divider */}
                <div style={{
                    position: "absolute", top: 0, bottom: 0, left: "50%",
                    width: 1,
                    background: "linear-gradient(180deg, transparent 0%, var(--border) 30%, var(--border) 70%, transparent 100%)",
                    zIndex: 1,
                    pointerEvents: "none",
                }} />

                <PlayerLifePanel
                    playerID={myPlayerID}
                    username={myUsername}
                    avatarUrl={myAvatarUrl}
                    lifeTotal={myState?.life_total ?? rules.starting_life}
                    counters={myState?.counters ?? {}}
                    isMe={true}
                    mode={mode}
                    rules={rules}
                    onDeltaLife={!isCompleted ? handleDeltaLife : undefined}
                />

                <PlayerLifePanel
                    playerID={opponentPlayerID}
                    username={opponentUsername}
                    avatarUrl={opponentAvatarUrl}
                    lifeTotal={oppState?.life_total ?? rules.starting_life}
                    counters={oppState?.counters ?? {}}
                    isMe={false}
                    mode={mode}
                    rules={rules}
                />
            </div>

            {/* Advanced mode — event declaration panel */}
            {mode === "advanced" && !isCompleted && (
                <div style={{
                    borderTop: "1px solid var(--border)",
                    padding: 16,
                    display: "flex", flexDirection: "column", gap: 10,
                }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--foreground)" }}>
                        Declarar acción
                    </span>

                    {/* Event type */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {EVENT_TYPES.map((et) => (
                            <button
                                key={et.value}
                                onClick={() => setAdvForm((prev) => ({ ...prev, event_type: et.value }))}
                                style={{
                                    padding: "5px 12px", borderRadius: 999,
                                    border: `1px solid ${advForm.event_type === et.value ? "var(--accent)" : "var(--border)"}`,
                                    backgroundColor: advForm.event_type === et.value ? "var(--accent)" : "var(--background)",
                                    color: advForm.event_type === et.value ? "#fff" : "var(--muted)",
                                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                                }}
                            >
                                {et.label}
                            </button>
                        ))}
                    </div>

                    {/* Target */}
                    <div style={{ display: "flex", gap: 6 }}>
                        {[
                            { value: "opponent", label: `→ ${opponentUsername}` },
                            { value: "self", label: "→ Yo mismo" },
                        ].map((t) => (
                            <button
                                key={t.value}
                                onClick={() => setAdvForm((prev) => ({ ...prev, target: t.value as "self" | "opponent" }))}
                                style={{
                                    padding: "5px 12px", borderRadius: 999,
                                    backgroundColor: advForm.target === t.value ? "rgba(59,130,246,0.12)" : "transparent",
                                    color: advForm.target === t.value ? "var(--accent)" : "var(--muted)",
                                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                                    border: `1px solid ${advForm.target === t.value ? "rgba(59,130,246,0.3)" : "var(--border)"}`,
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Amount + description */}
                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            type="number"
                            placeholder="Cantidad"
                            value={advForm.amount}
                            min={1}
                            onChange={(e) => setAdvForm((prev) => ({ ...prev, amount: e.target.value }))}
                            style={{
                                width: 90, padding: "8px 10px", borderRadius: 10,
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--background)",
                                color: "var(--foreground)", fontSize: 13, outline: "none",
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Descripción (opcional)"
                            value={advForm.description}
                            maxLength={200}
                            onChange={(e) => setAdvForm((prev) => ({ ...prev, description: e.target.value }))}
                            style={{
                                flex: 1, padding: "8px 12px", borderRadius: 10,
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--background)",
                                color: "var(--foreground)", fontSize: 13, outline: "none",
                            }}
                        />
                    </div>

                    <button
                        onClick={handleDeclareEvent}
                        disabled={!!loading || !advForm.amount}
                        style={{
                            padding: "10px 0", borderRadius: 12, border: "none",
                            backgroundColor: "var(--accent)", color: "#fff",
                            fontSize: 13, fontWeight: 800,
                            cursor: loading || !advForm.amount ? "not-allowed" : "pointer",
                            opacity: loading || !advForm.amount ? 0.6 : 1,
                            boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
                        }}
                    >
                        {loading === "event" ? "Declarando..." : "Declarar acción"}
                    </button>
                </div>
            )}

            {/* Pending events */}
            {pendingEvents.length > 0 && (
                <div style={{
                    borderTop: "1px solid var(--border)",
                    padding: 16,
                    display: "flex", flexDirection: "column", gap: 8,
                }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--foreground)", marginBottom: 2 }}>
                        Eventos pendientes ({pendingEvents.length})
                    </span>
                    {pendingEvents.map((event) => (
                        <PendingEventCard
                            key={event.id}
                            event={event}
                            duelID={duelID}
                            gameNumber={gameNumber}
                            myPlayerID={myPlayerID}
                            sourceUsername={
                                event.source_player_id === myPlayerID ? myUsername : opponentUsername
                            }
                            targetUsername={
                                event.target_player_id === myPlayerID ? myUsername : opponentUsername
                            }
                            token={token}
                        />
                    ))}
                </div>
            )}

            {/* End game section */}
            {!isCompleted && (
                <div style={{
                    borderTop: "1px solid var(--border)",
                    padding: 16,
                }}>
                    {!showEndConfirm ? (
                        <button
                            onClick={() => setShowEndConfirm(true)}
                            style={{
                                width: "100%", padding: "11px 0",
                                borderRadius: 12,
                                border: "1px solid rgba(239,68,68,0.3)",
                                backgroundColor: "rgba(239,68,68,0.06)",
                                color: "var(--danger)",
                                fontSize: 13, fontWeight: 800, cursor: "pointer",
                            }}
                        >
                            Terminar partida
                        </button>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", textAlign: "center" }}>
                                ¿Quién ganó esta partida?
                            </span>

                            <div style={{ display: "flex", gap: 8 }}>
                                {[
                                    { id: myPlayerID, label: `${myUsername} (Yo)` },
                                    { id: opponentPlayerID, label: opponentUsername },
                                ].map(({ id, label }) => (
                                    <button
                                        key={id}
                                        onClick={() => setSelectedWinner(id)}
                                        style={{
                                            flex: 1, padding: "10px 0", borderRadius: 12,
                                            border: `1px solid ${selectedWinner === id ? "var(--accent)" : "var(--border)"}`,
                                            backgroundColor: selectedWinner === id ? "rgba(59,130,246,0.12)" : "transparent",
                                            color: selectedWinner === id ? "var(--accent)" : "var(--muted)",
                                            fontSize: 12, fontWeight: 700, cursor: "pointer",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => { setShowEndConfirm(false); setSelectedWinner(null); }}
                                    style={{
                                        flex: 1, padding: "10px 0", borderRadius: 12,
                                        border: "1px solid var(--border)",
                                        backgroundColor: "transparent",
                                        color: "var(--muted)",
                                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleEndGame}
                                    disabled={selectedWinner === null || loading === "end"}
                                    style={{
                                        flex: 2, padding: "10px 0", borderRadius: 12, border: "none",
                                        backgroundColor: selectedWinner !== null ? "var(--danger)" : "var(--border)",
                                        color: "#fff",
                                        fontSize: 13, fontWeight: 800,
                                        cursor: selectedWinner === null || loading === "end" ? "not-allowed" : "pointer",
                                        opacity: selectedWinner === null ? 0.5 : 1,
                                        boxShadow: selectedWinner !== null ? "0 4px 12px rgba(239,68,68,0.3)" : undefined,
                                    }}
                                >
                                    {loading === "end" ? "Finalizando..." : "Confirmar fin"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
