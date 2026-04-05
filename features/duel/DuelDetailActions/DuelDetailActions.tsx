"use client";

import type { Duel, DuelPlayer } from "@/lib/types/duel";

export interface DuelDetailActionsProps {
    duel: Duel;
    p1: DuelPlayer;
    p2: DuelPlayer;
    isChallenger: boolean;
    isOpponent: boolean;
    isMyDuel: boolean;
    isPending: boolean;
    isAwaiting: boolean;
    isDisputed: boolean;
    isCompleted: boolean;
    isReporter: boolean;
    iWon: boolean;
    hasScore: boolean;
    loading: string | null;
    introEligible: boolean;
    // Report user
    showReportUser: boolean;
    setShowReportUser: (v: boolean) => void;
    reportReason: string;
    setReportReason: (v: string) => void;
    // Handlers
    onAccept: () => void;
    onDecline: () => void;
    onCancel: () => void;
    onConfirm: () => void;
    onDispute: () => void;
    onReportUser: () => void;
}

export default function DuelDetailActions({
    duel,
    p1,
    p2,
    isChallenger,
    isOpponent,
    isMyDuel,
    isPending,
    isAwaiting,
    isDisputed,
    isCompleted,
    isReporter,
    iWon,
    hasScore,
    loading,
    introEligible,
    showReportUser,
    setShowReportUser,
    reportReason,
    setReportReason,
    onAccept,
    onDecline,
    onCancel,
    onConfirm,
    onDispute,
    onReportUser,
}: DuelDetailActionsProps) {
    const showActions = (isPending || isAwaiting || isDisputed) && isMyDuel;
    return (
        <>
            {/* Result banner (completed) */}
            {isCompleted && isMyDuel && (
                <div className="mb-4 p-4 rounded-xl border flex items-center gap-3" style={{
                    backgroundColor: iWon ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                    borderColor: iWon ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                }}>
                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{
                        backgroundColor: iWon ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                    }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iWon ? "var(--success)" : "var(--danger)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {iWon ? (
                                <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 22V11"/><path d="M14 22V11"/><path d="M8 7h8l-1 5H9L8 7Z"/></>
                            ) : (
                                <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
                            )}
                        </svg>
                    </div>
                    <div>
                        <p className="text-base font-extrabold" style={{ color: iWon ? "var(--success)" : "var(--danger)" }}>
                            {iWon ? "Victoria" : "Derrota"}
                        </p>
                        {hasScore && <p className="text-[11px] font-semibold text-muted">Resultado: {duel.challenger_wins} – {duel.opponent_wins}</p>}
                    </div>
                </div>
            )}
            {/* XP gained */}
            {isCompleted && duel.xp_gained != null && duel.xp_gained > 0 && (
                <div className="mb-4 p-3.5 rounded-xl border flex items-center gap-3" style={{
                    backgroundColor: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.15)",
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--warning)" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <div>
                        <span className="text-sm font-bold text-warning">+{duel.xp_gained} XP</span>
                        <p className="text-[11px] text-muted m-0">Duelo casual — no afecta tu ELO</p>
                    </div>
                </div>
            )}
            {/* Message */}
            {!!duel.message && (
                <div className="mb-4 p-4 rounded-xl border border-border bg-surface-solid flex items-start gap-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span className="text-[13px] italic leading-[19px] text-muted">&ldquo;{duel.message}&rdquo;</span>
                </div>
            )}
            {/* Actions section */}
            {showActions && (
                <div className="mb-4 flex flex-col gap-3" style={{ animation: introEligible ? "duelStagger3 0.8s cubic-bezier(0.16,1,0.3,1) both" : undefined }}>
                    {/* Pending: Accept/Decline (opponent) */}
                    {isPending && isOpponent && (
                        <div className="flex gap-2.5">
                            <button
                                onClick={onAccept}
                                disabled={!!loading}
                                className="flex-[2] py-3.5 rounded-xl border-none text-white text-[15px] font-extrabold bg-success"
                                style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, boxShadow: "0 4px 14px rgba(34,197,94,0.3)" }}
                            >
                                {loading === "Aceptar" ? "..." : "Aceptar duelo"}
                            </button>
                            <button
                                onClick={onDecline}
                                disabled={!!loading}
                                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-danger"
                                style={{ border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.08)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
                            >
                                {loading === "Rechazar" ? "..." : "Rechazar"}
                            </button>
                        </div>
                    )}

                    {/* Pending: Cancel (challenger) */}
                    {isPending && isChallenger && (
                        <button
                            onClick={onCancel}
                            disabled={!!loading}
                            className="py-3.5 rounded-xl text-sm font-bold border border-border bg-surface-solid text-muted"
                            style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
                        >
                            {loading === "Cancelar" ? "..." : "Cancelar desafio"}
                        </button>
                    )}

                    {/* Awaiting confirmation */}
                    {isAwaiting && isMyDuel && (
                        <div className="flex flex-col gap-3">
                            <div className="p-4 rounded-xl border flex items-center gap-3" style={{
                                backgroundColor: "rgba(168,85,247,0.06)", borderColor: "rgba(168,85,247,0.15)",
                            }}>
                                <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(168,85,247,0.12)" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[13px] font-bold text-foreground">Resultado reportado</p>
                                    <p className="text-xl font-black tracking-tight text-purple">{duel.challenger_wins} – {duel.opponent_wins}</p>
                                </div>
                            </div>
                            {isReporter ? (
                                <div className="flex items-center justify-center gap-2 p-3 rounded-lg" style={{ backgroundColor: "rgba(168,85,247,0.04)" }}>
                                    <div className="animate-spin w-3.5 h-3.5 border-2 border-purple-200 border-t-purple-500 rounded-full" />
                                    <span className="text-xs font-semibold text-muted">Esperando confirmacion del oponente</span>
                                </div>
                            ) : (
                                <div className="flex gap-2.5">
                                    <button
                                        onClick={onConfirm}
                                        disabled={!!loading}
                                        className="flex-[2] py-3.5 rounded-xl border-none text-white text-[15px] font-extrabold bg-success"
                                        style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, boxShadow: "0 4px 14px rgba(34,197,94,0.3)" }}
                                    >
                                        {loading === "Confirmar" ? "..." : "Confirmar resultado"}
                                    </button>
                                    <button
                                        onClick={onDispute}
                                        disabled={!!loading}
                                        className="flex-1 py-3.5 rounded-xl text-sm font-bold text-danger"
                                        style={{ border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.08)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
                                    >
                                        {loading === "Disputar" ? "..." : "Disputar"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Disputed */}
                    {isDisputed && (
                        <div className="p-3.5 rounded-xl border flex items-center gap-2.5" style={{ backgroundColor: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <span className="text-[11px] font-semibold text-danger">Resultado disputado — esperando moderador</span>
                        </div>
                    )}
                </div>
            )}
            {/* Report opponent */}
            {isCompleted && isMyDuel && (
                <div className="mb-4">
                    {!showReportUser ? (
                        <button
                            onClick={() => setShowReportUser(true)}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-transparent border-none cursor-pointer"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                            <span className="text-[11px] text-muted">Reportar oponente</span>
                        </button>
                    ) : (
                        <div className="p-4 rounded-xl border border-border bg-surface-solid flex flex-col gap-3">
                            <span className="text-[13px] font-bold text-foreground">
                                Reportar a @{isChallenger ? p2.username : p1.username}
                            </span>
                            <textarea
                                placeholder="Motivo del reporte..."
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                maxLength={300} rows={3}
                                className="w-full text-[13px] outline-none resize-none rounded-[10px] border border-border bg-surface-tertiary text-foreground font-[inherit] px-3 py-2.5"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setShowReportUser(false); setReportReason(""); }}
                                    className="flex-1 py-3 rounded-xl text-[13px] font-bold border border-border bg-surface text-muted cursor-pointer"
                                >Cancelar</button>
                                <button
                                    onClick={onReportUser}
                                    disabled={!reportReason.trim() || loading === "reportUser"}
                                    className="flex-[2] py-3 rounded-xl border-none text-[13px] font-bold text-white bg-danger"
                                    style={{ cursor: !reportReason.trim() ? "not-allowed" : "pointer", opacity: reportReason.trim() ? 1 : 0.4 }}
                                >
                                    {loading === "reportUser" ? "Enviando..." : "Enviar reporte"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
