import type { RankInfo } from "@/lib/rankSystem";

interface ProfileQuickStatsProps {
    rating: number;
    rank: RankInfo;
    winRate: number;
    winRateDisplay: string;
    winRateColor: string;
    tournamentsPlayed: number;
    currentStreak: number;
    bestStreak: number;
}

export default function ProfileQuickStats({
    rating,
    rank,
    winRate,
    winRateDisplay,
    winRateColor,
    tournamentsPlayed,
    currentStreak,
    bestStreak,
}: ProfileQuickStatsProps) {
    return (
        <div className="max-w-[960px] mx-auto w-full px-4 mt-5">
            <div className="grid grid-cols-4 gap-2.5">
                {/* Rating / ELO */}
                <div
                    className="rounded-[14px] py-4 px-3 text-center backdrop-blur-sm"
                    style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <p className="text-2xl font-extrabold m-0 leading-none" style={{ color: rank.cssColor }}>
                        {rating || "-"}
                    </p>
                    <p className="text-[11px] font-medium m-0 mt-1" style={{ color: "var(--muted)" }}>
                        {rank.name}
                    </p>
                </div>

                {/* Win Rate */}
                <div
                    className="rounded-[14px] py-4 px-3 text-center backdrop-blur-sm"
                    style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <p
                        className="text-2xl font-extrabold m-0 leading-none"
                        style={{ color: winRate > 0 ? winRateColor : "var(--foreground)" }}
                    >
                        {winRateDisplay}
                    </p>
                    <p className="text-[11px] font-medium m-0 mt-1" style={{ color: "var(--muted)" }}>
                        Win Rate
                    </p>
                </div>

                {/* Torneos */}
                <div
                    className="rounded-[14px] py-4 px-3 text-center backdrop-blur-sm"
                    style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <p className="text-2xl font-extrabold m-0 leading-none" style={{ color: "var(--foreground)" }}>
                        {tournamentsPlayed || "-"}
                    </p>
                    <p className="text-[11px] font-medium m-0 mt-1" style={{ color: "var(--muted)" }}>
                        Torneos
                    </p>
                </div>

                {/* Racha */}
                <div
                    className="rounded-[14px] py-4 px-3 text-center backdrop-blur-sm"
                    style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <p
                        className="text-2xl font-extrabold m-0 leading-none"
                        style={{ color: currentStreak > 0 ? "var(--warning)" : "var(--foreground)" }}
                    >
                        {currentStreak > 0 ? currentStreak : bestStreak > 0 ? bestStreak : "-"}
                        {currentStreak > 0 && <span className="text-sm ml-0.5">🔥</span>}
                    </p>
                    <p className="text-[11px] font-medium m-0 mt-1" style={{ color: "var(--muted)" }}>
                        Racha
                    </p>
                </div>
            </div>
        </div>
    );
}
