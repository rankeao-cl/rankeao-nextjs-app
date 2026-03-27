"use client";

import Image from "next/image";
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
    const lifeColor = isLow ? "var(--danger)" : isMe ? "var(--accent)" : "var(--foreground)";
    const ringColor = isMe ? "var(--accent)" : "var(--muted)";
    const poisonCount = counters?.poison ?? 0;
    const showPoison = rules.supports_poison && poisonCount > 0;
    const canControl = isMe && mode === "simple" && !!onDeltaLife;

    return (
        <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "20px 12px",
        }}>
            {/* Avatar */}
            <div style={{
                width: 56, height: 56, borderRadius: 28,
                background: ringColor, padding: 2,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <div style={{
                    width: 52, height: 52, borderRadius: 26,
                    backgroundColor: "var(--background)", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt={username}
                            width={52}
                            height={52}
                            style={{ objectFit: "cover" }}
                        />
                    ) : (
                        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)" }}>
                            {(username || "?").charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            {/* Username */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                    {username}
                </span>
                {isMe && (
                    <span style={{
                        fontSize: 9, fontWeight: 800, color: "var(--accent)",
                        backgroundColor: "rgba(59,130,246,0.12)",
                        padding: "2px 8px", borderRadius: 999,
                    }}>
                        TÚ
                    </span>
                )}
            </div>

            {/* Life total */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{
                    fontSize: 56,
                    fontWeight: 900,
                    color: lifeColor,
                    lineHeight: 1,
                    letterSpacing: "-2px",
                    transition: "color 0.3s ease",
                    textShadow: isLow ? "0 0 20px rgba(239,68,68,0.4)" : undefined,
                }}>
                    {lifeTotal}
                </span>
                <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                    vidas
                </span>
            </div>

            {/* Poison counter */}
            {showPoison && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    backgroundColor: "rgba(168,85,247,0.12)",
                    border: "1px solid rgba(168,85,247,0.25)",
                    padding: "4px 10px", borderRadius: 999,
                }}>
                    <span style={{ fontSize: 13 }}>☠️</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#a855f7" }}>
                        {poisonCount}/{rules.poison_to_lose ?? 10}
                    </span>
                </div>
            )}

            {/* Extra counters */}
            {rules.extra_counters && rules.extra_counters.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                    {rules.extra_counters.map((counter) => {
                        const val = counters?.[counter] ?? 0;
                        if (val === 0) return null;
                        return (
                            <div
                                key={counter}
                                style={{
                                    fontSize: 10, fontWeight: 600,
                                    color: "var(--muted)",
                                    backgroundColor: "var(--surface-solid)",
                                    border: "1px solid var(--border)",
                                    padding: "2px 8px", borderRadius: 999,
                                }}
                            >
                                {counter}: {val}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Life buttons (simple mode, own player) */}
            {canControl && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                        <button
                            onClick={() => onDeltaLife(1)}
                            style={lifeBtn("var(--accent)")}
                        >
                            +1
                        </button>
                        <button
                            onClick={() => onDeltaLife(5)}
                            style={lifeBtn("var(--accent)")}
                        >
                            +5
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                        <button
                            onClick={() => onDeltaLife(-1)}
                            style={lifeBtn("var(--danger)")}
                        >
                            -1
                        </button>
                        <button
                            onClick={() => onDeltaLife(-5)}
                            style={lifeBtn("var(--danger)")}
                        >
                            -5
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function lifeBtn(color: string): React.CSSProperties {
    return {
        flex: 1,
        padding: "8px 0",
        borderRadius: 10,
        border: `1px solid ${color}40`,
        backgroundColor: `${color}15`,
        color: color,
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
        transition: "opacity 0.15s ease",
    };
}
