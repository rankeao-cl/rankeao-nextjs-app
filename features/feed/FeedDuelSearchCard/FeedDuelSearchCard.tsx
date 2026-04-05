"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
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
    if (mins < 1) return <span style={{ color: "var(--muted)", fontSize: 11 }}>Ahora</span>;
    if (mins < 60) return <span style={{ color: "var(--muted)", fontSize: 11 }}>{mins}m buscando</span>;
    const hrs = Math.floor(mins / 60);
    return <span style={{ color: "var(--muted)", fontSize: 11 }}>{hrs}h {mins % 60}m buscando</span>;
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
            <div style={{
                backgroundColor: "color-mix(in srgb, var(--success) 4%, transparent)",
                borderRadius: 20,
                border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)",
                padding: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
            }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span style={{ color: "var(--success)", fontSize: 13, fontWeight: 700 }}>Duelo aceptado contra @{challenger.username}</span>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: "var(--surface-solid)",
            borderRadius: 20,
            border: "1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)",
            overflow: "hidden",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            position: "relative",
            animation: "duelPulse 2s ease-in-out infinite",
        }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                </div>
                <div style={{ flex: 1 }}>
                    <span style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 700, display: "block" }}>Busca oponente para duelo</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        <TimeSince dateStr={duel.created_at} />
                    </div>
                </div>
                <span style={{
                    backgroundColor: "color-mix(in srgb, var(--warning) 10%, transparent)", padding: "3px 8px", borderRadius: 999,
                    fontSize: 9, fontWeight: 800, color: "var(--warning)", letterSpacing: 0.5,
                }}>
                    CASUAL
                </span>
            </div>

            {/* Challenger info */}
            <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: 10,
                backgroundColor: "color-mix(in srgb, var(--accent) 4%, transparent)", borderRadius: 10,
                border: "1px solid color-mix(in srgb, var(--accent) 8%, transparent)",
            }}>
                {challenger.avatar_url ? (
                    <Image src={challenger.avatar_url} alt={challenger.username} width={44} height={44} style={{ borderRadius: 999, objectFit: "cover" }} />
                ) : (
                    <div style={{
                        width: 44, height: 44, borderRadius: 999,
                        backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <span style={{ color: "var(--accent)", fontSize: 16, fontWeight: 800 }}>
                            {challenger.username?.[0]?.toUpperCase()}
                        </span>
                    </div>
                )}
                <div style={{ flex: 1 }}>
                    <span style={{ color: "var(--foreground)", fontSize: 14, fontWeight: 700, display: "block" }}>
                        {challenger.display_name || challenger.username}
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>@{challenger.username}</span>
                </div>
                {challenger.rating != null && challenger.rating > 0 && (
                    <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        backgroundColor: "var(--surface)", padding: "6px 10px", borderRadius: 6,
                    }}>
                        <span style={{ color: "var(--foreground)", fontSize: 14, fontWeight: 800 }}>{challenger.rating}</span>
                        <span style={{ color: "var(--muted)", fontSize: 8, fontWeight: 700, letterSpacing: 0.5 }}>ELO</span>
                    </div>
                )}
            </div>

            {/* Game + Format + BO */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {duel.game_name && (
                    <span style={{ fontSize: 11, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "4px 10px", borderRadius: 8 }}>
                        {duel.game_name}
                    </span>
                )}
                {duel.format_name && (
                    <span style={{ fontSize: 11, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "4px 10px", borderRadius: 8 }}>
                        {duel.format_name}
                    </span>
                )}
                {duel.best_of != null && duel.best_of > 0 && (
                    <span style={{ fontSize: 11, color: "var(--muted)", backgroundColor: "var(--surface)", padding: "4px 10px", borderRadius: 8 }}>
                        Bo{duel.best_of}
                    </span>
                )}
            </div>

            {/* Message */}
            {!!duel.message && (
                <p style={{ color: "var(--muted)", fontSize: 13, fontStyle: "italic", lineHeight: "19px", margin: 0, paddingLeft: 4 }}>
                    &ldquo;{duel.message}&rdquo;
                </p>
            )}

            {/* XP note */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--warning)" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span style={{ color: "var(--muted)", fontSize: 11 }}>Solo XP, no afecta ELO</span>
            </div>

            {/* Accept button */}
            <button
                onClick={handleAccept}
                disabled={accepting}
                style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
                    backgroundColor: "var(--accent)", cursor: accepting ? "not-allowed" : "pointer",
                    opacity: accepting ? 0.6 : 1, transition: "all 0.15s",
                }}
            >
                {accepting ? (
                    <div className="animate-spin" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: 999 }} />
                ) : (
                    <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Aceptar duelo</span>
                    </>
                )}
            </button>
        </div>
    );
}
