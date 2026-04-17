"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { Tabs } from "@heroui/react/tabs";
import { toast } from "@heroui/react/toast";

import Image from "next/image";
import { Clock, MapPin, Persons, Cup, Person, ShieldCheck } from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { mapErrorMessage } from "@/lib/api/errors";
import { getGameBrand } from "@/lib/gameLogos";
import type { Tournament, TournamentDetail, TournamentJudge, TournamentPrize, Round, Standing, Match } from "@/lib/types/tournament";
import TournamentBracket from "@/features/tournament/TournamentBracket";
import FollowTournamentButton from "@/features/tournament/FollowTournamentButton";
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
    PENDING: "Pendiente", IN_PROGRESS: "En curso", REPORTED: "Reportado",
    CONFIRMED: "Confirmado", DISPUTED: "Disputado",
};

// ── Helpers ──

function getUsernameFromToken(accessToken?: string): string | undefined {
    if (!accessToken) return undefined;
    try {
        const parts = accessToken.split(".");
        if (parts.length !== 3) return undefined;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(window.atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
        const payload = JSON.parse(json);
        return payload.usr || payload.username;
    } catch { return undefined; }
}

function getUserRole(tournament: TournamentDetail, username?: string): "organizer" | "judge" | "player" | "spectator" {
    if (!username) return "spectator";
    if (tournament.organizer_name === username) return "organizer";
    if (tournament.judges?.some((j: TournamentJudge) => j.username === username)) return "judge";
    if (tournament.my_registration) return "player";
    return "spectator";
}

// ── Main Component ──

export default function TournamentDetailClient({ tournament: initial }: { tournament: Tournament }) {
    const { session, status: authStatus } = useAuth();
    const [tournament] = useState(initial);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [standings, setStandings] = useState<Standing[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const isAuthenticated = authStatus === "authenticated" && Boolean(session?.accessToken);
    const currentUsername = useMemo(
        () => session?.username || getUsernameFromToken(session?.accessToken),
        [session?.username, session?.accessToken]
    );

    const detail = tournament as TournamentDetail;
    const st = statusConfig[tournament.status] || statusConfig.DRAFT;

    const role = useMemo(() => {
        if (!isAuthenticated || !currentUsername) return "spectator" as const;
        return getUserRole(detail, currentUsername);
    }, [isAuthenticated, currentUsername, detail]);

    const isLive = ["STARTED", "ROUND_IN_PROGRESS", "ROUND_COMPLETE"].includes(tournament.status);
    const isOpen = tournament.status === "OPEN";
    const isCheckIn = tournament.status === "CHECK_IN";
    const isFinished = ["FINISHED", "CLOSED"].includes(tournament.status);

    const progress = tournament.max_players
        ? Math.min(100, ((tournament.registered_count || 0) / tournament.max_players) * 100)
        : null;

    // ── Data fetching ──

    const loadRounds = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getTournamentRounds(tournament.id);
            const data = (res as { data?: Round[] | { rounds?: Round[] } }).data || res;
            const list = (data as { rounds?: Round[] }).rounds;
            setRounds(Array.isArray(list) ? list : Array.isArray(data) ? data as Round[] : []);
        } catch { /* silent */ }
        setLoading(false);
    }, [tournament.id]);

    const loadStandings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getTournamentStandings(tournament.id);
            const data = (res as { data?: Standing[] | { standings?: Standing[] }; standings?: Standing[] }).data || res;
            const list = (data as { standings?: Standing[] }).standings;
            setStandings(Array.isArray(list) ? list : Array.isArray(data) ? data as Standing[] : []);
        } catch { /* silent */ }
        setLoading(false);
    }, [tournament.id]);

    // Auto-load on mount
    useEffect(() => {
        loadRounds();
        loadStandings();
    }, [loadRounds, loadStandings]);

    async function handleAction(action: () => Promise<unknown>, successMsg: string) {
        setActionLoading(true);
        try {
            await action();
            toast.success(successMsg);
            window.location.reload();
        } catch (e: unknown) {
            toast.danger(mapErrorMessage(e));
        }
        setActionLoading(false);
    }

    // Collect all matches for bracket view
    const allBracketMatches: Match[] = useMemo(() => {
        const result: Match[] = [];
        for (const round of rounds) {
            if (round.matches) {
                result.push(...round.matches);
            }
        }
        return result;
    }, [rounds]);

    // Default tab based on tournament status
    const defaultTab = isLive ? "rounds" : isFinished ? "standings" : "info";

    const bannerBg = tournament.banner_url || tournament.game_logo_url || tournament.tenant_logo_url || null;
    const gameBrand = getGameBrand(tournament.game || tournament.game_name || "");

    return (
        <div className="flex flex-col w-full">
            {/* ── Banner Hero con imagen de fondo y overlay degradado ── */}
            <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden" style={{ backgroundColor: "var(--surface-solid)" }}>
                {/* Imagen de fondo */}
                {bannerBg ? (
                    <Image
                        src={bannerBg}
                        alt={tournament.name}
                        fill
                        sizes="100vw"
                        className="object-cover opacity-50"
                        priority
                    />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `radial-gradient(ellipse at 70% 20%, ${gameBrand.color}22 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, ${gameBrand.color}12 0%, transparent 50%), linear-gradient(145deg, ${gameBrand.bg} 0%, #0a0a0e 50%, ${gameBrand.bg}cc 100%)`,
                        }}
                    />
                )}

                {/* Overlay degradado inferior hacia negro */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Barra de estado superior */}
                <div
                    className={`absolute top-0 inset-x-0 h-[3px] ${isLive ? "animate-pulse" : ""}`}
                    style={{
                        background: isLive
                            ? "var(--success)"
                            : isOpen || isCheckIn
                                ? "var(--warning)"
                                : `linear-gradient(90deg, ${gameBrand.color}, ${gameBrand.color}88, transparent)`,
                    }}
                />

                {/* Contenido en la parte inferior del banner */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-4 max-w-5xl mx-auto w-full">
                    <div className="flex items-end gap-3">
                        {/* Logo organizador */}
                        {tournament.tenant_logo_url ? (
                            <div
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0"
                                style={{ border: "2px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}
                            >
                                <Image src={tournament.tenant_logo_url} alt="" width={80} height={80} className="w-full h-full object-cover" />
                            </div>
                        ) : tournament.tenant_name ? (
                            <div
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex-shrink-0 flex items-center justify-center"
                                style={{ backgroundColor: "var(--overlay)", border: "2px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}
                            >
                                <span className="text-2xl font-black text-[var(--muted)]">
                                    {tournament.tenant_name[0]?.toUpperCase()}
                                </span>
                            </div>
                        ) : null}

                        <div className="flex-1 min-w-0 pb-0.5">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                                    {tournament.name}
                                </h1>
                                <Chip color={st.color} variant="soft" size="sm" className="shrink-0 font-semibold">
                                    {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
                                    {st.label}
                                </Chip>
                            </div>
                            {(tournament.tenant_name || detail.organizer_name) && (
                                <p className="text-sm text-white/60" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                                    Organizado por <span className="font-medium text-white/80">{tournament.tenant_name || detail.organizer_name}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Header acciones y meta ── */}
            <div className="max-w-5xl mx-auto w-full px-4 mt-4 mb-6">
                {/* Botones de acción */}
                <div className="flex gap-2 mb-4">
                    <FollowTournamentButton tournamentId={tournament.id} />
                    <ActionButtons
                        tournament={tournament}
                        role={role}
                        isAuthenticated={isAuthenticated}
                        loading={actionLoading}
                        onAction={handleAction}
                    />
                </div>

                {/* Live round indicator */}
                {isLive && (tournament.current_round || detail.current_round) && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20 w-fit">
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
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {(detail.game_name || tournament.game) && <Chip variant="secondary" size="sm">{detail.game_name || tournament.game}</Chip>}
                    {(detail.format_name || tournament.format) && <Chip variant="secondary" size="sm">{detail.format_name || tournament.format}</Chip>}
                    {(detail.format_type || tournament.structure) && <Chip variant="secondary" size="sm">{detail.format_type || tournament.structure}</Chip>}
                    {tournament.best_of && <Chip variant="secondary" size="sm">Bo{tournament.best_of}</Chip>}
                    {tournament.is_ranked && <Chip color="warning" variant="soft" size="sm">Ranked</Chip>}
                    {tournament.is_online && <Chip variant="secondary" size="sm">Online</Chip>}
                </div>

                {/* Meta + Stats row */}
                <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-3">
                    {[
                        ...(tournament.starts_at ? [{ label: "Fecha", value: new Date(tournament.starts_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" }), icon: <Clock className="size-3.5" /> }] : []),
                        ...(tournament.city ? [{ label: "Lugar", value: detail.venue_name || tournament.city, icon: <MapPin className="size-3.5" /> }] : []),
                        { label: "Jugadores", value: `${detail.current_players || tournament.registered_count || 0}${tournament.max_players ? `/${tournament.max_players}` : ""}`, icon: <Persons className="size-3.5" /> },
                        ...(detail.prize_pool ? [{ label: "Premio", value: `$${Number(detail.prize_pool).toLocaleString("es-CL")}`, icon: <Cup className="size-3.5" /> }] : []),
                        ...(detail.entry_fee ? [{ label: "Entrada", value: `$${Number(detail.entry_fee).toLocaleString("es-CL")}` }] : []),
                    ].map((stat) => (
                        <div key={stat.label} className="flex-1 min-w-[80px] p-2.5 sm:p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] text-center">
                            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold mb-0.5 flex items-center justify-center gap-1">
                                {"icon" in stat && stat.icon}{stat.label}
                            </p>
                            <p className="text-sm font-bold text-[var(--foreground)] truncate">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Capacity bar */}
                {progress !== null && (
                    <div className="mb-3 p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)]">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Capacidad</span>
                            <span className="text-xs font-bold text-[var(--foreground)]">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-[var(--surface-tertiary)] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: progress > 80 ? "var(--danger)" : "var(--accent)" }} />
                        </div>
                    </div>
                )}

                {/* Role badge */}
                {isAuthenticated && role !== "spectator" && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] w-fit">
                        {role === "organizer" && <ShieldCheck className="size-4 text-[var(--accent)]" />}
                        {role === "judge" && <ShieldCheck className="size-4 text-[var(--warning)]" />}
                        {role === "player" && <Person className="size-4 text-[var(--success)]" />}
                        <span className="text-sm font-medium text-[var(--foreground)]">
                            {role === "organizer" ? "Eres el organizador" : role === "judge" ? "Eres juez" : "Estás registrado"}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Tabs ── */}
            <div className="max-w-5xl mx-auto w-full px-4 mb-12">
                <Tabs variant="secondary" defaultSelectedKey={defaultTab}>
                    <Tabs.ListContainer className="overflow-x-auto overflow-y-hidden pb-1 no-scrollbar">
                        <Tabs.List className="whitespace-nowrap flex-nowrap min-w-max">
                            <Tabs.Tab id="info">Información<Tabs.Indicator /></Tabs.Tab>
                            <Tabs.Tab id="rounds">Rondas<Tabs.Indicator /></Tabs.Tab>
                            <Tabs.Tab id="bracket">Bracket<Tabs.Indicator /></Tabs.Tab>
                            <Tabs.Tab id="standings">Clasificación<Tabs.Indicator /></Tabs.Tab>
                        </Tabs.List>
                    </Tabs.ListContainer>

                    <Tabs.Panel id="info" className="pt-4">
                        <InfoTab tournament={tournament} />
                    </Tabs.Panel>

                    <Tabs.Panel id="rounds" className="pt-4">
                        <RoundsTab
                            tournament={tournament}
                            rounds={rounds}
                            loading={loading}
                            role={role}
                            currentUsername={currentUsername}
                            onRefresh={loadRounds}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel id="bracket" className="pt-4">
                        {loading ? (
                            <div className="p-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                                <p className="text-sm animate-pulse text-[var(--muted)]">Cargando bracket...</p>
                            </div>
                        ) : (
                            <TournamentBracket rounds={rounds} matches={allBracketMatches} />
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel id="standings" className="pt-4">
                        <StandingsTab standings={standings} loading={loading} />
                    </Tabs.Panel>
                </Tabs>
            </div>
        </div>
    );
}

// ── Action Buttons (inline, not card) ──

function ActionButtons({
    tournament, role, isAuthenticated, loading, onAction,
}: {
    tournament: Tournament; role: string; isAuthenticated: boolean; loading: boolean;
    onAction: (action: () => Promise<unknown>, msg: string) => void;
}) {
    const detail = tournament as TournamentDetail & { my_registration?: TournamentDetail["my_registration"] & { checked_in_at?: string } };
    const isOpen = tournament.status === "OPEN";
    const isCheckIn = tournament.status === "CHECK_IN";
    const isLive = ["STARTED", "ROUND_IN_PROGRESS", "ROUND_COMPLETE"].includes(tournament.status);
    const isRegistered = !!detail.my_registration;
    const isCheckedIn = detail.my_registration?.checked_in || detail.my_registration?.checked_in_at;

    if (!isAuthenticated) return null;

    return (
        <>
            {role === "spectator" && isOpen && (
                <Button variant="primary" size="sm" className="font-bold" isDisabled={loading}
                    onPress={() => onAction(() => registerForTournament(tournament.id), "Te has registrado al torneo")}>
                    Inscribirse
                </Button>
            )}
            {role === "player" && isOpen && isRegistered && (
                <Button size="sm" variant="danger-soft" isDisabled={loading}
                    onPress={() => onAction(() => unregisterFromTournament(tournament.id), "Te has desinscrito del torneo")}>
                    Cancelar inscripción
                </Button>
            )}
            {role === "player" && isCheckIn && isRegistered && !isCheckedIn && (
                <Button size="sm" isDisabled={loading} className="font-bold bg-[var(--success)] text-[var(--success-foreground)]"
                    onPress={() => onAction(() => checkInTournament(tournament.id), "Check-in realizado")}>
                    Hacer check-in
                </Button>
            )}
            {role === "player" && isCheckIn && isCheckedIn && (
                <Chip color="success" variant="soft" size="sm">Check-in hecho</Chip>
            )}
            {role === "player" && isLive && (
                <Button size="sm" variant="danger-soft" isDisabled={loading}
                    onPress={() => onAction(() => dropFromTournament(tournament.id), "Has abandonado el torneo")}>
                    Abandonar
                </Button>
            )}
            {role === "organizer" && (isOpen || isCheckIn) && (
                <Button size="sm" isDisabled={loading} className="font-bold bg-[var(--success)] text-[var(--success-foreground)]"
                    onPress={() => onAction(() => startTournament(tournament.id), "Torneo iniciado")}>
                    Iniciar torneo
                </Button>
            )}
            {role === "organizer" && tournament.status === "ROUND_COMPLETE" && (
                <Button variant="primary" size="sm" className="font-bold" isDisabled={loading}
                    onPress={() => onAction(() => nextRound(tournament.id), "Nueva ronda generada")}>
                    Siguiente ronda
                </Button>
            )}
            {role === "organizer" && isLive && (
                <Button size="sm" variant="danger-soft" isDisabled={loading}
                    onPress={() => onAction(() => finishTournament(tournament.id), "Torneo finalizado")}>
                    Finalizar
                </Button>
            )}
        </>
    );
}

// ── Info Tab ──

function InfoTab({ tournament }: { tournament: Tournament }) {
    const detail = tournament as TournamentDetail;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournament.description && (
                <div className="md:col-span-2 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <h3 className="font-bold text-sm text-[var(--foreground)] mb-2">Descripción</h3>
                    <p className="text-sm text-[var(--muted)] whitespace-pre-wrap leading-relaxed">{tournament.description}</p>
                </div>
            )}
            {tournament.rules && (
                <div className="md:col-span-2 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <h3 className="font-bold text-sm text-[var(--foreground)] mb-2">Reglas</h3>
                    <p className="text-sm text-[var(--muted)] whitespace-pre-wrap leading-relaxed">{tournament.rules}</p>
                </div>
            )}

            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                <h3 className="font-bold text-sm text-[var(--foreground)]">Detalles</h3>
                <DetailRow label="Juego" value={detail.game_name || tournament.game} />
                <DetailRow label="Formato" value={detail.format_name || tournament.format} />
                <DetailRow label="Estructura" value={detail.format_type || tournament.structure} />
                <DetailRow label="Best of" value={tournament.best_of ? `${tournament.best_of}` : undefined} />
                <DetailRow label="Rondas máx." value={tournament.max_rounds ? `${tournament.max_rounds}` : undefined} />
                <DetailRow label="Timer" value={tournament.round_timer_min ? `${tournament.round_timer_min} min` : undefined} />
                <DetailRow label="Modalidad" value={detail.modality} />
                <DetailRow label="Tier" value={detail.tier} />
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                <h3 className="font-bold text-sm text-[var(--foreground)]">Ubicación</h3>
                <DetailRow label="Lugar" value={detail.venue_name || tournament.venue_name} />
                <DetailRow label="Dirección" value={tournament.venue_address} />
                <DetailRow label="Ciudad" value={tournament.city} />
                <DetailRow label="Región" value={detail.region} />
                <DetailRow label="País" value={detail.country_code || tournament.country} />
                {tournament.is_online && <p className="text-sm text-[var(--accent)] font-medium">Torneo online</p>}
            </div>

            {(detail.judges?.length ?? 0) > 0 && (
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                    <h3 className="font-bold text-sm text-[var(--foreground)]">Jueces</h3>
                    {detail.judges!.map((j: TournamentJudge) => (
                        <div key={j.user_id} className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-[var(--warning)]" />
                            <span className="text-sm text-[var(--foreground)]">{j.username}</span>
                            {j.is_head_judge && <Chip size="sm" color="warning" variant="soft">Head Judge</Chip>}
                        </div>
                    ))}
                </div>
            )}

            {(detail.prizes?.length ?? 0) > 0 && (
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                    <h3 className="font-bold text-sm text-[var(--foreground)]">Premios</h3>
                    {detail.prizes!.map((p: TournamentPrize, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-[var(--foreground)]">
                                {p.position === 1 ? "1er" : p.position === 2 ? "2do" : p.position === 3 ? "3er" : `${p.position}to`} lugar
                            </span>
                            <span className="text-sm font-medium text-[var(--accent)]">{p.description}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted)]">{label}</span>
            <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
        </div>
    );
}

// ── Rounds Tab ──

function RoundsTab({ tournament, rounds, loading, role, currentUsername }: {
    tournament: Tournament; rounds: Round[]; loading: boolean; role: string; currentUsername?: string; onRefresh: () => void;
}) {
    const [selectedRound, setSelectedRound] = useState<number | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [matchesLoading, setMatchesLoading] = useState(false);

    useEffect(() => {
        if (rounds.length > 0 && selectedRound === null) {
            const active = rounds.find((r) => r.status === "IN_PROGRESS");
            setSelectedRound(active?.round_number ?? rounds[rounds.length - 1].round_number);
        }
    }, [rounds, selectedRound]);

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
        getRoundMatches(tournament.id, selectedRound).then((m) => setMatches(m)).catch(() => setMatches([]));
    }, [tournament.id, selectedRound]);

    if (loading) {
        return <div className="p-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]"><p className="text-sm animate-pulse text-[var(--muted)]">Cargando rondas...</p></div>;
    }

    if (rounds.length === 0) {
        return (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="py-14 text-center">
                    <p className="text-3xl mb-3 opacity-50">⚔️</p>
                    <p className="text-sm font-medium text-[var(--foreground)]">Sin rondas</p>
                    <p className="text-xs mt-1 text-[var(--muted)]">No hay rondas generadas aún.</p>
                </Card.Content>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Round selector */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {rounds.map((r) => {
                    const isActive = r.round_number === selectedRound;
                    const isInProgress = r.status === "IN_PROGRESS";
                    return (
                        <button
                            key={r.round_number}
                            onClick={() => setSelectedRound(r.round_number)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border shrink-0 ${isActive
                                ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]"
                                : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                                }`}
                        >
                            R{r.round_number}
                            {isInProgress && <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-[var(--success)]" />}
                        </button>
                    );
                })}
            </div>

            {/* Matches */}
            {matchesLoading ? (
                <div className="p-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]"><p className="text-sm animate-pulse text-[var(--muted)]">Cargando partidas...</p></div>
            ) : matches.length === 0 ? (
                <div className="py-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]"><p className="text-sm text-[var(--muted)]">No hay partidas en esta ronda.</p></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matches.map((match) => (
                        <MatchCard key={match.id} match={match} tournamentId={tournament.id} role={role} currentUsername={currentUsername} onUpdate={refreshMatches} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Match Card ──

function MatchCard({ match, tournamentId, role, currentUsername, onUpdate }: {
    match: Match; tournamentId: string; role: string; currentUsername?: string; onUpdate: () => void;
}) {
    const [showReport, setShowReport] = useState(false);
    const [p1Wins, setP1Wins] = useState(match.player1_wins ?? 0);
    const [p2Wins, setP2Wins] = useState(match.player2_wins ?? 0);
    const [draws, setDraws] = useState(match.draws ?? 0);
    const [submitting, setSubmitting] = useState(false);

    const p1Name = match.player1?.username || "Jugador 1";
    const p2Name = match.player2?.username || "Jugador 2";
    const isMyMatch = currentUsername && (p1Name === currentUsername || p2Name === currentUsername);
    const iAmPlayer1 = currentUsername === p1Name;
    const opponentReported = match.status === "REPORTED" && isMyMatch;
    const canReport = isMyMatch && match.status === "PENDING" && !match.is_bye;
    const canConfirm = isMyMatch && opponentReported;
    const canDispute = isMyMatch && opponentReported;
    const isJudgeOrOrganizer = role === "judge" || role === "organizer";
    const canJudgeReport = isJudgeOrOrganizer && (match.status === "PENDING" || match.status === "DISPUTED");
    const canResolveDispute = isJudgeOrOrganizer && match.status === "DISPUTED";

    async function handleReport(asJudge = false) {
        setSubmitting(true);
        try {
            await reportMatch(tournamentId, match.id, { player1_wins: p1Wins, player2_wins: p2Wins, draws });
            toast.success(asJudge ? "Resultado registrado por juez" : "Resultado reportado");
            setShowReport(false); onUpdate();
        } catch (e: unknown) { toast.danger(mapErrorMessage(e)); }
        setSubmitting(false);
    }

    async function handleConfirm() {
        setSubmitting(true);
        try { await confirmMatch(tournamentId, match.id); toast.success("Resultado confirmado"); onUpdate(); }
        catch (e: unknown) { toast.danger(mapErrorMessage(e)); }
        setSubmitting(false);
    }

    async function handleDispute() {
        setSubmitting(true);
        try { await disputeMatch(tournamentId, match.id, { reason: "Resultado incorrecto" }); toast.warning("Resultado disputado"); onUpdate(); }
        catch (e: unknown) { toast.danger(mapErrorMessage(e)); }
        setSubmitting(false);
    }

    async function handleResolve() {
        setSubmitting(true);
        try { await resolveDispute(tournamentId, match.id, { player1_wins: p1Wins, player2_wins: p2Wins, draws }); toast.success("Disputa resuelta"); setShowReport(false); onUpdate(); }
        catch (e: unknown) { toast.danger(mapErrorMessage(e)); }
        setSubmitting(false);
    }

    if (match.is_bye) {
        return (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{p1Name}</p>
                    {match.table_number && <p className="text-xs text-[var(--muted)]">Mesa {match.table_number}</p>}
                </div>
                <Chip size="sm" variant="secondary">BYE</Chip>
            </div>
        );
    }

    const matchStatusColor = match.status === "CONFIRMED" ? "success" : match.status === "DISPUTED" ? "danger" : match.status === "REPORTED" ? "warning" : "default";

    return (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
            <div className="flex items-center justify-between">
                {match.table_number ? <span className="text-xs font-medium text-[var(--muted)]">Mesa {match.table_number}</span> : <span />}
                <Chip size="sm" color={matchStatusColor} variant="soft">{matchStatusLabels[match.status] || match.status}</Chip>
            </div>

            <div className="space-y-2">
                <PlayerRow name={p1Name} wins={match.player1_wins} isWinner={match.winner_id === match.player1?.user_id} isMe={iAmPlayer1} />
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <span className="text-xs font-bold text-[var(--muted)]">VS</span>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
                <PlayerRow name={p2Name} wins={match.player2_wins} isWinner={match.winner_id === match.player2?.user_id} isMe={!iAmPlayer1 && !!isMyMatch} />
                {(match.draws ?? 0) > 0 && <p className="text-xs text-center text-[var(--muted)]">Empates: {match.draws}</p>}
            </div>

            {match.status === "REPORTED" && isMyMatch && (
                <p className="text-xs text-[var(--warning)]">Resultado reportado: {match.player1_wins}-{match.player2_wins}. Esperando confirmación.</p>
            )}
            {match.status === "DISPUTED" && (
                <p className="text-xs text-[var(--danger)]">Resultado en disputa. Un juez debe resolverlo.</p>
            )}

            <div className="flex flex-wrap gap-2">
                {canReport && !showReport && <Button size="sm" variant="primary" onPress={() => setShowReport(true)}>Reportar resultado</Button>}
                {canConfirm && <Button size="sm" isDisabled={submitting} onPress={handleConfirm} className="bg-[var(--success)] text-[var(--success-foreground)] font-bold">Confirmar</Button>}
                {canDispute && <Button size="sm" variant="danger-soft" isDisabled={submitting} onPress={handleDispute}>Disputar</Button>}
                {canJudgeReport && !showReport && (
                    <Button size="sm" onPress={() => setShowReport(true)} className="bg-[var(--warning)] text-[var(--warning-foreground)] font-bold">
                        {canResolveDispute ? "Resolver disputa" : "Reportar como juez"}
                    </Button>
                )}
            </div>

            {showReport && (
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] space-y-3">
                    <p className="text-xs font-semibold text-[var(--foreground)]">{canResolveDispute ? "Resolver disputa" : "Reportar resultado"}</p>
                    <div className="grid grid-cols-3 gap-2">
                        <ScoreInput label={p1Name} value={p1Wins} onChange={setP1Wins} />
                        <ScoreInput label={p2Name} value={p2Wins} onChange={setP2Wins} />
                        <ScoreInput label="Empates" value={draws} onChange={setDraws} />
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="primary" isDisabled={submitting} onPress={() => canResolveDispute ? handleResolve() : handleReport(isJudgeOrOrganizer)}>
                            {submitting ? "Enviando..." : "Enviar"}
                        </Button>
                        <Button size="sm" variant="tertiary" onPress={() => setShowReport(false)}>Cancelar</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function PlayerRow({ name, wins, isWinner, isMe }: { name: string; wins?: number; isWinner: boolean; isMe?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className={`text-sm ${isWinner ? "font-bold text-[var(--accent)]" : "font-medium text-[var(--foreground)]"}`}>{name}</span>
                {isMe && <Chip size="sm" variant="soft" color="accent">Tú</Chip>}
            </div>
            <span className={`text-lg font-bold ${isWinner ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>{wins ?? "-"}</span>
        </div>
    );
}

function ScoreInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <label className="text-xs truncate max-w-full text-[var(--muted)]">{label}</label>
            <div className="flex items-center gap-1">
                <button onClick={() => onChange(Math.max(0, value - 1))} className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold border border-[var(--border)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-tertiary)]">-</button>
                <span className="w-6 text-center text-sm font-bold text-[var(--foreground)]">{value}</span>
                <button onClick={() => onChange(value + 1)} className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold border border-[var(--border)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-tertiary)]">+</button>
            </div>
        </div>
    );
}

// ── Standings Tab ──

function StandingsTab({ standings, loading }: { standings: Standing[]; loading: boolean }) {
    if (loading) {
        return <div className="p-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]"><p className="text-sm animate-pulse text-[var(--muted)]">Cargando clasificación...</p></div>;
    }

    if (standings.length === 0) {
        return (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="py-14 text-center">
                    <p className="text-3xl mb-3 opacity-50">🏆</p>
                    <p className="text-sm font-medium text-[var(--foreground)]">Sin clasificación</p>
                    <p className="text-xs mt-1 text-[var(--muted)]">No hay clasificación disponible aún.</p>
                </Card.Content>
            </Card>
        );
    }

    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--border)]">
                            <th className="px-4 py-3 text-left font-semibold text-[var(--muted)]">#</th>
                            <th className="px-4 py-3 text-left font-semibold text-[var(--muted)]">Jugador</th>
                            <th className="px-4 py-3 text-center font-semibold text-[var(--muted)]">Pts</th>
                            <th className="px-4 py-3 text-center font-semibold text-[var(--muted)]">V</th>
                            <th className="px-4 py-3 text-center font-semibold text-[var(--muted)]">D</th>
                            <th className="px-4 py-3 text-center font-semibold text-[var(--muted)]">E</th>
                            <th className="px-4 py-3 text-center font-semibold text-[var(--muted)]">OMW%</th>
                            <th className="px-4 py-3 text-center font-semibold text-[var(--muted)]">GW%</th>
                            <th className="px-4 py-3 text-center font-semibold text-[var(--muted)]">OGW%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((s, i) => (
                            <tr key={s.user_id || i} className="transition-colors hover:bg-[var(--surface-secondary)] border-b border-[var(--border)] last:border-0">
                                <td className={`px-4 py-3 font-bold ${s.rank <= 3 ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>{s.rank}</td>
                                <td className="px-4 py-3 font-medium text-[var(--foreground)]">{s.username}</td>
                                <td className="px-4 py-3 text-center font-bold text-[var(--foreground)]">{s.points}</td>
                                <td className="px-4 py-3 text-center text-[var(--success)]">{s.wins}</td>
                                <td className="px-4 py-3 text-center text-[var(--danger)]">{s.losses}</td>
                                <td className="px-4 py-3 text-center text-[var(--muted)]">{s.draws}</td>
                                <td className="px-4 py-3 text-center text-[var(--muted)]">{s.omw != null ? `${(s.omw * 100).toFixed(1)}%` : "-"}</td>
                                <td className="px-4 py-3 text-center text-[var(--muted)]">{s.gw != null ? `${(s.gw * 100).toFixed(1)}%` : "-"}</td>
                                <td className="px-4 py-3 text-center text-[var(--muted)]">{s.ogw != null ? `${(s.ogw * 100).toFixed(1)}%` : "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-[var(--border)]">
                {standings.map((s, i) => (
                    <div key={s.user_id || i} className="p-4 flex items-center gap-3">
                        <span className={`text-lg font-bold w-8 text-center ${s.rank <= 3 ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>{s.rank}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--foreground)] truncate">{s.username}</p>
                            <p className="text-xs text-[var(--muted)]">{s.wins}V - {s.losses}D - {s.draws}E</p>
                        </div>
                        <span className="text-lg font-bold text-[var(--foreground)]">{s.points}pts</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
