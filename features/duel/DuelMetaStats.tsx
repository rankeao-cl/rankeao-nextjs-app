"use client";

import type { GameBrand } from "@/lib/gameLogos";

export interface DuelMetaStatsProps {
    statusLabel: string;
    statusColor: string;
    hasActiveStatus: boolean;
    gameName?: string;
    formatName?: string;
    bestOf: number;
    isActive: boolean;
    elapsed: string;
    brand: GameBrand;
    introEligible: boolean;
}

export default function DuelMetaStats({
    statusLabel,
    statusColor,
    hasActiveStatus,
    gameName,
    formatName,
    bestOf,
    isActive,
    elapsed,
    brand,
    introEligible,
}: DuelMetaStatsProps) {
    return (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mt-4 mb-4" style={{ animation: introEligible ? "duelStagger2 0.8s cubic-bezier(0.16,1,0.3,1) both" : undefined }}>
            {/* Status */}
            <div className="flex-1 min-w-[80px] p-2.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 flex items-center justify-center gap-1" style={{ color: "var(--muted)" }}>
                    {hasActiveStatus && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor, animation: "pulseGlow 1.6s ease-in-out infinite" }} />}
                    Estado
                </p>
                <p className="text-xs font-bold truncate" style={{ color: statusColor }}>{statusLabel}</p>
            </div>
            {/* Game */}
            {gameName && (
                <div className="flex-1 min-w-[80px] p-2.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Juego</p>
                    <p className="text-xs font-bold truncate" style={{ color: brand.color }}>{gameName}</p>
                </div>
            )}
            {/* Format */}
            {formatName && (
                <div className="flex-1 min-w-[80px] p-2.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Formato</p>
                    <p className="text-xs font-bold truncate" style={{ color: "var(--foreground)" }}>{formatName}</p>
                </div>
            )}
            {/* Best of */}
            {bestOf != null && bestOf > 0 && (
                <div className="flex-1 min-w-[60px] p-2.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Serie</p>
                    <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Bo{bestOf}</p>
                </div>
            )}
            {/* Timer */}
            {isActive && elapsed && (
                <div className="flex-1 min-w-[70px] p-2.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Tiempo</p>
                    <p className="text-xs font-bold tabular-nums" style={{ color: "var(--foreground)" }}>{elapsed}</p>
                </div>
            )}
            {/* Type */}
            <div className="flex-1 min-w-[60px] p-2.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Tipo</p>
                <p className="text-xs font-bold" style={{ color: "var(--warning)" }}>Casual</p>
            </div>
        </div>
    );
}
