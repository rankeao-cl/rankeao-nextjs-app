"use client";

import { useState, useMemo } from "react";
import { Card, Chip } from "@heroui/react";
import { Cup } from "@gravity-ui/icons";
import Image from "next/image";
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
}: {
    earnedBadges: any[];
    allBadges: Badge[];
    badgesCount: number;
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

    // Extract categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        mergedBadges.forEach((b) => {
            if (b.category) cats.add(b.category);
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

    return (
        <div className="space-y-4">
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
                <div className="flex flex-wrap gap-2">
                    <Chip
                        size="sm"
                        className={`cursor-pointer transition-colors ${categoryFilter === "all" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)]"}`}
                        onClick={() => setCategoryFilter("all")}
                    >
                        Todos
                    </Chip>
                    {categories.map((cat) => (
                        <Chip
                            key={cat}
                            size="sm"
                            className={`cursor-pointer transition-colors ${categoryFilter === cat ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)]"}`}
                            onClick={() => setCategoryFilter(cat === categoryFilter ? "all" : cat)}
                        >
                            {cat}
                        </Chip>
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
