"use client";

import { useState } from "react";
import type { Partida, PlayResult, ResultType, VoteValue } from "@/lib/api/play";

interface ResultVotingPanelProps {
    partida: Partida;
    result: PlayResult | null;
    currentUserId: number | null;
    onVote: (vote: VoteValue) => Promise<void>;
    onSubmitResult: (body: { result_type: ResultType; winner_user_id?: number }) => Promise<void>;
}

export default function ResultVotingPanel({
    partida,
    result,
    currentUserId,
    onVote,
    onSubmitResult,
}: ResultVotingPanelProps) {
    const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
    const [resultType, setResultType] = useState<ResultType>("win");
    const [submitting, setSubmitting] = useState(false);

    const accepted = partida.participants.filter((p) => p.status === "accepted");
    const myVote = result?.votes.find((v) => v.participant_user_id === currentUserId);
    const agreeCount = result?.votes.filter((v) => v.vote === "agree").length ?? 0;
    const totalVoters = result?.votes.length ?? 0;

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onSubmitResult({
                result_type: resultType,
                winner_user_id: resultType === "win" && selectedWinner ? selectedWinner : undefined,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleVote = async (vote: VoteValue) => {
        setSubmitting(true);
        try {
            await onVote(vote);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Submit form (no result yet) ──
    if (!result) {
        return (
            <section
                className="flex flex-col gap-4 rounded-2xl p-5"
                style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <p className="text-sm font-bold text-white">Proponer resultado</p>

                {/* Result type */}
                <div className="flex gap-2">
                    {(["win", "draw"] as ResultType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setResultType(type)}
                            className="flex-1 rounded-xl py-2.5 text-sm font-bold"
                            style={{
                                background: resultType === type
                                    ? "rgba(99,102,241,0.25)"
                                    : "rgba(255,255,255,0.05)",
                                border: `1px solid ${resultType === type
                                    ? "rgba(99,102,241,0.5)"
                                    : "rgba(255,255,255,0.08)"}`,
                                color: resultType === type ? "#a5b4fc" : "rgba(255,255,255,0.5)",
                                cursor: "pointer",
                            }}
                        >
                            {type === "win" ? "Victoria" : "Empate"}
                        </button>
                    ))}
                </div>

                {/* Winner selector */}
                {resultType === "win" && (
                    <div className="flex flex-col gap-2">
                        <p className="text-xs text-white/40">Ganador</p>
                        {accepted.map((p) => (
                            <button
                                key={p.user_id}
                                onClick={() => setSelectedWinner(p.user_id)}
                                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-left"
                                style={{
                                    background: selectedWinner === p.user_id
                                        ? "rgba(34,197,94,0.15)"
                                        : "rgba(255,255,255,0.04)",
                                    border: `1px solid ${selectedWinner === p.user_id
                                        ? "rgba(34,197,94,0.4)"
                                        : "rgba(255,255,255,0.07)"}`,
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{
                                        background: selectedWinner === p.user_id ? "#4ade80" : "rgba(255,255,255,0.2)",
                                    }}
                                />
                                <span className="text-sm font-semibold text-white">
                                    {p.display_name || p.username}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={submitting || (resultType === "win" && !selectedWinner)}
                    className="w-full rounded-xl py-3 text-sm font-bold text-white"
                    style={{
                        background: "rgba(99,102,241,0.85)",
                        border: "1px solid rgba(99,102,241,0.5)",
                        opacity: submitting || (resultType === "win" && !selectedWinner) ? 0.5 : 1,
                        cursor: submitting || (resultType === "win" && !selectedWinner) ? "not-allowed" : "pointer",
                    }}
                >
                    {submitting ? "Enviando..." : "Proponer resultado"}
                </button>
            </section>
        );
    }

    // ── Voting panel (result submitted, waiting for consensus) ──
    if (!result.consensus_reached) {
        const winnerParticipant = result.winner_user_id
            ? accepted.find((p) => p.user_id === result.winner_user_id)
            : null;

        return (
            <section
                className="flex flex-col gap-4 rounded-2xl p-5"
                style={{
                    background: "rgba(99,102,241,0.06)",
                    border: "1px solid rgba(99,102,241,0.2)",
                }}
            >
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">Resultado propuesto</p>
                    <span className="text-xs text-white/40">
                        {agreeCount}/{accepted.length} votos
                    </span>
                </div>

                {/* Proposed result summary */}
                <div className="rounded-xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    {result.result_type === "win" && winnerParticipant ? (
                        <p className="text-sm text-white">
                            Ganador: <span className="font-bold">{winnerParticipant.display_name || winnerParticipant.username}</span>
                        </p>
                    ) : (
                        <p className="text-sm text-white font-bold">Empate</p>
                    )}
                </div>

                {/* Current votes */}
                <div className="flex flex-col gap-1.5">
                    {result.votes.map((vote) => {
                        const voter = accepted.find((p) => p.user_id === vote.participant_user_id);
                        return (
                            <div key={vote.id} className="flex items-center justify-between text-xs">
                                <span className="text-white/50">{voter?.display_name ?? `Usuario ${vote.participant_user_id}`}</span>
                                <span style={{ color: vote.vote === "agree" ? "#4ade80" : "#f87171" }}>
                                    {vote.vote === "agree" ? "De acuerdo" : "En desacuerdo"}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Vote buttons (only if I haven't voted yet) */}
                {!myVote && currentUserId && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleVote("agree")}
                            disabled={submitting}
                            className="flex-1 rounded-xl py-2.5 text-sm font-bold"
                            style={{
                                background: "rgba(34,197,94,0.15)",
                                border: "1px solid rgba(34,197,94,0.4)",
                                color: "#4ade80",
                                cursor: submitting ? "not-allowed" : "pointer",
                                opacity: submitting ? 0.6 : 1,
                            }}
                        >
                            De acuerdo
                        </button>
                        <button
                            onClick={() => handleVote("disagree")}
                            disabled={submitting}
                            className="flex-1 rounded-xl py-2.5 text-sm font-bold"
                            style={{
                                background: "rgba(239,68,68,0.12)",
                                border: "1px solid rgba(239,68,68,0.35)",
                                color: "#f87171",
                                cursor: submitting ? "not-allowed" : "pointer",
                                opacity: submitting ? 0.6 : 1,
                            }}
                        >
                            Disputar
                        </button>
                    </div>
                )}

                {myVote && (
                    <p className="text-xs text-center text-white/30">
                        Ya votaste: <span style={{ color: myVote.vote === "agree" ? "#4ade80" : "#f87171" }}>
                            {myVote.vote === "agree" ? "De acuerdo" : "En desacuerdo"}
                        </span>
                    </p>
                )}
            </section>
        );
    }

    // ── Consensus reached ──
    const winnerParticipant = result.winner_user_id
        ? accepted.find((p) => p.user_id === result.winner_user_id)
        : null;

    return (
        <section
            className="flex flex-col gap-3 rounded-2xl p-5 text-center"
            style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
            }}
        >
            <p className="text-4xl">🏆</p>
            <p className="text-base font-black text-white">
                {result.result_type === "win" && winnerParticipant
                    ? `${winnerParticipant.display_name || winnerParticipant.username} gana`
                    : "Empate"}
            </p>
            <p className="text-xs text-white/30">Resultado confirmado por consenso</p>
        </section>
    );
}
