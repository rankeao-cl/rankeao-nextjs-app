"use client";

import type { DuelPlayer } from "@/lib/types/duel";

export interface DuelSeriesProgressProps {
    p1: DuelPlayer;
    p2: DuelPlayer;
    challengerWins: number;
    opponentWins: number;
    maxWins: number;
}

export default function DuelSeriesProgress({
    p1,
    p2,
    challengerWins,
    opponentWins,
    maxWins,
}: DuelSeriesProgressProps) {
    return (
        <div className="mb-4 p-3 rounded-xl border" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--muted)" }}>Progreso de serie</span>
                <span className="text-[10px] font-bold" style={{ color: "var(--muted)" }}>Primero a {maxWins}</span>
            </div>
            <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold truncate max-w-[80px]" style={{ color: "var(--foreground)" }}>
                        {(p1.display_name || p1.username).split(" ")[0]}
                    </span>
                    <div className="flex gap-1.5">
                        {Array.from({ length: maxWins }).map((_, i) => (
                            <div key={`c-${i}`} className="rounded-full transition-colors" style={{
                                width: 10, height: 10,
                                backgroundColor: i < challengerWins ? "var(--success)" : "var(--border)",
                            }} />
                        ))}
                    </div>
                </div>
                <span className="text-[10px] font-extrabold" style={{ color: "var(--muted)" }}>VS</span>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        {Array.from({ length: maxWins }).map((_, i) => (
                            <div key={`o-${i}`} className="rounded-full transition-colors" style={{
                                width: 10, height: 10,
                                backgroundColor: i < opponentWins ? "var(--success)" : "var(--border)",
                            }} />
                        ))}
                    </div>
                    <span className="text-xs font-bold truncate max-w-[80px]" style={{ color: "var(--foreground)" }}>
                        {(p2.display_name || p2.username).split(" ")[0]}
                    </span>
                </div>
            </div>
        </div>
    );
}
