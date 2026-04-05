"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Switch, toast } from "@heroui/react";
import { useAuth } from "@/lib/hooks/use-auth";
import { mapErrorMessage } from "@/lib/api/errors";
import { getGames, getGameFormats } from "@/lib/api/catalog";
import { createTournament } from "@/lib/api/tournaments";
import { getGameBrand } from "@/lib/gameLogos";
import type { CatalogGame, CatalogFormat } from "@/lib/types/catalog";
import type { CreateTournamentRequest, Tournament } from "@/lib/types/tournament";

const structures = [
    { value: "SWISS", label: "Suizo" },
    { value: "SINGLE_ELIM", label: "Eliminación simple" },
    { value: "DOUBLE_ELIM", label: "Eliminación doble" },
    { value: "ROUND_ROBIN", label: "Round Robin" },
];

const tiers = [
    { value: "CASUAL", label: "Casual" },
    { value: "COMPETITIVE", label: "Competitivo" },
    { value: "PREMIER", label: "Premier" },
];

const modalities = [
    { value: "IN_PERSON", label: "Presencial" },
    { value: "ONLINE", label: "Online" },
    { value: "HYBRID", label: "Híbrido" },
];

const visibilities = [
    { value: "PUBLIC", label: "Público" },
    { value: "PRIVATE", label: "Privado" },
    { value: "UNLISTED", label: "No listado" },
];

const bestOfOptions = [
    { value: 1, label: "Bo1" },
    { value: 3, label: "Bo3" },
    { value: 5, label: "Bo5" },
];

