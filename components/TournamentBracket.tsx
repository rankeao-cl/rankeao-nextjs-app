"use client";

import { useMemo } from "react";
import type { Round, Match } from "@/lib/types/tournament";

interface TournamentBracketProps {
    rounds: Round[];
    matches: Match[];
}

interface BracketMatch {
    id: string;
    roundIndex: number;
    matchIndex: number;
    player1: string;
    player2: string;
    player1Score: number | null;
    player2Score: number | null;
    winnerId: string | null;
    player1Id: string;
    player2Id: string | null;
    status: string;
    isBye: boolean;
}

/**
 * Visual single-elimination bracket.
 * Renders rounds as columns with connector lines between them.
 * Supports 8, 16, and 32 player brackets.
 */
export default function TournamentBracket({ rounds, matches }: TournamentBracketProps) {
    const bracketRounds = useMemo(() => {
        // Group matches by round
        const roundMap = new Map<number, BracketMatch[]>();

        // Prefer matches from Round objects if they contain nested matches
        const allMatches: Match[] = [];
        for (const round of rounds) {
            if (round.matches && round.matches.length > 0) {
                allMatches.push(...round.matches);
            }
        }
        // Fall back to top-level matches array
        const source = allMatches.length > 0 ? allMatches : matches;

        for (const m of source) {
            const roundNum = m.round_number ?? 1;
            if (!roundMap.has(roundNum)) roundMap.set(roundNum, []);
            roundMap.get(roundNum)!.push({
                id: m.id,
                roundIndex: roundNum,
                matchIndex: roundMap.get(roundNum)!.length,
                player1: m.player1_username || "Por definir",
                player2: m.player2_username || (m.is_bye ? "BYE" : "Por definir"),
                player1Score: m.player1_wins ?? null,
                player2Score: m.player2_wins ?? null,
                winnerId: m.winner_id || null,
                player1Id: m.player1_id,
                player2Id: m.player2_id || null,
                status: m.status,
                isBye: m.is_bye || false,
            });
        }

        // Sort round numbers and build ordered array
        const sortedKeys = Array.from(roundMap.keys()).sort((a, b) => a - b);
        return sortedKeys.map((key) => ({
            roundNumber: key,
            matches: roundMap.get(key)!,
        }));
    }, [rounds, matches]);

    if (bracketRounds.length === 0) {
        return (
            <div
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-14 text-center"
            >
                <p className="text-3xl mb-3 opacity-50">🏟️</p>
                <p className="text-sm font-medium text-[var(--foreground)]">Bracket no disponible</p>
                <p className="text-xs mt-1 text-[var(--muted)]">
                    El bracket se mostrará cuando el torneo inicie.
                </p>
            </div>
        );
    }

    const totalRounds = bracketRounds.length;

    // Round labels
    function getRoundLabel(roundIdx: number, total: number): string {
        if (roundIdx === total - 1) return "Final";
        if (roundIdx === total - 2) return "Semifinal";
        if (roundIdx === total - 3) return "Cuartos";
        return `Ronda ${roundIdx + 1}`;
    }

    return (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
            <div
                className="flex gap-0 min-w-max py-4"
                style={{ minWidth: `${totalRounds * 240}px` }}
            >
                {bracketRounds.map((round, roundIdx) => {
                    // Calculate spacing: each subsequent round's matches are spaced 2x apart
                    const matchSpacingMultiplier = Math.pow(2, roundIdx);
                    const baseGap = 8; // px
                    const matchHeight = 88; // approximate match box height in px

                    return (
                        <div
                            key={round.roundNumber}
                            className="flex flex-col flex-shrink-0"
                            style={{ width: "220px" }}
                        >
                            {/* Round header */}
                            <div className="text-center mb-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                                    {getRoundLabel(roundIdx, totalRounds)}
                                </p>
                            </div>

                            {/* Matches column with connectors */}
                            <div
                                className="flex flex-col justify-around flex-1 relative"
                                style={{
                                    gap: `${baseGap * matchSpacingMultiplier}px`,
                                    paddingTop: `${(matchSpacingMultiplier - 1) * (matchHeight / 2 + baseGap / 2)}px`,
                                    paddingBottom: `${(matchSpacingMultiplier - 1) * (matchHeight / 2 + baseGap / 2)}px`,
                                }}
                            >
                                {round.matches.map((match, matchIdx) => {
                                    const isLive =
                                        match.status === "IN_PROGRESS" ||
                                        match.status === "PENDING";
                                    const isActive = match.status === "IN_PROGRESS";

                                    return (
                                        <div key={match.id} className="relative flex items-center">
                                            {/* Match box */}
                                            <div
                                                className="w-[200px] rounded-xl border overflow-hidden relative"
                                                style={{
                                                    background: "var(--surface)",
                                                    borderColor: isActive
                                                        ? "var(--success)"
                                                        : "var(--border)",
                                                    boxShadow: isActive
                                                        ? "0 0 12px rgba(var(--success-rgb, 34 197 94), 0.15)"
                                                        : undefined,
                                                }}
                                            >
                                                {/* EN VIVO indicator */}
                                                {isActive && (
                                                    <div className="absolute top-0 right-0 px-1.5 py-0.5 rounded-bl-lg bg-[var(--success)] flex items-center gap-1 z-10">
                                                        <span className="relative flex h-1.5 w-1.5">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                                                        </span>
                                                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                                                            En vivo
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Player 1 */}
                                                <PlayerSlot
                                                    name={match.player1}
                                                    score={match.player1Score}
                                                    isWinner={match.winnerId === match.player1Id}
                                                    isTBD={match.player1 === "Por definir"}
                                                    position="top"
                                                />

                                                {/* Divider */}
                                                <div
                                                    className="h-px w-full"
                                                    style={{ background: "var(--border)" }}
                                                />

                                                {/* Player 2 */}
                                                <PlayerSlot
                                                    name={match.player2}
                                                    score={match.player2Score}
                                                    isWinner={
                                                        match.player2Id != null &&
                                                        match.winnerId === match.player2Id
                                                    }
                                                    isTBD={
                                                        match.player2 === "Por definir" ||
                                                        match.player2 === "BYE"
                                                    }
                                                    isBye={match.isBye}
                                                    position="bottom"
                                                />
                                            </div>

                                            {/* Right connector line to next round */}
                                            {roundIdx < totalRounds - 1 && (
                                                <ConnectorRight
                                                    matchIdx={matchIdx}
                                                    matchSpacingMultiplier={matchSpacingMultiplier}
                                                    matchHeight={matchHeight}
                                                    baseGap={baseGap}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PlayerSlot({
    name,
    score,
    isWinner,
    isTBD,
    isBye,
    position,
}: {
    name: string;
    score: number | null;
    isWinner: boolean;
    isTBD: boolean;
    isBye?: boolean;
    position: "top" | "bottom";
}) {
    return (
        <div
            className="flex items-center justify-between px-3 py-2"
            style={{
                background: isWinner
                    ? "var(--accent-soft, rgba(var(--accent-rgb, 99 102 241), 0.08))"
                    : "transparent",
            }}
        >
            <span
                className={`text-xs truncate max-w-[140px] ${
                    isTBD || isBye
                        ? "italic text-[var(--muted)]"
                        : isWinner
                        ? "font-bold text-[var(--accent)]"
                        : "font-medium text-[var(--foreground)]"
                }`}
            >
                {isBye ? "BYE" : name}
            </span>
            {score != null && !isBye && !isTBD && (
                <span
                    className={`text-xs font-bold min-w-[16px] text-center ${
                        isWinner ? "text-[var(--accent)]" : "text-[var(--foreground)]"
                    }`}
                >
                    {score}
                </span>
            )}
        </div>
    );
}

/**
 * CSS-based connector lines between rounds.
 * Uses borders to draw horizontal + vertical connections.
 */
function ConnectorRight({
    matchIdx,
    matchSpacingMultiplier,
    matchHeight,
    baseGap,
}: {
    matchIdx: number;
    matchSpacingMultiplier: number;
    matchHeight: number;
    baseGap: number;
}) {
    const isTop = matchIdx % 2 === 0;
    // Height of the vertical connector: half the distance between two paired matches
    const verticalSpan = (matchHeight + baseGap * matchSpacingMultiplier) / 2;

    return (
        <div className="relative" style={{ width: "20px", height: `${matchHeight}px` }}>
            {/* Horizontal line from match box */}
            <div
                className="absolute left-0 top-1/2"
                style={{
                    width: "10px",
                    height: "1px",
                    background: "var(--border)",
                }}
            />
            {/* Vertical connector */}
            <div
                className="absolute"
                style={{
                    left: "10px",
                    width: "1px",
                    background: "var(--border)",
                    ...(isTop
                        ? { top: "50%", height: `${verticalSpan}px` }
                        : { bottom: "50%", height: `${verticalSpan}px` }),
                }}
            />
            {/* Horizontal line to next match */}
            <div
                className="absolute"
                style={{
                    left: "10px",
                    width: "10px",
                    height: "1px",
                    background: "var(--border)",
                    ...(isTop
                        ? { top: `calc(50% + ${verticalSpan}px)` }
                        : { bottom: `calc(50% + ${verticalSpan}px)` }),
                }}
            />
        </div>
    );
}
