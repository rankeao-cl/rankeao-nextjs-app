"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Chip, Spinner } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getMyCosmetics,
  getMyTitles,
  getMyEquipped,
  updateEquipped,
} from "@/lib/api/gamification";
import type { Title, Cosmetic } from "@/lib/types/gamification";
import { Palette, TextAlignLeft, ArrowLeft } from "@gravity-ui/icons";

// ── Rarity helpers ──

const RARITY_COLORS: Record<string, string> = {
  legendary: "#EAB308",
  epic: "#A855F7",
  rare: "#3B82F6",
  uncommon: "#10B981",
  common: "var(--muted)",
};

function rarityColor(rarity?: string): string {
  return RARITY_COLORS[rarity?.toLowerCase() ?? "common"] ?? "var(--muted)";
}

function rarityBgClass(rarity?: string): string {
  const r = rarity?.toLowerCase();
  switch (r) {
    case "legendary":
      return "bg-yellow-500/15 text-yellow-500";
    case "epic":
      return "bg-purple-500/15 text-purple-500";
    case "rare":
      return "bg-blue-500/15 text-blue-500";
    case "uncommon":
      return "bg-emerald-500/15 text-emerald-500";
    default:
      return "bg-[var(--muted)]/15 text-[var(--muted)]";
  }
}

type Tab = "titles" | "cosmetics";

// ── Main Page ──

