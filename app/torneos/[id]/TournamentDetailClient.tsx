"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, Chip, Button, Avatar, toast } from "@heroui/react";
import { Clock, MapPin, Persons, Cup, Person, ShieldCheck } from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import type { Tournament, Round, Standing } from "@/lib/types/tournament";
import {
    getTournamentRounds,
    getTournamentStandings,
    getRoundMatches,
    registerForTournament,
    unregisterFromTournament,
    checkInTournament,
    dropFromTournament,
    startTournament,
    finishTournament,
    nextRound,
    reportMatch,
    confirmMatch,
    disputeMatch,
    resolveDispute,
} from "@/lib/api/tournaments";

// ── Types for API match shape ──

interface ApiPlayer {
    user_id: string;
    username: string;
}

interface ApiMatch {
    id: string;
    round_number: number;
    table_number?: number;
    player1: ApiPlayer;
    player2?: ApiPlayer;
    player1_wins: number;
    player2_wins: number;
    draws: number;
    winner_id?: string;
    status: string;
    is_bye: boolean;
    reported_by?: string;
    reported_at?: string;
    confirmed_at?: string;
    disputed_by?: string;
    disputed_at?: string;
}

// ── Status config ──

const statusConfig: Record<string, { color: "success" | "warning" | "danger" | "default" | "accent"; label: string }> = {
    DRAFT: { color: "default", label: "Borrador" },
    OPEN: { color: "warning", label: "Inscripciones abiertas" },
    CHECK_IN: { color: "warning", label: "Check-in" },
    STARTED: { color: "success", label: "En curso" },
    ROUND_IN_PROGRESS: { color: "success", label: "Ronda en curso" },
    ROUND_COMPLETE: { color: "accent", label: "Ronda completa" },
    FINISHED: { color: "default", label: "Finalizado" },
    CLOSED: { color: "default", label: "Cerrado" },
    CANCELLED: { color: "danger", label: "Cancelado" },
};

const matchStatusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En curso",
    REPORTED: "Reportado",
    CONFIRMED: "Confirmado",
    DISPUTED: "Disputado",
};

type Tab = "info" | "rounds" | "standings";

// ── Helpers ──

function formatDate(iso?: string) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/** Extract user public_id (sub) from JWT access token */
function getUserIdFromToken(accessToken?: string): string | undefined {
    if (!accessToken) return undefined;
    try {
        const parts = accessToken.split(".");
        if (parts.length !== 3) return undefined;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            window.atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
        );
        const payload = JSON.parse(json);
        return payload.sub || payload.user_id || payload.public_id;
    } catch {
        return undefined;
    }
}

function getUserRole(tournament: any, userId?: string): "organizer" | "judge" | "player" | "spectator" {
    if (!userId) return "spectator";
    // Check organizer by username since API doesn't return organizer_id
    const judges: any[] = tournament.judges || [];
    if (judges.some((j) => j.user_id === userId)) return "judge";
    if (tournament.my_registration) return "player";
    // organizer_name matches are handled by username comparison
    return "spectator";
}

// ── Main Component ──

