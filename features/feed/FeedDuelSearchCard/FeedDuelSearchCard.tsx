"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react/toast";

import { mapErrorMessage } from "@/lib/api/errors";
import { acceptDuel } from "@/lib/api/duels";
import { useAuth } from "@/lib/hooks/use-auth";
import type { Duel } from "@/lib/types/duel";

interface FeedDuelSearchCardProps {
    duel: Duel;
    onAccepted?: () => void;
}

function TimeSince({ dateStr }: { dateStr: string }) {
    const [, setTick] = useState(0);
    useEffect(() => {
        const iv = setInterval(() => setTick((t) => t + 1), 30_000);
        return () => clearInterval(iv);
    }, []);

    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60_000);
    if (mins < 1) return <span className="text-muted text-[11px]">Ahora</span>;
    if (mins < 60) return <span className="text-muted text-[11px]">{mins}m buscando</span>;
    const hrs = Math.floor(mins / 60);
    return <span className="text-muted text-[11px]">{hrs}h {mins % 60}m buscando</span>;
}

// Track which duels already notified to avoid repeat alerts
const notifiedDuels = new Set<string>();

function notifyNewDuel(duelId: string) {
    if (notifiedDuels.has(duelId)) return;
    notifiedDuels.add(duelId);

    // Vibrate (mobile)
    try {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch {}

    // TCG duel alert — retro game card draw sound
    try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const t = ctx.currentTime;

        const tone = (freq: number, start: number, dur: number, vol: number, type: OscillatorType = "square") => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t + start);
            gain.gain.setValueAtTime(vol, t + start);
            gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
            osc.start(t + start);
            osc.stop(t + start + dur);
        };

        // 8-bit challenge jingle — turu tutu x3 (synced with 2s pulse)
        // Round 1
        tone(523, 0,    0.1,  0.10, "square");
        tone(659, 0.10, 0.1,  0.10, "square");
        tone(784, 0.20, 0.1,  0.11, "square");
        tone(1047, 0.30, 0.25, 0.12, "square");
        // Round 2
        tone(523, 2.0,  0.1,  0.10, "square");
        tone(659, 2.10, 0.1,  0.10, "square");
        tone(784, 2.20, 0.1,  0.11, "square");
        tone(1047, 2.30, 0.25, 0.12, "square");
        // Round 3
        tone(523, 4.0,  0.1,  0.10, "square");
        tone(659, 4.10, 0.1,  0.10, "square");
        tone(784, 4.20, 0.1,  0.11, "square");
        tone(1047, 4.30, 0.35, 0.14, "square");
    } catch {}
}

