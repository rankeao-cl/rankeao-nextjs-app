"use client";

import { useState, useMemo } from "react";
import { Card, Chip, Button } from "@heroui/react";
import { ArrowChevronLeft, ArrowChevronRight, Clock, MapPin, Persons } from "@gravity-ui/icons";
import Link from "next/link";
import type { Tournament } from "@/lib/types/tournament";

interface TorneosCalendarProps {
    tournaments: Tournament[];
}

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function isSameDay(d1: Date, d2: Date): boolean {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/** Monday-based day of week (0 = Mon, 6 = Sun) */
function getStartDayOfMonth(year: number, month: number): number {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

const statusConfig: Record<string, { color: "success" | "warning" | "danger" | "default"; label: string }> = {
    ROUND_IN_PROGRESS: { color: "success", label: "EN VIVO" },
    STARTED: { color: "success", label: "En curso" },
    OPEN: { color: "warning", label: "Inscripciones abiertas" },
    CHECK_IN: { color: "warning", label: "Check-in" },
    FINISHED: { color: "default", label: "Finalizado" },
    CLOSED: { color: "default", label: "Cerrado" },
};

export default function TorneosCalendar({ tournaments }: TorneosCalendarProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<Date>(today);

    // Map of date string -> tournaments
    const tournamentsByDate = useMemo(() => {
        const map = new Map<string, Tournament[]>();
        for (const t of tournaments) {
            if (!t.starts_at) continue;
            const d = new Date(t.starts_at);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(t);
        }
        return map;
    }, [tournaments]);

    function getTournamentsForDate(date: Date): Tournament[] {
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        return tournamentsByDate.get(key) || [];
    }

    function hasTournaments(date: Date): boolean {
        return getTournamentsForDate(date).length > 0;
    }

    function goToPrevMonth() {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    }

    function goToNextMonth() {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    }

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const startDay = getStartDayOfMonth(currentYear, currentMonth);
    const selectedDayTournaments = getTournamentsForDate(selectedDate);

    // Build calendar grid cells
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Pad to complete the last week row
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="space-y-4">
            {/* Calendar card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={goToPrevMonth}
                        className="p-2 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors text-[var(--foreground)]"
                        aria-label="Mes anterior"
                    >
                        <ArrowChevronLeft className="size-4" />
                    </button>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">
                        {MONTHS_ES[currentMonth]} {currentYear}
                    </h3>
                    <button
                        onClick={goToNextMonth}
                        className="p-2 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors text-[var(--foreground)]"
                        aria-label="Mes siguiente"
                    >
                        <ArrowChevronRight className="size-4" />
                    </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAYS_ES.map((day) => (
                        <div
                            key={day}
                            className="text-center text-[10px] font-semibold uppercase tracking-wider py-1 text-[var(--muted)]"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, idx) => {
                        if (day === null) {
                            return <div key={`empty-${idx}`} className="aspect-square" />;
                        }

                        const date = new Date(currentYear, currentMonth, day);
                        const isToday = isSameDay(date, today);
                        const isSelected = isSameDay(date, selectedDate);
                        const hasEvents = hasTournaments(date);
                        const dayTournaments = getTournamentsForDate(date);

                        // Get unique game colors for dots
                        const uniqueGames = [...new Set(dayTournaments.map((t) => t.game))];

                        return (
                            <button
                                key={`day-${day}`}
                                onClick={() => setSelectedDate(date)}
                                className={`
                                    aspect-square rounded-lg flex flex-col items-center justify-center relative
                                    text-sm transition-all duration-150
                                    ${isSelected
                                        ? "bg-[var(--accent)] text-white font-bold"
                                        : isToday
                                        ? "bg-[var(--accent)]/10 text-[var(--accent)] font-bold border border-[var(--accent)]/30"
                                        : "text-[var(--foreground)] hover:bg-[var(--surface-secondary)]"
                                    }
                                `}
                            >
                                <span className="text-xs">{day}</span>
                                {/* Tournament dots */}
                                {hasEvents && (
                                    <div className="flex gap-0.5 mt-0.5">
                                        {uniqueGames.slice(0, 3).map((_, gIdx) => (
                                            <span
                                                key={gIdx}
                                                className="w-1 h-1 rounded-full"
                                                style={{
                                                    background: isSelected
                                                        ? "white"
                                                        : "var(--accent)",
                                                }}
                                            />
                                        ))}
                                        {uniqueGames.length > 3 && (
                                            <span
                                                className="w-1 h-1 rounded-full"
                                                style={{
                                                    background: isSelected
                                                        ? "var(--muted)"
                                                        : "var(--muted)",
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected day tournaments */}
            <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">
                    {isSameDay(selectedDate, today)
                        ? "Hoy"
                        : selectedDate.toLocaleDateString("es-CL", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                          })}
                    {selectedDayTournaments.length > 0 && (
                        <span className="text-[var(--muted)] font-normal ml-2">
                            ({selectedDayTournaments.length} torneo{selectedDayTournaments.length !== 1 ? "s" : ""})
                        </span>
                    )}
                </h3>

                {selectedDayTournaments.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {selectedDayTournaments.map((t) => {
                            const st = statusConfig[t.status] || { color: "default" as const, label: t.status };
                            const time = t.starts_at
                                ? new Date(t.starts_at).toLocaleTimeString("es-CL", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  })
                                : null;

                            return (
                                <Link key={t.id} href={`/torneos/${t.id}`}>
                                    <div
                                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] transition-colors space-y-2 cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[var(--foreground)] truncate">
                                                    {t.name}
                                                </p>
                                                {t.tenant_name && (
                                                    <p className="text-xs text-[var(--muted)]">
                                                        {t.tenant_name}
                                                    </p>
                                                )}
                                            </div>
                                            <Chip color={st.color} variant="soft" size="sm">
                                                {st.label}
                                            </Chip>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            <Chip variant="secondary" size="sm">{t.game}</Chip>
                                            {t.format && <Chip variant="secondary" size="sm">{t.format}</Chip>}
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                                            {time && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="size-3" /> {time}
                                                </span>
                                            )}
                                            {t.city && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="size-3" /> {t.city}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 ml-auto">
                                                <Persons className="size-3" /> {t.registered_count || 0}
                                                {t.max_players ? `/${t.max_players}` : ""}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] py-8 text-center">
                        <p className="text-xs text-[var(--muted)]">
                            No hay torneos programados para este día.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
