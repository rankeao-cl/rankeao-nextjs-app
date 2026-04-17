import Image from "next/image";
import { getRankForElo } from "@/lib/rankSystem";
import type { UserProfile } from "@/lib/types/social";
import type { Badge, RawGameStat } from "@/lib/types/gamification";

interface ProfileSidebarProps {
    gamesList: string[];
    gameStats: RawGameStat[];
    profileUsername: string;
    badges: Badge[];
    badgesCount: number;
    friends: UserProfile[];
}

export default function ProfileSidebar({
    gamesList,
    gameStats,
    badges,
    badgesCount,
    friends,
}: ProfileSidebarProps) {
    return (
        <div className="hidden md:block w-[280px] shrink-0">
            <div className="sticky top-[72px] flex flex-col gap-4">
                {/* Games */}
                {gamesList.length > 0 && (
                    <div
                        className="rounded-[14px] p-3.5"
                        style={{
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: "var(--muted)" }}>
                            Juegos
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {gamesList.map((game: string) => (
                                <span
                                    key={game}
                                    className="py-[5px] px-2.5 rounded-lg text-xs font-medium"
                                    style={{
                                        backgroundColor: "var(--surface)",
                                        color: "var(--foreground)",
                                    }}
                                >
                                    {game}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ELO per game */}
                {gameStats.length > 0 && (
                    <div
                        className="rounded-[14px] p-3.5"
                        style={{
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: "var(--muted)" }}>
                            Rating por juego
                        </p>
                        <div className="flex flex-col gap-1.5 mt-2.5">
                            {gameStats.map((gameStat, i) => {
                                const gameValue = gameStat.game;
                                const gameName: string = (typeof gameValue === "string" ? gameValue : gameValue?.name) || gameStat.name || "Juego";
                                const gameStatRecord = gameStat as Record<string, unknown>;
                                const gameRating: number = (gameStatRecord.rating ?? gameStatRecord.elo ?? gameStatRecord.current_rating ?? 0) as number;
                                const gameRank = getRankForElo(gameRating);
                                return (
                                    <div key={gameName + i} className="flex items-center justify-between py-1.5">
                                        <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{gameName}</span>
                                        <span className="text-sm font-extrabold" style={{ color: gameRank.cssColor }}>
                                            {gameRating > 0 ? gameRating : "-"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Badges showcase */}
                {badges.length > 0 && (
                    <div
                        className="rounded-[14px] p-3.5"
                        style={{
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: "var(--muted)" }}>
                            Insignias ({badgesCount})
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2.5">
                            {badges.slice(0, 6).map((badge, i) => (
                                <div key={badge.id || badge.slug || i} className="flex flex-col items-center gap-1 w-16">
                                    {badge.icon_url ? (
                                        <Image src={badge.icon_url} alt={badge.name} width={28} height={28} className="object-contain" />
                                    ) : (
                                        <span className="text-[22px]">🏅</span>
                                    )}
                                    <span
                                        className="text-[9px] font-medium text-center leading-[11px]"
                                        style={{ color: "var(--muted)" }}
                                    >
                                        {badge.name || "Logro"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Friends */}
                {friends.length > 0 && (
                    <div
                        className="rounded-[14px] p-3.5"
                        style={{
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: "var(--muted)" }}>
                            Amigos ({friends.length})
                        </p>
                        <div className="flex flex-col gap-0.5 mt-2.5">
                            {friends.slice(0, 5).map((friend, i) => (
                                <a
                                    key={friend.user_id || friend.id || i}
                                    href={`/perfil/${friend.username}`}
                                    className="flex items-center gap-2 py-1.5 px-1 rounded-lg no-underline"
                                >
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                                        style={{ backgroundColor: "var(--surface)" }}
                                    >
                                        {friend.avatar_url ? (
                                            <Image src={friend.avatar_url} alt="" width={28} height={28} className="object-cover rounded-full" />
                                        ) : (
                                            <span className="text-[11px] font-bold" style={{ color: "var(--foreground)" }}>
                                                {friend.username?.[0]?.toUpperCase() || "?"}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                                        {friend.username}
                                    </span>
                                    {friend.is_online && (
                                        <div className="w-[7px] h-[7px] rounded-full ml-auto" style={{ backgroundColor: "var(--success)" }} />
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
