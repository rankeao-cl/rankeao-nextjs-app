"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react/toast";

import { usePlayLCStore } from "./use-play-life-counter";
import PlayerPanel from "@/features/play/LifeCounter/PlayerPanel";
import CommanderDamageOverlay from "@/features/play/LifeCounter/CommanderDamageOverlay";
import LifeHistory from "@/features/play/LifeCounter/LifeHistory";
import CenterMenu from "@/features/play/LifeCounter/CenterMenu";

import { useTrackerSocket } from "@/lib/hooks/use-partida-socket";
import { useAuth } from "@/lib/hooks/use-auth";
import {
    getTrackerState,
    getTrackerHistory,
    updateLife,
    updateCommanderDamage,
    undoLast,
    endTrackerSession,
} from "@/lib/api/play";
import type { LCSession, LCPlayer, LCEvent } from "@/lib/api/play";

// Duels types needed for shared UI components
import type { SessionPlayer, Session, LifeEvent } from "@/lib/api/sessions";
import { mapErrorMessage } from "@/lib/api/errors";

interface PlayLifeCounterProps {
    partidaId: string;
    initialSession?: LCSession | null;
}

// ── Type adapters ─────────────────────────────────────────────────────────────
// LCPlayer is structurally compatible with SessionPlayer for all fields the
// shared UI components access (seat, display_name, color, life_total, counters,
// commander_damage, is_eliminated, elimination_reason).

function asSessionPlayer(p: LCPlayer): SessionPlayer {
    return {
        id: p.id,
        seat: p.seat,
        display_name: p.display_name,
        color: p.color,
        life_total: p.life_total,
        poison_counters: p.poison_counters,
        energy_counters: p.energy_counters,
        experience_counters: p.experience_counters,
        commander_damage: p.commander_damage,
        is_eliminated: p.is_eliminated,
        elimination_reason: p.elimination_reason,
        user_id: p.user_id !== undefined ? String(p.user_id) : undefined,
    };
}

function asSession(s: LCSession): Session {
    return {
        id: s.id,
        duel_id: s.partida_id,
        game_number: s.game_number,
        format: s.is_commander ? "COMMANDER" : "STANDARD",
        starting_life: s.starting_life,
        player_count: s.players.length,
        host_mode: false,
        status: s.status,
        players: s.players.map(asSessionPlayer),
    };
}

function asLifeEvents(events: LCEvent[]): LifeEvent[] {
    return events.map((event) => ({
        id: event.id,
        target_seat: event.target_seat,
        change_amount: event.change_amount,
        new_total: event.new_total,
        event_type: event.event_type,
        source_seat: event.source_seat,
        seq: event.seq,
        created_at: event.created_at,
    }));
}