export default function TournamentDetailClient({ tournament: initial }: { tournament: Tournament }) {
    const { session, status: authStatus } = useAuth();
    const [tournament] = useState(initial);
    const [tab, setTab] = useState<Tab>("info");
    const [rounds, setRounds] = useState<Round[]>([]);
    const [standings, setStandings] = useState<Standing[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const isAuthenticated = authStatus === "authenticated" && Boolean(session?.accessToken);
    const userId = useMemo(() => getUserIdFromToken(session?.accessToken), [session?.accessToken]);
    const username = session?.username;

    const detail = tournament as any;
    const st = statusConfig[tournament.status] || statusConfig.DRAFT;

    // Role detection: organizer by username match, judge by user_id in judges array
    const role = useMemo(() => {
        if (!isAuthenticated || !userId) return "spectator" as const;
        if (username && detail.organizer_name === username) return "organizer" as const;
        return getUserRole(detail, userId);
    }, [isAuthenticated, userId, username, detail]);

    const isLive = ["STARTED", "ROUND_IN_PROGRESS", "ROUND_COMPLETE"].includes(tournament.status);
    const isOpen = tournament.status === "OPEN";
    const isCheckIn = tournament.status === "CHECK_IN";
    const isFinished = ["FINISHED", "CLOSED"].includes(tournament.status);

    // ── Data fetching ──

    const loadRounds = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getTournamentRounds(tournament.id);
            const data = (res as any).data || res;
            setRounds(Array.isArray(data.rounds) ? data.rounds : Array.isArray(data) ? data : []);
        } catch {
            // silent
        }
        setLoading(false);
    }, [tournament.id]);

    const loadStandings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getTournamentStandings(tournament.id);
            const data = (res as any).data || res;
            setStandings(Array.isArray(data.standings) ? data.standings : Array.isArray(data) ? data : []);
        } catch {
            // silent
        }
        setLoading(false);
    }, [tournament.id]);

    useEffect(() => {
        if (tab === "rounds") loadRounds();
        if (tab === "standings") loadStandings();
    }, [tab, loadRounds, loadStandings]);

    // Auto-select tab based on tournament status
    useEffect(() => {
        if (isLive) setTab("rounds");
        else if (isFinished) setTab("standings");
    }, [isLive, isFinished]);

    // ── Actions ──

    async function handleAction(action: () => Promise<any>, successMsg: string) {
        setActionLoading(true);
        try {
            await action();
            toast.success(successMsg);
            window.location.reload();
        } catch (e: any) {
            toast.danger(e.message || "Error al ejecutar la acción");
        }
        setActionLoading(false);
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: "info", label: "Info" },
        { key: "rounds", label: "Rondas" },
        { key: "standings", label: "Clasificación" },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-12 flex flex-col gap-6">
            {/* ── Header Card ── */}
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="p-0">
                    <div
                        className={`h-1.5 w-full ${isLive ? "animate-pulse" : ""}`}
                        style={{
                            background: isLive ? "var(--success)" : isOpen || isCheckIn ? "var(--warning)" : "var(--border)",
                        }}
                    />
                    <div className="p-5 sm:p-6 space-y-4">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                {tournament.tenant_logo_url ? (
                                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-[var(--border)]">
                                        <img src={tournament.tenant_logo_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ) : tournament.tenant_name ? (
                                    <Avatar size="md" className="flex-shrink-0">
                                        <Avatar.Fallback>{tournament.tenant_name[0]?.toUpperCase()}</Avatar.Fallback>
                                    </Avatar>
                                ) : null}
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: "var(--foreground)" }}>
                                        {tournament.name}
                                    </h1>
                                    {(tournament.tenant_name || detail.organizer_name) && (
                                        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                                            Organizado por {tournament.tenant_name || detail.organizer_name}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Chip color={st.color} variant="soft" size="md" className="flex-shrink-0">
                                {st.label}
                            </Chip>
                        </div>

                        {/* Live round indicator */}
                        {isLive && (tournament.current_round || detail.current_round) && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]" />
                                </span>
                                <span className="text-sm font-semibold text-[var(--success)]">
                                    Ronda {tournament.current_round || detail.current_round}
                                    {tournament.total_rounds ? ` de ${tournament.total_rounds}` : ""}
                                </span>
                            </div>
                        )}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                            {(detail.game_name || tournament.game) && (
                                <Chip variant="secondary" size="sm">{detail.game_name || tournament.game}</Chip>
                            )}
                            {(detail.format_name || tournament.format) && (
                                <Chip variant="secondary" size="sm">{detail.format_name || tournament.format}</Chip>
                            )}
                            {(detail.format_type || tournament.structure) && (
                                <Chip variant="secondary" size="sm">{detail.format_type || tournament.structure}</Chip>
                            )}
                            {tournament.best_of && <Chip variant="secondary" size="sm">Bo{tournament.best_of}</Chip>}
                            {tournament.is_ranked && <Chip color="warning" variant="soft" size="sm">Ranked</Chip>}
                            {tournament.is_online && <Chip variant="secondary" size="sm">Online</Chip>}
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--muted)" }}>
                            {tournament.starts_at && (
                                <span className="flex items-center gap-1.5">
                                    <Clock className="size-4" /> {formatDate(tournament.starts_at)}
                                </span>
                            )}
                            {tournament.city && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="size-4" />
                                    {(detail.venue_name || tournament.venue_name) ? `${detail.venue_name || tournament.venue_name}, ${tournament.city}` : tournament.city}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Persons className="size-4" />
                                {detail.current_players || tournament.registered_count || 0}
                                {tournament.max_players ? `/${tournament.max_players}` : ""} jugadores
                            </span>
                        </div>

                        {/* Prize / Fee */}
                        {(detail.prize_pool || detail.entry_fee) && (
                            <div className="flex items-center gap-4">
                                {detail.prize_pool && (
                                    <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--accent)" }}>
                                        <Cup className="size-4" /> ${Number(detail.prize_pool).toLocaleString("es-CL")} {detail.currency || "CLP"}
                                    </span>
                                )}
                                {detail.entry_fee && (
                                    <span className="text-sm" style={{ color: "var(--muted)" }}>
                                        Entrada: ${Number(detail.entry_fee).toLocaleString("es-CL")} {detail.currency || "CLP"}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Role badge */}
                        {isAuthenticated && role !== "spectator" && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ background: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                                {role === "organizer" && <ShieldCheck className="size-4 text-[var(--accent)]" />}
                                {role === "judge" && <ShieldCheck className="size-4 text-[var(--warning)]" />}
                                {role === "player" && <Person className="size-4 text-[var(--success)]" />}
                                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                                    {role === "organizer" ? "Eres el organizador" : role === "judge" ? "Eres juez" : "Estás registrado"}
                                </span>
                            </div>
                        )}
                    </div>
                </Card.Content>
            </Card>

            {/* ── Action Bar ── */}
            <ActionBar
                tournament={tournament}
                role={role}
                isAuthenticated={isAuthenticated}
                loading={actionLoading}
                onAction={handleAction}
            />

            {/* ── Tab navigation ── */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface-secondary)" }}>
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key
                            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Tab content ── */}
            {tab === "info" && <InfoTab tournament={tournament} />}
            {tab === "rounds" && (
                <RoundsTab
                    tournament={tournament}
                    rounds={rounds}
                    loading={loading}
                    role={role}
                    userId={userId}
                    onRefresh={loadRounds}
                />
            )}
            {tab === "standings" && <StandingsTab standings={standings} loading={loading} />}
        </div>
    );
}

