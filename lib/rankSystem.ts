export type RankName = "Bronce" | "Plata" | "Oro" | "Diamante" | "Master" | "Grand Master" | "Legendario";

export interface RankInfo {
    name: RankName;
    level: string;
    colorName: string;
    cssColor: string;
    ringColor: string;
    icon: string;
    minElo: number;
}

export const RANKS: RankInfo[] = [
    { name: "Bronce", level: "Inicial", colorName: "Marrón", cssColor: "#8B4513", ringColor: "ring-[#8B4513]", icon: "🥉", minElo: 0 },
    { name: "Plata", level: "Intermedio bajo", colorName: "Gris", cssColor: "#C0C0C0", ringColor: "ring-[#C0C0C0]", icon: "🥈", minElo: 1000 },
    { name: "Oro", level: "Intermedio", colorName: "Dorado", cssColor: "#FFD700", ringColor: "ring-[#FFD700]", icon: "🥇", minElo: 1200 },
    { name: "Diamante", level: "Avanzado", colorName: "Celeste", cssColor: "#00BFFF", ringColor: "ring-[#00BFFF]", icon: "💎", minElo: 1400 },
    { name: "Master", level: "Experto", colorName: "Rojo", cssColor: "#DC143C", ringColor: "ring-[#DC143C]", icon: "🔥", minElo: 1600 },
    { name: "Grand Master", level: "Élite", colorName: "Púrpura", cssColor: "#8A2BE2", ringColor: "ring-[#8A2BE2]", icon: "⚡", minElo: 1800 },
    { name: "Legendario", level: "Máximo", colorName: "Especial", cssColor: "url(#legendary-gradient)", ringColor: "ring-yellow-400 ring-offset-2 ring-offset-black", icon: "👑", minElo: 2000 },
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
