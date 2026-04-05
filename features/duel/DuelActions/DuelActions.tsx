"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react/toast";

import { useAuth } from "@/lib/hooks/use-auth";
import { mapErrorMessage } from "@/lib/api/errors";
import { acceptDuel, declineDuel, cancelDuel, reportDuelResult, confirmDuelResult, disputeDuel } from "@/lib/api/duels";
import type { DuelStatus } from "@/lib/types/duel";

interface DuelActionsProps {
    duelId: string;
    status: DuelStatus;
    bestOf: number;
    hasWinner: boolean;
    challengerId: string;
    opponentId: string;
}

export default function DuelActions({ duelId, status, bestOf, hasWinner, challengerId, opponentId }: DuelActionsProps) {
    const { session } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [showReportForm, setShowReportForm] = useState(false);
    const [challengerWins, setChallengerWins] = useState(0);
    const [opponentWins, setOpponentWins] = useState(0);

    const isPending = status === "PENDING";
    const isActive = ["ACCEPTED", "IN_PROGRESS"].includes(status);
    const isAwaiting = status === "AWAITING_CONFIRMATION";
    const isCompleted = status === "COMPLETED";

    const token = session?.accessToken;

    const exec = async (label: string, fn: () => Promise<unknown>) => {
        if (!token) {
            toast.danger("Error", { description: "Debes iniciar sesion" });
            return;
        }
        setLoading(label);
        try {
            await fn();
            toast.success("Listo", { description: `Accion "${label}" realizada` });
            router.refresh();
        } catch (err: unknown) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    };

    const handleReport = async () => {
        if (!token) return;
        const maxWins = Math.ceil(bestOf / 2);
        if (challengerWins + opponentWins === 0) {
            toast.danger("Error", { description: "Ingresa al menos un resultado" });
            return;
        }
        if (challengerWins > maxWins || opponentWins > maxWins) {
            toast.danger("Error", { description: `Maximo ${maxWins} victorias en Bo${bestOf}` });
            return;
        }
        // Determine winner based on scores
        const winnerId = challengerWins > opponentWins ? challengerId : opponentId;
        setLoading("report");
        try {
            await reportDuelResult(duelId, {
                winner_id: winnerId,
                score_challenger: challengerWins,
                score_challenged: opponentWins,
            }, token);
            toast.success("Resultado reportado");
            setShowReportForm(false);
            router.refresh();
        } catch (err: unknown) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    };

    const btnStyle = (bg: string, color: string, flex?: number) => ({
        flex: flex ?? 1,
        padding: "12px 20px",
        borderRadius: 12,
        border: "none",
        backgroundColor: bg,
        cursor: loading ? "not-allowed" as const : "pointer" as const,
        fontSize: 13,
        fontWeight: 700 as const,
        color,
        opacity: loading ? 0.6 : 1,
        transition: "all 0.15s",
    });

    if (!isPending && !isActive && !isAwaiting && !(isCompleted && hasWinner)) return null;

    return (
        <div style={{
            backgroundColor: "var(--surface-solid)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 20,
        }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: 0, marginBottom: 14 }}>
                {isAwaiting ? "Confirmar resultado" : isCompleted ? "Resultado" : "Acciones"}
            </h3>

            {/* Pending: Accept / Decline */}
            {isPending && (
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => exec("Aceptar", () => acceptDuel(duelId, token))}
                        disabled={!!loading}
                        style={btnStyle("var(--success)", "#FFFFFF")}
                    >
                        {loading === "Aceptar" ? "Aceptando..." : "Aceptar"}
                    </button>
                    <button
                        onClick={() => exec("Rechazar", () => declineDuel(duelId, token))}
                        disabled={!!loading}
                        style={{ ...btnStyle("var(--surface)", "var(--danger)"), border: "1px solid var(--border)" }}
                    >
                        {loading === "Rechazar" ? "Rechazando..." : "Rechazar"}
                    </button>
                </div>
            )}

            {/* Active: Report / Cancel */}
            {isActive && !showReportForm && (
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => setShowReportForm(true)}
                        disabled={!!loading}
                        style={btnStyle("var(--accent)", "#FFFFFF")}
                    >
                        Reportar resultado
                    </button>
                    <button
                        onClick={() => exec("Cancelar", () => cancelDuel(duelId, token))}
                        disabled={!!loading}
                        style={{ ...btnStyle("var(--surface)", "var(--muted)"), flex: undefined, border: "1px solid var(--border)" }}
                    >
                        {loading === "Cancelar" ? "Cancelando..." : "Cancelar"}
                    </button>
                </div>
            )}

            {/* Report form */}
            {isActive && showReportForm && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <label style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Challenger</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button
                                    onClick={() => setChallengerWins(Math.max(0, challengerWins - 1))}
                                    style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)", cursor: "pointer", fontSize: 16, fontWeight: 700 }}
                                >
                                    -
                                </button>
                                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", minWidth: 24, textAlign: "center" as const }}>{challengerWins}</span>
                                <button
                                    onClick={() => setChallengerWins(challengerWins + 1)}
                                    style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)", cursor: "pointer", fontSize: 16, fontWeight: 700 }}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--muted)", marginTop: 20 }}>-</span>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <label style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Oponente</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button
                                    onClick={() => setOpponentWins(Math.max(0, opponentWins - 1))}
                                    style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)", cursor: "pointer", fontSize: 16, fontWeight: 700 }}
                                >
                                    -
                                </button>
                                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", minWidth: 24, textAlign: "center" as const }}>{opponentWins}</span>
                                <button
                                    onClick={() => setOpponentWins(opponentWins + 1)}
                                    style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)", cursor: "pointer", fontSize: 16, fontWeight: 700 }}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            onClick={() => { setShowReportForm(false); setChallengerWins(0); setOpponentWins(0); }}
                            style={{ ...btnStyle("var(--surface)", "var(--muted)"), border: "1px solid var(--border)" }}
                        >
                            Volver
                        </button>
                        <button
                            onClick={handleReport}
                            disabled={!!loading}
                            style={btnStyle("var(--accent)", "#FFFFFF", 2)}
                        >
                            {loading === "report" ? "Enviando..." : "Enviar resultado"}
                        </button>
                    </div>
                </div>
            )}

            {/* Awaiting confirmation: Confirm / Dispute */}
            {isAwaiting && (
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => exec("Confirmar", () => confirmDuelResult(duelId, token))}
                        disabled={!!loading}
                        style={btnStyle("var(--success)", "#FFFFFF")}
                    >
                        {loading === "Confirmar" ? "Confirmando..." : "Confirmar resultado"}
                    </button>
                    <button
                        onClick={() => exec("Disputar", () => disputeDuel(duelId, token))}
                        disabled={!!loading}
                        style={{ ...btnStyle("rgba(239,68,68,0.06)", "var(--danger)"), border: "1px solid rgba(239,68,68,0.3)" }}
                    >
                        {loading === "Disputar" ? "Disputando..." : "Disputar"}
                    </button>
                </div>
            )}
        </div>
    );
}