export default function CreateTournamentForm() {
    const router = useRouter();
    const { status } = useAuth();
    const isAuthenticated = status === "authenticated";

    const [games, setGames] = useState<CatalogGame[]>([]);
    const [formats, setFormats] = useState<CatalogFormat[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [selectedGame, setSelectedGame] = useState<CatalogGame | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<CatalogFormat | null>(null);
    const [startsAt, setStartsAt] = useState("");
    const [structure, setStructure] = useState("SWISS");
    const [bestOf, setBestOf] = useState(3);
    const [tier, setTier] = useState("CASUAL");
    const [modality, setModality] = useState("IN_PERSON");
    const [visibility, setVisibility] = useState("PUBLIC");
    const [isRanked, setIsRanked] = useState(false);
    const [maxPlayers, setMaxPlayers] = useState("");
    const [maxRounds, setMaxRounds] = useState("");
    const [roundTimerMin, setRoundTimerMin] = useState("50");
    const [description, setDescription] = useState("");
    const [rules, setRules] = useState("");
    const [entryFee, setEntryFee] = useState("");
    const [prizePool, setPrizePool] = useState("");
    const [venueName, setVenueName] = useState("");
    const [city, setCity] = useState("");
    const [region, setRegion] = useState("");
    const [countryCode, setCountryCode] = useState("CL");
    const [bannerUrl, setBannerUrl] = useState("");

    // Load games
    useEffect(() => {
        getGames()
            .then((res) => {
                const list = res.data || (res as { data?: CatalogGame[]; games?: CatalogGame[] }).games || [];
                setGames(Array.isArray(list) ? list : []);
            })
            .catch(() => {});
    }, []);

    // Load formats when game changes
    useEffect(() => {
        if (!selectedGame) {
            setFormats([]);
            setSelectedFormat(null);
            return;
        }
        getGameFormats(selectedGame.slug)
            .then((res) => {
                const data = res as { formats?: CatalogFormat[]; data?: CatalogFormat[] };
                const list = data.formats || data.data || [];
                setFormats(Array.isArray(list) ? list : []);
                setSelectedFormat(null);
            })
            .catch(() => setFormats([]));
    }, [selectedGame]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedGame || !selectedFormat || !name.trim() || !startsAt) {
            toast.danger("Completa los campos obligatorios: nombre, juego, formato y fecha de inicio");
            return;
        }

        setSubmitting(true);
        try {
            const payload: Record<string, string | number | boolean | undefined> = {
                name: name.trim(),
                game_id: selectedGame.id,
                format_id: selectedFormat.id,
                starts_at: new Date(startsAt).toISOString(),
                format_type: structure,
                best_of: bestOf,
                tier,
                modality,
                visibility,
                is_ranked: isRanked,
                round_timer_min: parseInt(roundTimerMin) || 50,
                country_code: countryCode || "CL",
            };

            if (description.trim()) payload.description = description.trim();
            if (rules.trim()) payload.rules = rules.trim();
            if (maxPlayers) payload.max_players = parseInt(maxPlayers);
            if (maxRounds) payload.max_rounds = parseInt(maxRounds);
            if (entryFee) payload.entry_fee = parseInt(entryFee);
            if (prizePool) payload.prize_pool = parseInt(prizePool);
            if (venueName.trim()) payload.venue_name = venueName.trim();
            if (city.trim()) payload.city = city.trim();
            if (region.trim()) payload.region = region.trim();
            if (bannerUrl.trim()) payload.banner_url = bannerUrl.trim();

            const res = await createTournament(payload as unknown as CreateTournamentRequest);
            const outer = res as { tournament?: Tournament; data?: { tournament?: Tournament } };
            const created = outer.tournament || outer.data?.tournament || (res as unknown as Tournament);

            toast.success("Torneo creado exitosamente");
            router.push(`/torneos/${created.id || (created as Tournament & { public_id?: string }).public_id}`);
        } catch (e: unknown) {
            toast.danger(mapErrorMessage(e));
        }
        setSubmitting(false);
    }

    if (!isAuthenticated) {
        return (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="py-12 text-center">
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                        Debes iniciar sesión para crear un torneo.
                    </p>
                    <Button
                        size="sm"
                        className="mt-4"
                        onPress={() => router.push("/login")}
                        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                    >
                        Iniciar sesión
                    </Button>
                </Card.Content>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* ── Información básica ── */}
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="p-5 space-y-4">
                    <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Información básica</h2>

                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>
                            Nombre del torneo *
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Copa Santiago Standard"
                            required
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>
                            Descripción
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe tu torneo..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                            style={{
                                background: "var(--field-background, var(--surface-secondary))",
                                border: "1px solid var(--border)",
                                color: "var(--foreground)",
                                outline: "none",
                            }}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>
                            Reglas
                        </label>
                        <textarea
                            value={rules}
                            onChange={(e) => setRules(e.target.value)}
                            placeholder="Reglas específicas del torneo..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                            style={{
                                background: "var(--field-background, var(--surface-secondary))",
                                border: "1px solid var(--border)",
                                color: "var(--foreground)",
                                outline: "none",
                            }}
                        />
                    </div>
                </Card.Content>
            </Card>

            {/* ── Banner personalizado ── */}
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="p-5 space-y-4">
                    <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Banner del torneo</h2>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Opcional. Si no se agrega, se usará el banner del juego seleccionado.
                    </p>

                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>
                            URL de imagen (landscape, mín. 1200px ancho)
                        </label>
                        <Input
                            value={bannerUrl}
                            onChange={(e) => setBannerUrl(e.target.value)}
                            placeholder="https://ejemplo.com/banner.jpg"
                            className="w-full"
                        />
                    </div>

                    {/* Preview */}
                    {(bannerUrl.trim() || selectedGame) && (
                        <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", border: "1px solid var(--border)" }}>
                            {bannerUrl.trim() ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={bannerUrl.trim()}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                            ) : selectedGame ? (
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: (() => {
                                            const b = getGameBrand(selectedGame.slug);
                                            return `radial-gradient(ellipse at 70% 20%, ${b.color}22 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, ${b.color}12 0%, transparent 50%), linear-gradient(145deg, ${b.bg} 0%, #0a0a0e 50%, ${b.bg}cc 100%)`;
                                        })(),
                                    }}
                                />
                            ) : null}
                            <div className="absolute bottom-2 left-3">
                                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.5)", color: "var(--muted)" }}>
                                    {bannerUrl.trim() ? "Banner personalizado" : `Banner por defecto: ${selectedGame?.name}`}
                                </span>
                            </div>
                        </div>
                    )}
                </Card.Content>
            </Card>

            {/* ── Juego y formato ── */}
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="p-5 space-y-4">
                    <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Juego y formato</h2>

                    <div>
                        <label className="text-xs font-medium mb-2 block" style={{ color: "var(--muted)" }}>
                            Juego *
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {games.map((g) => (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => setSelectedGame(g)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${selectedGame?.id === g.id
                                        ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]"
                                        : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                                        }`}
                                >
                                    {g.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedGame && (
                        <div>
                            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--muted)" }}>
                                Formato *
                            </label>
                            {formats.length === 0 ? (
                                <p className="text-xs" style={{ color: "var(--muted)" }}>Cargando formatos...</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {formats.map((f) => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setSelectedFormat(f)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${selectedFormat?.id === f.id
                                                ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]"
                                                : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                                                }`}
                                        >
                                            {f.name}
                                            {f.is_ranked && <span className="ml-1 text-[var(--warning)]">R</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </Card.Content>
            </Card>

            {/* ── Configuración del torneo ── */}
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="p-5 space-y-4">
                    <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Configuración</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Estructura */}
                        <div>
                            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--muted)" }}>Estructura</label>
                            <div className="flex flex-wrap gap-1.5">
                                {structures.map((s) => (
                                    <button
                                        key={s.value}
                                        type="button"
                                        onClick={() => setStructure(s.value)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${structure === s.value
                                            ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]"
                                            : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                                            }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Best of */}
                        <div>
                            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--muted)" }}>Best of</label>
                            <div className="flex gap-1.5">
                                {bestOfOptions.map((b) => (
                                    <button
                                        key={b.value}
                                        type="button"
                                        onClick={() => setBestOf(b.value)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${bestOf === b.value
                                            ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]"
                                            : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                                            }`}
                                    >
                                        {b.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tier */}
                        <div>
                            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--muted)" }}>Tier</label>
                            <div className="flex flex-wrap gap-1.5">
                                {tiers.map((t) => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => setTier(t.value)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${tier === t.value
                                            ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]"
                                            : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modality */}
                        <div>
                            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--muted)" }}>Modalidad</label>
                            <div className="flex flex-wrap gap-1.5">
                                {modalities.map((m) => (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => setModality(m.value)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${modality === m.value
                                            ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]"
                                            : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                                            }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visibility */}
                        <div>
                            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--muted)" }}>Visibilidad</label>
                            <div className="flex flex-wrap gap-1.5">
                                {visibilities.map((v) => (
                                    <button
                                        key={v.value}
                                        type="button"
                                        onClick={() => setVisibility(v.value)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${visibility === v.value
                                            ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]"
                                            : "bg-[var(--surface-secondary)] border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                                            }`}
                                    >
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Ranked toggle */}
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Ranked</label>
                            <Switch isSelected={isRanked} onChange={() => setIsRanked(!isRanked)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Máx. jugadores</label>
                            <Input
                                type="number"
                                value={maxPlayers}
                                onChange={(e) => setMaxPlayers(e.target.value)}
                                placeholder="Sin límite"
                                min={2}
                                max={2048}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Máx. rondas</label>
                            <Input
                                type="number"
                                value={maxRounds}
                                onChange={(e) => setMaxRounds(e.target.value)}
                                placeholder="Auto"
                                min={1}
                                max={20}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Timer por ronda (min)</label>
                            <Input
                                type="number"
                                value={roundTimerMin}
                                onChange={(e) => setRoundTimerMin(e.target.value)}
                                placeholder="50"
                                min={10}
                                max={120}
                                className="w-full"
                            />
                        </div>
                    </div>
                </Card.Content>
            </Card>

            {/* ── Fecha y lugar ── */}
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="p-5 space-y-4">
                    <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Fecha y lugar</h2>

                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>
                            Fecha de inicio *
                        </label>
                        <input
                            type="datetime-local"
                            value={startsAt}
                            onChange={(e) => setStartsAt(e.target.value)}
                            required
                            className="w-full px-3 py-2 rounded-xl text-sm"
                            style={{
                                background: "var(--field-background, var(--surface-secondary))",
                                border: "1px solid var(--border)",
                                color: "var(--foreground)",
                                colorScheme: "dark",
                                outline: "none",
                            }}
                        />
                    </div>

                    {modality !== "ONLINE" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Lugar</label>
                                <Input
                                    value={venueName}
                                    onChange={(e) => setVenueName(e.target.value)}
                                    placeholder="Nombre de la tienda o local"
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Ciudad</label>
                                <Input
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="Santiago"
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Región</label>
                                <Input
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    placeholder="Metropolitana"
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Código país</label>
                                <Input
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    placeholder="CL"
                                    maxLength={2}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}
                </Card.Content>
            </Card>

            {/* ── Costos y premios ── */}
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="p-5 space-y-4">
                    <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Costos y premios</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Inscripción (CLP)</label>
                            <Input
                                type="number"
                                value={entryFee}
                                onChange={(e) => setEntryFee(e.target.value)}
                                placeholder="0 (gratis)"
                                min={0}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted)" }}>Pozo de premios (CLP)</label>
                            <Input
                                type="number"
                                value={prizePool}
                                onChange={(e) => setPrizePool(e.target.value)}
                                placeholder="0"
                                min={0}
                                className="w-full"
                            />
                        </div>
                    </div>
                </Card.Content>
            </Card>

            {/* ── Submit ── */}
            <div className="flex gap-3">
                <Button
                    type="submit"
                    isDisabled={submitting || !name.trim() || !selectedGame || !selectedFormat || !startsAt}
                    className="flex-1 font-semibold"
                    style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                >
                    {submitting ? "Creando..." : "Crear torneo"}
                </Button>
                <Button
                    type="button"
                    variant="tertiary"
                    onPress={() => router.back()}
                >
                    Cancelar
                </Button>
            </div>
        </form>
    );
}
