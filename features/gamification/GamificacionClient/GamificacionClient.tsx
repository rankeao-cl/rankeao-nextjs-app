"use client";

import { useEffect, useState } from "react";
import { Card, Chip, Spinner } from "@heroui/react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { getUserStats, getMyXp } from "@/lib/api/gamification";
import { getUserBadges } from "@/lib/api/social";
import { RankBadge } from "@/features/gamification/RankBadge";
import { BadgesGallery } from "@/features/gamification/BadgesGallery";
import type { Badge, UserStats } from "@/lib/types/gamification";
import {
  Cup,
  Medal,
  ChartColumn,
  StarFill,
  ArrowRight,
} from "@gravity-ui/icons";

interface Props {
  badges: Badge[];
}

export default function GamificacionClient({ badges }: Props) {
  const { session, status } = useAuth();
  const isAuth = status === "authenticated";

  const [stats, setStats] = useState<UserStats | null>(null);
  const [xpData, setXpData] = useState<any>(null);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth || !session?.username) {
      setLoading(false);
      return;
    }

    Promise.all([
      getUserStats(session.username).catch(() => null),
      getMyXp(session.accessToken).catch(() => null),
      getUserBadges(session.username).catch(() => null),
    ]).then(([statsRes, xpRes, badgesRes]) => {
      const s = (statsRes as any)?.data ?? (statsRes as any)?.stats ?? statsRes;
      if (s) setStats(s);

      const xp = (xpRes as any)?.data ?? xpRes;
      if (xp) setXpData(xp);

      const rawBadges = (badgesRes as any)?.data ?? (badgesRes as any)?.badges ?? [];
      if (Array.isArray(rawBadges)) {
        setEarnedBadgeIds(rawBadges.map((b: any) => b.id || b.slug || b.badge_id));
      }

      setLoading(false);
    });
  }, [isAuth, session]);

  if (!isAuth) {
    return (
      <Card className="glass">
        <Card.Content className="py-12 text-center">
          <p className="text-3xl mb-3">🔒</p>
          <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
            Inicia sesión para ver tu progreso
          </p>
          <p className="text-xs text-[var(--muted)]">
            Necesitas una cuenta para desbloquear logros y ver tus estadísticas.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-white text-sm font-semibold"
          >
            Iniciar sesión
          </Link>
        </Card.Content>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const level = stats?.level ?? xpData?.level ?? 1;
  const totalXp = stats?.total_xp ?? xpData?.total_xp ?? 0;
  const currentLevelXp = stats?.current_level_xp ?? xpData?.current_level_xp ?? 0;
  const xpToNext = stats?.xp_to_next_level ?? xpData?.xp_to_next_level ?? 100;
  const xpProgress = xpToNext > 0 ? Math.min((currentLevelXp / xpToNext) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* XP Progress Card */}
      <div className="glass p-5 rounded-2xl">
        <div className="flex items-center gap-4 mb-4">
          {/* Level circle */}
          <div className="relative w-16 h-16 rounded-full bg-[var(--accent)]/15 border-2 border-[var(--accent)] flex items-center justify-center shrink-0">
            <span className="text-xl font-extrabold text-[var(--accent)]">{level}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--foreground)]">Nivel {level}</p>
            <p className="text-xs text-[var(--muted)] mb-2">
              {totalXp.toLocaleString("es-CL")} XP total
            </p>
            {/* Progress bar */}
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

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Medal className="size-4 text-[var(--accent)]" />}
            label="Logros"
            value={stats.badges_earned ?? 0}
          />
          <StatCard
            icon={<Cup className="size-4 text-yellow-500" />}
            label="Torneos"
            value={stats.tournaments_played ?? 0}
          />
          <StatCard
            icon={<ChartColumn className="size-4 text-emerald-500" />}
            label="Partidas"
            value={stats.total_matches ?? 0}
          />
          <StatCard
            icon={<StarFill className="size-4 text-purple-500" />}
            label="Winrate"
            value={`${Math.round(stats.win_rate ?? 0)}%`}
          />
        </div>
      )}

      {/* Rank */}
      {stats && stats.peak_rating != null && (
        <div className="glass-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RankBadge elo={stats.peak_rating} size="md" />
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Tu Ranking</p>
              <p className="text-xs text-[var(--muted)]">
                Rating máximo: {stats.peak_rating}
                {stats.current_streak ? ` · Racha: ${stats.current_streak}` : ""}
              </p>
            </div>
          </div>
          <Link
            href="/ranking"
            className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            Ver ranking <ArrowRight className="size-3" />
          </Link>
        </div>
      )}

      {/* Badges Section */}
      {badges.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[var(--foreground)]">Insignias</h2>
            <Link
              href="/gamificacion/badges"
              className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight className="size-3" />
            </Link>
          </div>
          <BadgesGallery
            badges={badges.slice(0, 15)}
            earnedBadgeIds={earnedBadgeIds}
          />
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="glass-sm p-4 flex flex-col items-center gap-1.5 text-center">
      {icon}
      <p className="text-lg font-extrabold text-[var(--foreground)]">{value}</p>
      <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}
