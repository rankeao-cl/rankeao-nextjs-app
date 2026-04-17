"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react/toast";
import { useAuth } from "@/lib/hooks/use-auth";
import {
    listMyPartidas,
    createPartida,
    joinPartida,
} from "@/lib/api/play";
import type { Partida, PartidaStatus } from "@/lib/api/play";

// ── Game mode catalog (seeded in DB, mirrored here for the create form) ──────

interface GameMode {
    game_slug: string;
    mode_slug: string;
    label: string;
    playerCount: number;
    life: number;
}

const GAME_MODES: GameMode[] = [
    { game_slug: "magic", mode_slug: "commander",   label: "Commander",  playerCount: 4, life: 40 },
    { game_slug: "magic", mode_slug: "brawl",        label: "Brawl",      playerCount: 4, life: 25 },
    { game_slug: "magic", mode_slug: "oathbreaker",  label: "Oathbreaker",playerCount: 4, life: 20 },
    { game_slug: "magic", mode_slug: "standard",     label: "Standard",   playerCount: 2, life: 20 },
    { game_slug: "magic", mode_slug: "pioneer",      label: "Pioneer",    playerCount: 2, life: 20 },
    { game_slug: "magic", mode_slug: "modern",       label: "Modern",     playerCount: 2, life: 20 },
    { game_slug: "magic", mode_slug: "legacy",       label: "Legacy",     playerCount: 2, life: 20 },
    { game_slug: "magic", mode_slug: "pauper",       label: "Pauper",     playerCount: 2, life: 20 },
    { game_slug: "magic", mode_slug: "draft",        label: "Draft",      playerCount: 2, life: 20 },
    { game_slug: "magic", mode_slug: "custom",       label: "Custom",     playerCount: 8, life: 20 },
];

const STATUS_LABEL: Record<PartidaStatus, string> = {
    lobby: "En lobby",
    active: "En curso",
    completed: "Completada",
    cancelled: "Cancelada",
};

const STATUS_COLOR: Record<PartidaStatus, string> = {
    lobby: "var(--accent)",
    active: "var(--success)",
    completed: "var(--muted)",
    cancelled: "var(--danger)",
};

// ── Create form ───────────────────────────────────────────────────────────────

function CreatePartidaModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: (partida: Partida) => void;
}) {
    const [selectedMode, setSelectedMode] = useState<GameMode>(GAME_MODES[0]);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        try {
            const res = await createPartida({
                game_slug: selectedMode.game_slug,
                mode_slug: selectedMode.mode_slug,
                title: title.trim() || undefined,
            });
            if (res.data) {
                onCreated(res.data);
                toast.success("Lobby creado");
            }
        } catch {
            toast.danger("Error", { description: "No se pudo crear el lobby" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-end sm:items-center justify-center"
            style={{ zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            onClick={onClose}
        >
            <div
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl flex flex-col gap-5"
                style={{
                    background: "var(--surface-solid)",
                    border: "1px solid var(--border)",
                    padding: "28px 20px 32px",
                    maxHeight: "90dvh",
                    overflowY: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-black text-foreground">Nueva partida</h2>

                {/* Mode grid */}
                <div>
                    <p className="text-xs font-semibold text-muted mb-3 uppercase tracking-widest">Formato</p>
                    <div className="grid grid-cols-2 gap-2">
                        {GAME_MODES.map((mode) => (
                            <button
                                key={mode.mode_slug}
                                onClick={() => setSelectedMode(mode)}
                                className="flex flex-col items-start rounded-xl px-4 py-3 text-left"
                                style={{
                                    background: selectedMode.mode_slug === mode.mode_slug
                                        ? "color-mix(in srgb, var(--accent) 18%, transparent)"
                                        : "var(--surface)",
                                    border: `1px solid ${selectedMode.mode_slug === mode.mode_slug
                                        ? "color-mix(in srgb, var(--accent) 45%, transparent)"
                                        : "var(--border)"}`,
                                    cursor: "pointer",
                                }}
                            >
                                <span className="text-sm font-bold text-foreground">{mode.label}</span>
                                <span className="text-[10px] text-muted mt-0.5">
                                    {mode.playerCount}J · {mode.life}VP
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Optional title */}
                <div>
                    <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-widest">
                        Título (opcional)
                    </p>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Mi partida de Commander..."
                        maxLength={80}
                        className="w-full rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted outline-none"
                        style={{
                            background: "var(--field-background)",
                            border: "1px solid var(--border)",
                        }}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl py-3 text-sm font-bold text-muted"
                        style={{
                            background: "var(--surface-solid-secondary)",
                            border: "1px solid var(--border)",
                            cursor: "pointer",
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="flex-1 rounded-xl py-3 text-sm font-bold"
                        style={{
                            background: loading
                                ? "color-mix(in srgb, var(--accent) 45%, transparent)"
                                : "var(--accent)",
                            color: "var(--accent-foreground)",
                            border: "1px solid color-mix(in srgb, var(--accent) 70%, transparent)",
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading ? "Creando..." : "Crear lobby"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Partida card ──────────────────────────────────────────────────────────────

function PartidaCard({ partida, onOpen }: { partida: Partida; onOpen: () => void }) {
    const accepted = partida.participants.filter((p) => p.status === "accepted").length;

    return (
        <button
            onClick={onOpen}
            className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 text-left"
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                cursor: "pointer",
            }}
        >
            {/* Status indicator */}
            <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: STATUS_COLOR[partida.status] }}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                    {partida.title || `${partida.game_slug} · ${partida.mode_slug}`}
                </p>
                <p className="text-xs text-muted mt-0.5">
                    {accepted}/{partida.max_players} jugadores
                </p>
            </div>

            {/* Status badge */}
            <span
                className="flex-shrink-0 text-[10px] font-bold rounded-full px-2.5 py-1"
                style={{
                    background: `color-mix(in srgb, ${STATUS_COLOR[partida.status]} 14%, transparent)`,
                    color: STATUS_COLOR[partida.status],
                    border: `1px solid color-mix(in srgb, ${STATUS_COLOR[partida.status]} 30%, transparent)`,
                }}
            >
                {STATUS_LABEL[partida.status]}
            </span>
        </button>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PartidasListClient() {
    const router = useRouter();
    const { session: authSession, status } = useAuth();
    const [partidas, setPartidas] = useState<Partida[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const load = useCallback(async () => {
        if (status !== "authenticated") return;
        setLoading(true);
        try {
            const res = await listMyPartidas({ limit: 50 });
            setPartidas(res.data ?? []);
        } catch {
            toast.danger("Error", { description: "No se pudieron cargar las partidas" });
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        load();
    }, [load]);

    if (status === "unauthenticated") {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-muted text-sm">Inicia sesión para ver tus partidas</p>
            </div>
        );
    }

    const active = partidas.filter((p) => p.status === "lobby" || p.status === "active");
    const past = partidas.filter((p) => p.status === "completed" || p.status === "cancelled");

    return (
        <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-black text-foreground">Partidas</h1>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
                    style={{
                        background: "var(--accent)",
                        color: "var(--accent-foreground)",
                        border: "1px solid color-mix(in srgb, var(--accent) 70%, transparent)",
                        cursor: "pointer",
                    }}
                >
                    + Nueva
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div
                        className="w-7 h-7 rounded-full animate-spin"
                        style={{
                            border: "2px solid var(--border)",
                            borderTopColor: "var(--accent)",
                        }}
                    />
                </div>
            ) : partidas.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3">
                    <p className="text-muted text-sm">Sin partidas aún</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="text-sm font-bold"
                        style={{ cursor: "pointer", background: "none", border: "none", color: "var(--accent)" }}
                    >
                        Crear primera partida
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {active.length > 0 && (
                        <section className="flex flex-col gap-2">
                            <p className="text-xs font-bold text-muted uppercase tracking-widest">Activas</p>
                            {active.map((p) => (
                                <PartidaCard
                                    key={p.id}
                                    partida={p}
                                    onOpen={() => router.push(`/matches/${p.id}`)}
                                />
                            ))}
                        </section>
                    )}
                    {past.length > 0 && (
                        <section className="flex flex-col gap-2">
                            <p className="text-xs font-bold text-muted uppercase tracking-widest">Historial</p>
                            {past.map((p) => (
                                <PartidaCard
                                    key={p.id}
                                    partida={p}
                                    onOpen={() => router.push(`/matches/${p.id}`)}
                                />
                            ))}
                        </section>
                    )}
                </div>
            )}

            {showCreate && (
                <CreatePartidaModal
                    onClose={() => setShowCreate(false)}
                    onCreated={(partida) => {
                        setShowCreate(false);
                        router.push(`/matches/${partida.id}`);
                    }}
                />
            )}
        </div>
    );
}
