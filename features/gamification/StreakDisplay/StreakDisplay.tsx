"use client";

interface Props {
    activityStreak: number;
    victoryStreak: number;
}

export function StreakDisplay({ activityStreak, victoryStreak }: Props) {
    return (
        <div className="inline-flex items-center gap-3">
            {/* Activity streak */}
            <div className="inline-flex items-center gap-1" title={`${activityStreak} días consecutivos activo`}>
                <span className={`text-base ${activityStreak > 0 ? "streak-fire" : ""}`}>
                    🔥
                </span>
                <span className={`text-sm font-bold ${
                    activityStreak > 0 ? "text-orange-500" : "text-[var(--muted)]"
                }`}>
                    {activityStreak}
                </span>
                <span className="text-[10px] text-[var(--muted)] hidden sm:inline">
                    días
                </span>
            </div>

            {/* Separator */}
            <div className="w-px h-4 bg-[var(--border)]" />

            {/* Victory streak */}
            <div className="inline-flex items-center gap-1" title={`${victoryStreak} victorias consecutivas`}>
                <span className="text-base">
                    🏆
                </span>
                <span className={`text-sm font-bold ${
                    victoryStreak > 0 ? "text-yellow-500" : "text-[var(--muted)]"
                }`}>
                    {victoryStreak}
                </span>
                <span className="text-[10px] text-[var(--muted)] hidden sm:inline">
                    wins
                </span>
            </div>
        </div>
    );
}
