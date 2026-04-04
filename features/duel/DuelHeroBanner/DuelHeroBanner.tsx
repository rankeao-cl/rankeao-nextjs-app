"use client";

import Image from "next/image";
import Link from "next/link";
import type { DuelPlayer } from "@/lib/types/duel";
import type { GameBrand } from "@/lib/gameLogos";

// ── Types ──

export interface DuelHeroBannerProps {
    p1: DuelPlayer;
    p2: DuelPlayer;
    brand: GameBrand;
    statusColor: string;
    hasActiveStatus: boolean;
    hasScore: boolean;
    challengerWins: number | undefined;
    opponentWins: number | undefined;
    challengerWon: boolean;
    opponentWon: boolean;
    isChallenger: boolean;
    isOpponent: boolean;
    introEligible: boolean;
    onShare: () => void;
}

// ── Avatar helper ──

function PlayerAvatar({ player, size, ringColor }: { player: DuelPlayer; size: number; ringColor: string }) {
    const inner = size - 6;
    return (
        <div style={{
            width: size, height: size, borderRadius: size / 2,
            background: ringColor, padding: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <div style={{
                width: inner, height: inner, borderRadius: inner / 2,
                backgroundColor: "var(--background)", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                {player.avatar_url ? (
                    <Image src={player.avatar_url} alt={player.username} width={inner} height={inner} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <span style={{ fontSize: size * 0.3, fontWeight: 800, color: "var(--foreground)" }}>
                        {(player.username || "?").charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Component ──

export default function DuelHeroBanner({
    p1,
    p2,
    brand,
    statusColor,
    hasActiveStatus,
    hasScore,
    challengerWins,
    opponentWins,
    challengerWon,
    opponentWon,
    isChallenger,
    isOpponent,
    introEligible,
    onShare,
}: DuelHeroBannerProps) {
    return (
        <div className="relative w-full overflow-hidden" style={{ height: 200, backgroundColor: "var(--surface-solid)", animation: introEligible ? "duelStagger1 0.8s cubic-bezier(0.16,1,0.3,1) both" : undefined }}>
            {/* Background gradient with game brand */}
            <div className="absolute inset-0" style={{
                background: `linear-gradient(135deg, ${brand.bg} 0%, color-mix(in srgb, ${brand.color} 10%, ${brand.bg}) 50%, #0a0a10 100%)`,
            }} />

            {/* Glow radial from game color */}
            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 30%, ${brand.color}20 0%, transparent 70%)` }} />

            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Status bar at top */}
            <div className={`absolute top-0 inset-x-0 z-10 ${hasActiveStatus ? "animate-pulse" : ""}`}
                style={{ height: 3, background: `linear-gradient(90deg, ${brand.color}, ${statusColor}, transparent)` }}
            />

            {/* Nav buttons */}
            <div className="absolute top-4 left-4 z-10">
                <Link href="/duelos" style={{
                    width: 40, height: 40, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none",
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </Link>
            </div>
            <div className="absolute top-4 right-4 z-10">
                <button onClick={onShare} style={{
                    width: 40, height: 40, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                </button>
            </div>

            {/* Bottom: VS matchup hero */}
            <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-4">
                <div className="max-w-5xl mx-auto flex items-end justify-between gap-3">
                    {/* Player 1 */}
                    <div className="flex items-center gap-3 min-w-0">
                        <PlayerAvatar player={p1} size={52} ringColor={challengerWon ? "var(--success)" : isChallenger ? "var(--accent)" : "var(--border)"} />
                        <div className="min-w-0">
                            <p className="text-white font-extrabold text-sm sm:text-base truncate" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                                {p1.display_name || p1.username}
                            </p>
                            <p className="text-white/50 text-[11px] truncate">@{p1.username}{p1.rating != null && ` · ${p1.rating} ELO`}</p>
                        </div>
                    </div>

                    {/* Score / VS */}
                    <div className="flex flex-col items-center shrink-0 pb-0.5">
                        {hasScore ? (
                            <span className="text-white font-black text-2xl sm:text-3xl tracking-tight" style={{ textShadow: `0 0 16px ${brand.color}40` }}>
                                {challengerWins} – {opponentWins}
                            </span>
                        ) : (
                            <span className="text-white/60 font-black text-xl tracking-widest">VS</span>
                        )}
                    </div>

                    {/* Player 2 */}
                    <div className="flex items-center gap-3 min-w-0 flex-row-reverse text-right">
                        <PlayerAvatar player={p2} size={52} ringColor={opponentWon ? "var(--success)" : isOpponent ? "var(--accent)" : "var(--border)"} />
                        <div className="min-w-0">
                            <p className="text-white font-extrabold text-sm sm:text-base truncate" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                                {p2.display_name || p2.username}
                            </p>
                            <p className="text-white/50 text-[11px] truncate">{p2.rating != null && `${p2.rating} ELO · `}@{p2.username}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
