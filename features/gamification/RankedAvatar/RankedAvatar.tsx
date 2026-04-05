import { Avatar } from "@heroui/react/avatar";
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

    // Use CSS-class-based ring + glow instead of inline Tailwind
    const ringClass = rank.ringClass;
    const glowClass = rank.glowClass;

    return (
        <div className={`relative inline-block ${className}`}>
            <Avatar
                size={size}
                className={`rounded-full ${ringClass} ${glowClass}`}
            >
                <Avatar.Image src={src ?? undefined} />
                <Avatar.Fallback>{fallback || "?"}</Avatar.Fallback>
            </Avatar>
            {/* Small rank icon overlay at the bottom right */}
            <div
                className={`absolute -bottom-1 -right-1 z-10 bg-[var(--surface)] rounded-full border border-[var(--border)] flex items-center justify-center shadow-sm ${isHighRank ? "animate-bounce-subtle" : ""}`}
                style={{
                    width: size === "sm" ? "16px" : size === "md" ? "20px" : "24px",
                    height: size === "sm" ? "16px" : size === "md" ? "20px" : "24px",
                    fontSize: size === "sm" ? "10px" : size === "md" ? "12px" : "14px",
                }}
            >
                {rank.icon}
            </div>
        </div>
    );
}