// ── Action Bar ──

function ActionBar({
    tournament,
    role,
    isAuthenticated,
    loading,
    onAction,
}: {
    tournament: Tournament;
    role: string;
    isAuthenticated: boolean;
    loading: boolean;
    onAction: (action: () => Promise<any>, msg: string) => void;
}) {
    const detail = tournament as any;
    const isOpen = tournament.status === "OPEN";
    const isCheckIn = tournament.status === "CHECK_IN";
    const isLive = ["STARTED", "ROUND_IN_PROGRESS", "ROUND_COMPLETE"].includes(tournament.status);
    const isRegistered = !!detail.my_registration;
    const isCheckedIn = detail.my_registration?.checked_in || detail.my_registration?.checked_in_at;

    if (!isAuthenticated) return null;

    const hasActions =
        (role === "spectator" && isOpen) ||
        (role === "player" && (isOpen || isCheckIn || isLive)) ||
        (role === "organizer" && (isOpen || isCheckIn || isLive));

    if (!hasActions) return null;

    return (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Card.Content className="p-4">
                <div className="flex flex-wrap gap-2">
                    {role === "spectator" && isOpen && (
                        <Button
                            size="sm"
                            isDisabled={loading}
                            onPress={() => onAction(() => registerForTournament(tournament.id), "Te has registrado al torneo")}
                            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                        >
                            Inscribirse
                        </Button>
                    )}

                    {role === "player" && isOpen && isRegistered && (
                        <Button
                            size="sm"
                            variant="danger-soft"
                            isDisabled={loading}
                            onPress={() => onAction(() => unregisterFromTournament(tournament.id), "Te has desinscrito del torneo")}
                        >
                            Cancelar inscripción
                        </Button>
                    )}

                    {role === "player" && isCheckIn && isRegistered && !isCheckedIn && (
                        <Button
                            size="sm"
                            isDisabled={loading}
                            onPress={() => onAction(() => checkInTournament(tournament.id), "Check-in realizado")}
                            style={{ background: "var(--success)", color: "var(--success-foreground)" }}
                        >
                            Hacer check-in
                        </Button>
                    )}

                    {role === "player" && isCheckIn && isCheckedIn && (
                        <Chip color="success" variant="soft" size="sm">Check-in hecho</Chip>
                    )}

                    {role === "player" && isLive && (
                        <Button
                            size="sm"
                            variant="danger-soft"
                            isDisabled={loading}
                            onPress={() => onAction(() => dropFromTournament(tournament.id), "Has abandonado el torneo")}
                        >
                            Abandonar torneo
                        </Button>
                    )}

                    {role === "organizer" && (isOpen || isCheckIn) && (
                        <Button
                            size="sm"
                            isDisabled={loading}
                            onPress={() => onAction(() => startTournament(tournament.id), "Torneo iniciado")}
                            style={{ background: "var(--success)", color: "var(--success-foreground)" }}
                        >
                            Iniciar torneo
                        </Button>
                    )}

                    {role === "organizer" && tournament.status === "ROUND_COMPLETE" && (
                        <Button
                            size="sm"
                            isDisabled={loading}
                            onPress={() => onAction(() => nextRound(tournament.id), "Nueva ronda generada")}
                            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                        >
                            Siguiente ronda
                        </Button>
                    )}

                    {role === "organizer" && isLive && (
                        <Button
                            size="sm"
                            variant="danger-soft"
                            isDisabled={loading}
                            onPress={() => onAction(() => finishTournament(tournament.id), "Torneo finalizado")}
                        >
                            Finalizar torneo
                        </Button>
                    )}
                </div>
            </Card.Content>
        </Card>
    );
}

