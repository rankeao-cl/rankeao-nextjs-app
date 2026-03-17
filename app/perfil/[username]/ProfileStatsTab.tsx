"use client";

import { useMemo } from "react";
import { Card } from "@heroui/react";
import { getRankForElo } from "@/lib/rankSystem";
import type { RatingHistoryPoint } from "@/lib/types/rating";

interface ProfileStatsProps {
    rating: number;
    peakRating: number;
    winRate: number;
    totalMatches: number;
    tournamentsPlayed: number;
    tournamentsWon: number;
    currentStreak: number;
    bestStreak: number;
    ratingHistory: RatingHistoryPoint[];
    gamiStats: any;
}

function EloChart({ history }: { history: RatingHistoryPoint[] }) {
    const points = history.filter((p) => p.rating != null);

    if (points.length < 2) {
        return (
            <div className="min-h-[160px] flex items-center justify-center text-[var(--muted)] bg-[var(--surface-secondary)]/30 rounded-lg p-4 border border-[var(--border)]">
                <p className="text-xs text-center max-w-xs">
                    {points.length === 1
                        ? "Se necesitan al menos 2 registros para mostrar el grafico."
                        : "Sin historial de ranking disponible."}
                </p>
            </div>
        );
    }

    const ratings = points.map((p) => p.rating);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    const range = maxRating - minRating || 1;
    const padding = Math.max(range * 0.1, 10);
    const chartMin = minRating - padding;
    const chartMax = maxRating + padding;
    const chartRange = chartMax - chartMin;

    const width = 800;
    const height = 200;
    const marginLeft = 50;
    const marginRight = 10;
    const marginTop = 10;
    const marginBottom = 30;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;

    const svgPoints = points.map((p, i) => {
        const x = marginLeft + (i / (points.length - 1)) * plotWidth;
        const y = marginTop + plotHeight - ((p.rating - chartMin) / chartRange) * plotHeight;
        return { x, y, point: p };
    });

    const linePath = svgPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    const areaPath = `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${marginTop + plotHeight} L ${svgPoints[0].x} ${marginTop + plotHeight} Z`;

    // Y-axis ticks
    const tickCount = 5;
    const ticks = Array.from({ length: tickCount }, (_, i) => {
        const val = chartMin + (chartRange * i) / (tickCount - 1);
        return Math.round(val);
    });

    // X-axis labels (show a few dates)
    const xLabels = [0, Math.floor(points.length / 2), points.length - 1]
        .filter((idx, pos, arr) => arr.indexOf(idx) === pos)
        .map((idx) => ({
            x: svgPoints[idx].x,
            label: points[idx].date
                ? new Date(points[idx].date).toLocaleDateString("es-CL", { day: "numeric", month: "short" })
                : "",
        }));

    // Color based on trend
    const lastRating = points[points.length - 1].rating;
    const firstRating = points[0].rating;
    const isUp = lastRating >= firstRating;
    const strokeColor = isUp ? "var(--success)" : "var(--danger)";
    const fillColor = isUp ? "var(--success)" : "var(--danger)";

    return (
        <div className="w-full overflow-x-auto">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto min-w-[400px]"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Grid lines */}
                {ticks.map((tick) => {
                    const y = marginTop + plotHeight - ((tick - chartMin) / chartRange) * plotHeight;
                    return (
                        <g key={tick}>
                            <line
                                x1={marginLeft}
                                y1={y}
                                x2={width - marginRight}
                                y2={y}
                                stroke="var(--border)"
                                strokeWidth={0.5}
                                strokeDasharray="4 4"
                            />
                            <text
                                x={marginLeft - 8}
                                y={y + 4}
                                textAnchor="end"
                                fill="var(--muted)"
                                fontSize={10}
                                fontFamily="inherit"
                            >
                                {tick}
                            </text>
                        </g>
                    );
                })}

                {/* Area fill */}
                <path d={areaPath} fill={fillColor} opacity={0.08} />

                {/* Line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points */}
                {svgPoints.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r={3.5} fill={strokeColor} />
                        {/* Tooltip hint on hover */}
                        <title>
                            {p.point.date
                                ? new Date(p.point.date).toLocaleDateString("es-CL")
                                : ""}{" "}
                            — ELO: {p.point.rating}
                            {p.point.delta != null ? ` (${p.point.delta > 0 ? "+" : ""}${p.point.delta})` : ""}
                            {p.point.tournament_name ? ` — ${p.point.tournament_name}` : ""}
                        </title>
                    </g>
                ))}

                {/* Start and end markers */}
                <circle cx={svgPoints[0].x} cy={svgPoints[0].y} r={5} fill={strokeColor} opacity={0.5} />
                <circle
                    cx={svgPoints[svgPoints.length - 1].x}
                    cy={svgPoints[svgPoints.length - 1].y}
                    r={5}
                    fill={strokeColor}
                />

                {/* X-axis labels */}
                {xLabels.map((lbl, i) => (
                    <text
                        key={i}
                        x={lbl.x}
                        y={height - 5}
                        textAnchor="middle"
                        fill="var(--muted)"
                        fontSize={10}
                        fontFamily="inherit"
                    >
                        {lbl.label}
                    </text>
                ))}
            </svg>
        </div>
    );
}

