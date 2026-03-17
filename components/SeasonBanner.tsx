"use client";

import Link from "next/link";

interface SeasonData {
    name: string;
    number: number;
    ends_at: string;
    badge_url?: string;
}

interface Props {
    season: SeasonData;
}

function getDaysRemaining(endsAt: string): number {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function SeasonBanner({ season }: Props) {
    const daysLeft = getDaysRemaining(season.ends_at);
    const isEndingSoon = daysLeft <= 7;

    return (
        <Link href={`/ranking?season=${season.number}`} className="block">
            <div className="glass-sm px-4 py-2.5 flex items-center gap-3 transition-all hover:shadow-md">
                {/* Season badge/icon */}
                <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--accent-subtle)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
                    {season.badge_url ? (
                        <img
                            src={season.badge_url}
                            alt={season.name}
                            className="w-6 h-6 object-contain"
                        />
                    ) : (
                        <span className="text-sm">🏅</span>
                    )}
                </div>

                {/* Season info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[var(--foreground)] truncate">
                            {season.name}
                        </span>
                        <span className="shrink-0 text-[10px] text-[var(--muted)] font-medium">
                            Temporada {season.number}
                        </span>
                    </div>
                </div>

                {/* Days remaining */}
                <div className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    isEndingSoon
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "bg-[var(--surface-tertiary)] text-[var(--muted)] border border-[var(--border)]"
                }`}>
                    {daysLeft === 0
                        ? "Último día"
                        : `${daysLeft} día${daysLeft !== 1 ? "s" : ""}`
                    }
                </div>
            </div>
        </Link>
    );
}
