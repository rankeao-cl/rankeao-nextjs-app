"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createSession } from "@/lib/api/sessions";
import type { SessionFormat, CreateSessionRequest } from "@/lib/api/sessions";

interface LifeCounterSetupProps {
    linkedDuelId: string | null;
    onSessionCreated: (sessionId: string) => void;
}

const FORMAT_OPTIONS: Array<{
    value: SessionFormat;
    label: string;
    life: number;
    description: string;
}> = [
    { value: "COMMANDER", label: "Commander", life: 40, description: "40 vida, 4 jugadores" },
    { value: "STANDARD", label: "Standard", life: 20, description: "20 vida" },
    { value: "MODERN", label: "Modern", life: 20, description: "20 vida" },
    { value: "PIONEER", label: "Pioneer", life: 20, description: "20 vida" },
    { value: "LEGACY", label: "Legacy", life: 20, description: "20 vida" },
    { value: "DRAFT", label: "Draft", life: 20, description: "20 vida, limitado" },
    { value: "CUSTOM", label: "Custom", life: 20, description: "Configura a tu gusto" },
];

const PLAYER_COLORS = [
    { label: "Azul", value: "#3b82f6" },
    { label: "Rojo", value: "#ef4444" },
    { label: "Verde", value: "#22c55e" },
    { label: "Violeta", value: "#8b5cf6" },
    { label: "Naranja", value: "#f97316" },
    { label: "Rosa", value: "#ec4899" },
    { label: "Cian", value: "#06b6d4" },
    { label: "Ámbar", value: "#f59e0b" },
];

const DEFAULT_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#8b5cf6"];
const DEFAULT_NAMES = ["Jugador 1", "Jugador 2", "Jugador 3", "Jugador 4"];

interface PlayerConfig {
    display_name: string;
    color: string;
}

