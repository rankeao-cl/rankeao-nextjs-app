"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDuelSocket } from "@/lib/hooks/use-duel-socket";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@heroui/react";
import { useAuth } from "@/lib/hooks/use-auth";
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
import { TargetDart, Comment } from "@gravity-ui/icons";
import RankeaoSpinner from "@/components/ui/RankeaoSpinner";
import { getGameBrand } from "@/lib/gameLogos";
import GameTracker from "@/features/duel/GameTracker";
import MatchFoundOverlay from "@/features/duel/MatchFoundOverlay";
import GameStartedOverlay from "@/features/duel/GameStartedOverlay";

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

// ── Avatar helper ──

function PlayerAvatar({ player, size, ringColor }: { player: Duel["challenger"]; size: number; ringColor: string }) {
    const inner = size - 6;
    return (
        <div style={{
            width: size, height: size, borderRadius: size / 2,
            background: ringColor, padding: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <div style={{
                width: inner, height: inner, borderRadius: inner / 2,
                backgroundColor: "var(--background)", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                {player.avatar_url ? (
                    <Image src={player.avatar_url} alt={player.username} width={inner} height={inner} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <span style={{ fontSize: size * 0.3, fontWeight: 800, color: "var(--foreground)" }}>
                        {(player.username || "?").charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
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

    // Report form
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
                // Detect PENDING → ACCEPTED: show intro to the challenger waiting
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
        // eslint-disable name-line react-hooks/exhaustive-deps
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

    const handleReport = async () => {
        if (!token || !duel) return;
        if (myWins + oppWins === 0) { toast.danger("Error", { description: "Ingresa al menos un resultado" }); return; }
        if (myWins > maxWins || oppWins > maxWins) { toast.danger("Error", { description: `Máximo ${maxWins} victorias en Bo${duel.best_of}` }); return; }
        if (myWins !== maxWins && oppWins !== maxWins) { toast.danger("Error", { description: `Alguien debe llegar a ${maxWins} victorias` }); return; }
        const cWins = isChallenger ? myWins : oppWins;
        const oWins = isChallenger ? oppWins : myWins;
        const winnerId = cWins > oWins ? duel.challenger.id : duel.opponent.id;
        setLoading("report");
        try {
            await reportDuelResult(duelId, { winner_id: winnerId, score_challenger: cWins, score_challenged: oWins }, token);
            toast.success("Resultado reportado", { description: "Esperando confirmación del oponente." });
            await refreshDuel();
        } catch (err: any) { toast.danger("Error", { description: mapErrorMessage(err) }); }
        finally { setLoading(null); }
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

        // Fallback: legacy full-screen VS intro
        const renderAvatar = (player: typeof p1, size: number) => (
            <PlayerAvatar player={player} size={size} ringColor="var(--accent)" />
        );

        const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
        const sparkCount = isMobile ? 4 : 8;
        const sparks = Array.from({ length: sparkCount }, (_, i) => {
            const angle = (i / sparkCount) * 360;
            const dist = 60 + Math.random() * 80;
            const x = Math.cos(angle * Math.PI / 180) * dist;
            const y = Math.sin(angle * Math.PI / 180) * dist;
            const size = 3 + Math.random() * 4;
            const delay = 1.2 + Math.random() * 0.15;
            return { x, y, size, delay };
        });

        // Lightning bolt SVG segments — viewBox 1600x900 (16:9)
        const boltCount = isMobile ? 4 : 8;
        const bolts = Array.from({ length: boltCount }, (_, i) => {
            const side = i < boltCount / 2 ? "left" : "right";
            const xStart = side === "left" ? 100 + Math.random() * 500 : 1000 + Math.random() * 500;
            const yStart = 50 + Math.random() * 200;
            const segments = Array.from({ length: 5 }, () => {
                const dx = (Math.random() - 0.5) * 120;
                const dy = 80 + Math.random() * 60;
                return `l ${dx} ${dy}`;
            }).join(" ");
            const delay = 0.9 + Math.random() * 0.6;
            return { path: `M ${xStart} ${yStart} ${segments}`, delay, side };
        });

        return (
            <div style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "#000",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                overflow: "hidden",
            }}>
                <style>{`
                    @keyframes introSlideLeft {
                        0% { opacity: 0; transform: translateX(-110vw) scale(1.2); filter: blur(8px); }
                        25% { opacity: 1; filter: blur(0); }
                        35%, 100% { transform: translateX(0) scale(1); opacity: 1; }
                    }
                    @keyframes introSlideRight {
                        0% { opacity: 0; transform: translateX(110vw) scale(1.2); filter: blur(8px); }
                        25% { opacity: 1; filter: blur(0); }
                        35%, 100% { transform: translateX(0) scale(1); opacity: 1; }
                    }
                    @keyframes introVsExplode {
                        0%, 30% { opacity: 0; transform: scale(0); }
                        45% { opacity: 1; transform: scale(2.2); }
                        55% { transform: scale(0.85); }
                        65% { transform: scale(1.1); }
                        75%, 100% { opacity: 1; transform: scale(1); }
                    }
                    @keyframes introVsGlow {
                        0%, 40% { text-shadow: none; filter: brightness(1); }
                        50% { text-shadow: 0 0 60px rgba(59,130,246,1), 0 0 120px rgba(59,130,246,0.6), 0 0 200px rgba(59,130,246,0.3); filter: brightness(2); }
                        70% { text-shadow: 0 0 30px rgba(59,130,246,0.6), 0 0 60px rgba(59,130,246,0.25); filter: brightness(1.2); }
                        100% { text-shadow: 0 0 20px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.15); filter: brightness(1); }
                    }
                    @keyframes introImpact {
                        0%, 38% { opacity: 0; }
                        40% { opacity: 1; }
                        45% { opacity: 0.6; }
                        48% { opacity: 0.9; }
                        55%, 100% { opacity: 0; }
                    }
                    @keyframes introShake {
                        0%, 38% { transform: translate(0,0) rotate(0); }
                        39% { transform: translate(-8px, 6px) rotate(-0.5deg); }
                        40% { transform: translate(10px, -4px) rotate(0.5deg); }
                        41% { transform: translate(-6px, -8px) rotate(-0.3deg); }
                        42% { transform: translate(7px, 3px) rotate(0.3deg); }
                        43% { transform: translate(-4px, -2px); }
                        44% { transform: translate(2px, 1px); }
                        46%, 100% { transform: translate(0,0) rotate(0); }
                    }
                    @keyframes introPlayerAura {
                        0%, 30% { box-shadow: 0 0 0px transparent; }
                        40% { box-shadow: 0 0 30px rgba(59,130,246,0.5), 0 0 60px rgba(59,130,246,0.2), inset 0 0 20px rgba(59,130,246,0.1); }
                        100% { box-shadow: 0 0 15px rgba(59,130,246,0.3), 0 0 30px rgba(59,130,246,0.1); }
                    }
                    @keyframes introNameIn {
                        0% { opacity: 0; transform: translateY(10px); letter-spacing: 8px; }
                        30% { opacity: 1; transform: translateY(0); letter-spacing: 0px; }
                        80% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    @keyframes introEloIn {
                        0%, 35% { opacity: 0; transform: scale(0.8); }
                        50%, 80% { opacity: 1; transform: scale(1); }
                        100% { opacity: 0; }
                    }
                    @keyframes introSlash {
                        0%, 35% { transform: scaleY(0); opacity: 0; }
                        40% { transform: scaleY(1); opacity: 0.6; }
                        60% { opacity: 0.3; }
                        100% { opacity: 0.15; }
                    }
                    @keyframes introBolt {
                        0% { stroke-dashoffset: 200; opacity: 0; }
                        10% { opacity: 1; }
                        40% { stroke-dashoffset: 0; }
                        50% { opacity: 0.8; }
                        70% { opacity: 0; }
                        100% { opacity: 0; stroke-dashoffset: 0; }
                    }
                    @keyframes introRingPulse {
                        0%, 35% { transform: scale(0); opacity: 0; }
                        42% { transform: scale(1); opacity: 0.4; }
                        60% { transform: scale(2.5); opacity: 0; }
                        100% { opacity: 0; }
                    }
                    @keyframes introTagsIn {
                        0%, 55% { opacity: 0; transform: translateY(16px); }
                        70%, 100% { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes introFightIn {
                        0%, 50% { opacity: 0; transform: scale(4) rotate(-8deg); filter: blur(10px); }
                        60% { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); }
                        68% { transform: scale(1.15) rotate(1deg); }
                        76%, 100% { opacity: 1; transform: scale(1) rotate(0); }
                    }
                    @keyframes introFightGlow {
                        0%, 55% { text-shadow: none; }
                        62% { text-shadow: 0 0 40px rgba(239,68,68,0.8), 0 0 80px rgba(239,68,68,0.4), 0 0 120px rgba(239,68,68,0.2); }
                        100% { text-shadow: 0 0 20px rgba(239,68,68,0.4), 0 0 40px rgba(239,68,68,0.15); }
                    }
                    @keyframes introSkipIn { 0%, 65% { opacity: 0; } 100% { opacity: 0.6; } }
                    @keyframes introBgPulse {
                        0% { opacity: 0; }
                        40% { opacity: 0; }
                        44% { opacity: 0.15; }
                        50% { opacity: 0; }
                        100% { opacity: 0; }
                    }
                    @keyframes introSpeedLine {
                        0% { transform: scaleX(0); opacity: 0; }
                        15% { transform: scaleX(1); opacity: 0.4; }
                        50%, 100% { transform: scaleX(1.5); opacity: 0; }
                    }

                    /* ── Mobile optimizations ── */
                    @media (max-width: 640px) {
                        /* Remove filter:blur from slide animations — expensive on mobile GPU */
                        @keyframes introSlideLeft {
                            0% { opacity: 0; transform: translateX(-100vw); }
                            30% { opacity: 1; }
                            40%, 100% { transform: translateX(0); opacity: 1; }
                        }
                        @keyframes introSlideRight {
                            0% { opacity: 0; transform: translateX(100vw); }
                            30% { opacity: 1; }
                            40%, 100% { transform: translateX(0); opacity: 1; }
                        }
                        /* Simpler VS — no brightness filter */
                        @keyframes introVsGlow {
                            0%, 40% { text-shadow: none; }
                            50% { text-shadow: 0 0 30px rgba(59,130,246,0.8), 0 0 60px rgba(59,130,246,0.3); }
                            100% { text-shadow: 0 0 15px rgba(59,130,246,0.3); }
                        }
                        /* Lighter player aura */
                        @keyframes introPlayerAura {
                            0%, 30% { box-shadow: 0 0 0px transparent; }
                            40%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.3); }
                        }
                        /* No blur on FIGHT */
                        @keyframes introFightIn {
                            0%, 50% { opacity: 0; transform: scale(3); }
                            60% { opacity: 1; transform: scale(1); }
                            68% { transform: scale(1.1); }
                            76%, 100% { opacity: 1; transform: scale(1); }
                        }
                        /* Lighter fight glow */
                        @keyframes introFightGlow {
                            0%, 55% { text-shadow: none; }
                            62% { text-shadow: 0 0 20px rgba(239,68,68,0.5); }
                            100% { text-shadow: 0 0 10px rgba(239,68,68,0.3); }
                        }
                        /* Simpler shake — fewer steps */
                        @keyframes introShake {
                            0%, 38% { transform: translate(0,0); }
                            40% { transform: translate(-4px, 3px); }
                            42% { transform: translate(3px, -2px); }
                            44%, 100% { transform: translate(0,0); }
                        }
                    }
                `}</style>

                {/* Dark radial bg with game brand tint */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${brand.color}12 0%, #000 70%)`,
                }} />

                {/* Impact flash */}
                <div style={{ position: "absolute", inset: 0, backgroundColor: brand.color, pointerEvents: "none", animation: "introImpact 3.2s ease-out forwards", zIndex: 3 }} />

                {/* Bg pulse on impact */}
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${brand.color}60 0%, transparent 50%)`, pointerEvents: "none", animation: "introBgPulse 3.2s ease-out forwards", zIndex: 1 }} />

                {/* Diagonal slash through center */}
                <div style={{
                    position: "absolute", top: "50%", left: "50%", width: 3, height: "140%",
                    background: `linear-gradient(180deg, transparent 0%, ${brand.color}80 30%, #fff 50%, ${brand.color}80 70%, transparent 100%)`,
                    transform: "translate(-50%, -50%) rotate(12deg)", transformOrigin: "center",
                    animation: "introSlash 3.2s ease-out forwards", zIndex: 2,
                }} />
                <div style={{
                    position: "absolute", top: "50%", left: "calc(50% + 6px)", width: 1, height: "140%",
                    background: `linear-gradient(180deg, transparent 0%, ${brand.color}40 30%, ${brand.color}60 50%, ${brand.color}40 70%, transparent 100%)`,
                    transform: "translate(-50%, -50%) rotate(12deg)", transformOrigin: "center",
                    animation: "introSlash 3.2s 0.05s ease-out forwards", zIndex: 2,
                }} />

                {/* Lightning bolts */}
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2, pointerEvents: "none" }} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
                    {bolts.map((b, i) => (
                        <path
                            key={`bolt-${i}`}
                            d={b.path}
                            fill="none"
                            stroke={i % 2 === 0 ? brand.color : "#fff"}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="200"
                            style={{ animation: `introBolt 0.8s ${b.delay}s ease-out forwards`, opacity: 0 }}
                        />
                    ))}
                </svg>

                {/* Speed lines — full-width energy streaks */}
                {Array.from({ length: isMobile ? 6 : 12 }).map((_, i) => {
                    const top = 10 + Math.random() * 80;
                    const isLeft = i < 6;
                    const widthPct = 25 + Math.random() * 35;
                    const delay = 0.7 + Math.random() * 0.5;
                    const h = 1 + Math.random() * 2;
                    return (
                        <div key={`speed-${i}`} style={{
                            position: "absolute",
                            [isLeft ? "left" : "right"]: 0,
                            top: `${top}%`,
                            width: `${widthPct}%`, height: h,
                            background: `linear-gradient(${isLeft ? "90deg" : "270deg"}, ${brand.color}60, ${brand.color}, transparent)`,
                            transformOrigin: isLeft ? "left" : "right",
                            animation: `introSpeedLine 0.7s ${delay}s ease-out forwards`,
                            opacity: 0, zIndex: 2,
                        }} />
                    );
                })}

                {/* Expanding ring on impact */}
                <div style={{
                    position: "absolute", top: "50%", left: "50%", width: 200, height: 200,
                    marginLeft: -100, marginTop: -100,
                    borderRadius: "50%", border: `2px solid ${brand.color}`,
                    animation: "introRingPulse 3.2s ease-out forwards",
                    pointerEvents: "none", zIndex: 2,
                }} />
                {!isMobile && <div style={{
                    position: "absolute", top: "50%", left: "50%", width: 300, height: 300,
                    marginLeft: -150, marginTop: -150,
                    borderRadius: "50%", border: `1px solid ${brand.color}60`,
                    animation: "introRingPulse 3.2s 0.1s ease-out forwards",
                    pointerEvents: "none", zIndex: 2,
                }} />}

                {/* Spark particles — more and varied */}
                {sparks.map((s, i) => (
                    <div key={`spark-${i}`} style={{
                        position: "absolute", left: "50%", top: "50%",
                        width: s.size, height: s.size, borderRadius: "50%",
                        backgroundColor: i % 4 === 0 ? brand.color : i % 4 === 1 ? "#fff" : i % 4 === 2 ? "var(--warning)" : brand.color,
                        boxShadow: isMobile ? "none" : `0 0 ${s.size * 2}px ${i % 2 === 0 ? brand.color : "#fff"}`,
                        opacity: 0, animation: `sparkMove${i} 0.8s ${s.delay}s ease-out forwards`,
                        zIndex: 4,
                    }}>
                        <style>{`@keyframes sparkMove${i} { 0% { opacity:1; transform:translate(0,0) scale(1.5); } 100% { opacity:0; transform:translate(${s.x * 1.5}px,${s.y * 1.5}px) scale(0); } }`}</style>
                    </div>
                ))}

                {/* Main content */}
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
                    opacity: introFading ? 0 : 1,
                    transform: introFading ? "scale(1.2)" : "scale(1)",
                    filter: introFading && !isMobile ? "blur(8px) brightness(2)" : "none",
                    transition: `opacity 0.7s ease-out, transform 0.7s ease-out${!isMobile ? ", filter 0.7s ease-out" : ""}`,
                    animation: "introShake 3.2s ease-out forwards", zIndex: 5,
                }}>
                    {/* Players row */}
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 20 : 40 }}>
                        {/* P1 */}
                        <div style={{ animation: "introSlideLeft 1.4s cubic-bezier(0.16,1,0.3,1) forwards", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <div style={{ animation: "introPlayerAura 3.2s ease-out forwards", borderRadius: "50%" }}>
                                {renderAvatar(p1, isMobile ? 72 : 100)}
                            </div>
                            <span style={{ fontSize: isMobile ? 14 : 18, fontWeight: 900, color: "#fff", animation: "introNameIn 3.2s ease-out forwards", maxWidth: isMobile ? 90 : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>
                                {p1.display_name || p1.username}
                            </span>
                            {p1.rating != null && (
                                <span style={{ fontSize: 12, fontWeight: 700, color: brand.color, animation: "introEloIn 3.2s ease-out forwards", opacity: 0 }}>
                                    {p1.rating} ELO
                                </span>
                            )}
                        </div>

                        {/* VS */}
                        <div style={{ animation: "introVsExplode 3.2s cubic-bezier(0.34,1.56,0.64,1) forwards", opacity: 0 }}>
                            <span style={{
                                fontSize: isMobile ? 48 : 72, fontWeight: 900, color: "#fff",
                                animation: "introVsGlow 3.2s ease-out forwards",
                                letterSpacing: "-3px",
                                WebkitTextStroke: `1px ${brand.color}`,
                            }}>VS</span>
                        </div>

                        {/* P2 */}
                        <div style={{ animation: "introSlideRight 1.4s cubic-bezier(0.16,1,0.3,1) forwards", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <div style={{ animation: "introPlayerAura 3.2s ease-out forwards", borderRadius: "50%" }}>
                                {renderAvatar(p2, isMobile ? 72 : 100)}
                            </div>
                            <span style={{ fontSize: isMobile ? 14 : 18, fontWeight: 900, color: "#fff", animation: "introNameIn 3.2s ease-out forwards", maxWidth: isMobile ? 90 : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>
                                {p2.display_name || p2.username}
                            </span>
                            {p2.rating != null && (
                                <span style={{ fontSize: 12, fontWeight: 700, color: brand.color, animation: "introEloIn 3.2s ease-out forwards", opacity: 0 }}>
                                    {p2.rating} ELO
                                </span>
                            )}
                        </div>
                    </div>

                    {/* FIGHT! */}
                    <div style={{ animation: "introFightIn 3.2s cubic-bezier(0.16,1,0.3,1) forwards", opacity: 0 }}>
                        <span style={{
                            fontSize: 36, fontWeight: 900, color: "#EF4444",
                            letterSpacing: "8px", textTransform: "uppercase",
                            animation: "introFightGlow 3.2s ease-out forwards",
                        }}>FIGHT!</span>
                    </div>

                    {/* Tags */}
                    <div style={{ display: "flex", gap: 8, animation: "introTagsIn 3.2s ease-out forwards", opacity: 0 }}>
                        {duel.game_name && <span style={{ fontSize: 13, fontWeight: 700, color: brand.color, background: `${brand.color}20`, border: `1px solid ${brand.color}40`, padding: "5px 14px", borderRadius: 999 }}>{duel.game_name}</span>}
                        {duel.format_name && <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "5px 14px", borderRadius: 999 }}>{duel.format_name}</span>}
                        {duel.best_of != null && duel.best_of > 0 && <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "5px 14px", borderRadius: 999 }}>Bo{duel.best_of}</span>}
                    </div>

                    {/* Skip */}
                    <button onClick={skipIntro} style={{
                        animation: "introSkipIn 3.2s ease-out forwards", opacity: 0,
                        marginTop: 4, background: "none",
                        border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)",
                        fontSize: 12, fontWeight: 600, padding: "6px 18px", borderRadius: 999, cursor: "pointer",
                    }}>Saltar</button>
                </div>
            </div>
        );
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

            {/* ── Hero banner — Tournament-style ── */}
            <div className="relative w-full overflow-hidden" style={{ height: 200, backgroundColor: "var(--surface-solid)", animation: introEligible ? "duelStagger1 0.8s cubic-bezier(0.16,1,0.3,1) both" : undefined }}>
                {/* Background gradient with game brand */}
                <div className="absolute inset-0" style={{
                    background: `linear-gradient(135deg, ${brand.bg} 0%, color-mix(in srgb, ${brand.color} 10%, ${brand.bg}) 50%, #0a0a10 100%)`,
                }} />

                {/* Glow radial from game color */}
                <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 30%, ${brand.color}20 0%, transparent 70%)` }} />

                {/* Dark overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Status bar at top */}
                <div className={`absolute top-0 inset-x-0 z-10 ${hasActiveStatus ? "animate-pulse" : ""}`}
                    style={{ height: 3, background: `linear-gradient(90deg, ${brand.color}, ${cfg.color}, transparent)` }}
                />

                {/* Nav buttons */}
                <div className="absolute top-4 left-4 z-10">
                    <Link href="/duelos" style={{
                        width: 40, height: 40, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none",
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </Link>
                </div>
                <div className="absolute top-4 right-4 z-10">
                    <button onClick={handleShare} style={{
                        width: 40, height: 40, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    </button>
                </div>

                {/* Bottom: VS matchup hero */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-4">
                    <div className="max-w-5xl mx-auto flex items-end justify-between gap-3">
                        {/* Player 1 */}
                        <div className="flex items-center gap-3 min-w-0">
                            <PlayerAvatar player={p1} size={52} ringColor={challengerWon ? "var(--success)" : isChallenger ? "var(--accent)" : "var(--border)"} />
                            <div className="min-w-0">
                                <p className="text-white font-extrabold text-sm sm:text-base truncate" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                                    {p1.display_name || p1.username}
                                </p>
                                <p className="text-white/50 text-[11px] truncate">@{p1.username}{p1.rating != null && ` · ${p1.rating} ELO`}</p>
                            </div>
                        </div>

                        {/* Score / VS */}
                        <div className="flex flex-col items-center shrink-0 pb-0.5">
                            {hasScore ? (
                                <span className="text-white font-black text-2xl sm:text-3xl tracking-tight" style={{ textShadow: `0 0 16px ${brand.color}40` }}>
                                    {duel.challenger_wins} – {duel.opponent_wins}
                                </span>
                            ) : (
                                <span className="text-white/60 font-black text-xl tracking-widest">VS</span>
                            )}
                        </div>

                        {/* Player 2 */}
                        <div className="flex items-center gap-3 min-w-0 flex-row-reverse text-right">
                            <PlayerAvatar player={p2} size={52} ringColor={opponentWon ? "var(--success)" : isOpponent ? "var(--accent)" : "var(--border)"} />
                            <div className="min-w-0">
                                <p className="text-white font-extrabold text-sm sm:text-base truncate" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                                    {p2.display_name || p2.username}
                                </p>
                                <p className="text-white/50 text-[11px] truncate">{p2.rating != null && `${p2.rating} ELO · `}@{p2.username}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content area ── */}
            <div className="px-4 sm:px-6 pb-20 max-w-5xl mx-auto">
                {/* Meta stats row — Tournament style */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mt-4 mb-4" style={{ animation: introEligible ? "duelStagger2 0.8s cubic-bezier(0.16,1,0.3,1) both" : undefined }}>
                    {/* Status */}
                    <div className="flex-1 min-w-[80px] p-2.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                        <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 flex items-center justify-center gap-1" style={{ color: "var(--muted)" }}>
                            {hasActiveStatus && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color, animation: "pulseGlow 1.6s ease-in-out infinite" }} />}
                            Estado
                        </p>
                        <p className="text-xs font-bold truncate" style={{ color: cfg.color }}>{cfg.label}</p>
                    </div>
                    {/* Game */}
                    {duel.game_name && (
                        <div className="flex-1 min-w-[80px] p-2.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                            <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Juego</p>
                            <p className="text-xs font-bold truncate" style={{ color: brand.color }}>{duel.game_name}</p>
                        </div>
                    )}
                    {/* Format */}
                    {duel.format_name && (
                        <div className="flex-1 min-w-[80px] p-2.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                            <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Formato</p>
                            <p className="text-xs font-bold truncate" style={{ color: "var(--foreground)" }}>{duel.format_name}</p>
                        </div>
                    )}
                    {/* Best of */}
                    {duel.best_of != null && duel.best_of > 0 && (
                        <div className="flex-1 min-w-[60px] p-2.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                            <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Serie</p>
                            <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Bo{duel.best_of}</p>
                        </div>
                    )}
                    {/* Timer */}
                    {isActive && elapsed && (
                        <div className="flex-1 min-w-[70px] p-2.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                            <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Tiempo</p>
                            <p className="text-xs font-bold tabular-nums" style={{ color: "var(--foreground)" }}>{elapsed}</p>
                        </div>
                    )}
                    {/* Type */}
                    <div className="flex-1 min-w-[60px] p-2.5 rounded-xl border text-center" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                        <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: "var(--muted)" }}>Tipo</p>
                        <p className="text-xs font-bold" style={{ color: "var(--warning)" }}>Casual</p>
                    </div>
                </div>

                {/* Bo series progress dots */}
                {duel.best_of > 1 && (duel.challenger_wins != null || duel.opponent_wins != null) && (
                    <div className="mb-4 p-3 rounded-xl border" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--muted)" }}>Progreso de serie</span>
                            <span className="text-[10px] font-bold" style={{ color: "var(--muted)" }}>Primero a {maxWins}</span>
                        </div>
                        <div className="flex items-center justify-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold truncate max-w-[80px]" style={{ color: "var(--foreground)" }}>
                                    {(p1.display_name || p1.username).split(" ")[0]}
                                </span>
                                <div className="flex gap-1.5">
                                    {Array.from({ length: maxWins }).map((_, i) => (
                                        <div key={`c-${i}`} className="rounded-full transition-colors" style={{
                                            width: 10, height: 10,
                                            backgroundColor: i < (duel.challenger_wins ?? 0) ? "var(--success)" : "var(--border)",
                                        }} />
                                    ))}
                                </div>
                            </div>
                            <span className="text-[10px] font-extrabold" style={{ color: "var(--muted)" }}>VS</span>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    {Array.from({ length: maxWins }).map((_, i) => (
                                        <div key={`o-${i}`} className="rounded-full transition-colors" style={{
                                            width: 10, height: 10,
                                            backgroundColor: i < (duel.opponent_wins ?? 0) ? "var(--success)" : "var(--border)",
                                        }} />
                                    ))}
                                </div>
                                <span className="text-xs font-bold truncate max-w-[80px]" style={{ color: "var(--foreground)" }}>
                                    {(p2.display_name || p2.username).split(" ")[0]}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

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
                            {hasScore && <p className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>Resultado: {duel.challenger_wins} – {duel.opponent_wins}</p>}
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
                            <span className="text-sm font-bold" style={{ color: "var(--warning)" }}>+{duel.xp_gained} XP</span>
                            <p className="text-[11px]" style={{ color: "var(--muted)", margin: 0 }}>Duelo casual — no afecta tu ELO</p>
                        </div>
                    </div>
                )}

                {/* Message */}
                {!!duel.message && (
                    <div className="mb-4 p-4 rounded-xl border flex items-start gap-3" style={{ backgroundColor: "var(--surface-solid)", borderColor: "var(--border)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span className="text-[13px] italic leading-[19px]" style={{ color: "var(--muted)" }}>&ldquo;{duel.message}&rdquo;</span>
                    </div>
                )}

                {/* Game Tracker */}
                {isActive && isMyDuel && token && (
                    activeGameNumber !== null ? (
                        <div className="mb-4">
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
                        </div>
                    ) : (
                        <>
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
                        </>
                    )
                )}

                {/* ── Actions section ── */}
                {(isPending || isActive || isAwaiting || isDisputed) && isMyDuel && (
                    <div className="mb-4 flex flex-col gap-3" style={{ animation: introEligible ? "duelStagger3 0.8s cubic-bezier(0.16,1,0.3,1) both" : undefined }}>
                        {/* Pending: Accept/Decline (opponent) */}
                        {isPending && isOpponent && (
                            <div className="flex gap-2.5">
                                <button
                                    onClick={() => exec("Aceptar", () => acceptDuel(duelId, token))}
                                    disabled={!!loading}
                                    className="flex-[2] py-3.5 rounded-xl border-none text-white text-[15px] font-extrabold"
                                    style={{ backgroundColor: "var(--success)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, boxShadow: "0 4px 14px rgba(34,197,94,0.3)" }}
                                >
                                    {loading === "Aceptar" ? "..." : "Aceptar duelo"}
                                </button>
                                <button
                                    onClick={() => { if (confirm("¿Seguro que quieres rechazar?")) exec("Rechazar", () => declineDuel(duelId, token)); }}
                                    disabled={!!loading}
                                    className="flex-1 py-3.5 rounded-xl text-sm font-bold"
                                    style={{ border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.08)", color: "var(--danger)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
                                >
                                    {loading === "Rechazar" ? "..." : "Rechazar"}
                                </button>
                            </div>
                        )}

                        {/* Pending: Cancel (challenger) */}
                        {isPending && isChallenger && (
                            <button
                                onClick={() => { if (confirm("¿Seguro que quieres cancelar?")) exec("Cancelar", () => cancelDuel(duelId, token)); }}
                                disabled={!!loading}
                                className="py-3.5 rounded-xl text-sm font-bold"
                                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface-solid)", color: "var(--muted)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
                            >
                                {loading === "Cancelar" ? "..." : "Cancelar desafío"}
                            </button>
                        )}

                        {/* Report result — inline like tournament match card */}
                        {isActive && isMyDuel && (
                            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--surface-solid)", borderColor: "var(--border)" }}>
                                <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Reportar resultado</span>
                                </div>
                                <div className="p-4 flex flex-col gap-3">
                                    {/* Score row */}
                                    <div className="flex items-center gap-2">
                                        {/* My score */}
                                        <div className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl" style={{ backgroundColor: "var(--surface-secondary)" }}>
                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Tú</span>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => setMyWins(Math.max(0, myWins - 1))} style={counterBtnSmStyle}>-</button>
                                                <span className="text-xl font-black w-5 text-center tabular-nums" style={{ color: "var(--foreground)" }}>{myWins}</span>
                                                <button onClick={() => { const n = Math.min(maxWins, myWins + 1); setMyWins(n); if (n === maxWins && oppWins >= maxWins) setOppWins(maxWins - 1); }} style={counterBtnSmStyle}>+</button>
                                            </div>
                                        </div>
                                        <span className="text-xs font-extrabold shrink-0" style={{ color: "var(--muted)" }}>VS</span>
                                        {/* Opponent score */}
                                        <div className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl" style={{ backgroundColor: "var(--surface-secondary)" }}>
                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>Oponente</span>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => setOppWins(Math.max(0, oppWins - 1))} style={counterBtnSmStyle}>-</button>
                                                <span className="text-xl font-black w-5 text-center tabular-nums" style={{ color: "var(--foreground)" }}>{oppWins}</span>
                                                <button onClick={() => { const n = Math.min(maxWins, oppWins + 1); setOppWins(n); if (n === maxWins && myWins >= maxWins) setMyWins(maxWins - 1); }} style={counterBtnSmStyle}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleReport} disabled={!!loading}
                                        className="w-full py-3 rounded-xl border-none text-white text-sm font-extrabold"
                                        style={{ backgroundColor: "var(--accent)", cursor: loading ? "not-allowed" : "pointer", opacity: loading === "report" ? 0.6 : 1 }}
                                    >
                                        {loading === "report" ? "Enviando..." : "Enviar resultado"}
                                    </button>
                                    <button
                                        onClick={() => { if (confirm("¿Seguro que quieres cancelar el duelo?")) exec("Cancelar", () => cancelDuel(duelId, token)); }}
                                        disabled={!!loading}
                                        className="w-full py-2.5 rounded-xl text-[12px] font-bold"
                                        style={{
                                            border: "1px solid rgba(239,68,68,0.25)",
                                            backgroundColor: "rgba(239,68,68,0.06)",
                                            color: "var(--danger)",
                                            cursor: loading ? "not-allowed" : "pointer",
                                            opacity: loading === "Cancelar" ? 0.6 : 1,
                                        }}
                                    >
                                        {loading === "Cancelar" ? "..." : "Cancelar duelo"}
                                    </button>
                                </div>
                            </div>
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
                                        <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>Resultado reportado</p>
                                        <p className="text-xl font-black tracking-tight" style={{ color: "var(--purple)" }}>{duel.challenger_wins} – {duel.opponent_wins}</p>
                                    </div>
                                </div>
                                {isReporter ? (
                                    <div className="flex items-center justify-center gap-2 p-3 rounded-lg" style={{ backgroundColor: "rgba(168,85,247,0.04)" }}>
                                        <div className="animate-spin w-3.5 h-3.5 border-2 border-purple-200 border-t-purple-500 rounded-full" />
                                        <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Esperando confirmación del oponente</span>
                                    </div>
                                ) : (
                                    <div className="flex gap-2.5">
                                        <button
                                            onClick={() => exec("Confirmar", () => confirmDuelResult(duelId, token))}
                                            disabled={!!loading}
                                            className="flex-[2] py-3.5 rounded-xl border-none text-white text-[15px] font-extrabold"
                                            style={{ backgroundColor: "var(--success)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, boxShadow: "0 4px 14px rgba(34,197,94,0.3)" }}
                                        >
                                            {loading === "Confirmar" ? "..." : "Confirmar resultado"}
                                        </button>
                                        <button
                                            onClick={() => { if (confirm("El resultado será revisado por un moderador. ¿Continuar?")) exec("Disputar", () => disputeDuel(duelId, token)); }}
                                            disabled={!!loading}
                                            className="flex-1 py-3.5 rounded-xl text-sm font-bold"
                                            style={{ border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.08)", color: "var(--danger)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
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
                                <span className="text-[11px] font-semibold" style={{ color: "var(--danger)" }}>Resultado disputado — esperando moderador</span>
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
                                <span className="text-[11px]" style={{ color: "var(--muted)" }}>Reportar oponente</span>
                            </button>
                        ) : (
                            <div className="p-4 rounded-xl border flex flex-col gap-3" style={{ backgroundColor: "var(--surface-solid)", borderColor: "var(--border)" }}>
                                <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                                    Reportar a @{isChallenger ? p2.username : p1.username}
                                </span>
                                <textarea
                                    placeholder="Motivo del reporte..."
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    maxLength={300} rows={3}
                                    className="text-[13px] outline-none resize-none"
                                    style={{
                                        width: "100%", backgroundColor: "var(--surface-tertiary)", borderRadius: 10,
                                        border: "1px solid var(--border)", padding: "10px 12px",
                                        color: "var(--foreground)", fontFamily: "inherit",
                                    }}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setShowReportUser(false); setReportReason(""); }}
                                        className="flex-1 py-3 rounded-xl text-[13px] font-bold"
                                        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--muted)", cursor: "pointer" }}
                                    >Cancelar</button>
                                    <button
                                        onClick={handleReportUser}
                                        disabled={!reportReason.trim() || loading === "reportUser"}
                                        className="flex-[2] py-3 rounded-xl border-none text-[13px] font-bold text-white"
                                        style={{ backgroundColor: "var(--danger)", cursor: !reportReason.trim() ? "not-allowed" : "pointer", opacity: reportReason.trim() ? 1 : 0.4 }}
                                    >
                                        {loading === "reportUser" ? "Enviando..." : "Enviar reporte"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

              {/* ── Chat sidebar — fixed, responsive to available space ── */}
              {(isCompleted || isActive || isAwaiting) && (
                <div className="hidden 2xl:block fixed" style={{
                    top: "50%", transform: "translateY(-50%)",
                    /* Position: starts right after the centered content (max-w-5xl = 64rem = 1024px) + padding */
                    left: "calc(50% + 540px)",
                    /* Width: fill space to viewport edge minus padding, max 320px */
                    width: "calc(100vw - 50% - 556px)",
                    maxWidth: 320, minWidth: 240,
                    maxHeight: "70vh",
                }}>
                    <div className="flex flex-col gap-3 rounded-2xl border p-4 h-full" style={{ backgroundColor: "var(--surface-solid)", borderColor: "var(--border)", maxHeight: "70vh" }}>
                        <div className="flex items-center gap-2.5 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
                            <Comment style={{ width: 16, height: 16, color: "var(--foreground)" }} />
                            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Chat del duelo</span>
                            {comments.length > 0 && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>
                                    {comments.length}
                                </span>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[200px]" style={{ scrollbarWidth: "thin", maxHeight: "calc(80vh - 140px)" }}>
                            {comments.length > 0 ? comments.map((c) => (
                                <div key={c.id} className="flex gap-2.5">
                                    <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
                                        {c.avatar_url ? (
                                            <Image src={c.avatar_url} alt="" width={32} height={32} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <span className="text-[10px] font-bold" style={{ color: "var(--muted)" }}>{c.username?.[0]?.toUpperCase() || "?"}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{c.username || "Usuario"}</span>
                                            {c.created_at && <span className="text-[10px]" style={{ color: "var(--muted)" }}>{timeAgo(c.created_at, { verbose: true })}</span>}
                                        </div>
                                        <p className="text-[13px] leading-[19px] m-0 mt-0.5" style={{ color: "var(--foreground)" }}>{c.content || c.text}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-xs" style={{ color: "var(--muted)" }}>Sin mensajes aún</p>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        {isMyDuel && (
                            <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                                <input
                                    type="text"
                                    placeholder="Escribe un mensaje..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleSendComment(); }}
                                    maxLength={300}
                                    className="flex-1 text-[13px] outline-none"
                                    style={{
                                        backgroundColor: "var(--background)", borderRadius: 99,
                                        border: "1px solid var(--border)", padding: "10px 14px",
                                        color: "var(--foreground)",
                                    }}
                                />
                                <button
                                    onClick={handleSendComment}
                                    disabled={!commentText.trim() || sendingComment}
                                    className="px-4 py-2.5 rounded-full border-none text-xs font-bold text-white shrink-0"
                                    style={{
                                        backgroundColor: "var(--accent)",
                                        cursor: !commentText.trim() || sendingComment ? "not-allowed" : "pointer",
                                        opacity: !commentText.trim() || sendingComment ? 0.4 : 1,
                                    }}
                                >
                                    {sendingComment ? "..." : "Enviar"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
              )}

                {/* ── Chat mobile — below content on small screens ── */}
                {(isCompleted || isActive || isAwaiting) && (
                    <div className="2xl:hidden mb-4">
                    {comments.length > 0 && (
                        <div className="flex flex-col gap-2 mb-3">
                            {comments.map((c) => (
                                <div key={c.id} className="flex gap-2">
                                    <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
                                        {c.avatar_url ? (
                                            <Image src={c.avatar_url} alt="" width={24} height={24} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <span className="text-[9px] font-bold" style={{ color: "var(--muted)" }}>{c.username?.[0]?.toUpperCase() || "?"}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[11px] font-bold" style={{ color: "var(--foreground)" }}>{c.username || "Usuario"}</span>
                                        {c.created_at && <span className="text-[9px] ml-1.5" style={{ color: "var(--muted)" }}>{timeAgo(c.created_at, { verbose: true })}</span>}
                                        <p className="text-[13px] leading-[18px] m-0 mt-0.5" style={{ color: "var(--foreground)" }}>{c.content || c.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {isMyDuel && (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Mensaje..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSendComment(); }}
                                maxLength={300}
                                className="flex-1 text-[13px] outline-none"
                                style={{ backgroundColor: "var(--surface-solid)", borderRadius: 99, border: "1px solid var(--border)", padding: "10px 16px", color: "var(--foreground)" }}
                            />
                            <button
                                onClick={handleSendComment}
                                disabled={!commentText.trim() || sendingComment}
                                className="px-4 py-2.5 rounded-full border-none text-xs font-bold text-white shrink-0"
                                style={{ backgroundColor: "var(--accent)", cursor: !commentText.trim() || sendingComment ? "not-allowed" : "pointer", opacity: !commentText.trim() || sendingComment ? 0.4 : 1 }}
                            >
                                {sendingComment ? "..." : "Enviar"}
                            </button>
                        </div>
                    )}
                </div>
              )}
            </div>
        </div>
    );
}

const counterBtnSmStyle: React.CSSProperties = {
    width: 28, height: 28, borderRadius: 8,
    border: "1px solid var(--border)", backgroundColor: "var(--surface)",
    color: "var(--foreground)", cursor: "pointer", fontSize: 15, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
};
