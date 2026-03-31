import { getBadges, getBadgeCategories } from "@/lib/api/gamification";
import type { Badge, BadgeCategory } from "@/lib/types/gamification";
import type { Metadata } from "next";
import { Card, Chip } from "@heroui/react";
import BadgesPageClient from "./BadgesPageClient";

export const metadata: Metadata = {
  title: "Insignias",
  description: "Galería completa de insignias y logros en Rankeao.",
};

export default async function BadgesPage() {
  let badges: Badge[] = [];
  let categories: BadgeCategory[] = [];

  try {
    const [badgesData, catData] = await Promise.all([
      getBadges({ per_page: 100 }).catch(() => null),
      getBadgeCategories().catch(() => null),
    ]);
    badges = badgesData?.badges ?? [];
    const rawCats = (catData as any)?.categories ?? (catData as any)?.data;
    categories = Array.isArray(rawCats) ? rawCats : [];
  } catch {
    // silent
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <section>
        <div className="glass p-5 sm:p-6 rounded-2xl">
          <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
            Colección
          </Chip>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Insignias
          </h1>
          <p className="text-sm text-[var(--muted)] max-w-lg">
            Desbloquea insignias participando en torneos, siendo activo en la comunidad y coleccionando cartas.
          </p>
        </div>
      </section>

      <BadgesPageClient badges={badges} categories={categories} />
    </div>
  );
}
