"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "@heroui/react";
import { TargetDart, HeartFill, Flame, Shield, Cup, Clock } from "@gravity-ui/icons";
import RankeaoSpinner from "@/components/ui/RankeaoSpinner";
import { useGameState } from "@/lib/hooks/use-game-state";
import { updateLife, declareEvent, endGame, getInteractions, passTurn } from "@/lib/api/game";
import { mapErrorMessage } from "@/lib/api/errors";
import type { GameMode, GameStateSnapshot, GameInteraction } from "@/lib/types/game";
import PlayerLifePanel from "@/features/duel/PlayerLifePanel";
import PendingEventCard from "@/features/duel/PendingEventCard";

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

interface AdvancedFormState {
    event_type: string;
    amount: string;
    description: string;
    target: "self" | "opponent";
}

const EVENT_TYPES = [
    { value: "damage", label: "Daño", Icon: TargetDart },
    { value: "heal", label: "Cura", Icon: HeartFill },
    { value: "poison", label: "Veneno", Icon: Flame },
    { value: "counter", label: "Contra", Icon: Shield },
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
    const { gameState, interactions: wsInteractions, isConnected, error } = useGameState(duelID, gameNumber, token, initialSnapshot);
    const [interactions, setInteractions] = useState<GameInteraction[]>([]);
    const [showTimeline, setShowTimeline] = useState(false);

    useEffect(() => {
        if (!token || gameNumber === null) return;
        getInteractions(duelID, gameNumber, token)
            .then((res: any) => {
                const list = res?.data?.interactions ?? res?.interactions ?? [];
                setInteractions(list);
            })
            .catch(() => {});
    }, [duelID, gameNumber, token]);
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

    const myState = gameState?.player_states.find((ps) => Number(ps.player_id) === myPlayerID);
    const oppState = gameState?.player_states.find((ps) => Number(ps.player_id) === opponentPlayerID);
    const rules = gameState?.game.game_rules;
    const pendingEvents = gameState?.pending_events ?? [];
    const isCompleted = gameState?.game.status === "completed";
    const isMyTurn = !isCompleted && Number(gameState?.game.active_player_id) === myPlayerID;

    const handlePassTurn = useCallback(async () => {
        if (!token || loading) return;
        setLoading("pass_turn");
        try {
            await passTurn(duelID, gameNumber, token);
        } catch (err) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    }, [duelID, gameNumber, token, loading]);

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

    const handleDeclareEvent = async () => {
        const amount = parseInt(advForm.amount, 10);
        if (!amount || amount <= 0) {
            toast.danger("Error", { description: "Ingresa una cantidad válida" });
            return;
        }
        const targetID = advForm.target === "opponent" ? opponentPlayerID : myPlayerID;
        setLoading("event");
        try {
            await declareEvent(duelID, gameNumber, {
                target_player_id: targetID,
                event_type: advForm.event_type,
                amount,
                description: advForm.description.trim() || undefined,
            }, token);
            setAdvForm((prev) => ({ ...prev, amount: "", description: "" }));
        } catch (err) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    };

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

    // ── States ──

    if (error) {
        return (
            <div className="rounded-2xl border p-5 text-center" style={{ backgroundColor: "var(--surface-solid)", borderColor: "var(--border)" }}>
                <p className="text-[13px] m-0" style={{ color: "var(--danger)" }}>{error}</p>
            </div>
        );
    }

    if (!gameState || !rules) {
        return (
            <div className="rounded-2xl border py-10 flex items-center justify-center" style={{ backgroundColor: "var(--surface-solid)", borderColor: "var(--border)" }}>
                <RankeaoSpinner className="h-10 w-auto" />
            </div>
        );
    }

    return (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--surface-solid)", borderColor: "var(--border)" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold" style={{ color: "var(--foreground)" }}>
                        Partida #{gameNumber}
                    </span>
                    <button
                        onClick={() => setShowTimeline(v => !v)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full border-none cursor-pointer text-[10px] font-bold transition-colors"
                        style={{
                            backgroundColor: showTimeline ? "rgba(59,130,246,0.12)" : "var(--surface)",
                            color: showTimeline ? "var(--accent)" : "var(--muted)",
                            border: `1px solid ${showTimeline ? "rgba(59,130,246,0.3)" : "var(--border)"}`,
                        }}
                    >
                        <Clock style={{ width: 10, height: 10 }} /> Historial
                    </button>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{
                        color: isCompleted ? "var(--muted)" : isConnected ? "#22c55e" : "var(--warning)",
                        backgroundColor: isCompleted ? "var(--surface)" : isConnected ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                        border: `1px solid ${isCompleted ? "var(--border)" : isConnected ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`,
                    }}>
                        {isCompleted ? "Finalizada" : isConnected ? "En vivo" : "Conectando..."}
                    </span>
                </div>

                {!isCompleted && (
                    <div className="flex rounded-full p-[3px] gap-0.5 border" style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
                        {(["simple", "advanced"] as GameMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className="px-3 py-1 rounded-full border-none text-[11px] font-bold cursor-pointer transition-all"
                                style={{
                                    backgroundColor: mode === m ? "var(--accent)" : "transparent",
                                    color: mode === m ? "#fff" : "var(--muted)",
                                }}
                            >
                                {m === "simple" ? "⚡ Simple" : "⚔️ Avanzado"}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Winner banner ── */}
            {isCompleted && gameState.game.winner_id !== null && (
                <div className="px-4 py-3 flex items-center justify-center gap-2 border-b" style={{
                    backgroundColor: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.15)",
                }}>
                    <Cup style={{ width: 18, height: 18, color: "#22c55e" }} />
                    <span className="text-[13px] font-extrabold" style={{ color: "#22c55e" }}>
                        {Number(gameState.game.winner_id) === myPlayerID ? `¡${myUsername} gana la partida!` : `${opponentUsername} gana la partida`}
                    </span>
                </div>
            )}

            {/* ── Turn indicator ── */}
            {!isCompleted && gameState.game.active_player_id !== null && (
                <div style={{
                    padding: "8px 16px",
                    background: isMyTurn ? "rgba(59,130,246,0.08)" : "rgba(0,0,0,0.06)",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                            width: 8, height: 8, borderRadius: 4,
                            backgroundColor: isMyTurn ? "var(--accent)" : "var(--muted)",
                            display: "inline-block",
                            boxShadow: isMyTurn ? "0 0 6px var(--accent)" : undefined,
                        }} />
                        <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: isMyTurn ? "var(--accent)" : "var(--muted)",
                        }}>
                            {isMyTurn ? "TU TURNO" : `Turno de ${opponentUsername}`}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>
                            #{gameState.game.turn_number}
                        </span>
                    </div>
                    {isMyTurn && (
                        <button
                            onClick={handlePassTurn}
                            disabled={!!loading}
                            style={{
                                padding: "4px 12px",
                                borderRadius: 999,
                                border: "1px solid var(--border)",
                                backgroundColor: "transparent",
                                color: "var(--muted)",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.5 : 1,
                            }}
                        >
                            {loading === "pass_turn" ? "..." : "Pasar turno"}
                        </button>
                    )}
                </div>
            )}

            {/* ── Player panels ── */}
            <div className="flex relative">
                <div className="absolute top-0 bottom-0 left-1/2 w-px pointer-events-none z-[1]"
                    style={{ background: "linear-gradient(180deg, transparent 0%, var(--border) 20%, var(--border) 80%, transparent 100%)" }}
                />
                <PlayerLifePanel
                    playerID={myPlayerID} username={myUsername} avatarUrl={myAvatarUrl}
                    lifeTotal={myState?.life_total ?? rules.starting_life}
                    counters={myState?.counters ?? {}} isMe={true} mode={mode} rules={rules}
                    onDeltaLife={!isCompleted ? handleDeltaLife : undefined}
                />
                <PlayerLifePanel
                    playerID={opponentPlayerID} username={opponentUsername} avatarUrl={opponentAvatarUrl}
                    lifeTotal={oppState?.life_total ?? rules.starting_life}
                    counters={oppState?.counters ?? {}} isMe={false} mode={mode} rules={rules}
                />
            </div>

            {/* ── Advanced mode panel ── */}
            {mode === "advanced" && !isCompleted && (
                <div className="border-t p-4 flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Declarar acción</span>

                    {/* Event type — large tap targets */}
                    <div className="grid grid-cols-4 gap-2">
                        {EVENT_TYPES.map((et) => {
                            const active = advForm.event_type === et.value;
                            return (
                                <button
                                    key={et.value}
                                    onClick={() => setAdvForm((prev) => ({ ...prev, event_type: et.value }))}
                                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl border cursor-pointer transition-all"
                                    style={{
                                        backgroundColor: active ? "var(--accent)" : "var(--background)",
                                        borderColor: active ? "var(--accent)" : "var(--border)",
                                        color: active ? "#fff" : "var(--muted)",
                                    }}
                                >
                                    <et.Icon style={{ width: 20, height: 20 }} />
                                    <span className="text-[11px] font-bold">{et.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Target — full width toggle */}
                    <div className="flex gap-2">
                        {[
                            { value: "opponent" as const, label: opponentUsername },
                            { value: "self" as const, label: "Yo mismo" },
                        ].map((t) => {
                            const active = advForm.target === t.value;
                            return (
                                <button
                                    key={t.value}
                                    onClick={() => setAdvForm((prev) => ({ ...prev, target: t.value }))}
                                    className="flex-1 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all truncate"
                                    style={{
                                        backgroundColor: active ? "rgba(59,130,246,0.12)" : "transparent",
                                        borderColor: active ? "rgba(59,130,246,0.3)" : "var(--border)",
                                        color: active ? "var(--accent)" : "var(--muted)",
                                    }}
                                >
                                    → {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Amount + description */}
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Cant."
                            value={advForm.amount}
                            min={1}
                            onChange={(e) => setAdvForm((prev) => ({ ...prev, amount: e.target.value }))}
                            className="w-20 px-3 py-2.5 rounded-xl border text-[13px] font-bold outline-none text-center"
                            style={{ backgroundColor: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                        />
                        <input
                            type="text"
                            placeholder="Descripción (opcional)"
                            value={advForm.description}
                            maxLength={200}
                            onChange={(e) => setAdvForm((prev) => ({ ...prev, description: e.target.value }))}
                            className="flex-1 px-3 py-2.5 rounded-xl border text-[13px] outline-none"
                            style={{ backgroundColor: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleDeclareEvent}
                        disabled={!!loading || !advForm.amount}
                        className="w-full py-3.5 rounded-xl border-none text-white text-[14px] font-extrabold"
                        style={{
                            backgroundColor: "var(--accent)",
                            cursor: loading || !advForm.amount ? "not-allowed" : "pointer",
                            opacity: loading || !advForm.amount ? 0.5 : 1,
                            boxShadow: "0 4px 14px rgba(59,130,246,0.25)",
                        }}
                    >
                        {loading === "event" ? "Declarando..." : "Declarar acción"}
                    </button>
                </div>
            )}

            {/* ── Pending events ── */}
            {pendingEvents.length > 0 && (
                <div className="border-t p-4 flex flex-col gap-2.5" style={{ borderColor: "var(--border)" }}>
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                        Eventos pendientes ({pendingEvents.length})
                    </span>
                    {pendingEvents.map((event) => (
                        <PendingEventCard
                            key={event.id}
                            event={event}
                            duelID={duelID}
                            gameNumber={gameNumber}
                            myPlayerID={myPlayerID}
                            sourceUsername={Number(event.source_player_id) === myPlayerID ? myUsername : opponentUsername}
                            targetUsername={Number(event.target_player_id) === myPlayerID ? myUsername : opponentUsername}
                            token={token}
                        />
                    ))}
                </div>
            )}

            {/* ── End game ── */}
            {!isCompleted && (
                <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
                    {!showEndConfirm ? (
                        <button
                            onClick={() => setShowEndConfirm(true)}
                            className="w-full py-3 rounded-xl text-[13px] font-extrabold cursor-pointer"
                            style={{
                                border: "1px solid rgba(239,68,68,0.25)",
                                backgroundColor: "rgba(239,68,68,0.06)",
                                color: "var(--danger)",
                            }}
                        >
                            Terminar partida
                        </button>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <span className="text-[13px] font-bold text-center" style={{ color: "var(--foreground)" }}>
                                ¿Quién ganó esta partida?
                            </span>

                            <div className="flex gap-2">
                                {[
                                    { id: myPlayerID, label: `${myUsername} (Yo)` },
                                    { id: opponentPlayerID, label: opponentUsername },
                                ].map(({ id, label }) => (
                                    <button
                                        key={id}
                                        onClick={() => setSelectedWinner(id)}
                                        className="flex-1 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all truncate"
                                        style={{
                                            border: `1px solid ${selectedWinner === id ? "var(--accent)" : "var(--border)"}`,
                                            backgroundColor: selectedWinner === id ? "rgba(59,130,246,0.12)" : "transparent",
                                            color: selectedWinner === id ? "var(--accent)" : "var(--muted)",
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setShowEndConfirm(false); setSelectedWinner(null); }}
                                    className="flex-1 py-3 rounded-xl text-[13px] font-bold cursor-pointer"
                                    style={{ border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--muted)" }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleEndGame}
                                    disabled={selectedWinner === null || loading === "end"}
                                    className="flex-[2] py-3 rounded-xl border-none text-[13px] font-extrabold text-white"
                                    style={{
                                        backgroundColor: selectedWinner !== null ? "var(--danger)" : "var(--border)",
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

            {/* ── Interaction Timeline ── */}
            {showTimeline && (
                <div className="border-t p-4 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                        Historial de la partida
                    </span>
                    {interactions.length === 0 ? (
                        <p className="text-[12px] text-center py-4" style={{ color: "var(--muted)" }}>Sin interacciones aún</p>
                    ) : (
                        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                            {interactions.map((item) => (
                                <InteractionRow
                                    key={item.id}
                                    item={item}
                                    myPlayerID={myPlayerID}
                                    myUsername={myUsername}
                                    opponentUsername={opponentUsername}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const INTERACTION_ICONS: Record<string, string> = {
    game_started: "🎮",
    game_ended: "🏆",
    life_updated: "❤️",
    event_declared: "⚔️",
    event_passed: "✅",
    event_countered: "🛡",
    event_disputed: "⚑",
    event_responded: "💬",
    event_resolved: "✔️",
    turn_passed: "↩️",
};

function InteractionRow({ item, myPlayerID, myUsername, opponentUsername }: {
    item: GameInteraction;
    myPlayerID: number;
    myUsername: string;
    opponentUsername: string;
}) {
    const isMe = Number(item.player_id) === myPlayerID;
    const username = isMe ? myUsername : opponentUsername;
    const icon = INTERACTION_ICONS[item.type] ?? "•";
    const time = new Date(item.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const descMap: Record<string, string> = {
        game_started: "inició la partida",
        game_ended: "terminó la partida",
        life_updated: `cambió vida ${(item.payload as any)?.delta > 0 ? "+" : ""}${(item.payload as any)?.delta ?? ""}`,
        event_declared: `declaró ${(item.payload as any)?.event_type ?? "acción"} de ${(item.payload as any)?.amount ?? ""}`,
        event_passed: "aceptó el efecto",
        event_countered: "jugó contrahechizo",
        event_disputed: "disputó la acción",
        event_responded: "respondió",
        event_resolved: "efecto resuelto",
        turn_passed: `pasó el turno → ${Number((item.payload as any)?.to_player_id) === myPlayerID ? "ti" : opponentUsername}`,
    };

    return (
        <div className="flex items-start gap-2 text-[11px]" style={{ color: "var(--foreground)" }}>
            <span className="shrink-0 w-16 text-right" style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{time}</span>
            <span>{icon}</span>
            <span><span style={{ fontWeight: 700, color: isMe ? "var(--accent)" : "var(--foreground)" }}>{username}</span>{" "}{descMap[item.type] ?? item.type}</span>
        </div>
    );
}
