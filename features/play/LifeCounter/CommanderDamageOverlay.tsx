"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { SessionPlayer } from "@/lib/api/sessions";

interface CommanderDamageOverlayProps {
    isOpen: boolean;
    targetPlayer: SessionPlayer | null;
    allPlayers: SessionPlayer[];
    onDamage: (targetSeat: number, sourceSeat: number, damage: number) => void;
    onClose: () => void;
}

export default function CommanderDamageOverlay({
    isOpen,
    targetPlayer,
    allPlayers,
    onDamage,
    onClose,
}: CommanderDamageOverlayProps) {
    if (!targetPlayer) return null;

    const opponents = allPlayers.filter((p) => p.seat !== targetPlayer.seat);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-end justify-center"
                    style={{ zIndex: 100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 26, stiffness: 300 }}
                        className="w-full rounded-t-3xl"
                        style={{
                            background: "rgba(15,15,20,0.97)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderBottom: "none",
                            maxWidth: 480,
                            padding: "24px 20px 40px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-0.5">
                                    Daño de comandante
                                </p>
                                <h3 className="text-base font-black text-white">
                                    {targetPlayer.display_name}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-white/60 hover:text-white"
                                style={{ background: "rgba(255,255,255,0.08)", border: "none", fontSize: 18 }}
                                aria-label="Cerrar"
                            >
                                ×
                            </button>
                        </div>

                        {/* Opponents list */}
                        <div className="flex flex-col gap-3">
                            {opponents.map((opponent) => {
                                const key = String(opponent.seat);
                                const accumulated = targetPlayer.commander_damage[key] ?? 0;
                                const isLethal = accumulated >= 21;

                                return (
                                    <div
                                        key={opponent.seat}
                                        className="flex items-center justify-between rounded-2xl px-4 py-3"
                                        style={{
                                            background: isLethal
                                                ? "rgba(220,38,38,0.18)"
                                                : "rgba(255,255,255,0.06)",
                                            border: isLethal
                                                ? "1px solid rgba(220,38,38,0.5)"
                                                : "1px solid rgba(255,255,255,0.08)",
                                        }}
                                    >
                                        {/* Color dot + name */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: opponent.color }}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">
                                                    {opponent.display_name}
                                                </p>
                                                {isLethal && (
                                                    <p className="text-xs font-bold text-red-400">
                                                        LETAL — {accumulated} daño
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Counter controls */}
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <button
                                                onClick={() => onDamage(targetPlayer.seat, opponent.seat, -1)}
                                                className="w-9 h-9 rounded-full font-black text-white text-xl flex items-center justify-center"
                                                style={{
                                                    background: "rgba(255,255,255,0.1)",
                                                    border: "none",
                                                    cursor: "pointer",
                                                }}
                                                aria-label={`-1 daño de ${opponent.display_name}`}
                                            >
                                                −
                                            </button>
                                            <span
                                                className="tabular-nums font-black text-center"
                                                style={{
                                                    minWidth: 32,
                                                    fontSize: "1.25rem",
                                                    color: isLethal ? "#f87171" : "white",
                                                }}
                                            >
                                                {accumulated}
                                            </span>
                                            <button
                                                onClick={() => onDamage(targetPlayer.seat, opponent.seat, 1)}
                                                className="w-9 h-9 rounded-full font-black text-white text-xl flex items-center justify-center"
                                                style={{
                                                    background: isLethal
                                                        ? "rgba(220,38,38,0.6)"
                                                        : "rgba(255,255,255,0.1)",
                                                    border: "none",
                                                    cursor: "pointer",
                                                }}
                                                aria-label={`+1 daño de ${opponent.display_name}`}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {opponents.length === 0 && (
                            <p className="text-center text-white/40 text-sm py-4">
                                No hay oponentes
                            </p>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