export default function ProfileStatsTab({
    rating,
    peakRating,
    winRate,
    totalMatches,
    tournamentsPlayed,
    tournamentsWon,
    currentStreak,
    bestStreak,
    ratingHistory,
    gamiStats,
}: ProfileStatsProps) {
    const rank = getRankForElo(rating);

    const wins = gamiStats?.wins ?? (totalMatches > 0 ? Math.round((winRate / 100) * totalMatches) : 0);
    const losses = gamiStats?.losses ?? totalMatches - wins;
    const winBarWidth = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Most played formats from gamiStats
    const formats: { name: string; count: number }[] = useMemo(() => {
        const raw = gamiStats?.formats_played || gamiStats?.most_played_formats || [];
        if (Array.isArray(raw)) {
            return raw.map((f: any) => ({
                name: typeof f === "string" ? f : f.name || f.format || "Desconocido",
                count: f.count || f.matches || 0,
            }));
        }
        return [];
    }, [gamiStats]);

    // Winrate by game
    const gameStats: { game: string; winRate: number; matches: number }[] = useMemo(() => {
        const raw = gamiStats?.game_stats || gamiStats?.winrate_by_game || [];
        if (Array.isArray(raw)) {
            return raw.map((g: any) => ({
                game: g.game || g.name || "Desconocido",
                winRate: g.win_rate ?? g.winRate ?? 0,
                matches: g.matches ?? g.total_matches ?? 0,
            }));
        }
        return [];
    }, [gamiStats]);

    const hasAnyData = rating > 0 || totalMatches > 0 || ratingHistory.length > 0;

    if (!hasAnyData) {
        return (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Card.Content className="py-14 text-center">
                    <p className="text-3xl mb-3 opacity-50">📊</p>
                    <p className="text-sm font-medium text-[var(--foreground)]">Sin estadisticas disponibles</p>
                    <p className="text-xs mt-1 text-[var(--muted)]">Las estadisticas se generan al participar en torneos y partidas.</p>
                </Card.Content>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* ELO + Rank Badge */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2"
                            style={{ borderColor: rank.cssColor }}
                        >
                            {rank.icon}
                        </div>
                        <div>
                            <p className="text-lg font-extrabold" style={{ color: rank.cssColor }}>
                                {rating} ELO
                            </p>
                            <p className="text-xs text-[var(--muted)]">
                                {rank.name} — {rank.level}
                            </p>
                        </div>
                    </div>
                    {peakRating > 0 && (
                        <div className="text-right">
                            <p className="text-sm font-bold text-[var(--foreground)]">{peakRating}</p>
                            <p className="text-[10px] text-[var(--muted)] uppercase">Peak ELO</p>
                        </div>
                    )}
                </div>

                {/* ELO History Chart */}
                <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide mb-3">
                    Evolucion ELO Historica
                </h3>
                <EloChart history={ratingHistory} />
            </div>

            {/* Win/Loss Ratio */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide mb-3">
                    Ratio Victoria / Derrota
                </h3>
                <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm font-bold text-[var(--success)]">{wins}W</span>
                    <div className="flex-1 h-4 bg-[var(--surface-tertiary)] rounded-full overflow-hidden">
                        <div className="flex h-full">
                            <div
                                className="h-full bg-[var(--success)] transition-all duration-500 rounded-l-full"
                                style={{ width: `${winBarWidth}%` }}
                            />
                            <div
                                className="h-full bg-[var(--danger)] transition-all duration-500 rounded-r-full"
                                style={{ width: `${100 - winBarWidth}%` }}
                            />
                        </div>
                    </div>
                    <span className="text-sm font-bold text-[var(--danger)]">{losses}L</span>
                </div>
                <p className="text-center text-sm font-bold text-[var(--foreground)]">{winRate}% Win Rate</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                    { label: "Partidas Totales", value: totalMatches },
                    { label: "Torneos Jugados", value: tournamentsPlayed },
                    { label: "Victorias Torneos", value: tournamentsWon },
                    { label: "Racha Actual", value: currentStreak },
                    { label: "Mejor Racha", value: bestStreak },
                    { label: "Peak ELO", value: peakRating },
                ].map((stat) => (
                    <div key={stat.label} className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center">
                        <p className="text-xl font-extrabold text-[var(--foreground)]">{stat.value}</p>
                        <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Most Played Formats */}
            {formats.length > 0 && (
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide mb-3">
                        Formatos Mas Jugados
                    </h3>
                    <div className="space-y-2">
                        {formats.map((f, i) => {
                            const maxCount = formats[0]?.count || 1;
                            const barWidth = Math.max(5, Math.round((f.count / maxCount) * 100));
                            return (
                                <div key={f.name + i} className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-[var(--foreground)] w-28 truncate">{f.name}</span>
                                    <div className="flex-1 h-3 bg-[var(--surface-tertiary)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-[var(--muted)] font-bold w-10 text-right">{f.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Winrate by Game */}
            {gameStats.length > 0 && (
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide mb-3">
                        Winrate por Juego
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {gameStats.map((g, i) => (
                            <div key={g.game + i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">{g.game}</p>
                                    <p className="text-[10px] text-[var(--muted)]">{g.matches} partidas</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-extrabold ${g.winRate >= 50 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                                        {g.winRate}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
