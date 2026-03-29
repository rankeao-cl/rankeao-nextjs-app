"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Flame } from "@gravity-ui/icons";
import type { GameMode, GameRules } from "@/lib/types/game";

interface PlayerLifePanelProps {
    playerID: number;
    username: string;
    avatarUrl?: string;
    lifeTotal: number;
    counters: Record<string, number>;
    isMe: boolean;
    mode: GameMode;
    rules: GameRules;
    onDeltaLife?: (delta: number) => void;
}

export default function PlayerLifePanel({
    username,
    avatarUrl,
    lifeTotal,
    counters,
    isMe,
    mode,
    rules,
    onDeltaLife,
}: PlayerLifePanelProps) {
    const isLow = lifeTotal <= 5;
    const canControl = isMe && mode === "simple" && !!onDeltaLife;
    const poisonCount = counters?.poison ?? 0;
    const showPoison = rules.supports_poison && poisonCount > 0;

    // Delta display
    const [lastDelta, setLastDelta] = useState<number | null>(null);
    const deltaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const prevLife = useRef(lifeTotal);

    if (lifeTotal !== prevLife.current) {
        const diff = lifeTotal - prevLife.current;
        prevLife.current = lifeTotal;
        setLastDelta(diff);
        clearTimeout(deltaTimer.current);
        deltaTimer.current = setTimeout(() => setLastDelta(null), 1200);
    }

    const fire = (delta: number) => {
        if (!canControl) return;
        onDeltaLife!(delta);
    };

    const lifeColor = isLow ? "var(--danger)" : isMe ? "var(--accent)" : "var(--foreground)";

    return (
        <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            userSelect: "none",
            WebkitUserSelect: "none",
        }}>
            <style>{`
                @keyframes deltaFade {
                    0% { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(-24px) scale(0.8); }
                }
                .life-btn { touch-action: manipulation; -webkit-tap-highlight-color: transparent; transition: opacity 0.1s; }
                .life-btn:active { opacity: 0.6; }
            `}</style>

            {/* Username + avatar header */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "12px 8px 8px",
            }}>
                <div style={{
                    width: 24, height: 24, borderRadius: 12,
                    overflow: "hidden", flexShrink: 0,
                    backgroundColor: "var(--surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    {avatarUrl ? (
                        <Image src={avatarUrl} alt="" width={24} height={24} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)" }}>{(username || "?")[0].toUpperCase()}</span>
                    )}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {username}
                </span>
                {isMe && (
                    <span style={{ fontSize: 8, fontWeight: 800, color: "var(--accent)", backgroundColor: "rgba(59,130,246,0.12)", padding: "1px 6px", borderRadius: 999 }}>TÚ</span>
                )}
            </div>

            {canControl ? (
                <>
                    {/* ── +1 / +5 row ── */}
                    <div style={{ display: "flex", gap: 4, padding: "0 8px", flex: 1 }}>
                        <button className="life-btn" onClick={() => fire(1)} style={{
                            flex: 1,
                            border: "none",
                            borderRadius: 14,
                            backgroundColor: "rgba(34,197,94,0.10)",
                            color: "var(--success)",
                            fontSize: 28,
                            fontWeight: 900,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            +1
                        </button>
                        <button className="life-btn" onClick={() => fire(5)} style={{
                            flex: 1,
                            border: "none",
                            borderRadius: 14,
                            backgroundColor: "rgba(34,197,94,0.10)",
                            color: "var(--success)",
                            fontSize: 28,
                            fontWeight: 900,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            +5
                        </button>
                    </div>

                    {/* ── Life total center ── */}
                    <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center",
                        padding: "12px 8px",
                        position: "relative",
                    }}>
                        {lastDelta != null && (
                            <span style={{
                                position: "absolute", top: -4,
                                fontSize: 20, fontWeight: 800,
                                color: lastDelta > 0 ? "var(--success)" : "var(--danger)",
                                animation: "deltaFade 1.2s ease-out forwards",
                                pointerEvents: "none",
                            }}>
                                {lastDelta > 0 ? `+${lastDelta}` : lastDelta}
                            </span>
                        )}

                        <span style={{
                            fontSize: 80,
                            fontWeight: 900,
                            lineHeight: 1,
                            letterSpacing: "-4px",
                            color: lifeColor,
                            transition: "color 0.3s ease",
                            textShadow: isLow ? "0 0 24px rgba(239,68,68,0.4)" : undefined,
                        }}>
                            {lifeTotal}
                        </span>

                        {/* Counters */}
                        <div style={{ display: "flex", gap: 6, marginTop: 4, minHeight: 18 }}>
                            {showPoison && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", backgroundColor: "rgba(168,85,247,0.12)", padding: "2px 8px", borderRadius: 999, display: "flex", alignItems: "center", gap: 3 }}>
                                    <Flame style={{ width: 12, height: 12 }} /> {poisonCount}/{rules.poison_to_lose ?? 10}
                                </span>
                            )}
                            {rules.extra_counters?.map((c) => {
                                const v = counters?.[c] ?? 0;
                                if (!v) return null;
                                return (
                                    <span key={c} style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 999 }}>
                                        {c}: {v}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── -1 / -5 row ── */}
                    <div style={{ display: "flex", gap: 4, padding: "0 8px 8px", flex: 1 }}>
                        <button className="life-btn" onClick={() => fire(-1)} style={{
                            flex: 1,
                            border: "none",
                            borderRadius: 14,
                            backgroundColor: "rgba(239,68,68,0.10)",
                            color: "var(--danger)",
                            fontSize: 28,
                            fontWeight: 900,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            −1
                        </button>
                        <button className="life-btn" onClick={() => fire(-5)} style={{
                            flex: 1,
                            border: "none",
                            borderRadius: 14,
                            backgroundColor: "rgba(239,68,68,0.10)",
                            color: "var(--danger)",
                            fontSize: 28,
                            fontWeight: 900,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            −5
                        </button>
                    </div>
                </>
            ) : (
                /* ── Read-only view ── */
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: "16px 12px 24px",
                }}>
                    <span style={{
                        fontSize: 72,
                        fontWeight: 900,
                        lineHeight: 1,
                        letterSpacing: "-3px",
                        color: lifeColor,
                        transition: "color 0.3s ease",
                        textShadow: isLow ? "0 0 20px rgba(239,68,68,0.4)" : undefined,
                    }}>
                        {lifeTotal}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>vidas</span>

                    {showPoison && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", backgroundColor: "rgba(168,85,247,0.12)", padding: "3px 8px", borderRadius: 999, display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}>
                            <Flame style={{ width: 12, height: 12 }} /> {poisonCount}/{rules.poison_to_lose ?? 10}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
