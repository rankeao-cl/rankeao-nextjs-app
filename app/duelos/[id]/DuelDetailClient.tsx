"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { mapErrorMessage } from "@/lib/api/errors";
import { timeAgo } from "@/lib/utils/format";
import {
    acceptDuel,
    declineDuel,
    cancelDuel,
    reportDuelResult,
    confirmDuelResult,
    disputeDuel,
    getDuelComments,
    createDuelComment,
    reportDuelOpponent,
    getDuel,
} from "@/lib/api/duels";
import type { Duel, DuelStatus } from "@/lib/types/duel";


const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente", color: "#F59E0B" },
    ACCEPTED: { label: "Aceptado", color: "#3B82F6" },
    IN_PROGRESS: { label: "En curso", color: "#22C55E" },
    AWAITING_CONFIRMATION: { label: "Esperando confirmacion", color: "#A855F7" },
    COMPLETED: { label: "Finalizado", color: "#6B7280" },
    DECLINED: { label: "Rechazado", color: "#EF4444" },
    CANCELLED: { label: "Cancelado", color: "#6B7280" },
    DISPUTED: { label: "Disputado", color: "#EF4444" },
};

// ── PlayerCard ──

function PlayerCard({ player, wins, isWinner, isMe }: {
    player: Duel["challenger"];
    wins?: number;
    isWinner: boolean;
    isMe: boolean;
}) {
    return (
        <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: 14,
            borderRadius: 14,
            backgroundColor: isWinner ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
            border: isWinner ? "1px solid rgba(34,197,94,0.15)" : isMe ? "1px solid rgba(59,130,246,0.15)" : "none",
        }}>
            {player.avatar_url ? (
                <Image src={player.avatar_url} alt={player.username} width={52} height={52} style={{ borderRadius: 999, objectFit: "cover" }} />
            ) : (
                <div style={{ width: 52, height: 52, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#888891" }}>
                        {player.username.charAt(0).toUpperCase()}
                    </span>
                </div>
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: isWinner ? "#22C55E" : "#F2F2F2", textAlign: "center" }}>
                {player.display_name || player.username}
            </span>
            <span style={{ fontSize: 10, color: "#888891" }}>@{player.username}</span>
            {wins != null && (
                <span style={{ fontSize: 28, fontWeight: 800, color: isWinner ? "#22C55E" : "#F2F2F2", marginTop: 4 }}>
                    {wins}
                </span>
            )}
            {isWinner && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "#22C55E", backgroundColor: "rgba(34,197,94,0.1)", padding: "2px 8px", borderRadius: 999, marginTop: 2 }}>
                    GANADOR
                </span>
            )}
            {isMe && !isWinner && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "#3B82F6", backgroundColor: "rgba(59,130,246,0.1)", padding: "2px 8px", borderRadius: 999, marginTop: 2 }}>
                    TU
                </span>
            )}
        </div>
    );
}

// ── Comment type ──

interface DuelComment {
    id: string;
    username?: string;
    avatar_url?: string;
    content?: string;
    text?: string;
    created_at?: string;
}

// ── Main Component ──

interface DuelDetailClientProps {
    duelId: string;
    initialDuel: Duel | null;
}

