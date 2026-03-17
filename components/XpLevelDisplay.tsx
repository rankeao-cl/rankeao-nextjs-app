"use client";

interface Props {
    level: number;
    currentXp: number;
    xpToNextLevel: number;
    variant?: "compact" | "expanded";
}

export function XpLevelDisplay({ level, currentXp, xpToNextLevel, variant = "compact" }: Props) {
    const progressPercent = xpToNextLevel > 0
        ? Math.min((currentXp / xpToNextLevel) * 100, 100)
        : 100;

    if (variant === "compact") {
        return (
            <div className="inline-flex items-center gap-2">
                {/* Level circle */}
                <div className="relative shrink-0 w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
                    <span className="text-xs font-bold text-[var(--accent-foreground)]">
                        {level}
                    </span>
                </div>

                {/* Mini progress bar */}
                <div className="flex flex-col gap-0.5 min-w-[80px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[var(--foreground)]">
                            Nv. {level}
                        </span>
                        <span className="text-[10px] text-[var(--muted)]">
                            {currentXp}/{xpToNextLevel} XP
                        </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--surface-tertiary)] overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[var(--accent)] xp-bar-fill transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Expanded variant
    return (
        <div className="glass-sm p-4 space-y-3">
            <div className="flex items-center gap-3">
                {/* Level badge - larger */}
                <div className="relative shrink-0 w-14 h-14 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-[var(--accent-foreground)]">
                        {level}
                    </span>
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-[var(--foreground)]">
                            Nivel {level}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                            Nivel {level + 1}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2.5 rounded-full bg-[var(--surface-tertiary)] overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[var(--accent)] xp-bar-fill transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {/* XP text */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--muted)]">
                            {currentXp.toLocaleString()} XP
                        </span>
                        <span className="text-xs font-medium text-[var(--foreground)]">
                            {xpToNextLevel.toLocaleString()} XP
                        </span>
                    </div>
                </div>
            </div>

            {/* XP remaining callout */}
            <div className="text-center">
                <span className="text-xs text-[var(--muted)]">
                    Faltan{" "}
                    <span className="font-semibold text-[var(--accent)]">
                        {Math.max(0, xpToNextLevel - currentXp).toLocaleString()} XP
                    </span>{" "}
                    para el siguiente nivel
                </span>
            </div>
        </div>
    );
}
