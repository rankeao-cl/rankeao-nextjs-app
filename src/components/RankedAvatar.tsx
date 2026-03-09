import { Avatar } from "@heroui/react";
import { getRankForElo, type RankInfo } from "@/lib/rankSystem";

interface Props {
    src?: string;
    fallback?: string;
    elo?: number;
    rank?: RankInfo;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function RankedAvatar({ src, fallback, elo, rank: propRank, size = "md", className = "" }: Props) {
    const rank = propRank ?? getRankForElo(elo);

    // Legendario gets a special animated effect if we wanted to push it, 
    // but for now we use the ringColor defined in the rankSystem
    const isLegendary = rank.name === "Legendario";

    return (
        <div className={`relative inline-block ${className}`}>
            <Avatar
                size={size}
                className={`ring-2 ${rank.ringColor} ${isLegendary ? "shadow-[0_0_10px_rgba(255,215,0,0.5)]" : ""}`}
            >
                <Avatar.Image src={src ?? undefined} />
                <Avatar.Fallback>{fallback || "?"}</Avatar.Fallback>
            </Avatar>
            {/* Small rank icon overlay at the bottom right */}
            <div
                className="absolute -bottom-1 -right-1 z-10 bg-black/80 rounded-full border border-zinc-700 flex items-center justify-center shadow-sm"
                style={{ width: size === "sm" ? "16px" : size === "md" ? "20px" : "24px", height: size === "sm" ? "16px" : size === "md" ? "20px" : "24px", fontSize: size === "sm" ? "10px" : size === "md" ? "12px" : "14px" }}
            >
                {rank.icon}
            </div>
        </div>
    );
}
