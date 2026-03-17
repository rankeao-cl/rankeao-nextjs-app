export type RankName = "Bronce" | "Plata" | "Oro" | "Diamante" | "Master" | "Grand Master" | "Legendario";

export interface RankInfo {
    name: RankName;
    level: string;
    colorName: string;
    cssColor: string;
    oklchColor: string;
    ringColor: string;
    ringClass: string;
    glowClass: string;
    icon: string;
    minElo: number;
}

export const RANKS: RankInfo[] = [
    {
        name: "Bronce", level: "Inicial", colorName: "Marrón",
        cssColor: "#8B4513", oklchColor: "oklch(55% 0.10 55)",
        ringColor: "ring-[#8B4513]", ringClass: "rank-ring-bronce", glowClass: "",
        icon: "🥉", minElo: 0,
    },
    {
        name: "Plata", level: "Intermedio bajo", colorName: "Gris",
        cssColor: "#C0C0C0", oklchColor: "oklch(70% 0.02 260)",
        ringColor: "ring-[#C0C0C0]", ringClass: "rank-ring-plata", glowClass: "",
        icon: "🥈", minElo: 1000,
    },
    {
        name: "Oro", level: "Intermedio", colorName: "Dorado",
        cssColor: "#FFD700", oklchColor: "oklch(75% 0.15 85)",
        ringColor: "ring-[#FFD700]", ringClass: "rank-ring-oro", glowClass: "",
        icon: "🥇", minElo: 1200,
    },
    {
        name: "Diamante", level: "Avanzado", colorName: "Celeste",
        cssColor: "#00BFFF", oklchColor: "oklch(70% 0.15 200)",
        ringColor: "ring-[#00BFFF]", ringClass: "rank-ring-diamante", glowClass: "",
        icon: "💎", minElo: 1400,
    },
    {
        name: "Master", level: "Experto", colorName: "Rojo",
        cssColor: "#DC143C", oklchColor: "oklch(55% 0.20 25)",
        ringColor: "ring-[#DC143C]", ringClass: "rank-ring-master", glowClass: "rank-glow-master rank-glow",
        icon: "🔥", minElo: 1600,
    },
    {
        name: "Grand Master", level: "Élite", colorName: "Púrpura",
        cssColor: "#8A2BE2", oklchColor: "oklch(55% 0.22 300)",
        ringColor: "ring-[#8A2BE2]", ringClass: "rank-ring-grandmaster", glowClass: "rank-glow-grandmaster rank-glow",
        icon: "⚡", minElo: 1800,
    },
    {
        name: "Legendario", level: "Máximo", colorName: "Especial",
        cssColor: "#FFD700", oklchColor: "oklch(75% 0.15 85)",
        ringColor: "ring-yellow-400 ring-offset-2 ring-offset-black",
        ringClass: "rank-ring-legendario", glowClass: "rank-glow-legendario rank-legendary",
        icon: "👑", minElo: 2000,
    },
];

export function getRankForElo(elo: number | undefined | null): RankInfo {
    const safeElo = elo ?? 0;
    // Iterate in reverse to find the highest rank the user qualifies for
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (safeElo >= RANKS[i].minElo) {
            return RANKS[i];
        }
    }
    return RANKS[0]; // fallback to Bronze
}
