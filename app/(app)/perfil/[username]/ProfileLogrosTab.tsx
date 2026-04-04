"use client";

import { useState, useMemo } from "react";
import { Card, Chip } from "@heroui/react";
import { Cup, Medal, ChartColumn, StarFill } from "@gravity-ui/icons";
import Image from "next/image";
import Link from "next/link";
import type { Badge } from "@/lib/types/gamification";

const rarityColors: Record<string, string> = {
    common: "text-[var(--muted)]",
    uncommon: "text-[var(--success)]",
    rare: "text-[#00BFFF]",
    epic: "text-[#8A2BE2]",
    legendary: "text-[#FFD700]",
};

export default function ProfileLogrosTab({
    earnedBadges,
    allBadges,
    badgesCount,
    gamiStats,
    isOwnProfile,
}: {
    earnedBadges: any[];
    allBadges: Badge[];
    badgesCount: number;
    gamiStats?: any;
    isOwnProfile?: boolean;
}) {
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Build a set of earned badge IDs/slugs for quick lookup
    const earnedSlugs = useMemo(() => {
        const set = new Set<string>();
        earnedBadges.forEach((b) => {
            if (b.slug) set.add(b.slug);
            if (b.id) set.add(b.id);
        });
        return set;
    }, [earnedBadges]);

    // Merge: show earned badges first, then unearned from allBadges
    const mergedBadges = useMemo(() => {
        const earned = earnedBadges.map((b) => ({ ...b, earned: true }));

        // Add unearned badges from allBadges that aren't in earned
        const unearned = allBadges
            .filter((b) => !earnedSlugs.has(b.slug) && !earnedSlugs.has(b.id || ""))
            .map((b) => ({ ...b, earned: false }));

        return [...earned, ...unearned];
    }, [earnedBadges, allBadges, earnedSlugs]);

    const categoryLabels: Record<string, string> = {
        social: "Social",
        trading: "Trading",
        tournament: "Torneos",
        tournaments: "Torneos",
        collection: "Colección",
        competitive: "Competitivo",
        community: "Comunidad",
        achievement: "Logros",
        achievements: "Logros",
        general: "General",
        gameplay: "Juego",
        profile: "Perfil",
        marketplace: "Mercado",
        deck: "Mazos",
        decks: "Mazos",
        duels: "Duelos",
        duel: "Duelos",
        milestones: "Hitos",
        milestone: "Hitos",
        special: "Especial",
        rare: "Raro",
        secret: "Secreto",
        seasonal: "Temporal",
        event: "Evento",
        events: "Eventos",
    };
    const translateCat = (cat: string) => categoryLabels[cat.toLowerCase()] || cat;

    // Extract categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        mergedBadges.forEach((b) => {
            const cat = typeof b.category === "string" ? b.category : b.category?.name || b.category?.id;
            if (cat) cats.add(String(cat));
        });
        return Array.from(cats);
    }, [mergedBadges]);

    const filtered = useMemo(() => {
        if (categoryFilter === "all") return mergedBadges;
        return mergedBadges.filter((b) => b.category === categoryFilter);
    }, [mergedBadges, categoryFilter]);

    if (earnedBadges.length === 0 && allBadges.length === 0) {
        return (
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="text-center text-[var(--muted)] py-8 flex flex-col items-center gap-3">
                    <Cup className="w-8 h-8 opacity-40 mx-auto text-[var(--muted)]" />
                    <p className="text-sm font-semibold text-[var(--foreground)]">Aun no ha desbloqueado medallas u honores.</p>
                    <p className="text-[10px] text-[var(--muted)] max-w-sm">
                        Los logros se obtienen al alcanzar hitos como &quot;Primer Top 8&quot;, &quot;Racha de 5 victorias&quot; o participando en eventos.
                    </p>
                </div>
            </div>
        );
    }

    const level = gamiStats?.level ?? 1;
    const totalXp = gamiStats?.xp ?? gamiStats?.total_xp ?? 0;
    const currentLevelXp = gamiStats?.xp_this_level ?? gamiStats?.current_level_xp ?? 0;
    const xpToNext = gamiStats?.xp_next_level ?? gamiStats?.xp_to_next_level ?? 100;
    const xpProgress = xpToNext > 0 ? Math.min((currentLevelXp / xpToNext) * 100, 100) : 0;

    return (
        <div className="space-y-4">
            {/* Gamification Stats */}
            {gamiStats && (
                <>
                    {/* XP Progress Card */}
                    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-[var(--accent)]/15 border-2 border-[var(--accent)] flex items-center justify-center shrink-0">
                                <span className="text-lg font-extrabold text-[var(--accent)]">{level}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[var(--foreground)]">Nivel {level}</p>
                                <p className="text-xs text-[var(--muted)] mb-2">
                                    {totalXp.toLocaleString("es-CL")} XP total
                                </p>
                                <div className="h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-[var(--accent)] xp-bar-fill"
                                        style={{ width: `${xpProgress}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-[var(--muted)] mt-1">
                                    {currentLevelXp.toLocaleString("es-CL")} / {xpToNext.toLocaleString("es-CL")} XP
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col items-center gap-1.5 text-center">
                            <Medal className="size-4 text-[var(--accent)]" />
                            <p className="text-lg font-extrabold text-[var(--foreground)]">{earnedBadges.length}</p>
                            <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">Logros</p>
                        </div>
                        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col items-center gap-1.5 text-center">
                            <Cup className="size-4 text-yellow-500" />
                            <p className="text-lg font-extrabold text-[var(--foreground)]">{gamiStats.tournaments_played ?? 0}</p>
                            <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">Torneos</p>
                        </div>
                        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col items-center gap-1.5 text-center">
                            <ChartColumn className="size-4 text-emerald-500" />
                            <p className="text-lg font-extrabold text-[var(--foreground)]">{gamiStats.total_matches ?? 0}</p>
                            <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">Partidas</p>
                        </div>
                        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col items-center gap-1.5 text-center">
                            <StarFill className="size-4 text-purple-500" />
                            <p className="text-lg font-extrabold text-[var(--foreground)]">{Math.round(gamiStats.win_rate ?? 0)}%</p>
                            <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">Winrate</p>
                        </div>
                    </div>

                </>
            )}

            {/* Summary */}
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center min-w-[80px]">
                    <p className="text-xl font-extrabold text-[var(--accent)]">{earnedBadges.length || badgesCount}</p>
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Obtenidos</p>
                </div>
                {allBadges.length > 0 && (
                    <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center min-w-[80px]">
                        <p className="text-xl font-extrabold text-[var(--foreground)]">{allBadges.length}</p>
                        <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Total</p>
                    </div>
                )}
            </div>

            {/* Category Filters */}
            {categories.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button
                        onClick={() => setCategoryFilter("all")}
                        style={{
                            paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8,
                            borderRadius: 99,
                            backgroundColor: categoryFilter === "all" ? "var(--foreground)" : "var(--surface-solid)",
                            color: categoryFilter === "all" ? "var(--background)" : "var(--muted)",
                            fontSize: 13, fontWeight: 600,
                            border: categoryFilter === "all" ? "1px solid transparent" : "1px solid var(--border)",
                            cursor: "pointer", whiteSpace: "nowrap",
                        }}
                    >
                        Todos
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat === categoryFilter ? "all" : cat)}
                            style={{
                                paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8,
                                borderRadius: 99,
                                backgroundColor: categoryFilter === cat ? "var(--foreground)" : "var(--surface-solid)",
                                color: categoryFilter === cat ? "var(--background)" : "var(--muted)",
                                fontSize: 13, fontWeight: 600,
                                border: categoryFilter === cat ? "1px solid transparent" : "1px solid var(--border)",
                                cursor: "pointer", whiteSpace: "nowrap",
                            }}
                        >
                            {translateCat(cat)}
                        </button>
                    ))}
                </div>
            )}

            {/* Badge Gallery */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {filtered.map((badge, i) => {
                        const isEarned = badge.earned;
                        const rarityClass = badge.rarity ? (rarityColors[badge.rarity.toLowerCase()] || "text-[var(--muted)]") : "";

                        return (
                            <div
                                key={badge.id || badge.slug || i}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition cursor-default ${
                                    isEarned
                                        ? "bg-[var(--surface-secondary)]/50 border-[var(--border)] hover:bg-[var(--surface-secondary)]"
                                        : "bg-[var(--surface-secondary)]/20 border-[var(--border)]/50 opacity-40 grayscale"
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border ${
                                    isEarned ? "border-[var(--accent)]/50 bg-[var(--surface-tertiary)]" : "border-[var(--border)] bg-[var(--surface-tertiary)]"
                                }`}>
                                    {badge.icon_url ? (
                                        <Image src={badge.icon_url} alt={badge.name} width={48} height={48} className="w-full h-full object-cover" />
                                    ) : (
                                        <Cup className={isEarned ? "text-[var(--accent)]" : ""} />
                                    )}
                                </div>

                                <p className="text-[10px] text-[var(--foreground)] text-center font-bold tracking-tight line-clamp-2">
                                    {badge.name || "Logro"}
                                </p>

                                {badge.rarity && (
                                    <p className={`text-[9px] uppercase font-semibold ${rarityClass}`}>
                                        {badge.rarity}
                                    </p>
                                )}

                                {!isEarned && (
                                    <p className="text-[8px] text-[var(--muted)] uppercase">Bloqueado</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