// ── Info Tab ──

function InfoTab({ tournament }: { tournament: Tournament }) {
    const detail = tournament as any;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournament.description && (
                <Card className="md:col-span-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Card.Content className="p-5">
                        <h3 className="font-bold text-sm mb-2" style={{ color: "var(--foreground)" }}>Descripción</h3>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{tournament.description}</p>
                    </Card.Content>
                </Card>
            )}

            {tournament.rules && (
                <Card className="md:col-span-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Card.Content className="p-5">
                        <h3 className="font-bold text-sm mb-2" style={{ color: "var(--foreground)" }}>Reglas</h3>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{tournament.rules}</p>
                    </Card.Content>
                </Card>
            )}

            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="p-5 space-y-3">
                    <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Detalles</h3>
                    <DetailRow label="Juego" value={detail.game_name || tournament.game} />
                    <DetailRow label="Formato" value={detail.format_name || tournament.format} />
                    <DetailRow label="Estructura" value={detail.format_type || tournament.structure} />
                    <DetailRow label="Best of" value={tournament.best_of ? `${tournament.best_of}` : undefined} />
                    <DetailRow label="Rondas máx." value={tournament.max_rounds ? `${tournament.max_rounds}` : undefined} />
                    <DetailRow label="Timer por ronda" value={tournament.round_timer_min ? `${tournament.round_timer_min} min` : undefined} />
                    <DetailRow label="Modalidad" value={detail.modality} />
                    <DetailRow label="Tier" value={detail.tier} />
                    <DetailRow label="Visibilidad" value={detail.visibility || tournament.visibility} />
                </Card.Content>
            </Card>

            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="p-5 space-y-3">
                    <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Ubicación</h3>
                    <DetailRow label="Lugar" value={detail.venue_name || tournament.venue_name} />
                    <DetailRow label="Dirección" value={tournament.venue_address} />
                    <DetailRow label="Ciudad" value={tournament.city} />
                    <DetailRow label="Región" value={detail.region} />
                    <DetailRow label="País" value={detail.country_code || tournament.country} />
                    {tournament.is_online && (
                        <p className="text-sm text-[var(--accent)] font-medium">Torneo online</p>
                    )}
                </Card.Content>
            </Card>

            {detail.judges && detail.judges.length > 0 && (
                <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Card.Content className="p-5 space-y-3">
                        <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Jueces</h3>
                        {detail.judges.map((j: any) => (
                            <div key={j.user_id} className="flex items-center gap-2">
                                <ShieldCheck className="size-4" style={{ color: "var(--warning)" }} />
                                <span className="text-sm" style={{ color: "var(--foreground)" }}>{j.username}</span>
                                {j.is_head_judge && <Chip size="sm" color="warning" variant="soft">Head Judge</Chip>}
                            </div>
                        ))}
                    </Card.Content>
                </Card>
            )}

            {detail.prizes && detail.prizes.length > 0 && (
                <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Card.Content className="p-5 space-y-3">
                        <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Premios</h3>
                        {detail.prizes.map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: "var(--foreground)" }}>
                                    {p.position === 1 ? "1er" : p.position === 2 ? "2do" : p.position === 3 ? "3er" : `${p.position}to`} lugar
                                </span>
                                <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>{p.description}</span>
                            </div>
                        ))}
                    </Card.Content>
                </Card>
            )}
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--muted)" }}>{label}</span>
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{value}</span>
        </div>
    );
}

