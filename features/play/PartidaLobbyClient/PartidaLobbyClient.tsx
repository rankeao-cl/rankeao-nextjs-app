"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react/toast";
import { useAuth } from "@/lib/hooks/use-auth";
import { usePartidaSocket } from "@/lib/hooks/use-partida-socket";
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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Participant row ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
    invited: "Invitado",
    accepted: "Listo",
    declined: "Rechazó",
    kicked: "Expulsado",
};

function ParticipantRow({ participant, isMe }: { participant: Participant; isMe: boolean }) {
    const isActive = participant.status === "accepted";
    return (
        <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
                background: isMe ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isMe ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)"}`,
            }}
        >
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
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                    {participant.display_name || participant.username}
                    {isMe && <span className="text-xs text-white/30 font-normal ml-1">(tú)</span>}
                </p>
                <p className="text-[10px] text-white/30">Asiento {participant.seat}</p>
            </div>
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

// ── Invite panel ──────────────────────────────────────────────────────────────

function InvitePanel({ partidaId, maxPlayers, accepted }: { partidaId: string; maxPlayers: number; accepted: number }) {
    const [copied, setCopied] = useState(false);
    const link = typeof window !== "undefined"
        ? `${window.location.origin}/matches/${partidaId}`
        : `/matches/${partidaId}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.danger("Error", { description: "No se pudo copiar el enlace" });
        }
    };

    const canShare = typeof navigator !== "undefined" && "share" in navigator;

    const handleShare = async () => {
        try {
            await navigator.share({ title: "Únete a mi partida en Rankeao", url: link });
        } catch { /* user cancelled */ }
    };

    const spots = maxPlayers - accepted;

    return (
        <section
            className="flex flex-col gap-3 rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Invitar jugadores</p>
                <span className="text-xs text-white/30">{spots} lugar{spots !== 1 ? "es" : ""} libre{spots !== 1 ? "s" : ""}</span>
            </div>

            <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
                <p className="flex-1 text-xs text-white/50 truncate font-mono">{link}</p>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleCopy}
                    className="flex-1 rounded-xl py-2.5 text-xs font-bold transition-colors"
                    style={{
                        background: copied ? "rgba(34,197,94,0.2)" : "rgba(99,102,241,0.15)",
                        border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(99,102,241,0.3)"}`,
                        color: copied ? "#4ade80" : "#a5b4fc",
                        cursor: "pointer",
                    }}
                >
                    {copied ? "¡Copiado!" : "Copiar enlace"}
                </button>
                {canShare && (
                    <button
                        onClick={handleShare}
                        className="flex-1 rounded-xl py-2.5 text-xs font-bold"
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.7)",
                            cursor: "pointer",
                        }}
                    >
                        Compartir
                    </button>
                )}
            </div>
        </section>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

interface PartidaLobbyClientProps {
    partidaId: string;
    initialPartida?: Partida | null;
}

export default function PartidaLobbyClient({ partidaId, initialPartida }: PartidaLobbyClientProps) {
    const router = useRouter();
    const { session: authSession, status: authStatus } = useAuth();
    const token = authSession?.accessToken ?? null;
    const currentUsername = authSession?.username ?? null;

    // Derive user ID from JWT (numeric sub field)
    const currentUserId = useMemo(() => {
        const raw = getJwtField(token ?? undefined, "sub") ?? getJwtField(token ?? undefined, "user_id");
        return raw ? parseInt(raw, 10) : null;
    }, [token]);

    const [partida, setPartida] = useState<Partida | null>(initialPartida ?? null);
    const [result, setResult] = useState<PlayResult | null>(null);
    const [loading, setLoading] = useState(!initialPartida);
    const [actionLoading, setActionLoading] = useState(false);

    const load = useCallback(async () => {
        try {
            const [pRes, rRes] = await Promise.allSettled([
                getPartida(partidaId),
                getResult(partidaId),
            ]);
            if (pRes.status === "fulfilled" && pRes.value.data) setPartida(pRes.value.data);
            // 404 on result is expected when no result exists yet — not an error
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

    // Derive identity — compare by username (reliable) AND user_id (when available)
    const myParticipant = useMemo(() => {
        if (!partida) return null;
        return partida.participants.find(
            (p) =>
                (currentUsername && p.username === currentUsername) ||
                (currentUserId !== null && p.user_id === currentUserId)
        ) ?? null;
    }, [partida, currentUsername, currentUserId]);

    const isHost = useMemo(() => {
        if (!partida) return false;
        // Primary: numeric ID match
        if (currentUserId !== null && partida.host_user_id === currentUserId) return true;
        // Fallback: the host participant (seat 1, accepted) has matching username
        if (currentUsername) {
            const hostParticipant = partida.participants.find(
                (p) => p.user_id === partida.host_user_id
            );
            return hostParticipant?.username === currentUsername;
        }
        return false;
    }, [partida, currentUserId, currentUsername]);

    const isAccepted = myParticipant?.status === "accepted";

    // Auto-redirect to jugar when tracker is active
    useEffect(() => {
        if (!partida || !myParticipant) return;
        if (partida.status === "active" && myParticipant.status === "accepted") {
            router.replace(`/matches/${partidaId}/jugar`);
        }
    }, [partida, myParticipant, partidaId, router]);

    // WS lobby updates
    usePartidaSocket(partidaId, token, {
        onSync: useCallback((p: Partida) => setPartida(p), []),
        onParticipantJoined: useCallback((p: Partida) => setPartida(p), []),
        onParticipantLeft: useCallback((p: Partida) => setPartida(p), []),
        onTrackerStarted: useCallback(
            (p: Partida) => {
                setPartida(p);
                // Redirect is handled by the useEffect above when partida updates
            },
            []
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

    const accepted = partida.participants.filter((p) => p.status === "accepted");
    const canStart = isHost && partida.status === "lobby" && accepted.length >= 2;
    const hasOpenSpots = accepted.length < partida.max_players;

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
        } catch {
            toast.danger("Error", { description: "No se pudo iniciar la partida" });
            setActionLoading(false);
        }
    };

    const modeLabel = `${partida.game_slug.toUpperCase()} · ${partida.mode_slug}`;

    return (
        <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-5">
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
                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Jugadores</p>
                    <p className="text-xs text-white/30">{accepted.length}/{partida.max_players}</p>
                </div>
                {partida.participants.length === 0 ? (
                    <p className="text-xs text-white/20 py-4 text-center">Sin participantes aún</p>
                ) : (
                    partida.participants
                        .sort((a, b) => a.seat - b.seat)
                        .map((p) => (
                            <ParticipantRow
                                key={p.id}
                                participant={p}
                                isMe={
                                    (!!currentUsername && p.username === currentUsername) ||
                                    (currentUserId !== null && p.user_id === currentUserId)
                                }
                            />
                        ))
                )}
            </section>

            {/* Invite panel — show in lobby when there are open spots */}
            {partida.status === "lobby" && hasOpenSpots && (
                <InvitePanel
                    partidaId={partidaId}
                    maxPlayers={partida.max_players}
                    accepted={accepted.length}
                />
            )}

            {/* Result voting */}
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
                    {/* Join — only for non-participants with open spots */}
                    {!myParticipant && hasOpenSpots && (
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

                    {/* Leave — non-host accepted participants */}
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

                    {/* Host controls */}
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

            {/* Active: go to game */}
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

            {/* Result submission — host in active match, no result yet */}
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
