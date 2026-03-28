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
import { getGameState, startGame } from "@/lib/api/game";
import type { Duel, DuelStatus } from "@/lib/types/duel";
import type { GameStateSnapshot } from "@/lib/types/game";
import GameTracker from "./components/GameTracker";


const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente", color: "var(--warning)" },
    ACCEPTED: { label: "Aceptado", color: "var(--accent)" },
    IN_PROGRESS: { label: "En curso", color: "var(--success)" },
    AWAITING_CONFIRMATION: { label: "Esperando confirmacion", color: "var(--purple)" },
    COMPLETED: { label: "Finalizado", color: "var(--muted)" },
    DECLINED: { label: "Rechazado", color: "var(--danger)" },
    CANCELLED: { label: "Cancelado", color: "var(--muted)" },
    DISPUTED: { label: "Disputado", color: "var(--danger)" },
};

// ── PlayerCard ──

function PlayerCard({ player, wins, isWinner, isMe }: {
    player: Duel["challenger"];
    wins?: number;
    isWinner: boolean;
    isMe: boolean;
}) {
    const ringColor = isWinner ? "var(--success)" : isMe ? "var(--accent)" : "var(--border)";

    return (
        <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            padding: "20px 14px",
            backgroundColor: isWinner ? "rgba(34,197,94,0.04)" : "transparent",
        }}>
            {/* Avatar with ring */}
            <div style={{
                width: 68, height: 68, borderRadius: 34,
                background: ringColor, padding: 3,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <div style={{
                    width: 62, height: 62, borderRadius: 31,
                    backgroundColor: "var(--background)", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    {player.avatar_url ? (
                        <Image src={player.avatar_url} alt={player.username} width={62} height={62} style={{ objectFit: "cover" }} />
                    ) : (
                        <span style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)" }}>
                            {(player.username || "?").charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            {/* Name */}
            <Link href={`/perfil/${player.username}`} style={{ textDecoration: "none", textAlign: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: isWinner ? "var(--success)" : "var(--foreground)" }}>
                    {player.display_name || player.username}
                </span>
            </Link>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>@{player.username}</span>

            {/* Rating badge */}
            {player.rating != null && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "2px 8px", borderRadius: 999 }}>
                    {player.rating} ELO
                </span>
            )}

            {/* Wins */}
            {wins != null && (
                <span style={{ fontSize: 32, fontWeight: 900, color: isWinner ? "var(--success)" : "var(--foreground)", marginTop: 4, letterSpacing: "-1px" }}>
                    {wins}
                </span>
            )}

            {/* Badges */}
            {isWinner && (
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--success)", backgroundColor: "rgba(34,197,94,0.1)", padding: "3px 10px", borderRadius: 999 }}>
                    GANADOR
                </span>
            )}
            {isMe && !isWinner && (
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--accent)", backgroundColor: "rgba(59,130,246,0.1)", padding: "3px 10px", borderRadius: 999 }}>
                    TÚ
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
    const [introChecked, setIntroChecked] = useState(false);
    const [showIntro, setShowIntro] = useState(false);
    const [introFading, setIntroFading] = useState(false);
    const introEligible = duel ? ["ACCEPTED", "IN_PROGRESS"].includes(duel.status) : false;

    // Trigger intro once when duel loads (server or client)
    useEffect(() => {
        if (introChecked || !duel) return;
        setIntroChecked(true);
        if (["ACCEPTED", "IN_PROGRESS"].includes(duel.status)) {
            setShowIntro(true);
        }
    }, [duel, introChecked]);

    // Vibrate on impact (~1.2s after intro starts)
    useEffect(() => {
        if (!showIntro) return;
        const timer = setTimeout(() => {
            try { if (navigator.vibrate) navigator.vibrate([150, 40, 80, 30, 50]); } catch {}
        }, 1200);
        return () => clearTimeout(timer);
    }, [showIntro]);

    // Auto-dismiss intro after animation
    useEffect(() => {
        if (!showIntro) return;
        const fadeTimer = setTimeout(() => setIntroFading(true), 2800);
        const hideTimer = setTimeout(() => setShowIntro(false), 3500);
        return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
    }, [showIntro]);

    const skipIntro = () => {
        setIntroFading(true);
        setTimeout(() => setShowIntro(false), 700);
    };

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

    // Game tracker
    const [activeGameNumber, setActiveGameNumber] = useState<number | null>(null);
    const [activeGameSnapshot, setActiveGameSnapshot] = useState<GameStateSnapshot | null>(null);
    const [gameLoading, setGameLoading] = useState(false);

    // Fetch comments
    const fetchComments = useCallback(async () => {
        if (!token) return;
        try {
            const raw = await getDuelComments(duelId, token) as any;
            const list: DuelComment[] = raw?.data?.comments ?? raw?.comments ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
            setComments(list);
        } catch (err) { console.error("[DuelDetail] Error fetching comments:", err); }
    }, [duelId, token]);

    const fetchActiveGame = useCallback(async () => {
        if (!token) return;
        try {
            const snap = await getGameState(duelId, 1, token);
            if (snap?.game?.game_number) {
                setActiveGameNumber(snap.game.game_number);
                setActiveGameSnapshot(snap);
            }
        } catch {
            // 404 = no hay partida activa todavía
        }
    }, [duelId, token]);

    const handleStartGame = async () => {
        if (!token || !duel) return;
        setGameLoading(true);
        try {
            await startGame(duelId, { mode: "advanced", game_rules_slug: duel.game_slug ?? "" }, token);
            toast.success("Partida iniciada");
            setTimeout(() => fetchActiveGame(), 500);
        } catch (err: any) {
            if (err?.status === 409 || err?.code === "ACTIVE_GAME_EXISTS") {
                // Game already exists — load it
                await fetchActiveGame();
            } else {
                toast.danger("Error", { description: mapErrorMessage(err) });
            }
        } finally {
            setGameLoading(false);
        }
    };

    // Refresh duel
    const refreshDuel = useCallback(async () => {
        try {
            const res = await getDuel(duelId, token);
            if (res?.duel) {
                setDuel(res.duel);
                setInitialLoading(false);
                return res.duel;
            }
        } catch (err) { console.error("[DuelDetail] Error refreshing duel:", err); }
        finally { setInitialLoading(false); }
        return null;
    }, [duelId, token]);

    // Fetch duel client-side with auth token (server may not have token)
    // Chain fetchActiveGame after refreshDuel to avoid concurrent 401 race condition
    useEffect(() => {
        if (token) {
            refreshDuel().then((d) => {
                if (d && ["ACCEPTED", "IN_PROGRESS"].includes(d.status)) {
                    fetchActiveGame();
                }
            });
            fetchComments();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, duelId]);

    // Auto-refresh for active duels
    useEffect(() => {
        if (!duel) return;
        const isLive = ["PENDING", "ACCEPTED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(duel.status);
        if (!isLive) return;
        const interval = setInterval(refreshDuel, 10000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duel?.status, duelId, token]);

    if (initialLoading) {
        return (
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-24">
                <div className="animate-spin" style={{ width: 24, height: 24, border: "3px solid var(--overlay)", borderTopColor: "var(--accent)", borderRadius: 999 }} />
            </div>
        );
    }

    if (!duel) {
        return (
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-24">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-lg font-medium text-foreground">Duelo no encontrado</p>
                <Link href="/duelos" style={{ marginTop: 16, color: "var(--accent)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
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

    // ── Intro animation ──
    if (showIntro && duel) {
        const p1 = duel.challenger;
        const p2 = duel.opponent;

        const renderAvatar = (player: typeof p1, size: number) => (
            <div style={{
                width: size, height: size, borderRadius: size / 2,
                background: "var(--accent)", padding: 3,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <div style={{
                    width: size - 6, height: size - 6, borderRadius: (size - 6) / 2,
                    backgroundColor: "var(--background)", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: size * 0.3, fontWeight: 800, color: "var(--foreground)",
                }}>
                    {player.avatar_url
                        ? <img src={player.avatar_url} alt="" style={{ width: size - 6, height: size - 6, objectFit: "cover" }} />
                        : (player.username || "?").charAt(0).toUpperCase()
                    }
                </div>
            </div>
        );

        // Generate spark particles
        const sparks = Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * 360;
            const dist = 60 + Math.random() * 80;
            const x = Math.cos(angle * Math.PI / 180) * dist;
            const y = Math.sin(angle * Math.PI / 180) * dist;
            const size = 3 + Math.random() * 4;
            const delay = 1.2 + Math.random() * 0.15;
            return { x, y, size, delay };
        });

        return (
            <div style={{
                position: "fixed", inset: 0, zIndex: 9999,
                backgroundColor: "var(--background)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                overflow: "hidden",
            }}>
                <style>{`
                    @keyframes slideFromLeft {
                        0% { opacity: 0; transform: translateX(-100vw); }
                        30% { opacity: 1; transform: translateX(10px); }
                        40% { transform: translateX(0); }
                        100% { opacity: 1; transform: translateX(0); }
                    }
                    @keyframes slideFromRight {
                        0% { opacity: 0; transform: translateX(100vw); }
                        30% { opacity: 1; transform: translateX(-10px); }
                        40% { transform: translateX(0); }
                        100% { opacity: 1; transform: translateX(0); }
                    }
                    @keyframes vsDrop {
                        0%, 35% { opacity: 0; transform: translateY(-200px) rotate(-360deg) scale(0.2); }
                        65% { opacity: 1; transform: translateY(8px) rotate(10deg) scale(1.3); }
                        75% { transform: translateY(-4px) rotate(-3deg) scale(1); }
                        85% { transform: translateY(0) rotate(0deg) scale(1); }
                        100% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
                    }
                    @keyframes vsGlow {
                        0%, 60% { text-shadow: 0 0 0px transparent; }
                        80% { text-shadow: 0 0 40px rgba(59,130,246,0.7), 0 0 80px rgba(59,130,246,0.3); }
                        100% { text-shadow: 0 0 20px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.15); }
                    }
                    @keyframes playerGrow {
                        0%, 75% { transform: scale(1); }
                        100% { transform: scale(1.1); }
                    }
                    @keyframes nameHide {
                        0%, 75% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    @keyframes tagsIn {
                        0%, 50% { opacity: 0; transform: translateY(20px); }
                        70% { opacity: 1; transform: translateY(0); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes skipIn {
                        0%, 60% { opacity: 0; }
                        100% { opacity: 1; }
                    }
                    @keyframes impactFlash {
                        0%, 42% { opacity: 0; }
                        44% { opacity: 0.7; }
                        50% { opacity: 0; }
                        100% { opacity: 0; }
                    }
                    @keyframes screenShake {
                        0%, 42% { transform: translate(0, 0); }
                        43% { transform: translate(-6px, 4px); }
                        44% { transform: translate(5px, -3px); }
                        45% { transform: translate(-4px, -5px); }
                        46% { transform: translate(3px, 2px); }
                        47% { transform: translate(-2px, -1px); }
                        48% { transform: translate(0, 0); }
                        100% { transform: translate(0, 0); }
                    }
                    @keyframes speedLineLeft {
                        0% { opacity: 0; transform: translateX(50px); }
                        15% { opacity: 0.3; transform: translateX(0); }
                        35% { opacity: 0; transform: translateX(-30px); }
                        100% { opacity: 0; }
                    }
                    @keyframes speedLineRight {
                        0% { opacity: 0; transform: translateX(-50px); }
                        15% { opacity: 0.3; transform: translateX(0); }
                        35% { opacity: 0; transform: translateX(30px); }
                        100% { opacity: 0; }
                    }
                    @keyframes fightIn {
                        0%, 55% { opacity: 0; transform: scale(3) rotate(-10deg); }
                        65% { opacity: 1; transform: scale(1) rotate(0deg); }
                        72% { transform: scale(1.1) rotate(2deg); }
                        80% { transform: scale(1) rotate(0deg); }
                        100% { opacity: 1; transform: scale(1) rotate(0deg); }
                    }
                    @keyframes fightGlow {
                        0%, 65% { text-shadow: none; }
                        75% { text-shadow: 0 0 30px rgba(239,68,68,0.6), 0 0 60px rgba(239,68,68,0.3); }
                        100% { text-shadow: 0 0 15px rgba(239,68,68,0.3), 0 0 30px rgba(239,68,68,0.15); }
                    }
                `}</style>

                {/* White flash on impact */}
                <div style={{
                    position: "absolute", inset: 0, backgroundColor: "#FFFFFF", pointerEvents: "none",
                    animation: "impactFlash 2.8s ease-out forwards", zIndex: 1,
                }} />

                {/* Speed lines — left player */}
                {[0,1,2].map(i => (
                    <div key={`sl-${i}`} style={{
                        position: "absolute",
                        left: "10%", top: `${40 + i * 8}%`,
                        width: 80, height: 2,
                        background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
                        animation: `speedLineLeft 1.2s ${i * 0.05}s ease-out forwards`,
                        opacity: 0,
                    }} />
                ))}
                {/* Speed lines — right player */}
                {[0,1,2].map(i => (
                    <div key={`sr-${i}`} style={{
                        position: "absolute",
                        right: "10%", top: `${40 + i * 8}%`,
                        width: 80, height: 2,
                        background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
                        animation: `speedLineRight 1.2s ${i * 0.05}s ease-out forwards`,
                        opacity: 0,
                    }} />
                ))}

                {/* Spark particles on impact */}
                {sparks.map((s, i) => (
                    <div key={`spark-${i}`} style={{
                        position: "absolute",
                        left: "50%", top: "50%",
                        width: s.size, height: s.size,
                        borderRadius: "50%",
                        backgroundColor: i % 3 === 0 ? "var(--accent)" : i % 3 === 1 ? "var(--warning)" : "#FFFFFF",
                        opacity: 0,
                        animation: `sparkMove${i} 0.6s ${s.delay}s ease-out forwards`,
                    }}>
                        <style>{`
                            @keyframes sparkMove${i} {
                                0% { opacity: 1; transform: translate(0, 0) scale(1); }
                                100% { opacity: 0; transform: translate(${s.x}px, ${s.y}px) scale(0); }
                            }
                        `}</style>
                    </div>
                ))}

                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
                    opacity: introFading ? 0 : 1,
                    transform: introFading ? "scale(1.08)" : "scale(1)",
                    transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
                    animation: "screenShake 2.8s ease-out forwards",
                    zIndex: 2,
                }}>
                    {/* Players + VS row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                        {/* Player 1 — from left */}
                        <div style={{
                            animation: "slideFromLeft 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                        }}>
                            <div style={{ animation: "playerGrow 3s ease-in-out forwards" }}>
                                {renderAvatar(p1, 80)}
                            </div>
                            <span style={{
                                fontSize: 16, fontWeight: 800, color: "var(--foreground)",
                                animation: "nameHide 3s ease-in-out forwards",
                            }}>
                                {p1.display_name || p1.username}
                            </span>
                        </div>

                        {/* VS — drops from sky, spins 360° */}
                        <div style={{ animation: "vsDrop 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}>
                            <span style={{
                                fontSize: 52, fontWeight: 900, color: "var(--accent)",
                                animation: "vsGlow 2.5s ease-out forwards",
                                letterSpacing: "-2px",
                            }}>
                                VS
                            </span>
                        </div>

                        {/* Player 2 — from right */}
                        <div style={{
                            animation: "slideFromRight 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                        }}>
                            <div style={{ animation: "playerGrow 3s ease-in-out forwards" }}>
                                {renderAvatar(p2, 80)}
                            </div>
                            <span style={{
                                fontSize: 16, fontWeight: 800, color: "var(--foreground)",
                                animation: "nameHide 3s ease-in-out forwards",
                            }}>
                                {p2.display_name || p2.username}
                            </span>
                        </div>
                    </div>

                    {/* FIGHT! text */}
                    <div style={{ animation: "fightIn 2.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
                        <span style={{
                            fontSize: 28, fontWeight: 900, color: "#EF4444",
                            letterSpacing: "6px",
                            animation: "fightGlow 2.8s ease-out forwards",
                        }}>
                            FIGHT!
                        </span>
                    </div>

                    {/* Game + format tags */}
                    <div style={{ display: "flex", gap: 8, animation: "tagsIn 2s ease-out forwards" }}>
                        {duel.game_name && (
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", background: "rgba(59,130,246,0.12)", padding: "4px 12px", borderRadius: 999 }}>
                                {duel.game_name}
                            </span>
                        )}
                        {duel.format_name && (
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", background: "var(--surface-solid)", border: "1px solid var(--border)", padding: "4px 12px", borderRadius: 999 }}>
                                {duel.format_name}
                            </span>
                        )}
                        {duel.best_of != null && duel.best_of > 0 && (
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", background: "var(--surface-solid)", border: "1px solid var(--border)", padding: "4px 12px", borderRadius: 999 }}>
                                Bo{duel.best_of}
                            </span>
                        )}
                    </div>

                    {/* Skip button */}
                    <button
                        onClick={skipIntro}
                        style={{
                            animation: "skipIn 2.5s ease-out forwards",
                            marginTop: 8, background: "none", border: "1px solid var(--border)",
                            color: "var(--muted)", fontSize: 12, fontWeight: 600,
                            padding: "6px 16px", borderRadius: 999, cursor: "pointer",
                        }}
                    >
                        Saltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto flex flex-col" style={{ position: "relative", animation: introEligible ? "duelContentIn 0.8s ease-out" : undefined }}>
            <style>{`
                @keyframes duelContentIn {
                    0% { opacity: 0; transform: scale(0.95) translateY(20px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
            {/* Gradient banner */}
            <div>
                <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />
                <div style={{
                    height: 120,
                    background: `linear-gradient(180deg, ${cfg.color}12 0%, transparent 60%), linear-gradient(135deg, rgba(59,130,246,0.04) 0%, transparent 50%)`,
                }} />
            </div>

            {/* Floating buttons */}
            <div style={{ position: "absolute", top: 20, left: 16, zIndex: 10 }}>
                <Link href="/duelos" style={{
                    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </Link>
            </div>
            <div style={{ position: "absolute", top: 20, right: 16, zIndex: 10 }}>
                <button onClick={handleShare} style={{
                    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                </button>
            </div>

            {/* Header — overlapping banner */}
            <div style={{ marginTop: -60, paddingLeft: 20, paddingRight: 20 }}>
                {/* Status + time */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 14px", borderRadius: 999,
                        backgroundColor: cfg.color + "18",
                        border: `1px solid ${cfg.color}30`,
                    }}>
                        {hasActiveStatus && (
                            <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: cfg.color, animation: "pulse 1.6s ease-in-out infinite" }} />
                        )}
                        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{timeAgo(duel.created_at, { verbose: true, fallbackDays: 7 })}</span>
                </div>

                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                    {duel.game_name && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", backgroundColor: "rgba(59,130,246,0.1)", padding: "5px 12px", borderRadius: 999 }}>
                            {duel.game_name}
                        </span>
                    )}
                    {duel.format_name && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)", padding: "5px 12px", borderRadius: 999 }}>
                            {duel.format_name}
                        </span>
                    )}
                    {duel.best_of != null && duel.best_of > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", backgroundColor: "var(--surface-solid)", border: "1px solid var(--border)", padding: "5px 12px", borderRadius: 999 }}>
                            Bo{duel.best_of}
                        </span>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--warning)", backgroundColor: "rgba(245,158,11,0.1)", padding: "5px 12px", borderRadius: 999 }}>
                        Casual
                    </span>
                </div>
            </div>

            {/* Players card — arena hero */}
            <div style={{
                marginLeft: 20, marginRight: 20, marginBottom: 16,
                borderRadius: 20, overflow: "hidden",
                border: `1px solid ${cfg.color}30`,
                position: "relative",
                background: "var(--surface-solid)",
            }}>
                <style>{`
                    @keyframes arenaGlow {
                        0%, 100% { box-shadow: inset 0 0 30px rgba(59,130,246,0.03); }
                        50% { box-shadow: inset 0 0 60px rgba(59,130,246,0.08); }
                    }
                `}</style>

                {/* Diagonal slash divider */}
                <div style={{
                    position: "absolute", top: 0, bottom: 0, left: "50%",
                    width: 2,
                    background: `linear-gradient(180deg, transparent 0%, ${cfg.color}30 30%, ${cfg.color}15 70%, transparent 100%)`,
                    transform: "rotate(12deg) scaleY(1.4)", transformOrigin: "center",
                    pointerEvents: "none", zIndex: 1,
                }} />
                <div style={{
                    position: "absolute", top: 0, bottom: 0, left: "calc(50% + 5px)",
                    width: 1,
                    background: `linear-gradient(180deg, transparent 0%, ${cfg.color}15 30%, ${cfg.color}08 70%, transparent 100%)`,
                    transform: "rotate(12deg) scaleY(1.4)", transformOrigin: "center",
                    pointerEvents: "none", zIndex: 1,
                }} />

                <div style={{
                    display: "flex", alignItems: "stretch",
                    animation: hasActiveStatus ? "arenaGlow 3s ease-in-out infinite" : undefined,
                }}>
                    <PlayerCard player={duel.challenger} wins={duel.challenger_wins} isWinner={challengerWon} isMe={isChallenger} />
                    <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        padding: "20px 20px", gap: 4, zIndex: 2,
                    }}>
                        {(duel.challenger_wins != null && duel.opponent_wins != null && (duel.challenger_wins > 0 || duel.opponent_wins > 0)) ? (
                            <span style={{
                                fontSize: 30, fontWeight: 900, color: "var(--foreground)", letterSpacing: "-1px",
                                textShadow: "0 0 12px rgba(59,130,246,0.15)",
                            }}>
                                {duel.challenger_wins} - {duel.opponent_wins}
                            </span>
                        ) : (
                            <span style={{
                                fontSize: 28, fontWeight: 900, color: "var(--accent)", letterSpacing: "2px",
                                textShadow: "0 0 24px rgba(59,130,246,0.5), 0 0 48px rgba(59,130,246,0.2)",
                            }}>VS</span>
                        )}
                    </div>
                    <PlayerCard player={duel.opponent} wins={duel.opponent_wins} isWinner={opponentWon} isMe={isOpponent} />
                </div>
            </div>

            {/* Game Tracker — contador de vidas en tiempo real */}
            {isActive && isMyDuel && token && (
                <>
                    {activeGameNumber !== null ? (
                        <GameTracker
                            duelID={duelId}
                            myPlayerID={isChallenger ? parseInt(duel.challenger.id, 10) : parseInt(duel.opponent.id, 10)}
                            opponentPlayerID={isChallenger ? parseInt(duel.opponent.id, 10) : parseInt(duel.challenger.id, 10)}
                            myUsername={myUsername ?? "Yo"}
                            opponentUsername={isChallenger ? (duel.opponent.display_name ?? duel.opponent.username) : (duel.challenger.display_name ?? duel.challenger.username)}
                            myAvatarUrl={isChallenger ? duel.challenger.avatar_url : duel.opponent.avatar_url}
                            opponentAvatarUrl={isChallenger ? duel.opponent.avatar_url : duel.challenger.avatar_url}
                            token={token}
                            gameNumber={activeGameNumber}
                            initialSnapshot={activeGameSnapshot}
                            onGameEnd={() => { refreshDuel(); }}
                        />
                    ) : (
                        <div style={{ marginLeft: 20, marginRight: 20, marginBottom: 16 }}>
                            <button
                                onClick={handleStartGame}
                                disabled={gameLoading}
                                style={{
                                    width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                                    backgroundColor: "var(--accent)", color: "#fff",
                                    fontSize: 15, fontWeight: 800,
                                    cursor: gameLoading ? "not-allowed" : "pointer",
                                    opacity: gameLoading ? 0.7 : 1,
                                    boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                }}
                            >
                                {gameLoading ? (
                                    <>
                                        <div className="animate-spin" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: 999 }} />
                                        Iniciando...
                                    </>
                                ) : (
                                    "⚔️ Iniciar partida"
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Message card */}
            {!!duel.message && (
                <div style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    marginLeft: 20, marginRight: 20, marginBottom: 16, padding: 16,
                    backgroundColor: "var(--surface-solid)", borderRadius: 14, border: "1px solid var(--border)",
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span style={{ flex: 1, color: "var(--muted)", fontSize: 13, fontStyle: "italic", lineHeight: "19px" }}>
                        &ldquo;{duel.message}&rdquo;
                    </span>
                </div>
            )}

            {/* XP gained (completed) */}
            {isCompleted && duel.xp_gained != null && duel.xp_gained > 0 && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    marginLeft: 20, marginRight: 20, marginBottom: 16, padding: 16,
                    backgroundColor: "rgba(245,158,11,0.06)", borderRadius: 14, border: "1px solid rgba(245,158,11,0.15)",
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--warning)" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <div>
                        <span style={{ color: "var(--warning)", fontSize: 14, fontWeight: 700 }}>+{duel.xp_gained} XP ganado</span>
                        <p style={{ color: "var(--muted)", fontSize: 11, margin: 0, marginTop: 1 }}>Duelo casual — no afecta tu ELO</p>
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={iWon ? "var(--success)" : "var(--danger)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {iWon ? (
                            <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" /><path d="M4 22h16" /><path d="M10 22V11" /><path d="M14 22V11" /><path d="M8 7h8l-1 5H9L8 7Z" /></>
                        ) : (
                            <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
                        )}
                    </svg>
                    <span style={{ fontSize: 18, fontWeight: 800, color: iWon ? "var(--success)" : "var(--danger)" }}>
                        {iWon ? "Victoria" : "Derrota"}
                    </span>
                </div>
            )}

            {/* Actions */}
            {(isPending || isActive || isAwaiting || isDisputed) && isMyDuel && (
                <div style={{
                    marginLeft: 20, marginRight: 20, marginBottom: 16,
                    display: "flex", flexDirection: "column", gap: 10,
                }}>
                    {/* Pending: Accept/Decline (opponent only) */}
                    {isPending && isOpponent && (
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={() => exec("Aceptar", () => acceptDuel(duelId, token))}
                                disabled={!!loading}
                                style={{
                                    flex: 2, padding: "14px 0", borderRadius: 14, border: "none",
                                    backgroundColor: "var(--success)", color: "#fff",
                                    fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.6 : 1,
                                    boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
                                }}
                            >
                                {loading === "Aceptar" ? "..." : "Aceptar duelo"}
                            </button>
                            <button
                                onClick={() => { if (confirm("Seguro que quieres rechazar?")) exec("Rechazar", () => declineDuel(duelId, token)); }}
                                disabled={!!loading}
                                style={{
                                    flex: 1, padding: "14px 0", borderRadius: 14,
                                    border: "1px solid rgba(239,68,68,0.3)",
                                    backgroundColor: "rgba(239,68,68,0.08)", color: "var(--danger)",
                                    fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.6 : 1,
                                }}
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
                            style={{
                                padding: "14px 0", borderRadius: 14,
                                border: "1px solid var(--border)", backgroundColor: "var(--surface-solid)",
                                color: "var(--muted)", fontSize: 14, fontWeight: 700,
                                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                            }}
                        >
                            {loading === "Cancelar" ? "..." : "Cancelar desafío"}
                        </button>
                    )}

                    {/* Report form — always visible when active */}
                    {isActive && isMyDuel && (
                        <div style={{
                            display: "flex", flexDirection: "column", gap: 14,
                            backgroundColor: "var(--surface-solid)", borderRadius: 16, border: "1px solid var(--border)",
                            padding: 18,

                        }}>
                            <span style={{ color: "var(--foreground)", fontSize: 15, fontWeight: 800, textAlign: "center" }}>
                                Reportar resultado
                            </span>
                            <div style={{
                                display: "flex", gap: 16, alignItems: "center", justifyContent: "center",
                            }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>Tú</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <button onClick={() => setMyWins(Math.max(0, myWins - 1))} style={counterBtnStyle}>-</button>
                                        <span style={{ fontSize: 28, fontWeight: 900, color: "var(--foreground)", minWidth: 28, textAlign: "center" }}>{myWins}</span>
                                        <button onClick={() => { const next = Math.min(maxWins, myWins + 1); setMyWins(next); if (next === maxWins && oppWins >= maxWins) setOppWins(maxWins - 1); }} style={counterBtnStyle}>+</button>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 18, fontWeight: 900, color: "var(--muted)", marginTop: 20,
                                }}>—</span>
                                <div style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                                }}>
                                    <span style={{ fontSize: 12, color: "var(--danger)", fontWeight: 700 }}>Oponente</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <button onClick={() => setOppWins(Math.max(0, oppWins - 1))} style={counterBtnStyle}>-</button>
                                        <span style={{ fontSize: 28, fontWeight: 900, color: "var(--foreground)", minWidth: 28, textAlign: "center" }}>{oppWins}</span>
                                        <button onClick={() => { const next = Math.min(maxWins, oppWins + 1); setOppWins(next); if (next === maxWins && myWins >= maxWins) setMyWins(maxWins - 1); }} style={counterBtnStyle}>+</button>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleReport}
                                disabled={!!loading}
                                style={{
                                    width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                                    backgroundColor: "var(--accent)", color: "#fff",
                                    fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading === "report" ? 0.6 : 1,
                                    boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                                }}
                            >
                                {loading === "report" ? "Enviando..." : "Enviar resultado"}
                            </button>
                        </div>
                    )}

                    {/* Awaiting confirmation */}
                    {isAwaiting && isMyDuel && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, backgroundColor: "rgba(168,85,247,0.06)", borderRadius: 6 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span style={{ flex: 1, color: "var(--purple)", fontSize: 11, fontWeight: 600 }}>
                                    Resultado reportado: {duel.challenger_wins}-{duel.opponent_wins}
                                </span>
                            </div>
                            {isReporter ? (
                                <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", margin: 0 }}>
                                    Esperando que tu oponente confirme el resultado
                                </p>
                            ) : (
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button
                                        onClick={() => exec("Confirmar", () => confirmDuelResult(duelId, token))}
                                        disabled={!!loading}
                                        style={{
                                            flex: 2, padding: "14px 0", borderRadius: 14, border: "none",
                                            backgroundColor: "var(--success)", color: "#fff",
                                            fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
                                            opacity: loading ? 0.6 : 1,
                                            boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
                                        }}
                                    >
                                        {loading === "Confirmar" ? "..." : "Confirmar resultado"}
                                    </button>
                                    <button
                                        onClick={() => { if (confirm("El resultado sera revisado por un moderador. Continuar?")) exec("Disputar", () => disputeDuel(duelId, token)); }}
                                        disabled={!!loading}
                                        style={{
                                            flex: 1, padding: "14px 0", borderRadius: 14,
                                            border: "1px solid rgba(239,68,68,0.3)",
                                            backgroundColor: "rgba(239,68,68,0.08)", color: "var(--danger)",
                                            fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                                            opacity: loading ? 0.6 : 1,
                                        }}
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span style={{ flex: 1, color: "var(--danger)", fontSize: 11, fontWeight: 600 }}>Resultado disputado — esperando moderador</span>
                        </div>
                    )}

                    {/* Cancel active duel */}
                    {isActive && (
                        <button
                            onClick={() => { if (confirm("Seguro que quieres cancelar el duelo?")) exec("Cancelar", () => cancelDuel(duelId, token)); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0", alignSelf: "center" }}
                        >
                            <span style={{ color: "var(--muted)", fontSize: 11, textDecoration: "underline" }}>Cancelar duelo</span>
                        </button>
                    )}
                </div>
            )}

            {/* Comments section */}
            {(isCompleted || isActive || isAwaiting) && (
                <div style={{
                    marginLeft: 20, marginRight: 20, marginBottom: 16, padding: 16,
                    backgroundColor: "var(--surface-solid)", borderRadius: 14, border: "1px solid var(--border)",
                }}>
                    <span style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 700, display: "block", marginBottom: 10 }}>Comentarios</span>

                    {comments.length > 0 ? (
                        comments.map((c) => (
                            <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <span style={{ color: "var(--muted)", fontSize: 10, fontWeight: 700 }}>{c.username?.[0]?.toUpperCase() || "?"}</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                        <span style={{ color: "var(--foreground)", fontSize: 11, fontWeight: 700 }}>{c.username || "Usuario"}</span>
                                        {c.created_at && <span style={{ color: "var(--muted)", fontSize: 9 }}>{timeAgo(c.created_at, { verbose: true })}</span>}
                                    </div>
                                    <span style={{ color: "var(--foreground)", fontSize: 13, lineHeight: "18px" }}>{c.content || c.text}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: "var(--muted)", fontSize: 11, textAlign: "center", padding: "12px 0", margin: 0 }}>Sin comentarios aun</p>
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
                                    flex: 1, backgroundColor: "var(--surface-tertiary)", borderRadius: 6,
                                    border: "1px solid var(--border)", padding: "8px 12px",
                                    color: "var(--foreground)", fontSize: 13, outline: "none",
                                }}
                            />
                            <button
                                onClick={handleSendComment}
                                disabled={!commentText.trim() || sendingComment}
                                style={{
                                    width: 36, height: 36, borderRadius: 18, backgroundColor: "var(--accent)",
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
                            </svg>
                            <span style={{ color: "var(--muted)", fontSize: 11 }}>Reportar oponente</span>
                        </button>
                    ) : (
                        <div style={{
                            padding: 14, backgroundColor: "var(--surface-solid)", borderRadius: 14,
                            border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10,
                        }}>
                            <span style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 700 }}>
                                Reportar a @{isChallenger ? duel.opponent.username : duel.challenger.username}
                            </span>
                            <textarea
                                placeholder="Motivo del reporte..."
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                maxLength={300}
                                rows={3}
                                style={{
                                    width: "100%", backgroundColor: "var(--surface-tertiary)", borderRadius: 6,
                                    border: "1px solid var(--border)", padding: "10px 12px",
                                    color: "var(--foreground)", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit",
                                }}
                            />
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => { setShowReportUser(false); setReportReason(""); }}
                                    style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--muted)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReportUser}
                                    disabled={!reportReason.trim() || loading === "reportUser"}
                                    style={{ flex: 2, padding: "12px 0", borderRadius: 10, border: "none", backgroundColor: "var(--danger)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: !reportReason.trim() ? "not-allowed" : "pointer", opacity: reportReason.trim() ? 1 : 0.4 }}
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
    border: "1px solid var(--border)", backgroundColor: "var(--surface)",
    color: "var(--foreground)", cursor: "pointer", fontSize: 18, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
};