export default function DuelDetailClient({ duelId, initialDuel }: DuelDetailClientProps) {
    const router = useRouter();
    const { session } = useAuth();
    const myUsername = session?.username;
    const token = session?.accessToken;

    const [duel, setDuel] = useState<Duel | null>(initialDuel);
    const [initialLoading, setInitialLoading] = useState(!initialDuel);
    const [loading, setLoading] = useState<string | null>(null);

    // Report form
    const [showReport, setShowReport] = useState(false);
    const [myWins, setMyWins] = useState(0);
    const [oppWins, setOppWins] = useState(0);

    // Comments
    const [comments, setComments] = useState<DuelComment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [sendingComment, setSendingComment] = useState(false);

    // Report opponent
    const [showReportUser, setShowReportUser] = useState(false);
    const [reportReason, setReportReason] = useState("");

    // Fetch comments
    const fetchComments = useCallback(async () => {
        if (!token) return;
        try {
            const raw = await getDuelComments(duelId, token) as any;
            const list: DuelComment[] = raw?.data?.comments ?? raw?.comments ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
            setComments(list);
        } catch { /* silent */ }
    }, [duelId, token]);

    // Refresh duel
    const refreshDuel = useCallback(async () => {
        try {
            const res = await getDuel(duelId, token);
            if (res?.duel) {
                setDuel(res.duel);
                setInitialLoading(false);
            }
        } catch { /* silent */ }
        finally { setInitialLoading(false); }
    }, [duelId, token]);

    // Fetch duel client-side with auth token (server may not have token)
    useEffect(() => {
        if (token) {
            refreshDuel();
            fetchComments();
        }
    }, [token, refreshDuel, fetchComments]);

    // Auto-refresh for active duels
    useEffect(() => {
        if (!duel) return;
        const isLive = ["PENDING", "ACCEPTED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(duel.status);
        if (!isLive) return;
        const interval = setInterval(refreshDuel, 10000);
        return () => clearInterval(interval);
    }, [duel?.status, refreshDuel]);

    if (initialLoading) {
        return (
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-24">
                <div className="animate-spin" style={{ width: 24, height: 24, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#3B82F6", borderRadius: 999 }} />
            </div>
        );
    }

    if (!duel) {
        return (
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-24">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-lg font-medium text-[#F2F2F2]">Duelo no encontrado</p>
                <Link href="/duelos" style={{ marginTop: 16, color: "#3B82F6", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    Volver a duelos
                </Link>
            </div>
        );
    }

    const cfg = STATUS_CONFIG[duel.status] ?? STATUS_CONFIG.PENDING;
    const isChallenger = myUsername === duel.challenger.username;
    const isOpponent = myUsername === duel.opponent.username;
    const isMyDuel = isChallenger || isOpponent;
    const isPending = duel.status === "PENDING";
    const isActive = ["ACCEPTED", "IN_PROGRESS"].includes(duel.status);
    const isAwaiting = duel.status === "AWAITING_CONFIRMATION";
    const isCompleted = duel.status === "COMPLETED";
    const isDisputed = duel.status === "DISPUTED";

    const challengerWon = duel.winner_id === duel.challenger.id;
    const opponentWon = duel.winner_id === duel.opponent.id;
    const iWon = isChallenger ? challengerWon : opponentWon;
    const maxWins = Math.max(1, Math.ceil((duel.best_of || 1) / 2));

    const hasActiveStatus = ["ACCEPTED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(duel.status);
    const isReporter = duel.reporter_id === duel.challenger.id ? isChallenger : isOpponent;

    // ── Actions ──

    const exec = async (label: string, fn: () => Promise<unknown>) => {
        if (!token) {
            toast.danger("Error", { description: "Debes iniciar sesion" });
            return;
        }
        setLoading(label);
        try {
            await fn();
            toast.success("Listo", { description: `Accion "${label}" realizada` });
            await refreshDuel();
        } catch (err: any) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    };

    const handleReport = async () => {
        if (!token || !duel) return;
        if (myWins + oppWins === 0) {
            toast.danger("Error", { description: "Ingresa al menos un resultado" });
            return;
        }
        if (myWins > maxWins || oppWins > maxWins) {
            toast.danger("Error", { description: `Maximo ${maxWins} victorias en Bo${duel.best_of}` });
            return;
        }
        // Validate that someone must win (one player must have maxWins)
        if (myWins !== maxWins && oppWins !== maxWins) {
            toast.danger("Error", { description: `Alguien debe llegar a ${maxWins} victorias` });
            return;
        }
        const cWins = isChallenger ? myWins : oppWins;
        const oWins = isChallenger ? oppWins : myWins;
        const winnerId = cWins > oWins ? duel.challenger.id : duel.opponent.id;

        setLoading("report");
        try {
            await reportDuelResult(duelId, { winner_id: winnerId, score_challenger: cWins, score_challenged: oWins }, token);
            toast.success("Resultado reportado", { description: "Esperando confirmacion del oponente." });
            setShowReport(false);
            await refreshDuel();
        } catch (err: any) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    };

    const handleSendComment = async () => {
        if (!commentText.trim() || sendingComment || !token) return;
        setSendingComment(true);
        try {
            await createDuelComment(duelId, { content: commentText.trim() }, token);
            setCommentText("");
            await fetchComments();
        } catch (err: any) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally { setSendingComment(false); }
    };

    const handleReportUser = async () => {
        if (!reportReason.trim() || !token) return;
        setLoading("reportUser");
        try {
            await reportDuelOpponent(duelId, { reason: reportReason.trim() }, token);
            toast.success("Reporte enviado");
            setShowReportUser(false);
            setReportReason("");
        } catch (err: any) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setLoading(null);
        }
    };

    const handleShare = () => {
        const url = `https://rankeao.cl/duelos/${duelId}`;
        const text = `${duel.challenger.display_name || duel.challenger.username} vs ${duel.opponent.display_name || duel.opponent.username}`;
        if (navigator.share) {
            navigator.share({ title: text, url }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url).then(() => toast.success("URL copiada")).catch(() => {});
        }
    };

    return (
        <div className="max-w-3xl mx-auto flex flex-col" style={{ position: "relative" }}>
            {/* Gradient banner — matches Expo */}
            <div>
                <div style={{ height: 4, backgroundColor: cfg.color }} />
                <div style={{
                    height: 100,
                    background: `linear-gradient(135deg, ${cfg.color}15 0%, rgba(0,0,0,0) 50%, rgba(59,130,246,0.04) 100%)`,
                }} />
            </div>

            {/* Floating buttons — matches Expo */}
            <div style={{ position: "absolute", top: 20, left: 16, zIndex: 10 }}>
                <Link href="/duelos" style={{
                    width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.6)",
                    display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </Link>
            </div>
            <div style={{ position: "absolute", top: 20, right: 16, zIndex: 10 }}>
                <button onClick={handleShare} style={{
                    width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.6)",
                    display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer",
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                </button>
            </div>

            {/* Header section — overlapping banner */}
            <div style={{ marginTop: -40, paddingLeft: 16, paddingRight: 16 }}>
                {/* Status + time row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 999, backgroundColor: cfg.color + "18",
                    }}>
                        {hasActiveStatus && (
                            <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.color, animation: "pulse 1.6s ease-in-out infinite" }} />
                        )}
                        <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                    </span>
                    <span style={{ fontSize: 11, color: "#888891" }}>{timeAgo(duel.created_at, { verbose: true, fallbackDays: 7 })}</span>
                </div>

                {/* Title */}
                <h1 style={{ color: "#F2F2F2", fontSize: 20, fontWeight: 800, lineHeight: "26px", margin: 0, marginBottom: 10 }}>
                    {duel.challenger.display_name || duel.challenger.username} vs {duel.opponent.display_name || duel.opponent.username}
                </h1>

                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {duel.game_name && (
                        <span style={{ fontSize: 11, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: 6 }}>
                            {duel.game_name}
                        </span>
                    )}
                    {duel.format_name && (
                        <span style={{ fontSize: 11, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: 6 }}>
                            {duel.format_name}
                        </span>
                    )}
                    {duel.best_of != null && duel.best_of > 0 && (
                        <span style={{ fontSize: 11, color: "#888891", backgroundColor: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: 6 }}>
                            Bo{duel.best_of}
                        </span>
                    )}
                    <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600, backgroundColor: "rgba(245,158,11,0.1)", padding: "4px 8px", borderRadius: 6 }}>
                        Casual
                    </span>
                </div>
            </div>

            {/* Players card */}
            <div style={{
                display: "flex", gap: 8, alignItems: "stretch",
                marginLeft: 16, marginRight: 16, marginBottom: 12, padding: 14,
                backgroundColor: "#1A1A1E", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)",
            }}>
                <PlayerCard player={duel.challenger} wins={duel.challenger_wins} isWinner={challengerWon} isMe={isChallenger} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {(duel.challenger_wins != null && duel.opponent_wins != null && (duel.challenger_wins > 0 || duel.opponent_wins > 0)) ? (
                        <span style={{ fontSize: 20, fontWeight: 800, color: "#F2F2F2" }}>{duel.challenger_wins} - {duel.opponent_wins}</span>
                    ) : (
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#888891" }}>VS</span>
                    )}
                </div>
                <PlayerCard player={duel.opponent} wins={duel.opponent_wins} isWinner={opponentWon} isMe={isOpponent} />
            </div>

            {/* Message card */}
            {!!duel.message && (
                <div style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    marginLeft: 16, marginRight: 16, marginBottom: 12, padding: 14,
                    backgroundColor: "#1A1A1E", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)",
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span style={{ flex: 1, color: "#A8A8B0", fontSize: 13, fontStyle: "italic", lineHeight: "19px" }}>
                        &ldquo;{duel.message}&rdquo;
                    </span>
                </div>
            )}

            {/* XP gained (completed) */}
            {isCompleted && duel.xp_gained != null && duel.xp_gained > 0 && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    marginLeft: 16, marginRight: 16, marginBottom: 12, padding: 14,
                    backgroundColor: "rgba(245,158,11,0.06)", borderRadius: 14, border: "1px solid rgba(245,158,11,0.15)",
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <div>
                        <span style={{ color: "#F59E0B", fontSize: 14, fontWeight: 700 }}>+{duel.xp_gained} XP ganado</span>
                        <p style={{ color: "#888891", fontSize: 11, margin: 0, marginTop: 1 }}>Duelo casual — no afecta tu ELO</p>
                    </div>
                </div>
            )}

            {/* Result banner (completed) */}
            {isCompleted && isMyDuel && (
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    marginLeft: 16, marginRight: 16, marginBottom: 12, paddingTop: 16, paddingBottom: 16,
                    borderRadius: 14,
                    backgroundColor: iWon ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={iWon ? "#22C55E" : "#EF4444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {iWon ? (
                            <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" /><path d="M4 22h16" /><path d="M10 22V11" /><path d="M14 22V11" /><path d="M8 7h8l-1 5H9L8 7Z" /></>
                        ) : (
                            <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
                        )}
                    </svg>
                    <span style={{ fontSize: 18, fontWeight: 800, color: iWon ? "#22C55E" : "#EF4444" }}>
                        {iWon ? "Victoria" : "Derrota"}
                    </span>
                </div>
            )}

            {/* Actions card */}
            {(isPending || isActive || isAwaiting || isDisputed) && isMyDuel && (
                <div style={{
                    marginLeft: 16, marginRight: 16, marginBottom: 12, padding: 14,
                    backgroundColor: "#1A1A1E", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", flexDirection: "column", gap: 10,
                }}>
                    <span style={{ color: "#F2F2F2", fontSize: 13, fontWeight: 700 }}>Acciones</span>

                    {/* Pending: Accept/Decline (opponent only) */}
                    {isPending && isOpponent && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={() => exec("Aceptar", () => acceptDuel(duelId, token))}
                                disabled={!!loading}
                                style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", backgroundColor: "#22C55E", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
                            >
                                {loading === "Aceptar" ? "..." : "Aceptar"}
                            </button>
                            <button
                                onClick={() => { if (confirm("Seguro que quieres rechazar?")) exec("Rechazar", () => declineDuel(duelId, token)); }}
                                disabled={!!loading}
                                style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.06)", color: "#EF4444", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
                            >
                                {loading === "Rechazar" ? "..." : "Rechazar"}
                            </button>
                        </div>
                    )}

                    {/* Pending: Cancel (challenger only) */}
                    {isPending && isChallenger && (
                        <button
                            onClick={() => { if (confirm("Seguro que quieres cancelar?")) exec("Cancelar", () => cancelDuel(duelId, token)); }}
                            disabled={!!loading}
                            style={{ padding: "12px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.06)", color: "#888891", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
                        >
                            {loading === "Cancelar" ? "..." : "Cancelar desafio"}
                        </button>
                    )}

                    {/* Active: Report result */}
                    {isActive && isMyDuel && !showReport && (
                        <button
                            onClick={() => setShowReport(true)}
                            disabled={!!loading}
                            style={{ padding: "12px 0", borderRadius: 10, border: "none", backgroundColor: "#3B82F6", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                        >
                            Reportar resultado
                        </button>
                    )}

                    {/* Report form */}
                    {isActive && showReport && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <span style={{ color: "#F2F2F2", fontSize: 13, fontWeight: 700 }}>Resultado</span>
                            <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 11, color: "#888891", fontWeight: 600 }}>Tu</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <button onClick={() => setMyWins(Math.max(0, myWins - 1))} style={counterBtnStyle}>-</button>
                                        <span style={{ fontSize: 22, fontWeight: 800, color: "#F2F2F2", minWidth: 24, textAlign: "center" }}>{myWins}</span>
                                        <button onClick={() => { const next = Math.min(maxWins, myWins + 1); setMyWins(next); if (next === maxWins && oppWins >= maxWins) setOppWins(maxWins - 1); }} style={counterBtnStyle}>+</button>
                                    </div>
                                </div>
                                <span style={{ fontSize: 16, fontWeight: 800, color: "#888891", marginTop: 20 }}>-</span>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 11, color: "#888891", fontWeight: 600 }}>Oponente</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <button onClick={() => setOppWins(Math.max(0, oppWins - 1))} style={counterBtnStyle}>-</button>
                                        <span style={{ fontSize: 22, fontWeight: 800, color: "#F2F2F2", minWidth: 24, textAlign: "center" }}>{oppWins}</span>
                                        <button onClick={() => { const next = Math.min(maxWins, oppWins + 1); setOppWins(next); if (next === maxWins && myWins >= maxWins) setMyWins(maxWins - 1); }} style={counterBtnStyle}>+</button>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => setShowReport(false)}
                                    style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.06)", color: "#888891", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReport}
                                    disabled={!!loading}
                                    style={{ flex: 2, padding: "12px 0", borderRadius: 10, border: "none", backgroundColor: "#3B82F6", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading === "report" ? 0.6 : 1 }}
                                >
                                    {loading === "report" ? "Enviando..." : "Enviar"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Awaiting confirmation */}
                    {isAwaiting && isMyDuel && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, backgroundColor: "rgba(168,85,247,0.06)", borderRadius: 6 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span style={{ flex: 1, color: "#A855F7", fontSize: 11, fontWeight: 600 }}>
                                    Resultado reportado: {duel.challenger_wins}-{duel.opponent_wins}
                                </span>
                            </div>
                            {isReporter ? (
                                <p style={{ color: "#888891", fontSize: 12, textAlign: "center", margin: 0 }}>
                                    Esperando que tu oponente confirme el resultado
                                </p>
                            ) : (
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        onClick={() => exec("Confirmar", () => confirmDuelResult(duelId, token))}
                                        disabled={!!loading}
                                        style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", backgroundColor: "#22C55E", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
                                    >
                                        {loading === "Confirmar" ? "..." : "Confirmar"}
                                    </button>
                                    <button
                                        onClick={() => { if (confirm("El resultado sera revisado por un moderador. Continuar?")) exec("Disputar", () => disputeDuel(duelId, token)); }}
                                        disabled={!!loading}
                                        style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
                                    >
                                        {loading === "Disputar" ? "..." : "Disputar"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Disputed notice */}
                    {isDisputed && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, backgroundColor: "rgba(239,68,68,0.06)", borderRadius: 6 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span style={{ flex: 1, color: "#EF4444", fontSize: 11, fontWeight: 600 }}>Resultado disputado — esperando moderador</span>
                        </div>
                    )}

                    {/* Cancel active duel */}
                    {isActive && (
                        <button
                            onClick={() => { if (confirm("Seguro que quieres cancelar el duelo?")) exec("Cancelar", () => cancelDuel(duelId, token)); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0", alignSelf: "center" }}
                        >
                            <span style={{ color: "#888891", fontSize: 11, textDecoration: "underline" }}>Cancelar duelo</span>
                        </button>
                    )}
                </div>
            )}

            {/* Comments section */}
            {(isCompleted || isActive || isAwaiting) && (
                <div style={{
                    marginLeft: 16, marginRight: 16, marginBottom: 12, padding: 14,
                    backgroundColor: "#1A1A1E", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)",
                }}>
                    <span style={{ color: "#F2F2F2", fontSize: 13, fontWeight: 700, display: "block", marginBottom: 10 }}>Comentarios</span>

                    {comments.length > 0 ? (
                        comments.map((c) => (
                            <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <span style={{ color: "#888891", fontSize: 10, fontWeight: 700 }}>{c.username?.[0]?.toUpperCase() || "?"}</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                        <span style={{ color: "#F2F2F2", fontSize: 11, fontWeight: 700 }}>{c.username || "Usuario"}</span>
                                        {c.created_at && <span style={{ color: "#888891", fontSize: 9 }}>{timeAgo(c.created_at, { verbose: true })}</span>}
                                    </div>
                                    <span style={{ color: "#E5E5E5", fontSize: 13, lineHeight: "18px" }}>{c.content || c.text}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: "#888891", fontSize: 11, textAlign: "center", padding: "12px 0", margin: 0 }}>Sin comentarios aun</p>
                    )}

                    {/* Comment input */}
                    {isMyDuel && (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 8 }}>
                            <input
                                type="text"
                                placeholder="Escribe un comentario..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSendComment(); }}
                                maxLength={300}
                                style={{
                                    flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 6,
                                    border: "1px solid rgba(255,255,255,0.06)", padding: "8px 12px",
                                    color: "#F2F2F2", fontSize: 13, outline: "none",
                                }}
                            />
                            <button
                                onClick={handleSendComment}
                                disabled={!commentText.trim() || sendingComment}
                                style={{
                                    width: 36, height: 36, borderRadius: 18, backgroundColor: "#3B82F6",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: "none", cursor: !commentText.trim() || sendingComment ? "not-allowed" : "pointer",
                                    opacity: !commentText.trim() || sendingComment ? 0.4 : 1,
                                }}
                            >
                                {sendingComment ? (
                                    <div className="animate-spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: 999 }} />
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Report opponent */}
            {isCompleted && isMyDuel && (
                <div style={{ marginLeft: 16, marginRight: 16, marginBottom: 16 }}>
                    {!showReportUser ? (
                        <button
                            onClick={() => setShowReportUser(true)}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px 0", background: "none", border: "none", cursor: "pointer" }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888891" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
                            </svg>
                            <span style={{ color: "#888891", fontSize: 11 }}>Reportar oponente</span>
                        </button>
                    ) : (
                        <div style={{
                            padding: 14, backgroundColor: "#1A1A1E", borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 10,
                        }}>
                            <span style={{ color: "#F2F2F2", fontSize: 13, fontWeight: 700 }}>
                                Reportar a @{isChallenger ? duel.opponent.username : duel.challenger.username}
                            </span>
                            <textarea
                                placeholder="Motivo del reporte..."
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                maxLength={300}
                                rows={3}
                                style={{
                                    width: "100%", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 6,
                                    border: "1px solid rgba(255,255,255,0.06)", padding: "10px 12px",
                                    color: "#F2F2F2", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit",
                                }}
                            />
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => { setShowReportUser(false); setReportReason(""); }}
                                    style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.06)", color: "#888891", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReportUser}
                                    disabled={!reportReason.trim() || loading === "reportUser"}
                                    style={{ flex: 2, padding: "12px 0", borderRadius: 10, border: "none", backgroundColor: "#EF4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: !reportReason.trim() ? "not-allowed" : "pointer", opacity: reportReason.trim() ? 1 : 0.4 }}
                                >
                                    {loading === "reportUser" ? "Enviando..." : "Enviar reporte"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div style={{ height: 80 }} />
        </div>
    );
}

const counterBtnStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.06)",
    color: "#F2F2F2", cursor: "pointer", fontSize: 18, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
};
