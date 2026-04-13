"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react/toast";
import { useAuth } from "@/lib/hooks/use-auth";
import { usePartidaSocket } from "@/lib/hooks/use-partida-socket";

function getJwtField(token: string | undefined, field: string): string | undefined {
    if (!token) return undefined;
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return undefined;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        return payload[field] as string | undefined;
    } catch {
        return undefined;
    }
}
import {
    getPartida,
    startTracker,
    joinPartida,
    leavePartida,
    cancelPartida,
    submitResult,
    voteResult,
    getResult,
} from "@/lib/api/play";
import type { Partida, Participant, PlayResult } from "@/lib/api/play";
import ResultVotingPanel from "@/features/play/ResultVotingPanel/ResultVotingPanel";

const STATUS_LABEL: Record<string, string> = {
    invited: "Invitado",
    accepted: "Listo",
    declined: "Rechazó",
    kicked: "Expulsado",
};

function ParticipantRow({ participant }: { participant: Participant }) {
    const isActive = participant.status === "accepted";
    return (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
            {/* Avatar placeholder */}
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                    background: isActive ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${isActive ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                }}
            >
                <span className="text-xs font-bold text-white/80">
                    {(participant.display_name || participant.username).charAt(0).toUpperCase()}
                </span>
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                    {participant.display_name || participant.username}
                </p>
                <p className="text-[10px] text-white/30">Asiento {participant.seat}</p>
            </div>

            {/* Status */}
            <span
                className="text-[10px] font-bold rounded-full px-2.5 py-1"
                style={{
                    background: isActive ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                    color: isActive ? "#4ade80" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${isActive ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}
            >
                {STATUS_LABEL[participant.status] ?? participant.status}
            </span>
        </div>
    );
}

interface PartidaLobbyClientProps {
    partidaId: string;
    initialPartida?: Partida | null;
}

export default function PartidaLobbyClient({ partidaId, initialPartida }: PartidaLobbyClientProps) {
    const router = useRouter();
    const { session: authSession, status: authStatus } = useAuth();
    const token = authSession?.accessToken ?? null;
    const currentUserId = useMemo(() => {
        const raw = getJwtField(token ?? undefined, "sub") ?? getJwtField(token ?? undefined, "user_id");
        return raw ? parseInt(raw, 10) : null;
    }, [token]);

    const [partida, setPartida] = useState<Partida | null>(initialPartida ?? null);
    const [result, setResult] = useState<PlayResult | null>(null);
    const [loading, setLoading] = useState(!initialPartida);
    const [actionLoading, setActionLoading] = useState(false);

    // Load partida + result
    const load = useCallback(async () => {
        try {
            const [pRes, rRes] = await Promise.allSettled([
                getPartida(partidaId),
                getResult(partidaId),
            ]);
            if (pRes.status === "fulfilled" && pRes.value.data) setPartida(pRes.value.data);
            if (rRes.status === "fulfilled" && rRes.value.data) setResult(rRes.value.data);
        } catch {
            toast.danger("Error", { description: "No se pudo cargar la partida" });
        } finally {
            setLoading(false);
        }
    }, [partidaId]);

    useEffect(() => {
        if (!initialPartida) load();
    }, [initialPartida, load]);

    // Auto-redirect to jugar when tracker is active
    useEffect(() => {
        if (!partida || !currentUserId) return;
        if (partida.status === "active") {
            const isParticipant = partida.participants.some(
                (p) => p.user_id === currentUserId && p.status === "accepted"
            );
            if (isParticipant) {
                router.replace(`/matches/${partidaId}/jugar`);
            }
        }
    }, [partida, currentUserId, partidaId, router]);

    // WS lobby updates
    usePartidaSocket(partidaId, token, {
        onSync: useCallback((p: Partida) => setPartida(p), []),
        onParticipantJoined: useCallback((p: Partida) => setPartida(p), []),
        onParticipantLeft: useCallback((p: Partida) => setPartida(p), []),
        onTrackerStarted: useCallback(
            (p: Partida) => {
                setPartida(p);
                if (!currentUserId) return;
                const isParticipant = p.participants.some(
                    (part) => part.user_id === currentUserId && part.status === "accepted"
                );
                if (isParticipant) router.replace(`/matches/${partidaId}/jugar`);
            },
            [currentUserId, partidaId, router]
        ),
        onResultSubmitted: useCallback((r: PlayResult) => setResult(r), []),
        onResultConfirmed: useCallback((r: PlayResult) => {
            setResult(r);
            load();
        }, [load]),
        onCancelled: useCallback(() => {
            toast.danger("Partida cancelada");
            router.replace("/matches");
        }, [router]),
    });

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-7 h-7 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
        );
    }

    if (!partida) {
        return (
            <div className="flex flex-col items-center py-20 gap-3">
                <p className="text-white/30 text-sm">Partida no encontrada</p>
                <button
                    onClick={() => router.push("/matches")}
                    className="text-indigo-400 text-sm font-bold"
                    style={{ cursor: "pointer", background: "none", border: "none" }}
                >
                    Volver
                </button>
            </div>
        );
    }

    const isHost = partida.host_user_id === currentUserId;
    const myParticipant = partida.participants.find((p) => p.user_id === currentUserId);
    const isParticipant = !!myParticipant;
    const isAccepted = myParticipant?.status === "accepted";
    const accepted = partida.participants.filter((p) => p.status === "accepted");
    const canStart = isHost && partida.status === "lobby" && accepted.length >= 2;

    // ── Actions ──

    const handleJoin = async () => {
        setActionLoading(true);
        try {
            const res = await joinPartida(partidaId);
            if (res.data) setPartida(res.data);
        } catch {
            toast.danger("Error", { description: "No te pudiste unir" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeave = async () => {
        if (!confirm("¿Abandonar la partida?")) return;
        setActionLoading(true);
        try {
            await leavePartida(partidaId);
            router.replace("/matches");
        } catch {
            toast.danger("Error", { description: "No se pudo abandonar" });
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("¿Cancelar y disolver el lobby?")) return;
        setActionLoading(true);
        try {
            await cancelPartida(partidaId);
            router.replace("/matches");
        } catch {
            toast.danger("Error", { description: "No se pudo cancelar" });
            setActionLoading(false);
        }
    };

    const handleStart = async () => {
        setActionLoading(true);
        try {
            await startTracker(partidaId);
            // WS onTrackerStarted will redirect all participants
        } catch {
            toast.danger("Error", { description: "No se pudo iniciar el tracker" });
            setActionLoading(false);
        }
    };

    const modeLabel = `${partida.game_slug.toUpperCase()} · ${partida.mode_slug}`;

    return (
        <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push("/matches")}
                        className="text-xs text-white/30 mb-2 flex items-center gap-1"
                        style={{ cursor: "pointer", background: "none", border: "none" }}
                    >
                        ← Partidas
                    </button>
                    <h1 className="text-xl font-black text-white">
                        {partida.title || modeLabel}
                    </h1>
                    <p className="text-xs text-white/40 mt-1">{modeLabel}</p>
                </div>

                {/* Status pill */}
                <span
                    className="flex-shrink-0 text-xs font-bold rounded-full px-3 py-1.5"
                    style={{
                        background: partida.status === "active" ? "rgba(34,197,94,0.15)"
                            : partida.status === "lobby" ? "rgba(99,102,241,0.15)"
                            : "rgba(255,255,255,0.06)",
                        color: partida.status === "active" ? "#4ade80"
                            : partida.status === "lobby" ? "#a5b4fc"
                            : "rgba(255,255,255,0.4)",
                        border: `1px solid ${
                            partida.status === "active" ? "rgba(34,197,94,0.3)"
                            : partida.status === "lobby" ? "rgba(99,102,241,0.3)"
                            : "rgba(255,255,255,0.08)"
                        }`,
                    }}
                >
                    {partida.status === "lobby" ? "Esperando"
                        : partida.status === "active" ? "En curso"
                        : partida.status === "completed" ? "Terminada"
                        : "Cancelada"}
                </span>
            </div>

            {/* Participants */}
            <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
                        Jugadores
                    </p>
                    <p className="text-xs text-white/30">
                        {accepted.length}/{partida.max_players}
                    </p>
                </div>

                {partida.participants.length === 0 ? (
                    <p className="text-xs text-white/20 py-4 text-center">Sin participantes aún</p>
                ) : (
                    partida.participants
                        .sort((a, b) => a.seat - b.seat)
                        .map((p) => <ParticipantRow key={p.id} participant={p} />)
                )}
            </section>

            {/* Voting panel (if result exists) */}
            {result && (
                <ResultVotingPanel
                    partida={partida}
                    result={result}
                    currentUserId={currentUserId}
                    onVote={async (vote) => {
                        try {
                            const res = await voteResult(partidaId, vote);
                            if (res.data) setResult(res.data);
                        } catch {
                            toast.danger("Error", { description: "No se pudo votar" });
                        }
                    }}
                    onSubmitResult={async (body) => {
                        try {
                            const res = await submitResult(partidaId, body);
                            if (res.data) setResult(res.data);
                        } catch {
                            toast.danger("Error", { description: "No se pudo enviar el resultado" });
                        }
                    }}
                />
            )}

            {/* Actions */}
            {partida.status === "lobby" && (
                <div className="flex flex-col gap-3">
                    {/* Join / leave (non-host) */}
                    {!isHost && !isAccepted && (
                        <button
                            onClick={handleJoin}
                            disabled={actionLoading}
                            className="w-full rounded-xl py-3.5 text-sm font-bold text-white"
                            style={{
                                background: actionLoading ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.9)",
                                border: "1px solid rgba(99,102,241,0.6)",
                                cursor: actionLoading ? "not-allowed" : "pointer",
                            }}
                        >
                            {actionLoading ? "Uniéndose..." : "Unirse al lobby"}
                        </button>
                    )}
                    {!isHost && isAccepted && (
                        <button
                            onClick={handleLeave}
                            disabled={actionLoading}
                            className="w-full rounded-xl py-3.5 text-sm font-bold"
                            style={{
                                background: "rgba(239,68,68,0.1)",
                                border: "1px solid rgba(239,68,68,0.3)",
                                color: "#f87171",
                                cursor: actionLoading ? "not-allowed" : "pointer",
                            }}
                        >
                            Abandonar
                        </button>
                    )}

                    {/* Host: start + cancel */}
                    {isHost && (
                        <>
                            <button
                                onClick={handleStart}
                                disabled={!canStart || actionLoading}
                                className="w-full rounded-xl py-3.5 text-sm font-bold text-white"
                                style={{
                                    background: canStart && !actionLoading
                                        ? "rgba(34,197,94,0.85)"
                                        : "rgba(255,255,255,0.08)",
                                    border: `1px solid ${canStart ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.08)"}`,
                                    color: canStart ? "white" : "rgba(255,255,255,0.3)",
                                    cursor: canStart && !actionLoading ? "pointer" : "not-allowed",
                                }}
                            >
                                {actionLoading ? "Iniciando..." : canStart
                                    ? "Iniciar partida"
                                    : `Esperando jugadores (${accepted.length}/${partida.max_players})`}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={actionLoading}
                                className="w-full rounded-xl py-3 text-sm font-bold"
                                style={{
                                    background: "rgba(239,68,68,0.08)",
                                    border: "1px solid rgba(239,68,68,0.2)",
                                    color: "#f87171",
                                    cursor: actionLoading ? "not-allowed" : "pointer",
                                }}
                            >
                                Cancelar lobby
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Active: go to game button (in case redirect didn't fire) */}
            {partida.status === "active" && isAccepted && (
                <button
                    onClick={() => router.push(`/matches/${partidaId}/jugar`)}
                    className="w-full rounded-xl py-3.5 text-sm font-bold text-white"
                    style={{
                        background: "rgba(34,197,94,0.85)",
                        border: "1px solid rgba(34,197,94,0.5)",
                        cursor: "pointer",
                    }}
                >
                    Ir a la partida
                </button>
            )}

            {/* Result submission (host, active/completed, no result yet) */}
            {!result && partida.status === "active" && isHost && (
                <ResultVotingPanel
                    partida={partida}
                    result={null}
                    currentUserId={currentUserId}
                    onVote={async () => {}}
                    onSubmitResult={async (body) => {
                        try {
                            const res = await submitResult(partidaId, body);
                            if (res.data) setResult(res.data);
                        } catch {
                            toast.danger("Error", { description: "No se pudo enviar el resultado" });
                        }
                    }}
                />
            )}
        </div>
    );
}