export default function LifeCounterSetup({
    linkedDuelId,
    onSessionCreated,
}: LifeCounterSetupProps) {
    const [format, setFormat] = useState<SessionFormat>("COMMANDER");
    const [playerCount, setPlayerCount] = useState(2);
    const [startingLife, setStartingLife] = useState(40);
    const [customLife, setCustomLife] = useState(false);
    const [players, setPlayers] = useState<PlayerConfig[]>(
        Array.from({ length: 4 }, (_, i) => ({
            display_name: DEFAULT_NAMES[i],
            color: DEFAULT_COLORS[i],
        }))
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFormatChange = (f: SessionFormat) => {
        setFormat(f);
        const found = FORMAT_OPTIONS.find((o) => o.value === f);
        if (found && !customLife) {
            setStartingLife(found.life);
        }
        if (f === "COMMANDER") setPlayerCount((c) => Math.max(c, 2));
    };

    const updatePlayer = (index: number, field: keyof PlayerConfig, value: string) => {
        setPlayers((prev) =>
            prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
        );
    };

    const handleStart = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload: CreateSessionRequest = {
                format,
                starting_life: startingLife,
                player_count: playerCount,
                host_mode: !linkedDuelId,
                players: players.slice(0, playerCount).map((p, i) => ({
                    seat: i + 1,
                    display_name: p.display_name.trim() || DEFAULT_NAMES[i],
                    color: p.color,
                })),
            };
            const session = await createSession(linkedDuelId ?? "standalone", payload);
            onSessionCreated(session.id);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error al crear sesión";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-dvh flex flex-col items-center justify-start"
            style={{ background: "#080810", overflowY: "auto" }}
        >
            <div className="w-full max-w-md px-5 py-8 flex flex-col gap-6">
                {/* Title */}
                <div className="text-center mb-2">
                    <h1 className="text-2xl font-black text-white">Life Counter</h1>
                    <p className="text-sm text-white/40 mt-1">Magic: The Gathering</p>
                </div>

                {/* Format selector */}
                <section>
                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                        Formato
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {FORMAT_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => handleFormatChange(opt.value)}
                                className="rounded-2xl px-4 py-3 text-left"
                                style={{
                                    background:
                                        format === opt.value
                                            ? "rgba(99,102,241,0.25)"
                                            : "rgba(255,255,255,0.05)",
                                    border: `1.5px solid ${format === opt.value ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.08)"}`,
                                    cursor: "pointer",
                                }}
                            >
                                <p
                                    className="font-black text-sm"
                                    style={{
                                        color: format === opt.value ? "#a5b4fc" : "white",
                                    }}
                                >
                                    {opt.label}
                                </p>
                                <p className="text-[11px] text-white/40 mt-0.5">
                                    {opt.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Player count */}
                <section>
                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                        Jugadores
                    </p>
                    <div className="flex gap-2">
                        {[2, 3, 4].map((n) => (
                            <button
                                key={n}
                                onClick={() => setPlayerCount(n)}
                                className="flex-1 rounded-2xl py-3 font-black text-lg"
                                style={{
                                    background:
                                        playerCount === n
                                            ? "rgba(99,102,241,0.25)"
                                            : "rgba(255,255,255,0.05)",
                                    border: `1.5px solid ${playerCount === n ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.08)"}`,
                                    color: playerCount === n ? "#a5b4fc" : "rgba(255,255,255,0.6)",
                                    cursor: "pointer",
                                }}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Starting life */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-white/50 uppercase tracking-widest">
                            Vida inicial
                        </p>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs text-white/40">Custom</span>
                            <button
                                role="switch"
                                aria-checked={customLife}
                                onClick={() => setCustomLife((v) => !v)}
                                className="relative w-9 h-5 rounded-full transition-colors"
                                style={{
                                    background: customLife
                                        ? "rgba(99,102,241,0.8)"
                                        : "rgba(255,255,255,0.15)",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                }}
                            >
                                <span
                                    className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                                    style={{ transform: customLife ? "translateX(16px)" : "translateX(0)" }}
                                />
                            </button>
                        </label>
                    </div>
                    {customLife ? (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setStartingLife((v) => Math.max(1, v - 5))}
                                className="w-12 h-12 rounded-full font-black text-2xl text-white"
                                style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer" }}
                            >
                                −
                            </button>
                            <input
                                type="number"
                                value={startingLife}
                                onChange={(e) =>
                                    setStartingLife(Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="flex-1 text-center font-black text-3xl text-white bg-transparent rounded-xl py-2"
                                style={{
                                    border: "1.5px solid rgba(255,255,255,0.12)",
                                    outline: "none",
                                }}
                                min={1}
                                max={999}
                            />
                            <button
                                onClick={() => setStartingLife((v) => Math.min(999, v + 5))}
                                className="w-12 h-12 rounded-full font-black text-2xl text-white"
                                style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer" }}
                            >
                                +
                            </button>
                        </div>
                    ) : (
                        <div
                            className="text-center py-3 rounded-2xl font-black text-3xl text-white"
                            style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                            {startingLife}
                        </div>
                    )}
                </section>

                {/* Player configs */}
                <section>
                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                        Jugadores
                    </p>
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: playerCount }, (_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-2xl p-4"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className="w-5 h-5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: players[i].color }}
                                    />
                                    <p className="text-xs font-bold text-white/60">Jugador {i + 1}</p>
                                </div>

                                {/* Name */}
                                <input
                                    type="text"
                                    value={players[i].display_name}
                                    onChange={(e) => updatePlayer(i, "display_name", e.target.value)}
                                    placeholder={DEFAULT_NAMES[i]}
                                    className="w-full mb-3 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-transparent"
                                    style={{
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        outline: "none",
                                        background: "rgba(0,0,0,0.3)",
                                    }}
                                    maxLength={20}
                                />

                                {/* Color picker */}
                                <div className="flex flex-wrap gap-2">
                                    {PLAYER_COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            onClick={() => updatePlayer(i, "color", c.value)}
                                            className="w-7 h-7 rounded-full flex-shrink-0"
                                            style={{
                                                backgroundColor: c.value,
                                                border: `2px solid ${players[i].color === c.value ? "white" : "transparent"}`,
                                                cursor: "pointer",
                                                boxShadow:
                                                    players[i].color === c.value
                                                        ? "0 0 0 2px rgba(255,255,255,0.4)"
                                                        : "none",
                                            }}
                                            aria-label={`Color ${c.label}`}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Error */}
                {error && (
                    <p className="text-sm text-red-400 text-center rounded-xl py-2 px-4"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        {error}
                    </p>
                )}

                {/* Start button */}
                <motion.button
                    onClick={handleStart}
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-2xl font-black text-lg text-white"
                    style={{
                        background: loading
                            ? "rgba(99,102,241,0.4)"
                            : "rgba(99,102,241,0.9)",
                        border: "none",
                        cursor: loading ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 24px rgba(99,102,241,0.4)",
                    }}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creando sesión...
                        </span>
                    ) : (
                        "Empezar partida"
                    )}
                </motion.button>

                <div className="h-8" />
            </div>
        </div>
    );
}
