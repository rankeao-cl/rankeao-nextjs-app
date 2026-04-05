import Link from "next/link";
import type { Duel } from "@/lib/types/duel";

interface ProfileRecentDuelsProps {
    recentDuels: Duel[];
    profileUsername: string;
}

export default function ProfileRecentDuels({ recentDuels, profileUsername }: ProfileRecentDuelsProps) {
    if (recentDuels.length === 0) return null;

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                backgroundColor: "var(--surface-solid)",
                border: "1px solid var(--border)",
            }}
        >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-[11px] font-bold uppercase tracking-wider m-0" style={{ color: "var(--muted)" }}>
                    Duelos recientes
                </p>
            </div>
            <div>
                {recentDuels.map((duel) => {
                    const isChallenger = duel.challenger.username?.toLowerCase() === profileUsername?.toLowerCase();
                    const opponent = isChallenger ? duel.opponent : duel.challenger;
                    const myWins = isChallenger ? (duel.challenger_wins ?? 0) : (duel.opponent_wins ?? 0);
                    const opponentWins = isChallenger ? (duel.opponent_wins ?? 0) : (duel.challenger_wins ?? 0);
                    const isWin = myWins > opponentWins;
                    const isDraw = duel.status === "COMPLETED" && myWins === opponentWins;
                    const resultLabel = isDraw ? "EMPATE" : isWin ? "VICTORIA" : "DERROTA";
                    const resultColor = isDraw ? "var(--muted)" : isWin ? "var(--success)" : "var(--danger)";
                    const date = duel.played_at || duel.created_at;

                    return (
                        <div
                            key={duel.id}
                            className="flex items-center gap-2.5 px-4 py-2.5"
                            style={{ borderBottom: "1px solid var(--border)" }}
                        >
                            <div
                                className="w-14 text-center shrink-0 rounded-md py-[3px]"
                                style={{ backgroundColor: resultColor + "18" }}
                            >
                                <span className="text-[9px] font-extrabold tracking-wide" style={{ color: resultColor }}>
                                    {resultLabel}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
                                    vs{" "}
                                    <Link href={`/perfil/${opponent.username}`} className="no-underline" style={{ color: "var(--foreground)" }}>
                                        {opponent.username}
                                    </Link>
                                </span>
                                {duel.game_name && (
                                    <p className="text-[11px] m-0 mt-px" style={{ color: "var(--muted)" }}>{duel.game_name}</p>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                                    {myWins}-{opponentWins}
                                </span>
                                {date && (
                                    <p className="text-[10px] m-0 mt-px" style={{ color: "var(--muted)" }}>
                                        {new Date(date).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
