"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SessionPlayer } from "@/lib/api/sessions";

interface PlayerPanelProps {
    player: SessionPlayer;
    isFlipped: boolean;
    format: string;
    totalPlayers: number;
    onLifeChange: (seat: number, change: number) => void;
    onLongPress: (seat: number) => void;
}

const LONG_PRESS_MS = 500;

function LifeDelta({ delta }: { delta: number | null }) {
    return (
        <AnimatePresence mode="popLayout">
            {delta !== null && (
                <motion.span
                    key={delta + Date.now()}
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 0, y: -40, scale: 1.3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className="absolute pointer-events-none select-none font-black"
                    style={{
                        fontSize: "clamp(1.5rem, 6vw, 3rem)",
                        color: delta > 0 ? "#4ade80" : "#f87171",
                        textShadow: delta > 0
                            ? "0 0 20px rgba(74,222,128,0.8)"
                            : "0 0 20px rgba(248,113,113,0.8)",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 20,
                        whiteSpace: "nowrap",
                    }}
                >
                    {delta > 0 ? `+${delta}` : delta}
                </motion.span>
            )}
        </AnimatePresence>
    );
}

export default function PlayerPanel({
    player,
    isFlipped,
    format,
    totalPlayers,
    onLifeChange,
    onLongPress,
}: PlayerPanelProps) {
    const [delta, setDelta] = useState<number | null>(null);
    const deltaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressRef = useRef(false);
    const accumulatedDeltaRef = useRef(0);
    const deltaFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Life font size: adapts to number of players
    const lifeFontSize =
        totalPlayers === 4
            ? "clamp(3.5rem, 18vw, 7rem)"
            : totalPlayers === 3
            ? "clamp(4rem, 20vw, 9rem)"
            : "clamp(5rem, 25vw, 12rem)";

    const showDelta = useCallback((change: number) => {
        accumulatedDeltaRef.current += change;

        if (deltaFlushTimerRef.current) clearTimeout(deltaFlushTimerRef.current);
        deltaFlushTimerRef.current = setTimeout(() => {
            setDelta(accumulatedDeltaRef.current);
            accumulatedDeltaRef.current = 0;

            if (deltaTimerRef.current) clearTimeout(deltaTimerRef.current);
            deltaTimerRef.current = setTimeout(() => setDelta(null), 1200);
        }, 150);
    }, []);

    const handleChange = useCallback(
        (change: number) => {
            onLifeChange(player.seat, change);
            showDelta(change);
        },
        [player.seat, onLifeChange, showDelta]
    );

    // Touch / click zones: upper half = +1, lower half = -1
    const handleZonePress = useCallback(
        (e: React.MouseEvent | React.TouchEvent, zone: "top" | "bottom") => {
            if (isLongPressRef.current) return;
            e.stopPropagation();
            handleChange(zone === "top" ? 1 : -1);
            try {
                if (navigator.vibrate) navigator.vibrate(30);
            } catch {}
        },
        [handleChange]
    );

    const startLongPress = useCallback(
        (seat: number) => {
            isLongPressRef.current = false;
            longPressTimerRef.current = setTimeout(() => {
                isLongPressRef.current = true;
                try {
                    if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
                } catch {}
                onLongPress(seat);
            }, LONG_PRESS_MS);
        },
        [onLongPress]
    );

    const cancelLongPress = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        // Give a tick before resetting so click handler can check it
        setTimeout(() => {
            isLongPressRef.current = false;
        }, 50);
    }, []);

    useEffect(() => {
        return () => {
            if (deltaTimerRef.current) clearTimeout(deltaTimerRef.current);
            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
            if (deltaFlushTimerRef.current) clearTimeout(deltaFlushTimerRef.current);
        };
    }, []);

    const isCommander = format === "COMMANDER";

    return (
        <div
            className="relative flex-1 overflow-hidden select-none"
            style={{
                backgroundColor: player.color,
                transform: isFlipped ? "rotate(180deg)" : undefined,
                minHeight: 0,
            }}
            onTouchStart={() => startLongPress(player.seat)}
            onTouchEnd={cancelLongPress}
            onTouchCancel={cancelLongPress}
            onMouseDown={() => startLongPress(player.seat)}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
        >
            {/* Upper tap zone — plus */}
            <button
                className="absolute inset-x-0 top-0 flex items-center justify-center"
                style={{ height: "50%", background: "transparent", border: "none", cursor: "pointer" }}
                onClick={(e) => handleZonePress(e, "top")}
                onTouchEnd={(e) => handleZonePress(e, "top")}
                aria-label={`+1 vida para ${player.display_name}`}
            >
                <span
                    className="pointer-events-none font-black leading-none"
                    style={{
                        fontSize: "clamp(1.5rem, 6vw, 3rem)",
                        color: "rgba(255,255,255,0.35)",
                        userSelect: "none",
                    }}
                >
                    +
                </span>
            </button>

            {/* Lower tap zone — minus */}
            <button
                className="absolute inset-x-0 bottom-0 flex items-center justify-center"
                style={{ height: "50%", background: "transparent", border: "none", cursor: "pointer" }}
                onClick={(e) => handleZonePress(e, "bottom")}
                onTouchEnd={(e) => handleZonePress(e, "bottom")}
                aria-label={`-1 vida para ${player.display_name}`}
            >
                <span
                    className="pointer-events-none font-black leading-none"
                    style={{
                        fontSize: "clamp(1.5rem, 6vw, 3rem)",
                        color: "rgba(255,255,255,0.35)",
                        userSelect: "none",
                    }}
                >
                    −
                </span>
            </button>

            {/* Divider line between zones */}
            <div
                className="absolute inset-x-0 pointer-events-none"
                style={{
                    top: "50%",
                    height: 1,
                    background: "rgba(255,255,255,0.15)",
                }}
            />

            {/* Center: life total + delta */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                style={{ zIndex: 10 }}
            >
                <LifeDelta delta={delta} />
                <span
                    className="font-black leading-none tabular-nums"
                    style={{
                        fontSize: lifeFontSize,
                        color: "white",
                        textShadow: "0 2px 20px rgba(0,0,0,0.4)",
                        userSelect: "none",
                    }}
                >
                    {player.life_total}
                </span>
                <span
                    className="font-semibold mt-1 truncate max-w-[80%] text-center"
                    style={{
                        fontSize: "clamp(0.6rem, 2.5vw, 1rem)",
                        color: "rgba(255,255,255,0.75)",
                        userSelect: "none",
                    }}
                >
                    {player.display_name}
                </span>
            </div>

            {/* Counters badges — bottom corners (opposite to rotation) */}
            <div
                className="absolute bottom-2 left-2 flex gap-1 pointer-events-none"
                style={{ zIndex: 15 }}
            >
                {player.poison_counters > 0 && (
                    <span
                        className="flex items-center gap-[3px] rounded-full px-2 py-0.5 font-bold"
                        style={{
                            fontSize: "clamp(0.55rem, 2vw, 0.75rem)",
                            background: "rgba(0,0,0,0.55)",
                            color: "#a3e635",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        ☠ {player.poison_counters}
                    </span>
                )}
                {player.energy_counters > 0 && (
                    <span
                        className="flex items-center gap-[3px] rounded-full px-2 py-0.5 font-bold"
                        style={{
                            fontSize: "clamp(0.55rem, 2vw, 0.75rem)",
                            background: "rgba(0,0,0,0.55)",
                            color: "#fde68a",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        ⚡ {player.energy_counters}
                    </span>
                )}
                {player.experience_counters > 0 && (
                    <span
                        className="flex items-center gap-[3px] rounded-full px-2 py-0.5 font-bold"
                        style={{
                            fontSize: "clamp(0.55rem, 2vw, 0.75rem)",
                            background: "rgba(0,0,0,0.55)",
                            color: "#c4b5fd",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        ✦ {player.experience_counters}
                    </span>
                )}
            </div>

            {/* Commander damage indicators */}
            {isCommander && Object.keys(player.commander_damage).length > 0 && (
                <div
                    className="absolute bottom-2 right-2 flex flex-col gap-0.5 pointer-events-none items-end"
                    style={{ zIndex: 15 }}
                >
                    {Object.entries(player.commander_damage)
                        .filter(([, dmg]) => dmg > 0)
                        .map(([sourceSeat, dmg]) => (
                            <span
                                key={sourceSeat}
                                className="flex items-center gap-[3px] rounded-full px-2 py-0.5 font-bold"
                                style={{
                                    fontSize: "clamp(0.55rem, 2vw, 0.75rem)",
                                    background: dmg >= 21 ? "rgba(220,38,38,0.85)" : "rgba(0,0,0,0.55)",
                                    color: dmg >= 21 ? "#fff" : "#fca5a5",
                                    backdropFilter: "blur(4px)",
                                }}
                            >
                                ⚔ {dmg}
                                {dmg >= 21 && " !"}
                            </span>
                        ))}
                </div>
            )}

            {/* Eliminated overlay */}
            <AnimatePresence>
                {player.is_eliminated && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{
                            background: "rgba(0,0,0,0.72)",
                            backdropFilter: "blur(4px)",
                            zIndex: 30,
                        }}
                    >
                        <span style={{ fontSize: "clamp(2rem, 10vw, 5rem)" }}>💀</span>
                        <span
                            className="font-black uppercase tracking-widest mt-1"
                            style={{
                                fontSize: "clamp(0.65rem, 3vw, 1.1rem)",
                                color: "rgba(255,255,255,0.7)",
                                userSelect: "none",
                            }}
                        >
                            {player.elimination_reason === "commander"
                                ? "Daño de comandante"
                                : player.elimination_reason === "poison"
                                ? "Veneno"
                                : player.elimination_reason === "concede"
                                ? "Se rindió"
                                : "Eliminado"}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