export default function CosmeticsPage() {
  const { session, status } = useAuth();
  const isAuth = status === "authenticated";

  const [activeTab, setActiveTab] = useState<Tab>("titles");
  const [titles, setTitles] = useState<Title[]>([]);
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [equipped, setEquipped] = useState<{
    title_id?: string;
    cosmetic_ids?: string[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // ── Fetch data ──

  useEffect(() => {
    if (!isAuth || !session?.accessToken) {
      setLoading(false);
      return;
    }

    Promise.all([
      getMyTitles(session.accessToken).catch(() => null),
      getMyCosmetics(session.accessToken).catch(() => null),
      getMyEquipped(session.accessToken).catch(() => null),
    ]).then(([titlesRes, cosmeticsRes, equippedRes]) => {
      // Parse titles
      const td = (titlesRes as any)?.data ?? titlesRes;
      const parsedTitles = Array.isArray(td?.titles)
        ? td.titles
        : Array.isArray(td)
          ? td
          : [];
      setTitles(parsedTitles);

      // Parse cosmetics
      const cd = (cosmeticsRes as any)?.data ?? cosmeticsRes;
      const parsedCosmetics = Array.isArray(cd?.cosmetics)
        ? cd.cosmetics
        : Array.isArray(cd)
          ? cd
          : [];
      setCosmetics(parsedCosmetics);

      // Parse equipped
      const eq = (equippedRes as any)?.data ?? equippedRes ?? {};
      setEquipped(eq);

      setLoading(false);
    });
  }, [isAuth, session]);

  // ── Equip handlers ──

  const handleEquipTitle = useCallback(
    async (titleId: string | undefined) => {
      if (!session?.accessToken || updating) return;
      setUpdating(true);
      try {
        await updateEquipped({ title_id: titleId }, session.accessToken);
        setEquipped((prev) => ({ ...prev, title_id: titleId }));
      } catch {
        // silent
      } finally {
        setUpdating(false);
      }
    },
    [session, updating],
  );

  const handleToggleCosmetic = useCallback(
    async (cosmeticId: string, equip: boolean) => {
      if (!session?.accessToken || updating) return;
      setUpdating(true);
      const current = equipped.cosmetic_ids ?? [];
      const newIds = equip
        ? [...current, cosmeticId]
        : current.filter((id) => id !== cosmeticId);
      try {
        await updateEquipped(
          { cosmetic_ids: newIds },
          session.accessToken,
        );
        setEquipped((prev) => ({ ...prev, cosmetic_ids: newIds }));
      } catch {
        // silent
      } finally {
        setUpdating(false);
      }
    },
    [session, updating, equipped.cosmetic_ids],
  );

  // ── Derived state ──

  const equippedTitleId = equipped.title_id;
  const equippedCosmeticIds = new Set<string>(equipped.cosmetic_ids ?? []);
  const equippedTitle = titles.find((t) => t.id === equippedTitleId);
  const equippedCosmetics = cosmetics.filter((c) =>
    equippedCosmeticIds.has(c.id),
  );

  // ── Not authenticated ──

  if (!isAuth) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="glass p-8 rounded-2xl text-center">
          <p className="text-3xl mb-3">🔒</p>
          <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
            Inicia sesion para ver tus cosmeticos y titulos
          </p>
          <p className="text-xs text-[var(--muted)]">
            Necesitas una cuenta para equipar cosmeticos y titulos.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-white text-sm font-semibold"
          >
            Iniciar sesion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <section>
        <div className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Link
                href="/gamificacion"
                className="size-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
              >
                <ArrowLeft className="size-4 text-[var(--foreground)]" />
              </Link>
              <Chip color="accent" variant="soft" size="sm" className="px-3">
                Personaliza tu perfil
              </Chip>
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Cosmeticos y Titulos
            </h1>
            <p className="text-sm text-[var(--muted)] max-w-lg">
              Equipa titulos y cosmeticos desbloqueados para personalizar tu
              perfil.
            </p>
          </div>
        </div>
      </section>

      {/* Tab Selector */}
      <div className="flex rounded-xl bg-[var(--surface)] border border-[var(--border)] p-1">
        {(
          [
            { key: "titles" as Tab, label: "Titulos" },
            { key: "cosmetics" as Tab, label: "Cosmeticos" },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                active
                  ? "bg-[var(--foreground)] text-[var(--surface)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Equipped Preview */}
          {(equippedTitle || equippedCosmetics.length > 0) && (
            <div className="glass-sm p-5 rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
                Equipado actualmente
              </p>
              {equippedTitle && (
                <p
                  className="text-xl font-bold mb-2"
                  style={{ color: equippedTitle.color || "var(--accent)" }}
                >
                  {equippedTitle.display_text}
                </p>
              )}
              {equippedCosmetics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {equippedCosmetics.map((c) => (
                    <span
                      key={c.id}
                      className="px-3 py-1 rounded-full bg-[var(--surface)] text-xs font-semibold text-[var(--foreground)]"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Titles Tab */}
          {activeTab === "titles" && (
            <>
              {titles.length === 0 ? (
                <EmptyState
                  icon={
                    <TextAlignLeft className="size-12 text-[var(--muted)]" />
                  }
                  title="Sin titulos"
                  description="Desbloquea titulos participando en torneos y completando logros."
                />
              ) : (
                <div className="glass rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
                  {titles.map((title) => {
                    const isEquipped = equippedTitleId === title.id;
                    return (
                      <div
                        key={title.id}
                        className={`flex items-center gap-4 p-4 ${
                          isEquipped ? "bg-[var(--accent)]/8" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-lg font-bold"
                            style={{
                              color: title.color || rarityColor(title.rarity),
                            }}
                          >
                            {title.display_text}
                          </p>
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {title.name}
                          </p>
                          {title.description && (
                            <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                              {title.description}
                            </p>
                          )}
                          {title.rarity && (
                            <span
                              className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${rarityBgClass(title.rarity)}`}
                            >
                              {title.rarity}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={isEquipped ? "primary" : "outline"}
                          className="shrink-0 rounded-full"
                          isPending={updating}
                          onPress={() =>
                            handleEquipTitle(
                              isEquipped ? undefined : title.id,
                            )
                          }
                        >
                          {isEquipped ? "Desequipar" : "Equipar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Cosmetics Tab */}
          {activeTab === "cosmetics" && (
            <>
              {cosmetics.length === 0 ? (
                <EmptyState
                  icon={<Palette className="size-12 text-[var(--muted)]" />}
                  title="Sin cosmeticos"
                  description="Desbloquea cosmeticos participando en torneos y completando logros."
                />
              ) : (
                <div className="glass rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
                  {cosmetics.map((cosmetic) => {
                    const isEquipped = equippedCosmeticIds.has(cosmetic.id);
                    return (
                      <div
                        key={cosmetic.id}
                        className={`flex items-center gap-4 p-4 ${
                          isEquipped ? "bg-[var(--accent)]/8" : ""
                        }`}
                      >
                        {/* Thumbnail */}
                        {cosmetic.image_url || cosmetic.preview_url ? (
                          <div className="relative size-12 rounded-lg overflow-hidden shrink-0 bg-[var(--surface)]">
                            <Image
                              src={
                                cosmetic.preview_url || cosmetic.image_url || ""
                              }
                              alt={cosmetic.name}
                              fill
                              className="object-contain"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="size-12 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
                            <Palette className="size-5 text-[var(--muted)]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {cosmetic.name}
                          </p>
                          {cosmetic.type && (
                            <p className="text-xs text-[var(--muted)] capitalize">
                              {cosmetic.type.replace(/_/g, " ").toLowerCase()}
                            </p>
                          )}
                          {cosmetic.description && (
                            <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                              {cosmetic.description}
                            </p>
                          )}
                          {cosmetic.rarity && (
                            <span
                              className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${rarityBgClass(cosmetic.rarity)}`}
                            >
                              {cosmetic.rarity}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={isEquipped ? "primary" : "outline"}
                          className="shrink-0 rounded-full"
                          isPending={updating}
                          onPress={() =>
                            handleToggleCosmetic(cosmetic.id, !isEquipped)
                          }
                        >
                          {isEquipped ? "Quitar" : "Equipar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Empty State ──

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon}
      <p className="text-lg font-semibold text-[var(--foreground)] mt-4">
        {title}
      </p>
      <p className="text-sm text-[var(--muted)] mt-1 max-w-xs">{description}</p>
    </div>
  );
}
