"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "@heroui/react/toast";

import RankeaoSpinner from "@/components/ui/RankeaoSpinner";
import { useGameState } from "@/lib/hooks/use-game-state";
import { updateLife, declareEvent, endGame, passTurn, getInteractions, respondEvent } from "@/lib/api/game";
import { mapErrorMessage } from "@/lib/api/errors";
import type { GameStateSnapshot, GameInteraction } from "@/lib/types/game";

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

export default function GameTracker({
    duelID, myPlayerID, opponentPlayerID, myUsername, opponentUsername,
    myAvatarUrl, opponentAvatarUrl, token, gameNumber, initialSnapshot, onGameEnd,
}: GameTrackerProps) {
    const { gameState, error } = useGameState(duelID, gameNumber, token, initialSnapshot);

    const myState = gameState?.player_states.find((ps) => Number(ps.player_id) === myPlayerID);
    const oppState = gameState?.player_states.find((ps) => Number(ps.player_id) === opponentPlayerID);
    const rules = gameState?.game.game_rules;
    const pendingEvents = gameState?.pending_events ?? [];
    const myPendingEvents = pendingEvents.filter(e => Number(e.target_player_id) === myPlayerID && e.status === "pending");
    const isCompleted = gameState?.game.status === "completed";
    const isMyTurn = !isCompleted && Number(gameState?.game.active_player_id) === myPlayerID;
    const myLife = myState?.life_total ?? rules?.starting_life ?? 20;
    const oppLife = oppState?.life_total ?? rules?.starting_life ?? 20;

    // Pending actions (accumulated locally, sent on confirm)
    const [pendingHeal, setPendingHeal] = useState(0);
    const [pendingDamage, setPendingDamage] = useState(0);
    const hasPending = pendingHeal !== 0 || pendingDamage !== 0;
    const displayMyLife = myLife + pendingHeal;
    const displayOppLife = oppLife - pendingDamage;

    const [loading, setLoading] = useState<string | null>(null);
    const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
    const [showDeathPopup, setShowDeathPopup] = useState(false);

    // Local action log (works without backend deploy)
    const [localLog, setLocalLog] = useState<{ text: string; color: string; ts: number }[]>([]);
    const addLog = useCallback((text: string, color: string) => {
        setLocalLog(prev => [{ text, color, ts: Date.now() }, ...prev].slice(0, 15));
    }, []);

    // Auto-trigger onGameEnd when WebSocket reports game completed
    const didCallGameEnd = useRef(false);
    useEffect(() => {
        if (isCompleted && gameState?.game.winner_id != null && !didCallGameEnd.current) {
            didCallGameEnd.current = true;
            onGameEnd?.(Number(gameState.game.winner_id));
        }
    }, [isCompleted, gameState?.game.winner_id, onGameEnd]);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    const prevMyLife = useRef(myLife);
    useEffect(() => {
        if (prevMyLife.current > 0 && myLife <= 0 && !isCompleted) setShowDeathPopup(true);
        prevMyLife.current = myLife;
    }, [myLife, isCompleted]);

    const [lastDelta, setLastDelta] = useState<number | null>(null);
    const deltaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const prevHeroLife = useRef(myLife);
    if (myLife !== prevHeroLife.current) {
        const diff = myLife - prevHeroLife.current;
        prevHeroLife.current = myLife;
        setLastDelta(diff);
        clearTimeout(deltaTimer.current);
        deltaTimer.current = setTimeout(() => setLastDelta(null), 1200);
    }

    const [oppLastDelta, setOppLastDelta] = useState<number | null>(null);
    const oppDeltaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const prevOppLife = useRef(oppLife);
    if (oppLife !== prevOppLife.current) {
        const diff = oppLife - prevOppLife.current;
        prevOppLife.current = oppLife;
        setOppLastDelta(diff);
        clearTimeout(oppDeltaTimer.current);
        oppDeltaTimer.current = setTimeout(() => setOppLastDelta(null), 1200);
    }

    // Log opponent actions via WebSocket life changes
    const prevOppLifeForLog = useRef(oppLife);
    const prevMyLifeForLog = useRef(myLife);
    useEffect(() => {
        if (prevOppLifeForLog.current !== oppLife && prevOppLifeForLog.current !== 0) {
            const diff = oppLife - prevOppLifeForLog.current;
            // Only log if we didn't cause it (no pending damage was just sent)
            if (diff > 0) addLog(`${opponentUsername} +${diff} vida`, "rgba(248,113,113,0.4)");
        }
        prevOppLifeForLog.current = oppLife;
    }, [oppLife, opponentUsername, addLog]);

    useEffect(() => {
        if (prevMyLifeForLog.current !== myLife && prevMyLifeForLog.current !== 0) {
            const diff = myLife - prevMyLifeForLog.current;
            if (diff < 0) addLog(`${opponentUsername} te hizo ${Math.abs(diff)} daño`, "rgba(248,113,113,0.6)");
        }
        prevMyLifeForLog.current = myLife;
    }, [myLife, opponentUsername, addLog]);

    const [elapsed, setElapsed] = useState("00:00");
    useEffect(() => {
        const startedAt = gameState?.game.started_at;
        if (!startedAt || isCompleted) return;
        const start = new Date(startedAt).getTime();
        const tick = () => {
            const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
            const mm = String(Math.floor(diff / 60)).padStart(2, "0");
            const ss = String(diff % 60).padStart(2, "0");
            setElapsed(`${mm}:${ss}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [gameState?.game.started_at, isCompleted]);

    // Interactions from API
    const [interactions, setInteractions] = useState<GameInteraction[]>([]);

    const fetchInteractions = useCallback(() => {
        if (!token) return;
        getInteractions(duelID, gameNumber, token)
            .then((res) => {
                const list = res?.data?.interactions ?? res?.interactions ?? [];
                setInteractions(list);
            })
            .catch(() => {});
    }, [duelID, gameNumber, token]);

    useEffect(() => { fetchInteractions(); }, [fetchInteractions]);
    useEffect(() => { fetchInteractions(); }, [isMyTurn, fetchInteractions]);

    const handlePassTurn = useCallback(async () => {
        if (!token || loading) return;
        setLoading("pass_turn");
        try {
            await passTurn(duelID, gameNumber, token);
            setPendingHeal(0);
            setPendingDamage(0);
            addLog("Paso turno", "rgba(168,85,247,0.6)");
        } catch (err) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    }, [duelID, gameNumber, token, loading, addLog]);

    const handleConfirm = useCallback(async () => {
        if (loading || !hasPending) return;
        const healToSend = pendingHeal;
        const damageToSend = pendingDamage;
        setPendingHeal(0);
        setPendingDamage(0);
        setLoading("confirm");
        try {
            if (healToSend !== 0) {
                await updateLife(duelID, gameNumber, { delta: healToSend }, token);
            }
            if (damageToSend > 0) {
                await declareEvent(duelID, gameNumber, {
                    target_player_id: opponentPlayerID,
                    event_type: "damage",
                    amount: damageToSend,
                }, token);
            }
            if (healToSend !== 0) addLog(`+${healToSend} vida`, "rgba(74,222,128,0.6)");
            if (damageToSend > 0) addLog(`-${damageToSend} daño a ${opponentUsername}`, "rgba(248,113,113,0.6)");
            fetchInteractions();
            // Auto-pass: confirmar acciones = terminar turno
            await passTurn(duelID, gameNumber, token).catch(() => {});
        } catch (err) {
            setPendingHeal(healToSend);
            setPendingDamage(damageToSend);
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    }, [duelID, gameNumber, token, opponentPlayerID, pendingHeal, pendingDamage, loading, hasPending]);

    const handleSurrender = useCallback(async () => {
        if (!token || loading) return;
        setLoading("surrender");
        try {
            // Terminar solo esta partida — el backend actualiza el score del duelo
            await endGame(duelID, gameNumber, { winner_id: opponentPlayerID }, token);
            setShowSurrenderConfirm(false);
            onGameEnd?.(opponentPlayerID);
        } catch (err) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    }, [duelID, gameNumber, token, opponentPlayerID, loading, onGameEnd]);

    const handleDeathConfirm = useCallback(async () => {
        if (!token || loading) return;
        setLoading("death");
        try {
            await endGame(duelID, gameNumber, { winner_id: opponentPlayerID }, token);
            setShowDeathPopup(false);
            onGameEnd?.(opponentPlayerID);
        } catch (err) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    }, [duelID, gameNumber, token, opponentPlayerID, loading, onGameEnd]);

    if (error) {
        return (
            <div style={{ borderRadius: 16, border: "1px solid var(--border)", padding: 20, textAlign: "center", backgroundColor: "rgba(255,255,255,0.02)" }}>
                <p style={{ fontSize: 13, margin: 0, color: "var(--danger)" }}>{error}</p>
            </div>
        );
    }

    if (!gameState || !rules) {
        return (
            <div style={{ borderRadius: 16, border: "1px solid var(--border)", padding: "40px 0", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.02)" }}>
                <RankeaoSpinner className="h-10 w-auto" />
            </div>
        );
    }

    const isLowLife = displayMyLife <= 5;
    const oppLow = displayOppLife <= 5;

    return (
        <div className="flex flex-col lg:flex-row bg-[#0a0a0f] overflow-hidden h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-4rem)]">
        {/* Game panel */}
        <div className="flex flex-col overflow-y-auto overflow-x-hidden lg:w-1/2 flex-1 lg:flex-none relative">
            <style>{`
                @keyframes gtD{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-18px) scale(.8)}}
                @keyframes gtG{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 2px rgba(255,255,255,.04)}}
                @keyframes gtHeartBeat{0%{transform:scale(1)}12%{transform:scale(.93) scaleX(1.04)}30%{transform:scale(1.06) scaleX(.97)}55%{transform:scale(.98)}100%{transform:scale(1)}}
                @keyframes gtTapHeal{0%{transform:scale(1)}12%{transform:scale(.9)}35%{transform:scale(1.06)}100%{transform:scale(1)}}
                @keyframes gtTapDmg{0%{transform:scale(1) rotate(0)}12%{transform:scale(.93) rotate(8deg)}35%{transform:scale(1.05) rotate(-3deg)}100%{transform:scale(1) rotate(0)}}
                @keyframes gtSwordSwing{0%{transform:rotate(-35deg)}12%{transform:rotate(-15deg)}35%{transform:rotate(-40deg)}100%{transform:rotate(-35deg)}}
                @keyframes gtBloodDrop1{0%{opacity:1;transform:translateY(-60px) scale(.5)}30%{opacity:1;transform:translateY(0) scale(1)}45%{transform:translateY(-5px) scaleY(.8) scaleX(1.2)}60%{transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(4px) scale(.7)}}
                @keyframes gtBloodDrop2{0%{opacity:1;transform:translateY(-70px) scale(.4)}35%{opacity:1;transform:translateY(0) scale(1)}50%{transform:translateY(-4px) scaleY(.8) scaleX(1.15)}100%{opacity:0;transform:translateY(4px) scale(.6)}}
                @keyframes gtBloodDrop3{0%{opacity:1;transform:translateY(-55px) scale(.6)}28%{opacity:1;transform:translateY(0) scale(1)}42%{transform:translateY(-6px) scaleY(.75) scaleX(1.25)}100%{opacity:0;transform:translateY(4px) scale(.5)}}
                .gt-tap-heal{animation:gtTapHeal .4s ease-out}
                .gt-tap-dmg{animation:gtTapDmg .4s ease-out}
                .gt-dmg-wrap{position:relative;overflow:visible}
                .gt-dmg-wrap .gt-sword{transform:rotate(-35deg);transform-origin:center 60%}
                .gt-dmg-wrap.gt-slashing .gt-sword{animation:gtSwordSwing .35s ease-out forwards}
                .gt-dmg-wrap .gt-blood{position:absolute;opacity:0;pointer-events:none}
                .gt-dmg-wrap.gt-slashing .gt-blood:nth-child(2){animation:gtBloodDrop1 .5s .05s ease-out forwards}
                .gt-dmg-wrap.gt-slashing .gt-blood:nth-child(3){animation:gtBloodDrop2 .5s .1s ease-out forwards}
                .gt-dmg-wrap.gt-slashing .gt-blood:nth-child(4){animation:gtBloodDrop3 .5s .15s ease-out forwards}
                @keyframes gtCrossUp1{0%{opacity:1;transform:translate(0,0) scale(1) rotate(0)}100%{opacity:0;transform:translate(-14px,-32px) scale(.6) rotate(-15deg)}}
                @keyframes gtCrossUp2{0%{opacity:1;transform:translate(0,0) scale(1) rotate(0)}100%{opacity:0;transform:translate(10px,-36px) scale(.5) rotate(10deg)}}
                @keyframes gtCrossUp3{0%{opacity:1;transform:translate(0,0) scale(1) rotate(0)}100%{opacity:0;transform:translate(18px,-24px) scale(.7) rotate(20deg)}}
                .gt-heal-wrap{position:relative;overflow:visible}
                .gt-heal-wrap .gt-cross{position:absolute;opacity:0;pointer-events:none}
                .gt-heal-wrap.gt-popping .gt-cross:nth-child(2){animation:gtCrossUp1 .55s ease-out forwards}
                .gt-heal-wrap.gt-popping .gt-cross:nth-child(3){animation:gtCrossUp2 .55s .06s ease-out forwards}
                .gt-heal-wrap.gt-popping .gt-cross:nth-child(4){animation:gtCrossUp3 .55s .12s ease-out forwards}
                .gt-heal-wrap .gt-heart{transform-origin:center 60%}
                .gt-heal-wrap.gt-popping .gt-heart{animation:gtHeartBeat .5s cubic-bezier(.36,1.2,.5,1) forwards}
                .gt-btn-heal:active{background-color:rgba(74,222,128,0.15)!important;border-color:rgba(74,222,128,0.3)!important}
                .gt-btn-dmg:active{background-color:rgba(248,113,113,0.15)!important;border-color:rgba(248,113,113,0.3)!important}
                .gt-card{transition:all .4s cubic-bezier(.4,0,.2,1)}
            `}</style>

            {/* Life cards */}
            <div className="mx-3 flex flex-col shrink-0" style={{ marginTop: "clamp(0.5rem, 2dvh, 1rem)", gap: "clamp(4px, 0.8dvh, 8px)" }}>
                {/* My life */}
                <div className="gt-card px-4 rounded-2xl flex items-center gap-3 border"
                    style={{
                        padding: isMyTurn ? "clamp(0.75rem, 3dvh, 1.5rem) 1rem" : "clamp(0.5rem, 1.5dvh, 0.875rem) 1rem",
                        backgroundColor: isMyTurn ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                        borderColor: isMyTurn ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
                        opacity: isMyTurn ? 1 : 0.4,
                        animation: isMyTurn ? "gtG 2s ease-in-out infinite" : undefined,
                    }}>
                    <div className="rounded-full overflow-hidden shrink-0 bg-[#1a1a2e] flex items-center justify-center transition-all duration-400" style={{ width: isMyTurn ? "clamp(2rem, 5dvh, 2.75rem)" : "clamp(1.5rem, 3.5dvh, 2rem)", height: isMyTurn ? "clamp(2rem, 5dvh, 2.75rem)" : "clamp(1.5rem, 3.5dvh, 2rem)" }}>
                        {myAvatarUrl ? <Image src={myAvatarUrl} alt="" width={44} height={44} className="w-full h-full object-cover" /> : <span className={`font-extrabold text-white/50 ${isMyTurn ? "text-base" : "text-xs"}`}>{(myUsername||"?")[0].toUpperCase()}</span>}
                    </div>
                    <span className={`flex-1 min-w-0 font-semibold transition-all duration-400 ${isMyTurn ? "text-sm text-white/70" : "text-[13px] text-white/40"}`}>{myUsername}</span>
                    <div className="relative flex items-baseline gap-1.5">
                        {lastDelta != null && <span className="absolute right-0 -top-4 text-lg font-extrabold pointer-events-none" style={{ color: lastDelta > 0 ? "#22c55e" : "#ef4444", animation: "gtD 1.2s ease-out forwards" }}>{lastDelta > 0 ? `+${lastDelta}` : lastDelta}</span>}
                        <span className="font-black leading-none tracking-tighter transition-all duration-400" style={{ fontSize: isMyTurn ? "clamp(3rem, 9dvh, 4.5rem)" : "clamp(1.75rem, 5dvh, 2.5rem)", color: isLowLife ? "#ef4444" : "#fff" }}>{displayMyLife}</span>
                        {pendingHeal !== 0 && <span className="text-sm font-bold text-green-500">+{pendingHeal}</span>}
                    </div>
                </div>

                {/* Opponent */}
                <div className="gt-card px-4 rounded-2xl flex items-center gap-2 border"
                    style={{
                        padding: (!isMyTurn && !isCompleted) ? "clamp(0.75rem, 3dvh, 1.5rem) 1rem" : "clamp(0.5rem, 1.5dvh, 0.875rem) 1rem",
                        backgroundColor: (!isMyTurn && !isCompleted) ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                        borderColor: (!isMyTurn && !isCompleted) ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                        opacity: (!isMyTurn && !isCompleted) ? 1 : 0.4,
                    }}>
                    <div className="rounded-full overflow-hidden shrink-0 bg-[#1a1a2e] flex items-center justify-center transition-all duration-400" style={{ width: (!isMyTurn && !isCompleted) ? "clamp(2rem, 5dvh, 2.75rem)" : "clamp(1.5rem, 3.5dvh, 2rem)", height: (!isMyTurn && !isCompleted) ? "clamp(2rem, 5dvh, 2.75rem)" : "clamp(1.5rem, 3.5dvh, 2rem)" }}>
                        {opponentAvatarUrl ? <Image src={opponentAvatarUrl} alt="" width={44} height={44} className="w-full h-full object-cover" /> : <span className={`font-extrabold text-white/30 ${(!isMyTurn && !isCompleted) ? "text-base" : "text-xs"}`}>{(opponentUsername||"?")[0].toUpperCase()}</span>}
                    </div>
                    <span className={`flex-1 font-semibold text-white/40 transition-all duration-400 ${(!isMyTurn && !isCompleted) ? "text-sm" : "text-[13px]"}`}>{opponentUsername}</span>
                    <div className="relative flex items-baseline gap-1">
                        {oppLastDelta != null && <span className="absolute right-0 -top-3 text-sm font-extrabold pointer-events-none" style={{ color: oppLastDelta > 0 ? "#22c55e" : "#ef4444", animation: "gtD 1.2s ease-out forwards" }}>{oppLastDelta > 0 ? `+${oppLastDelta}` : oppLastDelta}</span>}
                        <span className="font-black leading-none tracking-tight transition-all duration-400" style={{ fontSize: (!isMyTurn && !isCompleted) ? "clamp(3rem, 9dvh, 4.5rem)" : "clamp(1.75rem, 5dvh, 2.5rem)", color: oppLow ? "#ef4444" : "rgba(255,255,255,0.7)" }}>{displayOppLife}</span>
                        {pendingDamage > 0 && <span className="text-xs font-bold text-red-500">-{pendingDamage}</span>}
                    </div>
                </div>
            </div>

            {/* Turn indicator */}
            {!isCompleted && gameState.game.active_player_id !== null && (
                <div className={`mx-3 shrink-0 text-center border rounded-xl ${isMyTurn ? "bg-purple-500/10 border-purple-500/20" : "bg-white/[0.03] border-white/[0.04]"}`} style={{ marginTop: "clamp(4px, 0.8dvh, 8px)", padding: "clamp(6px, 1dvh, 10px) 14px" }}>
                    <span className={`text-[13px] font-bold ${isMyTurn ? "text-white" : "text-white/30"}`}>{isMyTurn ? "Tu turno" : `Turno de ${opponentUsername}`}</span>
                </div>
            )}

            {/* Pending event popup overlay */}
            {myPendingEvents.length > 0 && (() => {
                const pe = myPendingEvents[0];
                const isCounter = pe.event_type === "counter";
                const eventColor = pe.event_type === "damage" ? "#ef4444" : pe.event_type === "heal" ? "#22c55e" : pe.event_type === "poison" ? "#a855f7" : "#3b82f6";
                return (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-5">
                        <div className="rounded-2xl p-6 max-w-[300px] w-full flex flex-col gap-4" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                            <p className="text-[15px] font-extrabold text-white m-0 text-center">
                                {isCounter
                                    ? <>{opponentUsername} contrarresta tu acción</>
                                    : <>{opponentUsername} declara <span style={{ color: eventColor }}>{pe.amount}</span> de daño</>
                                }
                            </p>
                            <PendingEventActions duelID={duelID} gameNumber={gameNumber} eventID={pe.id} token={token} deadline={pe.response_deadline} />
                        </div>
                    </div>
                );
            })()}

            {/* Winner */}
            {isCompleted && gameState.game.winner_id !== null && (
                <div className="mx-3 mt-1.5 p-3.5 rounded-xl bg-green-500/[0.08] border border-green-500/20 text-center shrink-0">
                    <span className="text-[15px] font-extrabold text-green-500">{Number(gameState.game.winner_id) === myPlayerID ? `${myUsername} gana!` : `${opponentUsername} gana`}</span>
                </div>
            )}

            {/* Timer */}
            <div className="flex flex-col items-center justify-center relative z-20" style={{ flex: isMyTurn ? "1 1 0" : "0 0 auto", minHeight: isMyTurn ? "clamp(60px, 10dvh, 140px)" : undefined, marginTop: isMyTurn ? 0 : "clamp(8px, 1.5dvh, 16px)" }}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full" style={{ background: "linear-gradient(135deg, transparent calc(50% - 0.5px), rgba(255,255,255,0.06) calc(50% - 0.5px), rgba(255,255,255,0.06) calc(50% + 0.5px), transparent calc(50% + 0.5px))" }} />
                </div>
                <div className="relative rounded-2xl backdrop-blur-xl" style={{ padding: "clamp(8px, 1.5dvh, 14px) clamp(20px, 4dvh, 32px)", backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
                    <span className="font-black text-white/80 font-mono tabular-nums tracking-widest" style={{ fontSize: "clamp(1.5rem, 4.5dvh, 2.25rem)" }}>{elapsed}</span>
                </div>
                <button onClick={() => setShowSurrenderConfirm(true)}
                    className="px-4 py-1 rounded-full font-semibold active:opacity-70 touch-manipulation"
                    style={{ marginTop: "clamp(4px, 0.8dvh, 8px)", fontSize: "clamp(10px, 1.3dvh, 12px)", backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", color: "rgba(239,68,68,0.5)" }}>
                    Rendirse
                </button>
            </div>

            {/* History — mobile only, when waiting */}
            {!isCompleted && !isMyTurn && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden lg:hidden" style={{ marginTop: "clamp(6px, 1dvh, 12px)" }}>
                    <div className="flex items-center justify-between px-4 shrink-0 py-2">
                        <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>Historial</span>
                    </div>
                    <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-px" style={{ scrollbarWidth: "thin" }}>
                        {[...interactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((item, i) => {
                            const p = item.payload;
                            const isMine = Number(item.player_id) === myPlayerID;
                            const who = isMine ? myUsername : opponentUsername;
                            const desc = formatInteraction(item.type, p, isMine, opponentUsername);
                            const delta = typeof p?.delta === "number" ? p.delta : 0;
                            const isHeal = item.type === "life_updated" && delta > 0;
                            const isDamage = item.type === "event_declared" || (item.type === "life_updated" && delta < 0);
                            const accentColor = isHeal ? "rgba(74,222,128,0.06)" : isDamage ? "rgba(248,113,113,0.06)" : "rgba(168,85,247,0.06)";
                            const dotColor = isHeal ? "#4ade80" : isDamage ? "#f87171" : "#a78bfa";
                            const time = new Date(item.created_at);
                            const hh = String(time.getHours()).padStart(2, "0");
                            const mm = String(time.getMinutes()).padStart(2, "0");
                            return (
                                <div key={item.id ?? i} className="flex items-center gap-2.5 px-3" style={{ padding: "clamp(6px, 1dvh, 10px) 12px", backgroundColor: accentColor }}>
                                    <svg className="shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none">
                                        {isHeal ? (
                                            /* Corazón con + */
                                            <><path d="M8 14s-6-4-6-8.5C2 3.5 3.5 2 5.5 2 6.8 2 7.8 2.7 8 3.5 8.2 2.7 9.2 2 10.5 2 12.5 2 14 3.5 14 5.5 14 10 8 14 8 14z" fill={dotColor}/></>
                                        ) : isDamage ? (
                                            /* Espada */
                                            <><rect x="7" y="1" width="2" height="9" rx=".5" fill={dotColor}/><rect x="4.5" y="9.5" width="7" height="1.5" rx=".5" fill={dotColor}/><rect x="7" y="11" width="2" height="3" rx=".5" fill={dotColor}/><circle cx="8" cy="15" r="1" fill={dotColor}/></>
                                        ) : item.type === "turn_passed" ? (
                                            /* Flechas rotación */
                                            <path d="M11 3.5A5 5 0 004 5l-1.5-1v3.5H6L4.5 6a3.5 3.5 0 015-1.5M5 12.5A5 5 0 0012 11l1.5 1V8.5H10l1.5 1.5a3.5 3.5 0 01-5 1.5" stroke={dotColor} strokeWidth="1.2" fill="none"/>
                                        ) : item.type === "game_started" ? (
                                            /* Play */
                                            <path d="M5 3l8 5-8 5V3z" fill={dotColor}/>
                                        ) : item.type === "game_ended" ? (
                                            /* Trofeo */
                                            <path d="M4 2h8v1h2v3c0 1-1 2-2 2h-1a3 3 0 01-3 3v1h2v1H6v-1h2v-1a3 3 0 01-3-3H4c-1 0-2-1-2-2V3h2V2z" fill={dotColor}/>
                                        ) : (
                                            <circle cx="8" cy="8" r="3" fill={dotColor}/>
                                        )}
                                    </svg>
                                    <span className="text-[10px] font-mono shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>{hh}:{mm}</span>
                                    <span className="text-[12px] font-semibold shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}>{who}</span>
                                    <span className="text-[12px] flex-1" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</span>
                                </div>
                            );
                        })}
                        {interactions.length === 0 && localLog.length > 0 && localLog.map((entry, i) => (
                            <div key={entry.ts + i} className="flex items-center gap-2.5 px-3" style={{ padding: "clamp(6px, 1dvh, 10px) 12px", backgroundColor: "rgba(255,255,255,0.02)" }}>
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                <span className="text-[12px] font-semibold shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}>{myUsername}</span>
                                <span className="text-[12px] flex-1" style={{ color: "rgba(255,255,255,0.4)" }}>{entry.text}</span>
                            </div>
                        ))}
                        {interactions.length === 0 && localLog.length === 0 && (
                            <p className="text-center m-0 py-4" style={{ fontSize: "clamp(11px, 1.5dvh, 13px)", color: "rgba(255,255,255,0.12)" }}>Esperando acciones...</p>
                        )}
                    </div>
                </div>
            )}

            {/* Actions — only when my turn */}
            {!isCompleted && isMyTurn && (
                <div className="shrink-0 flex flex-col px-3" style={{ gap: "clamp(4px, 0.8dvh, 8px)", paddingBottom: "clamp(12px, 2.5dvh, 24px)" }}>
                    {/* +3 +5 / -3 -5 agrupados */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex gap-1.5 rounded-xl p-1.5" style={{ backgroundColor: "rgba(74,222,128,0.02)", border: "1px solid rgba(74,222,128,0.06)" }}>
                            <button onClick={() => setPendingHeal(prev => prev + 3)}
                                className="flex-1 rounded-lg font-bold active:scale-[0.96] touch-manipulation border-none"
                                style={{ height: "clamp(2rem, 5dvh, 2.5rem)", fontSize: "clamp(13px, 1.8dvh, 15px)", backgroundColor: "rgba(74,222,128,0.05)", color: "#86efac" }}>
                                +3
                            </button>
                            <button onClick={() => setPendingHeal(prev => prev + 5)}
                                className="flex-1 rounded-lg font-bold active:scale-[0.96] touch-manipulation border-none"
                                style={{ height: "clamp(2rem, 5dvh, 2.5rem)", fontSize: "clamp(13px, 1.8dvh, 15px)", backgroundColor: "rgba(74,222,128,0.05)", color: "#86efac" }}>
                                +5
                            </button>
                        </div>
                        <div className="flex gap-1.5 rounded-xl p-1.5" style={{ backgroundColor: "rgba(248,113,113,0.02)", border: "1px solid rgba(248,113,113,0.06)" }}>
                            <button onClick={() => setPendingDamage(prev => prev + 3)}
                                className="flex-1 rounded-lg font-bold active:scale-[0.96] touch-manipulation border-none"
                                style={{ height: "clamp(2rem, 5dvh, 2.5rem)", fontSize: "clamp(13px, 1.8dvh, 15px)", backgroundColor: "rgba(248,113,113,0.05)", color: "#fca5a5" }}>
                                -3
                            </button>
                            <button onClick={() => setPendingDamage(prev => prev + 5)}
                                className="flex-1 rounded-lg font-bold active:scale-[0.96] touch-manipulation border-none"
                                style={{ height: "clamp(2rem, 5dvh, 2.5rem)", fontSize: "clamp(13px, 1.8dvh, 15px)", backgroundColor: "rgba(248,113,113,0.05)", color: "#fca5a5" }}>
                                -5
                            </button>
                        </div>
                    </div>
                    {/* Curar / Dañar grandes abajo */}
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={(e) => {
                                setPendingHeal(prev => prev + 1);
                                try { navigator?.vibrate?.(15); } catch {}
                                const el = e.currentTarget;
                                el.classList.remove("gt-tap-heal");
                                const wrap = el.querySelector(".gt-heal-wrap");
                                if (wrap) { wrap.classList.remove("gt-popping"); void (wrap as HTMLElement).offsetWidth; wrap.classList.add("gt-popping"); }
                                void el.offsetWidth; el.classList.add("gt-tap-heal");
                            }}
                            className="rounded-2xl touch-manipulation gt-btn-heal"
                            style={{ height: "clamp(70px, 14dvh, 160px)", backgroundColor: "rgba(74,222,128,0.02)", border: "1px solid rgba(74,222,128,0.08)" }}>
                            <div className="gt-heal-wrap relative w-full h-full flex items-center justify-center">
                                <svg className="gt-heart" style={{ width: "clamp(40px, 9dvh, 100px)", height: "clamp(40px, 9dvh, 100px)" }} viewBox="0 0 64 64" fill="none">
                                    <path d="M32 50C32 50 6 36 6 20c0-8.8 6.5-14 14-14 4.8 0 9 2.8 12 7 3-4.2 7.2-7 12-7 7.5 0 14 5.2 14 14 0 16-26 30-26 30z" fill="#86efac"/>
                                </svg>
                                <svg className="gt-cross" style={{ top: "10%", left: "5%" }} width="18" height="18" viewBox="0 0 16 16"><rect x="5" y="0" width="6" height="16" rx="1.5" fill="#fff"/><rect x="0" y="5" width="16" height="6" rx="1.5" fill="#fff"/></svg>
                                <svg className="gt-cross" style={{ top: "0%", left: "50%" }} width="14" height="14" viewBox="0 0 16 16"><rect x="5" y="0" width="6" height="16" rx="1.5" fill="#fff"/><rect x="0" y="5" width="16" height="6" rx="1.5" fill="#fff"/></svg>
                                <svg className="gt-cross" style={{ top: "15%", right: "2%" }} width="16" height="16" viewBox="0 0 16 16"><rect x="5" y="0" width="6" height="16" rx="1.5" fill="#fff"/><rect x="0" y="5" width="16" height="6" rx="1.5" fill="#fff"/></svg>
                                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg font-bold backdrop-blur-md"
                                    style={{ fontSize: "clamp(10px, 1.5dvh, 13px)", background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.3)", color: "#86efac" }}>
                                    +1
                                </span>
                            </div>
                        </button>
                        <button onClick={(e) => {
                                setPendingDamage(prev => prev + 1);
                                try { navigator?.vibrate?.(15); } catch {}
                                const el = e.currentTarget;
                                el.classList.remove("gt-tap-dmg");
                                const wrap = el.querySelector(".gt-dmg-wrap");
                                if (wrap) { wrap.classList.remove("gt-slashing"); void (wrap as HTMLElement).offsetWidth; wrap.classList.add("gt-slashing"); }
                                void el.offsetWidth; el.classList.add("gt-tap-dmg");
                            }}
                            className="rounded-2xl touch-manipulation gt-btn-dmg"
                            style={{ height: "clamp(70px, 14dvh, 160px)", backgroundColor: "rgba(248,113,113,0.02)", border: "1px solid rgba(248,113,113,0.08)" }}>
                            <div className="gt-dmg-wrap relative w-full h-full flex items-center justify-center">
                                <svg className="gt-sword" style={{ width: "clamp(40px, 9dvh, 100px)", height: "clamp(40px, 9dvh, 100px)" }} viewBox="0 0 64 64" fill="none">
                                    <polygon points="32,3 25,14 28,42 36,42 39,14" fill="#fca5a5"/>
                                    <rect x="20" y="42" width="24" height="4" rx="2" fill="#f87171"/>
                                    <rect x="29" y="46" width="6" height="9" rx="1.5" fill="#b91c1c"/>
                                    <circle cx="32" cy="58" r="3" fill="#f87171"/>
                                </svg>
                                {/* Gotas de sangre — posicionadas abajo, caen desde arriba */}
                                <svg className="gt-blood" style={{ bottom: "15%", left: "22%" }} width="10" height="14" viewBox="0 0 10 14"><path d="M5 0C5 0 0 7 0 10a5 5 0 0010 0C10 7 5 0 5 0z" fill="#dc2626"/></svg>
                                <svg className="gt-blood" style={{ bottom: "20%", left: "50%" }} width="8" height="12" viewBox="0 0 10 14"><path d="M5 0C5 0 0 7 0 10a5 5 0 0010 0C10 7 5 0 5 0z" fill="#ef4444"/></svg>
                                <svg className="gt-blood" style={{ bottom: "12%", right: "20%" }} width="7" height="10" viewBox="0 0 10 14"><path d="M5 0C5 0 0 7 0 10a5 5 0 0010 0C10 7 5 0 5 0z" fill="#dc2626"/></svg>
                                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg font-bold backdrop-blur-md"
                                    style={{ fontSize: "clamp(10px, 1.5dvh, 13px)", background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.3)", color: "#fca5a5" }}>
                                    -1
                                </span>
                            </div>
                        </button>
                    </div>

                    {/* Deshacer pills */}
                    {hasPending && (
                        <div className="flex gap-2">
                            {pendingHeal > 0 && (
                                <button onClick={() => setPendingHeal(0)}
                                    className="flex-1 rounded-full font-semibold active:scale-[0.98] touch-manipulation"
                                    style={{ padding: "clamp(5px, 1dvh, 8px) 0", fontSize: "clamp(11px, 1.5dvh, 13px)", backgroundColor: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)", color: "#86efac" }}>
                                    Deshacer +{pendingHeal}
                                </button>
                            )}
                            {pendingDamage > 0 && (
                                <button onClick={() => setPendingDamage(0)}
                                    className="flex-1 rounded-full font-semibold active:scale-[0.98] touch-manipulation"
                                    style={{ padding: "clamp(5px, 1dvh, 8px) 0", fontSize: "clamp(11px, 1.5dvh, 13px)", backgroundColor: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", color: "#fca5a5" }}>
                                    Deshacer -{pendingDamage}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Pasar turno (40%) + Confirmar (60%) */}
                    <div className="flex gap-2">
                        {isMyTurn && (
                            <button onClick={handlePassTurn} disabled={!!loading}
                                className={`w-[40%] shrink-0 rounded-2xl font-bold active:scale-[0.98] touch-manipulation ${loading === "pass_turn" ? "opacity-50" : ""}`}
                                style={{ padding: "clamp(10px, 2dvh, 14px) 0", fontSize: "clamp(12px, 1.7dvh, 14px)", backgroundColor: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "rgba(255,255,255,0.6)" }}>
                                {loading === "pass_turn" ? "..." : "Pasar turno"}
                            </button>
                        )}
                        <button onClick={handleConfirm} disabled={!hasPending || !!loading}
                            className={`flex-1 rounded-2xl font-bold active:scale-[0.98] touch-manipulation border-none ${hasPending ? "text-white" : "text-white/20"}`}
                            style={{ padding: "clamp(10px, 2dvh, 14px) 0", fontSize: "clamp(12px, 1.7dvh, 14px)", ...(hasPending ? { background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 4px 16px rgba(59,130,246,0.25)" } : { backgroundColor: "rgba(255,255,255,0.04)" }) }}>
                            {loading === "confirm" ? "Confirmando..." : "Confirmar"}
                        </button>
                    </div>
                </div>
            )}

            {/* Surrender confirm */}
            {/* Game ended overlay */}
            {isCompleted && gameState.game.winner_id !== null && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[200] p-5">
                    <div className="rounded-2xl p-8 max-w-[300px] w-full text-center flex flex-col items-center gap-5" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <p className="text-[42px] m-0 leading-none" style={{ color: Number(gameState.game.winner_id) === myPlayerID ? "#22c55e" : "#ef4444" }}>
                            {Number(gameState.game.winner_id) === myPlayerID ? "Victoria" : "Derrota"}
                        </p>
                        <p className="text-[15px] font-bold m-0" style={{ color: "rgba(255,255,255,0.5)" }}>
                            {Number(gameState.game.winner_id) === myPlayerID ? myUsername : opponentUsername} gana la partida
                        </p>
                    </div>
                </div>
            )}

            {showSurrenderConfirm && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur flex items-center justify-center z-[200] p-5">
                    <div className="rounded-2xl p-6 max-w-[300px] w-full text-center flex flex-col gap-4" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <p className="text-base font-extrabold text-white m-0">Rendirse</p>
                        <p className="text-[13px] text-white/40 m-0">Perderás esta partida.</p>
                        <div className="flex gap-2.5">
                            <button onClick={() => setShowSurrenderConfirm(false)} className="flex-1 py-3 rounded-xl border border-white/[0.08] bg-transparent text-white/40 text-sm font-bold active:opacity-70 touch-manipulation">Cancelar</button>
                            <button onClick={handleSurrender} disabled={loading === "surrender"} className={`flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-extrabold border-none active:opacity-70 touch-manipulation ${loading === "surrender" ? "opacity-50" : ""}`}>{loading === "surrender" ? "..." : "Confirmar"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Death popup */}
            {showDeathPopup && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-5">
                    <div className="rounded-2xl p-6 max-w-[300px] w-full text-center flex flex-col gap-4" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <p className="text-lg font-black text-red-500 m-0">Vida en 0</p>
                        <p className="text-sm text-white/40 m-0">¿Perdiste esta partida?</p>
                        <div className="flex gap-2.5">
                            <button onClick={() => setShowDeathPopup(false)} className="flex-1 py-3 rounded-xl border border-white/[0.08] bg-transparent text-white/40 text-sm font-bold active:opacity-70 touch-manipulation">No, error</button>
                            <button onClick={handleDeathConfirm} disabled={loading === "death"} className={`flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-extrabold border-none active:opacity-70 touch-manipulation ${loading === "death" ? "opacity-50" : ""}`}>{loading === "death" ? "..." : "Sí, perdí"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>{/* end game panel */}

            {/* Desktop history panel — always visible on lg+ */}
            <div className="hidden lg:flex flex-col w-1/2 border-l overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center px-4 py-3 shrink-0 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <span className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>Historial de la partida</span>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-px" style={{ scrollbarWidth: "thin" }}>
                    {[...interactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((item, i) => {
                        const p = item.payload;
                        const isMine = Number(item.player_id) === myPlayerID;
                        const who = isMine ? myUsername : opponentUsername;
                        const desc = formatInteraction(item.type, p, isMine, opponentUsername);
                        const delta = typeof p?.delta === "number" ? p.delta : 0;
                        const isHeal = item.type === "life_updated" && delta > 0;
                        const isDamage = item.type === "event_declared" || (item.type === "life_updated" && delta < 0);
                        const accentColor = isHeal ? "rgba(74,222,128,0.06)" : isDamage ? "rgba(248,113,113,0.06)" : "rgba(168,85,247,0.06)";
                        const time = new Date(item.created_at);
                        const hh = String(time.getHours()).padStart(2, "0");
                        const mm = String(time.getMinutes()).padStart(2, "0");
                        return (
                            <div key={item.id ?? i} className="flex items-center gap-2.5 rounded-lg" style={{ padding: "8px 12px", backgroundColor: accentColor }}>
                                <span className="text-[10px] font-mono shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>{hh}:{mm}</span>
                                <span className="text-[12px] font-semibold shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}>{who}</span>
                                <span className="text-[12px] flex-1" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</span>
                            </div>
                        );
                    })}
                    {interactions.length === 0 && (
                        <p className="text-center m-0 py-8 text-[13px]" style={{ color: "rgba(255,255,255,0.12)" }}>Sin interacciones aún</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function PendingEventActions({ duelID, gameNumber, eventID, token, deadline }: { duelID: string; gameNumber: number; eventID: string; token: string; deadline: string | null }) {
    const [busy, setBusy] = useState(false);
    const didAutoPass = useRef(false);
    const totalMs = 8000;
    const [remaining, setRemaining] = useState(() => deadline ? Math.max(0, new Date(deadline).getTime() - Date.now()) : totalMs);

    const respond = useCallback(async (type: string) => {
        if (busy) return;
        setBusy(true);
        try {
            await respondEvent(duelID, gameNumber, eventID, { response_type: type }, token);
        } catch { /* auto-resolve lo manejará */ }
        finally { setBusy(false); }
    }, [busy, duelID, gameNumber, eventID, token]);

    useEffect(() => {
        if (!deadline) return;
        const id = setInterval(() => {
            const ms = Math.max(0, new Date(deadline).getTime() - Date.now());
            setRemaining(ms);
            if (ms <= 0 && !didAutoPass.current) {
                didAutoPass.current = true;
                respond("pass");
            }
        }, 100);
        return () => clearInterval(id);
    }, [deadline, respond]);

    const pct = Math.max(0, (remaining / totalMs) * 100);
    const secs = Math.ceil(remaining / 1000);
    const urgent = secs <= 3;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <div style={{ position: "relative", height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 3, backgroundColor: urgent ? "#ef4444" : "#3b82f6", width: `${pct}%`, opacity: 0.8, transition: "width 0.15s linear" }} />
            </div>
            <div className="flex gap-2.5">
                <button onClick={() => respond("pass")} disabled={busy}
                    className={`flex-1 py-3 rounded-xl border border-white/[0.08] bg-transparent text-sm font-bold active:opacity-70 touch-manipulation ${busy ? "opacity-50" : ""}`}
                    style={{ color: "rgba(255,255,255,0.4)" }}>
                    {busy ? "..." : `Aceptar${secs > 0 ? ` (${secs})` : ""}`}
                </button>
                <button onClick={() => respond("counter")} disabled={busy}
                    className={`flex-1 py-3 rounded-xl border-none text-sm font-extrabold active:opacity-70 touch-manipulation ${busy ? "opacity-50" : ""}`}
                    style={{ backgroundColor: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa" }}>
                    {busy ? "..." : "Contrahechizo"}
                </button>
            </div>
        </div>
    );
}

function formatInteraction(type: string, p: Record<string, unknown>, isMine: boolean, oppName: string): string {
    const delta = typeof p?.delta === "number" ? p.delta : 0;
    const amount = typeof p?.amount === "number" ? p.amount : "";
    switch (type) {
        case "game_started": return "inicio la partida";
        case "game_ended": return "termino la partida";
        case "life_updated": return `${delta > 0 ? "+" : ""}${delta} vida`;
        case "event_declared": return `${amount} daño a ${isMine ? oppName : "ti"}`;
        case "turn_passed": return "paso turno";
        case "event_passed": return "acepto efecto";
        case "event_countered": return "contrahechizo";
        case "event_resolved": return "resuelto";
        default: return type.replace(/_/g, " ");
    }
}
