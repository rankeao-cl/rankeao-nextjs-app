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

    const isLegendary = rank.name === "Legendario";
    const isGrandMaster = rank.name === "Grand Master";
    const isMaster = rank.name === "Master";
    const isDiamante = rank.name === "Diamante";
    const isHighRank = isLegendary || isGrandMaster || isMaster || isDiamante;

    // Build animation class for high-rank users
    let animClass = "";
    if (isLegendary) {
        animClass = "shadow-[0_0_12px_rgba(255,215,0,0.6)] animate-[glow_2s_ease-in-out_infinite]";
    } else if (isGrandMaster) {
        animClass = "shadow-[0_0_10px_rgba(138,43,226,0.5)] animate-[glow_3s_ease-in-out_infinite]";
    } else if (isMaster) {
        animClass = "shadow-[0_0_8px_rgba(220,20,60,0.4)] animate-[glow_4s_ease-in-out_infinite]";
    } else if (isDiamante) {
        animClass = "shadow-[0_0_6px_rgba(0,191,255,0.3)]";
    }

    return (
        <div className={`relative inline-block ${className}`}>
            <Avatar
                size={size}
                className={`ring-2 ${rank.ringColor} ${animClass}`}
            >
                <Avatar.Image src={src ?? undefined} />
                <Avatar.Fallback>{fallback || "?"}</Avatar.Fallback>
            </Avatar>
            {/* Small rank icon overlay at the bottom right */}
            <div
                className={`absolute -bottom-1 -right-1 z-10 bg-black/80 rounded-full border border-zinc-700 flex items-center justify-center shadow-sm ${isHighRank ? "animate-bounce-subtle" : ""}`}
                style={{ width: size === "sm" ? "16px" : size === "md" ? "20px" : "24px", height: size === "sm" ? "16px" : size === "md" ? "20px" : "24px", fontSize: size === "sm" ? "10px" : size === "md" ? "12px" : "14px" }}
            >
                {rank.icon}
            </div>
        </div>
    );
}
