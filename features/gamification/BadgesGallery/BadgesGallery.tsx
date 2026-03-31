"use client";

import { useState } from "react";
import type { Badge } from "@/lib/types/gamification";

interface Props {
    badges: Badge[];
    earnedBadgeIds: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
    social: "Social",
    competitive: "Competitivo",
    collector: "Coleccionista",
    marketplace: "Marketplace",
};

const CATEGORY_ORDER = ["competitive", "social", "collector", "marketplace"];

export function BadgesGallery({ badges, earnedBadgeIds }: Props) {
    const [activeCategory, setActiveCategory] = useState<string | "all">("all");

    const earnedSet = new Set(earnedBadgeIds);

    // Group badges by category
    const categorized = badges.reduce<Record<string, Badge[]>>((acc, badge) => {
        const cat = badge.category || "social";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(badge);
        return acc;
    }, {});

    const categories = CATEGORY_ORDER.filter((c) => categorized[c]?.length);

    const filteredBadges = activeCategory === "all"
        ? badges
        : badges.filter((b) => (b.category || "social") === activeCategory);

    const earnedCount = badges.filter((b) => earnedSet.has(b.id || b.slug)).length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                    Insignias
                </h3>
                <span className="text-xs text-[var(--muted)]">
                    {earnedCount}/{badges.length} obtenidas
                </span>
            </div>

            {/* Category filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button
                    onClick={() => setActiveCategory("all")}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        activeCategory === "all"
                            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                            : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                >
                    Todas
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            activeCategory === cat
                                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                                : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                    >
                        {CATEGORY_LABELS[cat] || cat}
                    </button>
                ))}
            </div>

            {/* Badges grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredBadges.map((badge) => {
                    const isEarned = earnedSet.has(badge.id || badge.slug);
                    return (
                        <div
                            key={badge.id || badge.slug}
                            className={`glass-sm flex flex-col items-center gap-1.5 p-3 text-center transition-all ${
                                isEarned
                                    ? "opacity-100"
                                    : "opacity-40 grayscale"
                            }`}
                            title={isEarned ? badge.description : "Insignia bloqueada"}
                        >
                            {/* Badge icon */}
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                {isEarned && badge.icon_url ? (
                                    <img
                                        src={badge.icon_url}
                                        alt={badge.name}
                                        className="w-10 h-10 object-contain"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-[var(--surface-tertiary)] border border-[var(--border)] flex items-center justify-center text-lg text-[var(--muted)]">
                                        {isEarned ? (badge.icon_url ? "" : "🏅") : "?"}
                                    </div>
                                )}
                            </div>

                            {/* Badge name */}
                            <span className="text-[10px] font-semibold text-[var(--foreground)] leading-tight line-clamp-2">
                                {isEarned ? badge.name : "???"}
                            </span>

                            {/* Rarity indicator */}
                            {isEarned && badge.rarity && (
                                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                                    badge.rarity === "legendary" ? "bg-yellow-500/15 text-yellow-500" :
                                    badge.rarity === "epic" ? "bg-purple-500/15 text-purple-500" :
                                    badge.rarity === "rare" ? "bg-blue-500/15 text-blue-500" :
                                    "bg-[var(--surface-tertiary)] text-[var(--muted)]"
                                }`}>
                                    {badge.rarity}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredBadges.length === 0 && (
                <p className="text-center text-xs text-[var(--muted)] py-6">
                    No hay insignias en esta categoría.
                </p>
            )}
        </div>
    );
}
