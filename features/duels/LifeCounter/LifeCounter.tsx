"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react/toast";

import { useLifeCounterStore } from "./use-life-counter";
import PlayerPanel from "./PlayerPanel";
import CommanderDamageOverlay from "./CommanderDamageOverlay";
import LifeHistory from "./LifeHistory";
import CenterMenu from "./CenterMenu";

import { useSessionSocket } from "@/lib/hooks/use-session-socket";
import { useAuth } from "@/lib/hooks/use-auth";
import {
    getSession,
    updateLife,
    updateCommanderDamage,
    updateCounter,
    undoLast,
    endSession,
    getHistory,
} from "@/lib/api/sessions";
import type { Session, SessionPlayer, LifeEvent } from "@/lib/api/sessions";

interface LifeCounterProps {
    duelId: string;
    gameNumber: number;
    initialSession?: Session | null;
}

// ── WakeLock helper ──
function useWakeLock() {
    const lockRef = useRef<WakeLockSentinel | null>(null);

    useEffect(() => {
        let active = true;

        async function acquireLock() {
            if (!("wakeLock" in navigator)) return;
            try {
                lockRef.current = await navigator.wakeLock.request("screen");
                lockRef.current.addEventListener("release", () => {
                    if (active) acquireLock(); // reacquire on release (visibility change)
                });
            } catch {
                // silenciar — no todos los navegadores soportan WakeLock
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
            lockRef.current?.release().catch(() => {});
        };
    }, []);
}

// ── Layout helpers ──

function get2PLayout(players: SessionPlayer[], isFlippedMap: Record<number, boolean>) {
    // 2 players: top (flipped) / bottom (normal)
    const [p1, p2] = players;
    return (
        <div className="flex flex-col" style={{ height: "100dvh" }}>
            <PlayerPanel
                key={p1.seat}
                player={p1}
                isFlipped={isFlippedMap[p1.seat] ?? true}
                format=""
                totalPlayers={2}
                onLifeChange={() => {}}
                onLongPress={() => {}}
            />
            <div style={{ height: 1, background: "rgba(0,0,0,0.5)", flexShrink: 0 }} />
            <PlayerPanel
                key={p2.seat}
                player={p2}
                isFlipped={isFlippedMap[p2.seat] ?? false}
                format=""
                totalPlayers={2}
                onLifeChange={() => {}}
                onLongPress={() => {}}
            />
        </div>
    );
}

// ── Main Component ──

export default function LifeCounter({ duelId, gameNumber, initialSession }: LifeCounterProps) {
    useWakeLock();
    const router = useRouter();
    const { session: authSession } = useAuth();
    const token = authSession?.accessToken ?? null;

    const { session, setSession, updatePlayerLife, updateCommanderDamage: updateCDStore, updateCounter: updateCounterStore } =
        useLifeCounterStore();

    // ── Commander damage overlay state ──
    const [cmdOverlaySeat, setCmdOverlaySeat] = useState<number | null>(null);
    // ── History overlay state ──
    const [showHistory, setShowHistory] = useState(false);
    // ── End game confirm state ──
    const [ending, setEnding] = useState(false);

    // Init session
    useEffect(() => {
        if (initialSession) {
            setSession(initialSession);
        } else {
            getSession(duelId, gameNumber)
                .then(setSession)
                .catch(() => toast.danger("Error", { description: "No se pudo cargar la sesión" }));
        }
    }, [duelId, gameNumber, initialSession, setSession]);

    // ── Optimistic life change ──
    const handleLifeChange = useCallback(
        async (seat: number, change: number) => {
            // 1. Optimistic update
            updatePlayerLife(seat, change);
            // 2. Sync with API in background
            try {
                const updated = await updateLife(duelId, gameNumber, seat, change);
                setSession(updated);
            } catch {
                // Revert: refetch
                try {
                    const fresh = await getSession(duelId, gameNumber);
                    setSession(fresh);
                } catch {}
            }
        },
        [duelId, gameNumber, updatePlayerLife, setSession]
    );

    // ── Commander damage ──
    const handleCommanderDamage = useCallback(
        async (targetSeat: number, sourceSeat: number, damage: number) => {
            updateCDStore(targetSeat, sourceSeat, damage);
            try {
                const updated = await updateCommanderDamage(duelId, gameNumber, targetSeat, sourceSeat, damage);
                setSession(updated);
            } catch {
                try {
                    const fresh = await getSession(duelId, gameNumber);
                    setSession(fresh);
                } catch {}
            }
        },
        [duelId, gameNumber, updateCDStore, setSession]
    );

    // ── Counter update ──
    const handleCounterUpdate = useCallback(
        async (seat: number, type: "poison" | "energy" | "experience", change: number) => {
            updateCounterStore(seat, type, change);
            try {
                const updated = await updateCounter(duelId, gameNumber, seat, type, change);
                setSession(updated);
            } catch {
                try {
                    const fresh = await getSession(duelId, gameNumber);
                    setSession(fresh);
                } catch {}
            }
        },
        [duelId, gameNumber, updateCounterStore, setSession]
    );

    // ── Undo ──
    const handleUndo = useCallback(async () => {
        try {
            const updated = await undoLast(duelId, gameNumber);
            setSession(updated);
            toast.success("Deshecho");
        } catch {
            toast.danger("Error", { description: "No se pudo deshacer" });
        }
    }, [duelId, gameNumber, setSession]);

    // ── Fetch history ──
    const fetchHistory = useCallback(
        async (seat?: number): Promise<LifeEvent[]> => {
            return getHistory(duelId, gameNumber, seat);
        },
        [duelId, gameNumber]
    );

    // ── End session ──
    const handleEnd = useCallback(async () => {
        if (!confirm("¿Terminar la partida?")) return;
        setEnding(true);
        try {
            await endSession(duelId, gameNumber);
            toast.success("Partida terminada");
            router.back();
        } catch {
            toast.danger("Error", { description: "No se pudo terminar la sesión" });
            setEnding(false);
        }
    }, [duelId, gameNumber, router]);

    // ── Reset: refetch session ──
    const handleReset = useCallback(async () => {
        if (!confirm("¿Reiniciar todos los puntos de vida?")) return;
        try {
            const fresh = await getSession(duelId, gameNumber);
            setSession(fresh);
            toast.success("Reiniciado");
        } catch {
            toast.danger("Error", { description: "No se pudo reiniciar" });
        }
    }, [duelId, gameNumber, setSession]);

    // ── WebSocket ──
    useSessionSocket(duelId, gameNumber, token, {
        onLifeUpdated: useCallback(
            ({ player }: { player: SessionPlayer }) => {
                setSession((prev: Session | null) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        players: prev.players.map((p) => (p.seat === player.seat ? player : p)),
                    };
                });
            },
            [setSession]
        ),
        onPlayerEliminated: useCallback(
            ({ player }: { player: SessionPlayer }) => {
                setSession((prev: Session | null) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        players: prev.players.map((p) => (p.seat === player.seat ? player : p)),
                    };
                });
            },
            [setSession]
        ),
        onSessionReset: useCallback(
            ({ session: s }: { session: Session }) => {
                setSession(s);
            },
            [setSession]
        ),
        onSessionEnded: useCallback(() => {
            toast.success("Partida terminada");
            router.back();
        }, [router]),
        onStateSync: useCallback(
            ({ session: s }: { session: Session }) => {
                setSession(s);
            },
            [setSession]
        ),
    });

    // ── Render guards ──
    if (!session) {
        return (
            <div
                className="fixed inset-0 flex items-center justify-center"
                style={{ background: "#080810" }}
            >
                <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
            </div>
        );
    }

    const { players, format, player_count: playerCount } = session;

    // Sorted by seat
    const sortedPlayers = [...players].sort((a, b) => a.seat - b.seat);

    const cmdTargetPlayer =
        cmdOverlaySeat !== null
            ? sortedPlayers.find((p) => p.seat === cmdOverlaySeat) ?? null
            : null;

    // ── Layout: determine flipped seats ──
    // Top row players are flipped (rotated 180°) so they read from their side
    const isFlippedBySeat: Record<number, boolean> = {};
    if (playerCount === 2) {
        isFlippedBySeat[sortedPlayers[0]?.seat] = true;
        isFlippedBySeat[sortedPlayers[1]?.seat] = false;
    } else if (playerCount === 3) {
        isFlippedBySeat[sortedPlayers[0]?.seat] = true;  // top full
        isFlippedBySeat[sortedPlayers[1]?.seat] = false; // bottom left
        isFlippedBySeat[sortedPlayers[2]?.seat] = false; // bottom right
    } else {
        // 4 players: top row flipped
        isFlippedBySeat[sortedPlayers[0]?.seat] = true;
        isFlippedBySeat[sortedPlayers[1]?.seat] = true;
        isFlippedBySeat[sortedPlayers[2]?.seat] = false;
        isFlippedBySeat[sortedPlayers[3]?.seat] = false;
    }

    // ── Grid layout ──
    const renderLayout = () => {
        const panelProps = (p: SessionPlayer) => ({
            player: p,
            isFlipped: isFlippedBySeat[p.seat] ?? false,
            format,
            totalPlayers: playerCount,
            onLifeChange: handleLifeChange,
            onLongPress: format === "COMMANDER" ? setCmdOverlaySeat : () => {},
        });

        if (playerCount === 2) {
            return (
                <div className="flex flex-col" style={{ height: "100dvh" }}>
                    <div className="flex-1 flex" style={{ minHeight: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[0])} />
                    </div>
                    <div style={{ height: 1, background: "rgba(0,0,0,0.6)", flexShrink: 0 }} />
                    <div className="flex-1 flex" style={{ minHeight: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[1])} />
                    </div>
                </div>
            );
        }

        if (playerCount === 3) {
            return (
                <div className="flex flex-col" style={{ height: "100dvh" }}>
                    {/* Top: player 1 full width, flipped */}
                    <div className="flex-1 flex" style={{ minHeight: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[0])} />
                    </div>
                    <div style={{ height: 1, background: "rgba(0,0,0,0.6)", flexShrink: 0 }} />
                    {/* Bottom: players 2 and 3 side by side */}
                    <div className="flex-1 flex" style={{ minHeight: 0 }}>
                        <div className="flex-1 flex" style={{ minWidth: 0 }}>
                            <PlayerPanel {...panelProps(sortedPlayers[1])} />
                        </div>
                        <div style={{ width: 1, background: "rgba(0,0,0,0.6)", flexShrink: 0 }} />
                        <div className="flex-1 flex" style={{ minWidth: 0 }}>
                            <PlayerPanel {...panelProps(sortedPlayers[2])} />
                        </div>
                    </div>
                </div>
            );
        }

        // 4 players: 2x2 grid
        return (
            <div className="flex flex-col" style={{ height: "100dvh" }}>
                {/* Top row: players 1 and 2, flipped */}
                <div className="flex-1 flex" style={{ minHeight: 0 }}>
                    <div className="flex-1 flex" style={{ minWidth: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[0])} />
                    </div>
                    <div style={{ width: 1, background: "rgba(0,0,0,0.6)", flexShrink: 0 }} />
                    <div className="flex-1 flex" style={{ minWidth: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[1])} />
                    </div>
                </div>
                <div style={{ height: 1, background: "rgba(0,0,0,0.6)", flexShrink: 0 }} />
                {/* Bottom row: players 3 and 4, normal */}
                <div className="flex-1 flex" style={{ minHeight: 0 }}>
                    <div className="flex-1 flex" style={{ minWidth: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[2])} />
                    </div>
                    <div style={{ width: 1, background: "rgba(0,0,0,0.6)", flexShrink: 0 }} />
                    <div className="flex-1 flex" style={{ minWidth: 0 }}>
                        <PlayerPanel {...panelProps(sortedPlayers[3])} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Main layout */}
            <div
                className="fixed inset-0 overflow-hidden"
                style={{ background: "#000", touchAction: "manipulation" }}
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
                        style={{ background: "rgba(0,0,0,0.7)", zIndex: 200, backdropFilter: "blur(4px)" }}
                    >
                        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Commander damage overlay */}
            <CommanderDamageOverlay
                isOpen={cmdOverlaySeat !== null && format === "COMMANDER"}
                targetPlayer={cmdTargetPlayer}
                allPlayers={sortedPlayers}
                onDamage={handleCommanderDamage}
                onClose={() => setCmdOverlaySeat(null)}
            />

            {/* Life history bottom sheet */}
            <LifeHistory
                isOpen={showHistory}
                duelId={duelId}
                gameNumber={gameNumber}
                session={session}
                onUndo={handleUndo}
                onClose={() => setShowHistory(false)}
                fetchHistory={fetchHistory}
            />
        </>
    );
}
