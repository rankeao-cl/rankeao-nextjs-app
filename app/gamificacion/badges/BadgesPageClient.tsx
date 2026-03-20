"use client";

import { useEffect, useState } from "react";
import { Card, Spinner } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { getUserBadges } from "@/lib/api/social";
import { getBadgeDetail } from "@/lib/api/gamification";
import type { Badge, BadgeCategory } from "@/lib/types/gamification";

interface Props {
  badges: Badge[];
  categories: BadgeCategory[];
}

const RARITY_STYLES: Record<string, string> = {
  legendary: "bg-yellow-500/15 text-yellow-500",
  epic: "bg-purple-500/15 text-purple-500",
  rare: "bg-blue-500/15 text-blue-500",
  uncommon: "bg-emerald-500/15 text-emerald-500",
  common: "bg-[var(--surface-tertiary)] text-[var(--muted)]",
};

export default function BadgesPageClient({ badges, categories }: Props) {
  const { session, status } = useAuth();
  const isAuth = status === "authenticated";

  const [earnedSlugs, setEarnedSlugs] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [badgeDetail, setBadgeDetail] = useState<any>(null);

  useEffect(() => {
    if (!isAuth || !session?.username) return;
    getUserBadges(session.username)
      .then((res) => {
        const raw = (res as any)?.data ?? (res as any)?.badges ?? [];
        if (Array.isArray(raw)) {
          setEarnedSlugs(new Set(raw.map((b: any) => b.slug || b.id || b.badge_id)));
        }
      })
      .catch(() => {});
  }, [isAuth, session]);

  const filtered =
    activeCategory === "all"
      ? badges
      : badges.filter((b) => (b.category || "social") === activeCategory);

  // Sort: earned first
  const sorted = [...filtered].sort((a, b) => {
    const aEarned = earnedSlugs.has(a.slug) || earnedSlugs.has(a.id || "");
    const bEarned = earnedSlugs.has(b.slug) || earnedSlugs.has(b.id || "");
    if (aEarned && !bEarned) return -1;
    if (!aEarned && bEarned) return 1;
    return 0;
  });

  const earnedCount = badges.filter(
    (b) => earnedSlugs.has(b.slug) || earnedSlugs.has(b.id || "")
  ).length;

  const openDetail = async (badge: Badge) => {
    setSelectedBadge(badge);
    setDetailLoading(true);
    setBadgeDetail(null);
    try {
      const res = await getBadgeDetail(badge.slug);
      const detail = (res as any)?.data ?? (res as any)?.badge ?? res;
      setBadgeDetail(detail);
    } catch {
      // silent
    }
    setDetailLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {earnedCount} / {badges.length} desbloqueadas
        </p>
        <div className="h-2 flex-1 max-w-[200px] ml-4 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{
              width: badges.length > 0 ? `${(earnedCount / badges.length) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <FilterPill
          label="Todas"
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        />
        {categories.map((cat) => (
          <FilterPill
            key={cat.slug}
            label={cat.name}
            active={activeCategory === cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
          />
        ))}
      </div>

      {/* Badges grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {sorted.map((badge) => {
          const isEarned =
            earnedSlugs.has(badge.slug) || earnedSlugs.has(badge.id || "");
          return (
            <button
              key={badge.id || badge.slug}
              onClick={() => openDetail(badge)}
              className={`glass-sm flex flex-col items-center gap-1.5 p-3 text-center cursor-pointer transition-all hover:scale-[1.02] ${
                isEarned ? "opacity-100" : "opacity-40 grayscale"
              }`}
            >
              <div className="relative w-12 h-12 flex items-center justify-center">
                {isEarned && badge.icon_url ? (
                  <img
                    src={badge.icon_url}
                    alt={badge.name}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-tertiary)] border border-[var(--border)] flex items-center justify-center text-xl text-[var(--muted)]">
                    {isEarned ? "🏅" : "?"}
                  </div>
                )}
                {isEarned && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-[9px]">✓</span>
                  </div>
                )}
              </div>

              <span className="text-[11px] font-semibold text-[var(--foreground)] leading-tight line-clamp-2">
                {isEarned ? badge.name : "???"}
              </span>

              {badge.rarity && (
                <span
                  className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                    RARITY_STYLES[badge.rarity] || RARITY_STYLES.common
                  }`}
                >
                  {badge.rarity}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <p className="text-center text-sm text-[var(--muted)] py-12">
          No hay insignias en esta categoría.
        </p>
      )}

      {/* Badge detail modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="glass w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-3 text-center">
                  {selectedBadge.icon_url ? (
                    <img
                      src={selectedBadge.icon_url}
                      alt={selectedBadge.name}
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-3xl">
                      🏅
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    {selectedBadge.name}
                  </h3>
                  {selectedBadge.rarity && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        RARITY_STYLES[selectedBadge.rarity] || RARITY_STYLES.common
                      }`}
                    >
                      {selectedBadge.rarity}
                    </span>
                  )}
                </div>

                {(badgeDetail?.description || selectedBadge.description) && (
                  <p className="text-sm text-[var(--muted)] text-center">
                    {badgeDetail?.description || selectedBadge.description}
                  </p>
                )}

                {(badgeDetail?.criteria || selectedBadge.criteria) && (
                  <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
                    <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">
                      Criterio
                    </p>
                    <p className="text-sm text-[var(--foreground)]">
                      {badgeDetail?.criteria || selectedBadge.criteria}
                    </p>
                  </div>
                )}

                {badgeDetail?.earner_count != null && (
                  <p className="text-xs text-[var(--muted)] text-center">
                    {badgeDetail.earner_count.toLocaleString("es-CL")} jugadores la han obtenido
                  </p>
                )}

                <button
                  onClick={() => setSelectedBadge(null)}
                  className="w-full py-2.5 rounded-full bg-[var(--surface-secondary)] text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--default)] transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
        active
          ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
          : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </button>
  );
}
