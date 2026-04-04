"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDuelSocket } from "@/lib/hooks/use-duel-socket";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@heroui/react";
import { useAuth } from "@/lib/hooks/use-auth";
import { mapErrorMessage } from "@/lib/api/errors";
import {
    acceptDuel,
    declineDuel,
    cancelDuel,
    confirmDuelResult,
    disputeDuel,
    getDuelComments,
    createDuelComment,
    reportDuelOpponent,
    getDuel,
} from "@/lib/api/duels";
import { getGameState, startGame } from "@/lib/api/game";
import type { Duel } from "@/lib/types/duel";
import type { GameStateSnapshot } from "@/lib/types/game";
import { TargetDart } from "@gravity-ui/icons";
import RankeaoSpinner from "@/components/ui/RankeaoSpinner";
import { getGameBrand } from "@/lib/gameLogos";
import GameTracker from "@/features/duel/GameTracker";
import MatchFoundOverlay from "@/features/duel/MatchFoundOverlay";
import GameStartedOverlay from "@/features/duel/GameStartedOverlay";

// Sub-components
import DuelHeroBanner from "@/features/duel/DuelHeroBanner";
import DuelMetaStats from "@/features/duel/DuelMetaStats";
import DuelSeriesProgress from "@/features/duel/DuelSeriesProgress";
import DuelDetailActions from "@/features/duel/DuelDetailActions";
import DuelChat from "@/features/duel/DuelChat";
import type { DuelComment } from "@/features/duel/DuelChat";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente", color: "var(--warning)" },
    ACCEPTED: { label: "Aceptado", color: "var(--accent)" },
    IN_PROGRESS: { label: "En curso", color: "var(--success)" },
    AWAITING_CONFIRMATION: { label: "Esperando confirmación", color: "var(--purple)" },
    COMPLETED: { label: "Finalizado", color: "var(--muted)" },
    DECLINED: { label: "Rechazado", color: "var(--danger)" },
    CANCELLED: { label: "Cancelado", color: "var(--muted)" },
    DISPUTED: { label: "Disputado", color: "var(--danger)" },
};

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
    const [showIntro, setShowIntro] = useState(false);
    const [introFading, setIntroFading] = useState(false);
    const [introType, setIntroType] = useState<"match_found" | "match_accepted" | "game_started" | null>(null);
    const [gameStartedInfo, setGameStartedInfo] = useState<{ gameNumber: number; mode: string } | null>(null);
    const introEligible = duel ? ["ACCEPTED", "IN_PROGRESS"].includes(duel.status) : false;
    const prevDuelStatusRef = useRef<string | null>(null);
    const prevGameNumberRef = useRef<number | null>(null);

    // Canonical redirect: once slug is available, update URL silently
    useEffect(() => {
        if (duel?.slug && duelId !== duel.slug) {
            router.replace(`/duelos/${duel.slug}`, { scroll: false });
        }
    }, [duel?.slug, duelId, router]);

    // Show intro animation once per duel — guarded by sessionStorage so it only fires once ever
    useEffect(() => {
        if (!duel || typeof window === "undefined") return;
        if (!["ACCEPTED", "IN_PROGRESS"].includes(duel.status)) return;
        const key = `intro_shown_${duelId}`;
        if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            setIntroType(duel.status === "IN_PROGRESS" ? "game_started" : "match_accepted");
            setShowIntro(true);
        }
    // Only run once when duel first loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duelId]);

    useEffect(() => {
        if (!showIntro) return;
        const timer = setTimeout(() => {
            try { if (navigator.vibrate) navigator.vibrate([150, 40, 80, 30, 50]); } catch {}
        }, 1200);
        return () => clearTimeout(timer);
    }, [showIntro]);

    useEffect(() => {
        if (!showIntro) return;
        const fadeTimer = setTimeout(() => setIntroFading(true), 3400);
        const hideTimer = setTimeout(() => setShowIntro(false), 4100);
        return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
    }, [showIntro]);

    const skipIntro = () => {
        setIntroFading(true);
        setTimeout(() => setShowIntro(false), 700);
    };

    // Elapsed timer
    const [elapsed, setElapsed] = useState("");
    useEffect(() => {
        if (!duel || !["ACCEPTED", "IN_PROGRESS"].includes(duel.status)) return;
        const start = new Date(duel.created_at).getTime();
        const tick = () => {
            const diff = Math.floor((Date.now() - start) / 1000);
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            setElapsed(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [duel?.status, duel?.created_at]);

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
            const gameNum = snap?.game?.game_number ?? null;
            if (gameNum) {
                setActiveGameNumber(gameNum);
                setActiveGameSnapshot(snap);
                // Trigger animation when opponent starts game (we had no active game before)
                if (prevGameNumberRef.current === null && typeof window !== "undefined") {
                    const key = `game_intro_${duelId}_${gameNum}`;
                    if (!sessionStorage.getItem(key)) {
                        sessionStorage.setItem(key, "1");
                        const gameMode = snap?.game?.mode ?? "simple";
                        setGameStartedInfo({ gameNumber: gameNum, mode: gameMode });
                        setIntroType("game_started");
                        setShowIntro(true);
                    }
                }
            }
            prevGameNumberRef.current = gameNum;
        } catch {}
    }, [duelId, token]);

    const handleStartGame = async () => {
        if (!token || !duel) return;
        setGameLoading(true);
        try {
            await startGame(duelId, { game_rules_slug: duel.game_slug ?? "" }, token);
            toast.success("Partida iniciada");
            setTimeout(() => fetchActiveGame(), 500);
        } catch (err: any) {
            if (err?.status === 409 || err?.code === "ACTIVE_GAME_EXISTS") {
                await fetchActiveGame();
            } else {
                toast.danger("Error", { description: mapErrorMessage(err) });
            }
        } finally {
            setGameLoading(false);
        }
    };

    const refreshDuel = useCallback(async () => {
        try {
            const res = await getDuel(duelId, token);
            if (res?.duel) {
                const updated = res.duel;
                // Detect PENDING -> ACCEPTED: show intro to the challenger waiting
                if (
                    prevDuelStatusRef.current === "PENDING" &&
                    updated.status === "ACCEPTED" &&
                    typeof window !== "undefined"
                ) {
                    const key = `intro_shown_${duelId}`;
                    if (!sessionStorage.getItem(key)) {
                        sessionStorage.setItem(key, "1");
                        setIntroType("match_accepted");
                        setShowIntro(true);
                    }
                }
                prevDuelStatusRef.current = updated.status;
                setDuel(updated);
                setInitialLoading(false);
                return updated;
            }
        } catch (err) { console.error("[DuelDetail] Error refreshing duel:", err); }
        finally { setInitialLoading(false); }
        return null;
    }, [duelId, token]);

    useEffect(() => {
        if (token) {
            refreshDuel().then((d) => {
                if (d) {
                    prevDuelStatusRef.current = d.status;
                    if (["ACCEPTED", "IN_PROGRESS"].includes(d.status)) fetchActiveGame();
                }
            });
            fetchComments();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, duelId]);

    // WebSocket: recibe eventos de aceptación y arranque de partida en tiempo real
    useDuelSocket(duelId, token ?? null, {
        onDuelAccepted: useCallback(() => {
            refreshDuel().then((d) => {
                if (!d) return;
                prevDuelStatusRef.current = d.status;
                if (["ACCEPTED", "IN_PROGRESS"].includes(d.status)) fetchActiveGame();
                // Mostrar animación al challenger (quien estaba esperando)
                if (typeof window !== "undefined") {
                    const key = `intro_shown_${duelId}`;
                    if (!sessionStorage.getItem(key)) {
                        sessionStorage.setItem(key, "1");
                        setIntroType("match_found");
                        setShowIntro(true);
                    }
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [duelId, refreshDuel, fetchActiveGame]),
        onGameStarted: useCallback(() => {
            const prevGame = prevGameNumberRef.current;
            fetchActiveGame().then(() => {
                if (typeof window !== "undefined") {
                    const gameNum = prevGameNumberRef.current ?? 1;
                    const key = `game_intro_${duelId}_${gameNum}`;
                    // Show animation if we didn't already show it via fetchActiveGame
                    if (prevGame === null && !sessionStorage.getItem(key)) {
                        sessionStorage.setItem(key, "1");
                        setIntroType("game_started");
                        setShowIntro(true);
                    }
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [duelId, fetchActiveGame]),
    });

    // Polling de respaldo solo para AWAITING_CONFIRMATION (no cubierto por WS)
    useEffect(() => {
        if (!duel) return;
        if (duel.status !== "AWAITING_CONFIRMATION") return;
        const interval = setInterval(() => refreshDuel(), 10000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duel?.status, duelId, token]);

    // ── Loading / Not found ──

    if (initialLoading) {
        return (
            <div className="max-w-5xl mx-auto flex items-center justify-center" style={{ minHeight: "60vh" }}>
                <RankeaoSpinner className="h-12 w-auto" />
            </div>
        );
    }

    if (!duel) {
        return (
            <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-24 gap-3">
                <TargetDart style={{ width: 40, height: 40, color: "var(--muted)", opacity: 0.5 }} />
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Duelo no encontrado</p>
                <Link href="/duelos" className="text-xs font-semibold" style={{ color: "var(--accent)", textDecoration: "none" }}>
                    Volver a duelos
                </Link>
            </div>
        );
    }

    // ── Derived state ──

    const cfg = STATUS_CONFIG[duel.status] ?? STATUS_CONFIG.PENDING;
    const brand = getGameBrand(duel.game_slug ?? "");
    const isChallenger = myUsername === duel.challenger.username;
    const isOpponent = myUsername === duel.opponent.username;
    const isMyDuel = isChallenger || isOpponent;
    const isPending = duel.status === "PENDING";
    const isActive = ["ACCEPTED", "IN_PROGRESS"].includes(duel.status);
    const isAwaiting = duel.status === "AWAITING_CONFIRMATION";
    const isCompleted = duel.status === "COMPLETED";
    const isDisputed = duel.status === "DISPUTED";
    const hasActiveStatus = ["ACCEPTED", "IN_PROGRESS", "AWAITING_CONFIRMATION"].includes(duel.status);

    const challengerWon = duel.winner_id === duel.challenger.id;
    const opponentWon = duel.winner_id === duel.opponent.id;
    const iWon = isChallenger ? challengerWon : opponentWon;
    const maxWins = Math.max(1, Math.ceil((duel.best_of || 1) / 2));
    const isReporter = duel.reporter_id === duel.challenger.id ? isChallenger : isOpponent;

    const p1 = duel.challenger;
    const p2 = duel.opponent;

    // ── Game active: show only the tracker ──

    if (isActive && isMyDuel && token && activeGameNumber !== null) {
        return (
            <GameTracker
                duelID={duelId}
                myPlayerID={isChallenger ? parseInt(p1.id, 10) : parseInt(p2.id, 10)}
                opponentPlayerID={isChallenger ? parseInt(p2.id, 10) : parseInt(p1.id, 10)}
                myUsername={myUsername ?? "Yo"}
                opponentUsername={isChallenger ? (p2.display_name ?? p2.username) : (p1.display_name ?? p1.username)}
                myAvatarUrl={isChallenger ? p1.avatar_url : p2.avatar_url}
                opponentAvatarUrl={isChallenger ? p2.avatar_url : p1.avatar_url}
                token={token}
                gameNumber={activeGameNumber}
                initialSnapshot={activeGameSnapshot}
                onGameEnd={() => refreshDuel()}
            />
        );
    }

    // ── Actions ──

    const exec = async (label: string, fn: () => Promise<unknown>) => {
        if (!token) { toast.danger("Error", { description: "Debes iniciar sesión" }); return; }
        setLoading(label);
        try {
            await fn();
            toast.success("Listo", { description: `Acción "${label}" realizada` });
            await refreshDuel();
        } catch (err: any) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally { setLoading(null); }
    };

    const handleSendComment = async () => {
        if (!commentText.trim() || sendingComment || !token) return;
        setSendingComment(true);
        try {
            await createDuelComment(duelId, { content: commentText.trim() }, token);
            setCommentText("");
            await fetchComments();
        } catch (err: any) { toast.danger("Error", { description: mapErrorMessage(err) }); }
        finally { setSendingComment(false); }
    };

    const handleReportUser = async () => {
        if (!reportReason.trim() || !token) return;
        setLoading("reportUser");
        try {
            await reportDuelOpponent(duelId, { reason: reportReason.trim() }, token);
            toast.success("Reporte enviado");
            setShowReportUser(false);
            setReportReason("");
        } catch (err: any) { toast.danger("Error", { description: mapErrorMessage(err) }); }
        finally { setLoading(null); }
    };

    const handleShare = () => {
        const url = `https://rankeao.cl/duelos/${duel?.slug ?? duelId}`;
        const text = `${p1.display_name || p1.username} vs ${p2.display_name || p2.username}`;
        if (navigator.share) { navigator.share({ title: text, url }).catch(() => {}); }
        else { navigator.clipboard.writeText(url).then(() => toast.success("URL copiada")).catch(() => {}); }
    };

    // ── Intro animation ──

    if (showIntro && duel) {
        // Match found / accepted overlay
        if (introType === "match_found" || introType === "match_accepted") {
            return (
                <MatchFoundOverlay
                    type={introType === "match_found" ? "found" : "accepted"}
                    challengerUsername={p1.display_name || p1.username}
                    challengerAvatarUrl={p1.avatar_url}
                    challengedUsername={p2.display_name || p2.username}
                    challengedAvatarUrl={p2.avatar_url}
                    gameName={duel.game_name}
                    bestOf={duel.best_of}
                    isFading={introFading}
                    onSkip={skipIntro}
                />
            );
        }

        // Game started overlay
        if (introType === "game_started") {
            const gameNum = gameStartedInfo?.gameNumber ?? 1;
            const rawMode = gameStartedInfo?.mode ?? "simple";
            const overlayMode: "simple" | "advanced" =
                rawMode === "advanced" ? "advanced" : "simple";
            return (
                <GameStartedOverlay
                    gameNumber={gameNum}
                    totalGames={duel.best_of ?? 1}
                    mode={overlayMode}
                    gameName={duel.game_name}
                    formatName={duel.format_name}
                    isFading={introFading}
                    onSkip={skipIntro}
                />
            );
        }

    }

    // ──────────────────────────────────
    // ── MAIN DETAIL PAGE
    // ──────────────────────────────────

    const hasScore = duel.challenger_wins != null && duel.opponent_wins != null && (duel.challenger_wins > 0 || duel.opponent_wins > 0);

    return (
        <div className="w-full" style={{ animation: introEligible ? "duelReveal 1.2s cubic-bezier(0.16,1,0.3,1) both" : undefined }}>
            <style>{`
                @keyframes duelReveal {
                    0% { opacity: 0; transform: scale(1.04) translateY(-20px); filter: blur(12px) brightness(2); }
                    40% { opacity: 1; filter: blur(4px) brightness(1.3); }
                    100% { opacity: 1; transform: none; filter: blur(0) brightness(1); }
                }
                @media (max-width: 640px) {
                    @keyframes duelReveal {
                        0% { opacity: 0; transform: translateY(-16px); }
                        100% { opacity: 1; transform: none; }
                    }
                }
                @keyframes duelStagger1 { 0% { opacity:0; transform:translateY(20px); } 100% { opacity:1; transform:none; } }
                @keyframes duelStagger2 { 0%, 15% { opacity:0; transform:translateY(16px); } 100% { opacity:1; transform:none; } }
                @keyframes duelStagger3 { 0%, 30% { opacity:0; transform:translateY(12px); } 100% { opacity:1; transform:none; } }
                @keyframes pulseGlow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
            `}</style>

            {/* Hero banner */}
            <DuelHeroBanner
                p1={p1}
                p2={p2}
                brand={brand}
                statusColor={cfg.color}
                hasActiveStatus={hasActiveStatus}
                hasScore={hasScore}
                challengerWins={duel.challenger_wins}
                opponentWins={duel.opponent_wins}
                challengerWon={challengerWon}
                opponentWon={opponentWon}
                isChallenger={isChallenger}
                isOpponent={isOpponent}
                introEligible={introEligible}
                onShare={handleShare}
            />

            {/* Content area */}
            <div className="px-4 sm:px-6 pb-20 max-w-5xl mx-auto">
                {/* Meta stats */}
                <DuelMetaStats
                    statusLabel={cfg.label}
                    statusColor={cfg.color}
                    hasActiveStatus={hasActiveStatus}
                    gameName={duel.game_name}
                    formatName={duel.format_name}
                    bestOf={duel.best_of}
                    isActive={isActive}
                    elapsed={elapsed}
                    brand={brand}
                    introEligible={introEligible}
                />

                {/* Series progress */}
                {duel.best_of > 1 && (duel.challenger_wins != null || duel.opponent_wins != null) && (
                    <DuelSeriesProgress
                        p1={p1}
                        p2={p2}
                        challengerWins={duel.challenger_wins ?? 0}
                        opponentWins={duel.opponent_wins ?? 0}
                        maxWins={maxWins}
                    />
                )}

                {/* Actions: result banner, XP, message, accept/decline/cancel/confirm/dispute, report user */}
                <DuelDetailActions
                    duel={duel}
                    p1={p1}
                    p2={p2}
                    isChallenger={isChallenger}
                    isOpponent={isOpponent}
                    isMyDuel={isMyDuel}
                    isPending={isPending}
                    isAwaiting={isAwaiting}
                    isDisputed={isDisputed}
                    isCompleted={isCompleted}
                    isReporter={isReporter}
                    iWon={iWon}
                    hasScore={hasScore}
                    loading={loading}
                    introEligible={introEligible}
                    showReportUser={showReportUser}
                    setShowReportUser={setShowReportUser}
                    reportReason={reportReason}
                    setReportReason={setReportReason}
                    onAccept={() => exec("Aceptar", () => acceptDuel(duelId, token))}
                    onDecline={() => { if (confirm("¿Seguro que quieres rechazar?")) exec("Rechazar", () => declineDuel(duelId, token)); }}
                    onCancel={() => { if (confirm("¿Seguro que quieres cancelar?")) exec("Cancelar", () => cancelDuel(duelId, token)); }}
                    onConfirm={() => exec("Confirmar", () => confirmDuelResult(duelId, token))}
                    onDispute={() => { if (confirm("El resultado será revisado por un moderador. ¿Continuar?")) exec("Disputar", () => disputeDuel(duelId, token)); }}
                    onReportUser={handleReportUser}
                />

                {/* Start game button (only when no active game) */}
                {isActive && isMyDuel && token && activeGameNumber === null && (
                    <button
                        onClick={handleStartGame}
                        disabled={gameLoading}
                        className="w-full mb-4 py-3.5 rounded-xl border-none text-white text-[15px] font-extrabold flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: "var(--accent)", cursor: gameLoading ? "not-allowed" : "pointer",
                            opacity: gameLoading ? 0.7 : 1, boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                        }}
                    >
                        {gameLoading ? (
                            <><div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Iniciando...</>
                        ) : <><TargetDart style={{ width: 18, height: 18 }} /> Iniciar partida</>}
                    </button>
                )}

                {/* Chat */}
                {(isCompleted || isActive || isAwaiting) && (
                    <DuelChat
                        comments={comments}
                        commentText={commentText}
                        sendingComment={sendingComment}
                        isMyDuel={isMyDuel}
                        onCommentTextChange={setCommentText}
                        onSendComment={handleSendComment}
                    />
                )}
            </div>
        </div>
    );
}
