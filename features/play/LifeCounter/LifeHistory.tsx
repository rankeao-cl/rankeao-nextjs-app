"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LifeEvent } from "@/lib/api/sessions";
import type { Session } from "@/lib/api/sessions";

interface LifeHistoryProps {
    isOpen: boolean;
    duelId: string;
    gameNumber: number;
    session: Session;
    onUndo: () => void;
    onClose: () => void;
    fetchHistory: (seat?: number) => Promise<LifeEvent[]>;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
    life: "Vida",
    commander_damage: "Daño comandante",
    poison: "Veneno",
    energy: "Energía",
    experience: "Experiencia",
    concede: "Rendición",
    reset: "Reset",
};

export default function LifeHistory({
    isOpen,
    session,
    onUndo,
    onClose,
    fetchHistory,
}: LifeHistoryProps) {
    const [events, setEvents] = useState<LifeEvent[]>([]);
    const [selectedSeat, setSelectedSeat] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        fetchHistory(selectedSeat)
            .then(setEvents)
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, [isOpen, selectedSeat, fetchHistory]);

    const seatName = (seat: number) => {
        const p = session.players.find((p) => p.seat === seat);
        return p?.display_name ?? `Asiento ${seat}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-end justify-center"
                    style={{ zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 26, stiffness: 300 }}
                        className="w-full rounded-t-3xl flex flex-col"
                        style={{
                            background: "rgba(12,12,18,0.98)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderBottom: "none",
                            maxWidth: 540,
                            maxHeight: "80dvh",
                            padding: "20px 0 0",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 mb-4">
                            <h3 className="text-base font-black text-white">Historial</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onUndo}
                                    className="text-xs font-bold rounded-full px-3 py-1.5"
                                    style={{
                                        background: "rgba(239,68,68,0.15)",
                                        color: "#f87171",
                                        border: "1px solid rgba(239,68,68,0.3)",
                                        cursor: "pointer",
                                    }}
                                    aria-label="Deshacer última acción"
                                >
                                    Deshacer
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white/60 hover:text-white text-xl"
                                    style={{ background: "rgba(255,255,255,0.08)", border: "none" }}
                                    aria-label="Cerrar historial"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Seat filter */}
                        <div className="flex gap-2 px-5 mb-4 overflow-x-auto pb-1">
                            <button
                                onClick={() => setSelectedSeat(undefined)}
                                className="flex-shrink-0 text-xs font-bold rounded-full px-3 py-1.5"
                                style={{
                                    background: selectedSeat === undefined
                                        ? "rgba(99,102,241,0.3)"
                                        : "rgba(255,255,255,0.06)",
                                    color: selectedSeat === undefined ? "#a5b4fc" : "rgba(255,255,255,0.5)",
                                    border: `1px solid ${selectedSeat === undefined ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
                                    cursor: "pointer",
                                }}
                            >
                                Todos
                            </button>
                            {session.players.map((p) => (
                                <button
                                    key={p.seat}
                                    onClick={() => setSelectedSeat(p.seat)}
                                    className="flex-shrink-0 text-xs font-bold rounded-full px-3 py-1.5"
                                    style={{
                                        background: selectedSeat === p.seat
                                            ? `${p.color}40`
                                            : "rgba(255,255,255,0.06)",
                                        color: selectedSeat === p.seat ? "white" : "rgba(255,255,255,0.5)",
                                        border: `1px solid ${selectedSeat === p.seat ? p.color : "rgba(255,255,255,0.08)"}`,
                                        cursor: "pointer",
                                    }}
                                >
                                    {p.display_name}
                                </button>
                            ))}
                        </div>

                        {/* Events list */}
                        <div className="flex-1 overflow-y-auto px-5 pb-8">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                                </div>
                            ) : events.length === 0 ? (
                                <p className="text-center text-white/30 text-sm py-8">
                                    Sin eventos aún
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {[...events].reverse().map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex items-center justify-between rounded-xl px-3 py-2.5"
                                            style={{ background: "rgba(255,255,255,0.04)" }}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span
                                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                                    style={{
                                                        backgroundColor:
                                                            session.players.find(
                                                                (p) => p.seat === event.target_seat
                                                            )?.color ?? "#888",
                                                    }}
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-white/80 truncate">
                                                        {seatName(event.target_seat)}
                                                        {event.source_seat !== undefined &&
                                                            event.event_type === "commander_damage" && (
                                                                <span className="text-white/40">
                                                                    {" "}← {seatName(event.source_seat)}
                                                                </span>
                                                            )}
                                                    </p>
                                                    <p className="text-[10px] text-white/40">
                                                        {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span
                                                    className="text-sm font-black"
                                                    style={{
                                                        color:
                                                            event.change_amount > 0
                                                                ? "#4ade80"
                                                                : event.change_amount < 0
                                                                ? "#f87171"
                                                                : "rgba(255,255,255,0.5)",
                                                    }}
                                                >
                                                    {event.change_amount > 0 ? "+" : ""}
                                                    {event.change_amount}
                                                </span>
                                                <span className="text-xs font-bold text-white/60 tabular-nums">
                                                    → {event.new_total}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
