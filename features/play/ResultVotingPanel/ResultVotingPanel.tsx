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
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                }}
            >
                <p className="text-sm font-bold text-foreground">Proponer resultado</p>

                {/* Result type */}
                <div className="flex gap-2">
                    {(["win", "draw"] as ResultType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setResultType(type)}
                            className="flex-1 rounded-xl py-2.5 text-sm font-bold"
                            style={{
                                background: resultType === type
                                    ? "color-mix(in srgb, var(--accent) 18%, transparent)"
                                    : "var(--surface-solid-secondary)",
                                border: `1px solid ${resultType === type
                                    ? "color-mix(in srgb, var(--accent) 40%, transparent)"
                                    : "var(--border)"}`,
                                color: resultType === type ? "var(--accent)" : "var(--muted)",
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
                        <p className="text-xs text-muted">Ganador</p>
                        {accepted.map((p) => (
                            <button
                                key={p.user_id}
                                onClick={() => setSelectedWinner(p.user_id)}
                                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-left"
                                style={{
                                    background: selectedWinner === p.user_id
                                        ? "color-mix(in srgb, var(--success) 14%, transparent)"
                                        : "var(--surface-solid-secondary)",
                                    border: `1px solid ${selectedWinner === p.user_id
                                        ? "color-mix(in srgb, var(--success) 35%, transparent)"
                                        : "var(--border)"}`,
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{
                                        background: selectedWinner === p.user_id ? "var(--success)" : "var(--muted)",
                                    }}
                                />
                                <span className="text-sm font-semibold text-foreground">
                                    {p.display_name || p.username}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={submitting || (resultType === "win" && !selectedWinner)}
                    className="w-full rounded-xl py-3 text-sm font-bold"
                    style={{
                        background: "var(--accent)",
                        color: "var(--accent-foreground)",
                        border: "1px solid color-mix(in srgb, var(--accent) 70%, transparent)",
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
                    background: "color-mix(in srgb, var(--accent) 10%, var(--surface))",
                    border: "1px solid color-mix(in srgb, var(--accent) 24%, transparent)",
                }}
            >
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">Resultado propuesto</p>
                    <span className="text-xs text-muted">
                        {agreeCount}/{accepted.length} votos
                    </span>
                </div>

                {/* Proposed result summary */}
                <div className="rounded-xl px-4 py-3"
                    style={{ background: "var(--surface-solid-secondary)", border: "1px solid var(--border)" }}
                >
                    {result.result_type === "win" && winnerParticipant ? (
                        <p className="text-sm text-foreground">
                            Ganador: <span className="font-bold">{winnerParticipant.display_name || winnerParticipant.username}</span>
                        </p>
                    ) : (
                        <p className="text-sm text-foreground font-bold">Empate</p>
                    )}
                </div>

                {/* Current votes */}
                <div className="flex flex-col gap-1.5">
                    {result.votes.map((vote) => {
                        const voter = accepted.find((p) => p.user_id === vote.participant_user_id);
                        return (
                            <div key={vote.id} className="flex items-center justify-between text-xs">
                                <span className="text-muted">{voter?.display_name ?? `Usuario ${vote.participant_user_id}`}</span>
                                <span style={{ color: vote.vote === "agree" ? "var(--success)" : "var(--danger)" }}>
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
                                background: "color-mix(in srgb, var(--success) 14%, transparent)",
                                border: "1px solid color-mix(in srgb, var(--success) 35%, transparent)",
                                color: "var(--success)",
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
                                background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                                border: "1px solid color-mix(in srgb, var(--danger) 32%, transparent)",
                                color: "var(--danger)",
                                cursor: submitting ? "not-allowed" : "pointer",
                                opacity: submitting ? 0.6 : 1,
                            }}
                        >
                            Disputar
                        </button>
                    </div>
                )}

                {myVote && (
                    <p className="text-xs text-center text-muted">
                        Ya votaste: <span style={{ color: myVote.vote === "agree" ? "var(--success)" : "var(--danger)" }}>
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
                background: "color-mix(in srgb, var(--success) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--success) 28%, transparent)",
            }}
        >
            <p className="text-4xl">🏆</p>
            <p className="text-base font-black text-foreground">
                {result.result_type === "win" && winnerParticipant
                    ? `${winnerParticipant.display_name || winnerParticipant.username} gana`
                    : "Empate"}
            </p>
            <p className="text-xs text-muted">Resultado confirmado por consenso</p>
        </section>
    );
}