// ── WakeLock helper ───────────────────────────────────────────────────────────
function useWakeLock() {
    const lockRef = useRef<WakeLockSentinel | null>(null);

    useEffect(() => {
        let active = true;

        async function acquireLock() {
            if (!("wakeLock" in navigator)) return;
            try {
                lockRef.current = await navigator.wakeLock.request("screen");
                lockRef.current.addEventListener("release", () => {
                    if (active) acquireLock();
                });
            } catch (error: unknown) {
                console.error("No se pudo adquirir WakeLock", error);
            }
        }

        acquireLock();

        const handleVisibility = () => {
            if (document.visibilityState === "visible") acquireLock();
        };
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            active = false;
            document.removeEventListener("visibilitychange", handleVisibility);
            lockRef.current?.release().catch((error: unknown) => {
                console.error("No se pudo liberar WakeLock", error);
            });
        };
    }, []);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PlayLifeCounter({ partidaId, initialSession }: PlayLifeCounterProps) {
    useWakeLock();
    const router = useRouter();
    const { session: authSession } = useAuth();
    const token = authSession?.accessToken ?? null;

    const {
        session,
        setSession,
        updatePlayerLife,
        updateCommanderDamage: updateCDStore,
    } = usePlayLCStore();

    const [cmdOverlaySeat, setCmdOverlaySeat] = useState<number | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [ending, setEnding] = useState(false);
    const [confirmEnd, setConfirmEnd] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    // Init session
    useEffect(() => {
        if (initialSession) {
            setSession(initialSession);
        } else {
            getTrackerState(partidaId)
                .then((res) => {
                    if (res.data) setSession(res.data);
                })
                .catch((error: unknown) => {
                    toast.danger("Error", { description: mapErrorMessage(error) });
                });
        }
    }, [partidaId, initialSession, setSession]);

    useEffect(() => {
        if (!confirmEnd) return;
        const timer = setTimeout(() => setConfirmEnd(false), 4000);
        return () => clearTimeout(timer);
    }, [confirmEnd]);

    useEffect(() => {
        if (!confirmReset) return;
        const timer = setTimeout(() => setConfirmReset(false), 4000);
        return () => clearTimeout(timer);
    }, [confirmReset]);

    const refreshState = useCallback(async () => {
        try {
            const res = await getTrackerState(partidaId);
            if (res.data) setSession(res.data);
        } catch (error: unknown) {
            toast.danger("Error", { description: mapErrorMessage(error) });
        }
    }, [partidaId, setSession]);

    // ── Life change ──
    const handleLifeChange = useCallback(
        async (seat: number, change: number) => {
            updatePlayerLife(seat, change);
            try {
                const res = await updateLife(partidaId, seat, change);
                if (res.data) setSession(res.data);
            } catch {
                await refreshState();
            }
        },
        [partidaId, updatePlayerLife, setSession, refreshState]
    );

    // ── Commander damage ──
    const handleCommanderDamage = useCallback(
        async (targetSeat: number, sourceSeat: number, damage: number) => {
            updateCDStore(targetSeat, sourceSeat, damage);
            try {
                const res = await updateCommanderDamage(partidaId, targetSeat, sourceSeat, damage);
                if (res.data) setSession(res.data);
            } catch {
                await refreshState();
            }
        },
        [partidaId, updateCDStore, setSession, refreshState]
    );

    // ── Undo ──
    const handleUndo = useCallback(async () => {
        try {
            const res = await undoLast(partidaId);
            if (res.data) setSession(res.data);
            toast.success("Deshecho");
        } catch (error: unknown) {
            toast.danger("Error", { description: mapErrorMessage(error) });
        }
    }, [partidaId, setSession]);

    // ── Fetch history ──
    const fetchHistory = useCallback(
        async (seat?: number): Promise<LifeEvent[]> => {
            const res = await getTrackerHistory(partidaId, seat);
            return asLifeEvents(res.data ?? []);
        },
        [partidaId]
    );

    // ── End session ──
    const handleEnd = useCallback(async () => {
        if (!confirmEnd) {
            setConfirmEnd(true);
            toast("Presiona terminar nuevamente para confirmar.");
            return;
        }
        setEnding(true);
        try {
            await endTrackerSession(partidaId);
            toast.success("Sesión terminada");
            router.back();
        } catch (error: unknown) {
            toast.danger("Error", { description: mapErrorMessage(error) });
            setEnding(false);
        } finally {
            setConfirmEnd(false);
        }
    }, [confirmEnd, partidaId, router]);

    // ── Reset: refetch from API ──
    const handleReset = useCallback(async () => {
        if (!confirmReset) {
            setConfirmReset(true);
            toast("Presiona reset nuevamente para confirmar.");
            return;
        }
        try {
            const res = await getTrackerState(partidaId);
            if (res.data) setSession(res.data);
            toast.success("Estado recargado");
        } catch (error: unknown) {
            toast.danger("Error", { description: mapErrorMessage(error) });
        } finally {
            setConfirmReset(false);
        }
    }, [confirmReset, partidaId, setSession]);

    // ── WebSocket ──
    useTrackerSocket(partidaId, true, token, {
        onStateSync: useCallback(
            (s: LCSession) => setSession(s),
            [setSession]
        ),
        onLifeUpdated: useCallback(
            (s: LCSession) => setSession(s),
            [setSession]
        ),
        onPlayerElim: useCallback(
            ({ seat, reason }: { seat: number; reason: string }) => {
                setSession((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        players: prev.players.map((p) =>
                            p.seat === seat
                                ? { ...p, is_eliminated: true, elimination_reason: reason as LCPlayer["elimination_reason"] }
                                : p
                        ),
                    };
                });
            },
            [setSession]
        ),
        onSessionEnded: useCallback(
            (s: LCSession) => {
                setSession(s);
                toast.success("Sesión terminada");
                router.back();
            },
            [setSession, router]
        ),
    });

    // ── Render guards ──
    if (!session) {
        return (
            <div
                className="fixed inset-0 flex items-center justify-center"
                style={{ background: "var(--background)" }}
            >
                <div
                    className="w-8 h-8 rounded-full animate-spin"
                    style={{ border: "2px solid var(--border)", borderTopColor: "var(--accent)" }}
                />
            </div>
        );
    }

    const sortedPlayers = [...session.players].sort((a, b) => a.seat - b.seat);
    const playerCount = sortedPlayers.length;
    const format = session.is_commander ? "COMMANDER" : "STANDARD";

    const cmdTargetPlayer =
        cmdOverlaySeat !== null
            ? sortedPlayers.find((p) => p.seat === cmdOverlaySeat) ?? null
            : null;

    // Flipped seats: top row players are rotated 180° so they read from their side
    const isFlippedBySeat: Record<number, boolean> = {};
    if (playerCount === 2) {
        isFlippedBySeat[sortedPlayers[0]?.seat] = true;
        isFlippedBySeat[sortedPlayers[1]?.seat] = false;
    } else if (playerCount === 3) {
        isFlippedBySeat[sortedPlayers[0]?.seat] = true;
        isFlippedBySeat[sortedPlayers[1]?.seat] = false;
        isFlippedBySeat[sortedPlayers[2]?.seat] = false;
    } else {
        isFlippedBySeat[sortedPlayers[0]?.seat] = true;
        isFlippedBySeat[sortedPlayers[1]?.seat] = true;
        isFlippedBySeat[sortedPlayers[2]?.seat] = false;
        isFlippedBySeat[sortedPlayers[3]?.seat] = false;
    }

    const panelProps = (p: LCPlayer) => ({
        player: asSessionPlayer(p),
        isFlipped: isFlippedBySeat[p.seat] ?? false,
        format,
        totalPlayers: playerCount,
        onLifeChange: handleLifeChange,
        onLongPress: session.is_commander ? setCmdOverlaySeat : () => {},
    });

    const renderLayout = () => {
        const divider = (horizontal: boolean) => (
            <div
                style={{
                    [horizontal ? "height" : "width"]: 1,
                    background: "var(--border)",
                    flexShrink: 0,
                }}
            />
        );

        if (playerCount === 2) {
            return (
                <div className="flex flex-col" style={{ height: "100dvh" }}>
                    <div className="flex-1 flex" style={{ minHeight: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[0])} />
                    </div>
                    {divider(true)}
                    <div className="flex-1 flex" style={{ minHeight: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[1])} />
                    </div>
                </div>
            );
        }

        if (playerCount === 3) {
            return (
                <div className="flex flex-col" style={{ height: "100dvh" }}>
                    <div className="flex-1 flex" style={{ minHeight: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[0])} />
                    </div>
                    {divider(true)}
                    <div className="flex-1 flex" style={{ minHeight: 0 }}>
                        <div className="flex-1 flex" style={{ minWidth: 0 }}>
                            <PlayerPanel {...panelProps(sortedPlayers[1])} />
                        </div>
                        {divider(false)}
                        <div className="flex-1 flex" style={{ minWidth: 0 }}>
                            <PlayerPanel {...panelProps(sortedPlayers[2])} />
                        </div>
                    </div>
                </div>
            );
        }

        // 4 players: 2×2 grid
        return (
            <div className="flex flex-col" style={{ height: "100dvh" }}>
                <div className="flex-1 flex" style={{ minHeight: 0 }}>
                    <div className="flex-1 flex" style={{ minWidth: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[0])} />
                    </div>
                    {divider(false)}
                    <div className="flex-1 flex" style={{ minWidth: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[1])} />
                    </div>
                </div>
                {divider(true)}
                <div className="flex-1 flex" style={{ minHeight: 0 }}>
                    <div className="flex-1 flex" style={{ minWidth: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[2])} />
                    </div>
                    {divider(false)}
                    <div className="flex-1 flex" style={{ minWidth: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[3])} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div
                className="fixed inset-0 overflow-hidden"
                style={{ background: "var(--background)", touchAction: "manipulation" }}
            >
                {renderLayout()}

                {/* Floating center menu */}
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
                    <div
                        className="absolute pointer-events-auto"
                        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                    >
                        <CenterMenu
                            onHistory={() => setShowHistory(true)}
                            onReset={handleReset}
                            onSettings={() => {}}
                            onEnd={handleEnd}
                        />
                    </div>
                </div>

                {/* Ending spinner */}
                {ending && (
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                            background: "color-mix(in srgb, var(--background) 72%, transparent)",
                            zIndex: 200,
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        <div
                            className="w-10 h-10 rounded-full animate-spin"
                            style={{ border: "2px solid var(--border)", borderTopColor: "var(--accent)" }}
                        />
                    </div>
                )}
            </div>

            <CommanderDamageOverlay
                isOpen={cmdOverlaySeat !== null && session.is_commander}
                targetPlayer={cmdTargetPlayer ? asSessionPlayer(cmdTargetPlayer) : null}
                allPlayers={sortedPlayers.map(asSessionPlayer)}
                onDamage={handleCommanderDamage}
                onClose={() => setCmdOverlaySeat(null)}
            />

            <LifeHistory
                isOpen={showHistory}
                duelId={partidaId}
                gameNumber={0}
                session={asSession(session)}
                onUndo={handleUndo}
                onClose={() => setShowHistory(false)}
                fetchHistory={fetchHistory}
            />
        </>
    );
}
