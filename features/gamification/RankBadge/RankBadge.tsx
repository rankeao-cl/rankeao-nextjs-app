import { Chip } from "@heroui/react";
import { getRankForElo, type RankInfo } from "@/lib/rankSystem";

interface Props {
    elo?: number;
    rank?: RankInfo;
    showIcon?: boolean;
    showText?: boolean;
    size?: "sm" | "md" | "lg";
}

export function RankBadge({ elo, rank: propRank, showIcon = true, showText = true, size = "sm" }: Props) {
    const rank = propRank ?? getRankForElo(elo);

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold ${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base px-3 py-1"
                }`}
            style={{
                background: `${rank.cssColor}20`, // 20% opacity for background
                color: rank.name === "Legendario" ? "#FFD700" : rank.cssColor,
                border: `1px solid ${rank.name === "Legendario" ? "#FFD700" : rank.cssColor}50`,
            }}
        >
            {showIcon && <span>{rank.icon}</span>}
            {showText && <span>{rank.name}</span>}
        </div>
    );
}