export default function FeedDuelSearchCard({ duel, onAccepted }: FeedDuelSearchCardProps) {
    const router = useRouter();
    const { session } = useAuth();
    const [accepting, setAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);

    const challenger = duel.challenger;

    // Notify on mount (new duel appeared)
    useEffect(() => {
        notifyNewDuel(duel.id);
    }, [duel.id]);

    const handleAccept = async () => {
        if (accepting || accepted) return;
        if (!session?.accessToken) {
            toast.danger("Error", { description: "Debes iniciar sesion para aceptar duelos" });
            return;
        }
        setAccepting(true);
        try {
            await acceptDuel(duel.id, session.accessToken);
            setAccepted(true);
            onAccepted?.();
            setTimeout(() => router.push(`/duelos/${duel.slug ?? duel.id}`), 600);
        } catch (err: unknown) {
            toast.danger("Error", { description: mapErrorMessage(err) });
        } finally {
            setAccepting(false);
        }
    };

    if (accepted) {
        return (
            <div
                className="rounded-[20px] p-5 flex items-center justify-center gap-2.5"
                style={{
                    backgroundColor: "color-mix(in srgb, var(--success) 4%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)",
                }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="text-success text-[13px] font-bold">Duelo aceptado contra @{challenger.username}</span>
            </div>
        );
    }

    return (
        <div
            className="bg-surface-solid rounded-[20px] overflow-hidden p-3.5 flex flex-col gap-2.5 relative"
            style={{
                border: "1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                animation: "duelPulse 2s ease-in-out infinite",
            }}
        >
            <style>{`
                @keyframes duelPulse {
                    0%, 100% {
                        border-color: rgba(59,130,246,0.3);
                        box-shadow: 0 0 8px rgba(59,130,246,0.1), 0 0 0px rgba(59,130,246,0);
                    }
                    50% {
                        border-color: rgba(59,130,246,0.8);
                        box-shadow: 0 0 24px rgba(59,130,246,0.35), 0 0 48px rgba(59,130,246,0.15);
                    }
                }
            `}</style>

            {/* Header: icon + badge */}
            <div className="flex items-center gap-2.5">
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                </div>
                <div className="flex-1">
                    <span className="text-foreground text-[13px] font-bold block">Busca oponente para duelo</span>
                    <div className="flex items-center gap-1 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        <TimeSince dateStr={duel.created_at} />
                    </div>
                </div>
                <span
                    className="px-2 py-[3px] rounded-full text-[9px] font-[800] text-warning tracking-[0.5px]"
                    style={{ backgroundColor: "color-mix(in srgb, var(--warning) 10%, transparent)" }}
                >
                    CASUAL
                </span>
            </div>

            {/* Challenger info */}
            <div
                className="flex items-center gap-2.5 p-2.5 rounded-[10px]"
                style={{
                    backgroundColor: "color-mix(in srgb, var(--accent) 4%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--accent) 8%, transparent)",
                }}
            >
                {challenger.avatar_url ? (
                    <Image src={challenger.avatar_url} alt={challenger.username} width={44} height={44} className="rounded-full object-cover" />
                ) : (
                    <div
                        className="w-11 h-11 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
                    >
                        <span className="text-accent text-[16px] font-[800]">
                            {challenger.username?.[0]?.toUpperCase()}
                        </span>
                    </div>
                )}
                <div className="flex-1">
                    <span className="text-foreground text-[14px] font-bold block">
                        {challenger.display_name || challenger.username}
                    </span>
                    <span className="text-muted text-[11px]">@{challenger.username}</span>
                </div>
                {challenger.rating != null && challenger.rating > 0 && (
                    <div className="flex flex-col items-center bg-surface px-2.5 py-1.5 rounded-[6px]">
                        <span className="text-foreground text-[14px] font-[800]">{challenger.rating}</span>
                        <span className="text-muted text-[8px] font-bold tracking-[0.5px]">ELO</span>
                    </div>
                )}
            </div>

            {/* Game + Format + BO */}
            <div className="flex flex-wrap gap-1.5">
                {duel.game_name && (
                    <span className="text-[11px] text-muted bg-surface px-2.5 py-1 rounded-lg">
                        {duel.game_name}
                    </span>
                )}
                {duel.format_name && (
                    <span className="text-[11px] text-muted bg-surface px-2.5 py-1 rounded-lg">
                        {duel.format_name}
                    </span>
                )}
                {duel.best_of != null && duel.best_of > 0 && (
                    <span className="text-[11px] text-muted bg-surface px-2.5 py-1 rounded-lg">
                        Bo{duel.best_of}
                    </span>
                )}
            </div>

            {/* Message */}
            {!!duel.message && (
                <p className="text-muted text-[13px] italic leading-[19px] m-0 pl-1">
                    &ldquo;{duel.message}&rdquo;
                </p>
            )}

            {/* XP note */}
            <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--warning)" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="text-muted text-[11px]">Solo XP, no afecta ELO</span>
            </div>

            {/* Accept button */}
            <button
                onClick={handleAccept}
                disabled={accepting}
                className="flex items-center justify-center gap-2 w-full py-[13px] rounded-[10px] border-none bg-accent transition-all duration-150"
                style={{
                    cursor: accepting ? "not-allowed" : "pointer",
                    opacity: accepting ? 0.6 : 1,
                }}
            >
                {accepting ? (
                    <div className="animate-spin w-4 h-4 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                ) : (
                    <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span className="text-white text-[14px] font-bold">Aceptar duelo</span>
                    </>
                )}
            </button>
        </div>
    );
}