// ── Rounds Tab ──

function RoundsTab({
    tournament,
    rounds,
    loading,
    role,
    userId,
    onRefresh,
}: {
    tournament: Tournament;
    rounds: Round[];
    loading: boolean;
    role: string;
    userId?: string;
    onRefresh: () => void;
}) {
    const [selectedRound, setSelectedRound] = useState<number | null>(null);
    const [matches, setMatches] = useState<ApiMatch[]>([]);
    const [matchesLoading, setMatchesLoading] = useState(false);

    useEffect(() => {
        if (rounds.length > 0 && selectedRound === null) {
            const active = rounds.find((r) => r.status === "IN_PROGRESS");
            setSelectedRound(active?.round_number ?? rounds[rounds.length - 1].round_number);
        }
    }, [rounds, selectedRound]);

    // Load matches when round is selected
    useEffect(() => {
        if (selectedRound === null) return;
        setMatchesLoading(true);
        getRoundMatches(tournament.id, selectedRound)
            .then((m) => setMatches(m))
            .catch(() => setMatches([]))
            .finally(() => setMatchesLoading(false));
    }, [tournament.id, selectedRound]);

    const refreshMatches = useCallback(() => {
        if (selectedRound === null) return;
        getRoundMatches(tournament.id, selectedRound)
            .then((m) => setMatches(m))
            .catch(() => setMatches([]));
    }, [tournament.id, selectedRound]);

    if (loading) {
        return (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="p-8 text-center">
                    <p className="text-sm animate-pulse" style={{ color: "var(--muted)" }}>Cargando rondas...</p>
                </Card.Content>
            </Card>
        );
    }

    if (rounds.length === 0) {
        return (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="py-12 text-center">
                    <p className="text-sm" style={{ color: "var(--muted)" }}>No hay rondas generadas aún.</p>
                </Card.Content>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Round selector */}
            <div className="flex gap-1.5 flex-wrap">
                {rounds.map((r) => {
                    const isActive = r.round_number === selectedRound;
                    const isInProgress = r.status === "IN_PROGRESS";
                    return (
                        <button
                            key={r.round_number}
                            onClick={() => setSelectedRound(r.round_number)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${isActive
                                ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]"
                                : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                                }`}
                        >
                            Ronda {r.round_number}
                            {isInProgress && (
                                <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Matches */}
            {matchesLoading ? (
                <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Card.Content className="p-8 text-center">
                        <p className="text-sm animate-pulse" style={{ color: "var(--muted)" }}>Cargando partidas...</p>
                    </Card.Content>
                </Card>
            ) : matches.length === 0 ? (
                <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Card.Content className="py-8 text-center">
                        <p className="text-sm" style={{ color: "var(--muted)" }}>No hay partidas en esta ronda.</p>
                    </Card.Content>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matches.map((match) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            tournamentId={tournament.id}
                            role={role}
                            userId={userId}
                            onUpdate={refreshMatches}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Match Card ──

function MatchCard({
    match,
    tournamentId,
    role,
    userId,
    onUpdate,
}: {
    match: ApiMatch;
    tournamentId: string;
    role: string;
    userId?: string;
    onUpdate: () => void;
}) {
    const [showReport, setShowReport] = useState(false);
    const [p1Wins, setP1Wins] = useState(match.player1_wins ?? 0);
    const [p2Wins, setP2Wins] = useState(match.player2_wins ?? 0);
    const [draws, setDraws] = useState(match.draws ?? 0);
    const [submitting, setSubmitting] = useState(false);

    const p1Id = match.player1?.user_id;
    const p2Id = match.player2?.user_id;
    const p1Name = match.player1?.username || "Jugador 1";
    const p2Name = match.player2?.username || "Jugador 2";

    const isMyMatch = userId && (p1Id === userId || p2Id === userId);
    const iAmPlayer1 = userId === p1Id;
    const iReported = match.reported_by === userId;
    const opponentReported = match.status === "REPORTED" && !iReported && isMyMatch;
    const canReport = isMyMatch && match.status === "PENDING" && !match.is_bye;
    const canConfirm = isMyMatch && opponentReported;
    const canDispute = isMyMatch && opponentReported;
    const isJudgeOrOrganizer = role === "judge" || role === "organizer";
    const canJudgeReport = isJudgeOrOrganizer && (match.status === "PENDING" || match.status === "DISPUTED");
    const canResolveDispute = isJudgeOrOrganizer && match.status === "DISPUTED";

    async function handleReport(asJudge = false) {
        setSubmitting(true);
        try {
            await reportMatch(tournamentId, match.id, {
                player1_wins: p1Wins,
                player2_wins: p2Wins,
                draws,
            });
            toast.success(asJudge ? "Resultado registrado por juez" : "Resultado reportado. Esperando confirmación del oponente.");
            setShowReport(false);
            onUpdate();
        } catch (e: any) {
            toast.danger(e.message || "Error al reportar");
        }
        setSubmitting(false);
    }

    async function handleConfirm() {
        setSubmitting(true);
        try {
            await confirmMatch(tournamentId, match.id);
            toast.success("Resultado confirmado");
            onUpdate();
        } catch (e: any) {
            toast.danger(e.message || "Error al confirmar");
        }
        setSubmitting(false);
    }

    async function handleDispute() {
        setSubmitting(true);
        try {
            await disputeMatch(tournamentId, match.id, { reason: "Resultado incorrecto" });
            toast.warning("Resultado disputado. Un juez revisará la partida.");
            onUpdate();
        } catch (e: any) {
            toast.danger(e.message || "Error al disputar");
        }
        setSubmitting(false);
    }

    async function handleResolve() {
        setSubmitting(true);
        try {
            await resolveDispute(tournamentId, match.id, {
                player1_wins: p1Wins,
                player2_wins: p2Wins,
                draws,
            });
            toast.success("Disputa resuelta");
            setShowReport(false);
            onUpdate();
        } catch (e: any) {
            toast.danger(e.message || "Error al resolver disputa");
        }
        setSubmitting(false);
    }

    // BYE match
    if (match.is_bye) {
        return (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{p1Name}</p>
                            {match.table_number && (
                                <p className="text-xs" style={{ color: "var(--muted)" }}>Mesa {match.table_number}</p>
                            )}
                        </div>
                        <Chip size="sm" variant="secondary">BYE</Chip>
                    </div>
                </Card.Content>
            </Card>
        );
    }

    const matchStatusColor =
        match.status === "CONFIRMED" ? "success" :
        match.status === "DISPUTED" ? "danger" :
        match.status === "REPORTED" ? "warning" :
        "default";

    return (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Card.Content className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    {match.table_number ? (
                        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Mesa {match.table_number}</span>
                    ) : <span />}
                    <Chip size="sm" color={matchStatusColor} variant="soft">
                        {matchStatusLabels[match.status] || match.status}
                    </Chip>
                </div>

                {/* Players & Score */}
                <div className="space-y-2">
                    <PlayerRow
                        name={p1Name}
                        wins={match.player1_wins}
                        isWinner={match.winner_id === p1Id}
                        isMe={iAmPlayer1}
                    />
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                        <span className="text-xs font-bold" style={{ color: "var(--muted)" }}>VS</span>
                        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    </div>
                    <PlayerRow
                        name={p2Name}
                        wins={match.player2_wins}
                        isWinner={match.winner_id === p2Id}
                        isMe={!iAmPlayer1 && !!isMyMatch}
                    />
                    {(match.draws ?? 0) > 0 && (
                        <p className="text-xs text-center" style={{ color: "var(--muted)" }}>Empates: {match.draws}</p>
                    )}
                </div>

                {/* Status messages */}
                {match.status === "REPORTED" && iReported && (
                    <p className="text-xs" style={{ color: "var(--warning)" }}>
                        Reportaste el resultado. Esperando confirmación del oponente.
                    </p>
                )}
                {opponentReported && (
                    <p className="text-xs" style={{ color: "var(--warning)" }}>
                        Tu oponente reportó: {match.player1_wins}-{match.player2_wins}. Confirma o disputa.
                    </p>
                )}
                {match.status === "DISPUTED" && (
                    <p className="text-xs" style={{ color: "var(--danger)" }}>
                        Resultado en disputa. Un juez debe resolverlo.
                    </p>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                    {canReport && !showReport && (
                        <Button size="sm" onPress={() => setShowReport(true)} style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
                            Reportar resultado
                        </Button>
                    )}
                    {canConfirm && (
                        <Button size="sm" isDisabled={submitting} onPress={handleConfirm} style={{ background: "var(--success)", color: "var(--success-foreground)" }}>
                            Confirmar resultado
                        </Button>
                    )}
                    {canDispute && (
                        <Button size="sm" variant="danger-soft" isDisabled={submitting} onPress={handleDispute}>
                            Disputar
                        </Button>
                    )}
                    {canJudgeReport && !showReport && (
                        <Button size="sm" onPress={() => setShowReport(true)} style={{ background: "var(--warning)", color: "#000" }}>
                            {canResolveDispute ? "Resolver disputa" : "Reportar como juez"}
                        </Button>
                    )}
                </div>

                {/* Score form */}
                {showReport && (
                    <div className="p-3 rounded-lg border space-y-3" style={{ background: "var(--surface-secondary)", borderColor: "var(--border)" }}>
                        <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                            {canResolveDispute ? "Resolver disputa" : "Reportar resultado"}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            <ScoreInput label={p1Name} value={p1Wins} onChange={setP1Wins} />
                            <ScoreInput label={p2Name} value={p2Wins} onChange={setP2Wins} />
                            <ScoreInput label="Empates" value={draws} onChange={setDraws} />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                isDisabled={submitting}
                                onPress={() => canResolveDispute ? handleResolve() : handleReport(isJudgeOrOrganizer)}
                                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                            >
                                {submitting ? "Enviando..." : "Enviar"}
                            </Button>
                            <Button size="sm" variant="tertiary" onPress={() => setShowReport(false)}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </Card.Content>
        </Card>
    );
}

function PlayerRow({ name, wins, isWinner, isMe }: { name: string; wins?: number; isWinner: boolean; isMe?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span
                    className={`text-sm ${isWinner ? "font-bold" : "font-medium"}`}
                    style={{ color: isWinner ? "var(--accent)" : "var(--foreground)" }}
                >
                    {name}
                </span>
                {isMe && <Chip size="sm" variant="soft" color="accent">Tú</Chip>}
            </div>
            <span className={`text-lg font-bold`} style={{ color: isWinner ? "var(--accent)" : "var(--foreground)" }}>
                {wins ?? "-"}
            </span>
        </div>
    );
}

function ScoreInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <label className="text-xs truncate max-w-full" style={{ color: "var(--muted)" }}>{label}</label>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold border transition-colors hover:bg-[var(--surface-tertiary)]"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                    -
                </button>
                <span className="w-6 text-center text-sm font-bold" style={{ color: "var(--foreground)" }}>{value}</span>
                <button
                    onClick={() => onChange(value + 1)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold border transition-colors hover:bg-[var(--surface-tertiary)]"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                    +
                </button>
            </div>
        </div>
    );
}

// ── Standings Tab ──

function StandingsTab({ standings, loading }: { standings: Standing[]; loading: boolean }) {
    if (loading) {
        return (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="p-8 text-center">
                    <p className="text-sm animate-pulse" style={{ color: "var(--muted)" }}>Cargando clasificación...</p>
                </Card.Content>
            </Card>
        );
    }

    if (standings.length === 0) {
        return (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="py-12 text-center">
                    <p className="text-sm" style={{ color: "var(--muted)" }}>No hay clasificación disponible aún.</p>
                </Card.Content>
            </Card>
        );
    }

    return (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Card.Content className="p-0">
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--muted)" }}>#</th>
                                <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--muted)" }}>Jugador</th>
                                <th className="px-4 py-3 text-center font-semibold" style={{ color: "var(--muted)" }}>Pts</th>
                                <th className="px-4 py-3 text-center font-semibold" style={{ color: "var(--muted)" }}>V</th>
                                <th className="px-4 py-3 text-center font-semibold" style={{ color: "var(--muted)" }}>D</th>
                                <th className="px-4 py-3 text-center font-semibold" style={{ color: "var(--muted)" }}>E</th>
                                <th className="px-4 py-3 text-center font-semibold" style={{ color: "var(--muted)" }}>OMW%</th>
                                <th className="px-4 py-3 text-center font-semibold" style={{ color: "var(--muted)" }}>GW%</th>
                                <th className="px-4 py-3 text-center font-semibold" style={{ color: "var(--muted)" }}>OGW%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((s, i) => (
                                <tr
                                    key={s.user_id || i}
                                    className="transition-colors hover:bg-[var(--surface-secondary)]"
                                    style={{ borderBottom: "1px solid var(--border)" }}
                                >
                                    <td className="px-4 py-3 font-bold" style={{ color: s.rank <= 3 ? "var(--accent)" : "var(--foreground)" }}>
                                        {s.rank}
                                    </td>
                                    <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>
                                        {s.username}
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold" style={{ color: "var(--foreground)" }}>
                                        {s.points}
                                    </td>
                                    <td className="px-4 py-3 text-center text-[var(--success)]">{s.wins}</td>
                                    <td className="px-4 py-3 text-center text-[var(--danger)]">{s.losses}</td>
                                    <td className="px-4 py-3 text-center" style={{ color: "var(--muted)" }}>{s.draws}</td>
                                    <td className="px-4 py-3 text-center" style={{ color: "var(--muted)" }}>
                                        {s.omw != null ? `${(s.omw * 100).toFixed(1)}%` : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-center" style={{ color: "var(--muted)" }}>
                                        {s.gw != null ? `${(s.gw * 100).toFixed(1)}%` : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-center" style={{ color: "var(--muted)" }}>
                                        {s.ogw != null ? `${(s.ogw * 100).toFixed(1)}%` : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y" style={{ borderColor: "var(--border)" }}>
                    {standings.map((s, i) => (
                        <div key={s.user_id || i} className="p-4 flex items-center gap-3">
                            <span
                                className="text-lg font-bold w-8 text-center"
                                style={{ color: s.rank <= 3 ? "var(--accent)" : "var(--muted)" }}
                            >
                                {s.rank}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                                    {s.username}
                                </p>
                                <p className="text-xs" style={{ color: "var(--muted)" }}>
                                    {s.wins}V - {s.losses}D - {s.draws}E
                                </p>
                            </div>
                            <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.points}pts</span>
                        </div>
                    ))}
                </div>
            </Card.Content>
        </Card>
    );
}
