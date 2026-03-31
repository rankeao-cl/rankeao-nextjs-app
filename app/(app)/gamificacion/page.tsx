import { Card, Chip } from "@heroui/react";
import { getBadges, getUserStats, getGamificationSeasons } from "@/lib/api/gamification";
import { getUserBadges } from "@/lib/api/social";
import { RankBadge } from "@/features/gamification/RankBadge";
import type { Badge, UserStats, GamificationSeason } from "@/lib/types/gamification";
import type { Metadata } from "next";
import Link from "next/link";
import GamificacionClient from "./GamificacionClient";

export const metadata: Metadata = {
  title: "Gamificación",
  description: "Tu progreso, logros e insignias en Rankeao.",
};

export default async function GamificacionPage() {
  let badges: Badge[] = [];
  let seasons: GamificationSeason[] = [];

  try {
    const [badgesData, seasonsData] = await Promise.all([
      getBadges({ per_page: 50 }).catch(() => null),
      getGamificationSeasons().catch(() => null),
    ]);
    badges = badgesData?.badges ?? [];
    const rawSeasons = (seasonsData as any)?.seasons ?? (seasonsData as any)?.data;
    seasons = Array.isArray(rawSeasons) ? rawSeasons : [];
  } catch {
    // silent
  }

  const activeSeason = seasons.find((s) => s.is_active);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <section>
        <div className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden">
          <div className="relative z-10">
            <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
              Progreso & Logros
            </Chip>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Gamificación
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-lg">
              Sube de nivel, desbloquea insignias y demuestra tu rango en la comunidad.
            </p>
          </div>
        </div>
      </section>

      {/* Season Banner */}
      {activeSeason && (
        <SeasonBanner season={activeSeason} />
      )}

      {/* Client-side stats (requires auth) */}
      <GamificacionClient badges={badges} />
    </div>
  );
}

function SeasonBanner({ season }: { season: GamificationSeason }) {
  const endsAt = new Date(season.ends_at);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 86_400_000));
  const isEndingSoon = daysRemaining <= 7;

  return (
    <Link href="/ranking">
      <div
        className={`rounded-2xl p-4 border transition-colors cursor-pointer ${
          isEndingSoon
            ? "border-[var(--warning)] bg-[var(--warning)]/8"
            : "border-[var(--accent)] bg-[var(--accent)]/8"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
              Temporada activa
            </p>
            <p className="text-base font-bold text-[var(--foreground)] truncate">
              {season.name}
            </p>
            <p className={`text-xs font-semibold mt-1 ${isEndingSoon ? "text-[var(--warning)]" : "text-[var(--accent)]"}`}>
              {isEndingSoon
                ? `⚠️ Termina en ${daysRemaining} día${daysRemaining !== 1 ? "s" : ""}!`
                : `${daysRemaining} días restantes`}
            </p>
          </div>
          <div className="text-3xl">🏆</div>
        </div>
      </div>
    </Link>
  );
}
