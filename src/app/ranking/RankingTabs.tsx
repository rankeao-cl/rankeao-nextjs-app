"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, Card, Chip, Select, ListBox } from "@heroui/react";
import LeaderboardTable from "@/components/LeaderboardTable";
import { RankedAvatar } from "@/components/RankedAvatar";
import { RankBadge } from "@/components/RankBadge";
import type { LeaderboardEntry, CatalogFormat, CatalogGame } from "@/lib/api";

const medals = ["", "🥇", "🥈", "🥉"];

function TopThreeCards({ entries, type }: { entries: LeaderboardEntry[]; type: "xp" | "rating" }) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  const order = top3.length >= 3 ? [1, 0, 2] : top3.map((_, i) => i);
  const sizes = ["h-32", "h-40", "h-28"];

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-6 mb-8">
      {order.map((idx, pos) => {
        const entry = top3[idx];
        if (!entry) return null;
        const rank = entry.rank || idx + 1;
        return (
          <div
            key={entry.user_id || idx}
            className={`flex flex-col items-center ${sizes[pos]} justify-end relative`}
          >
            <span className="text-2xl mb-2 drop-shadow-md">{medals[rank] || rank}</span>
            <div className="mb-2">
              <RankedAvatar
                src={entry.avatar_url ?? undefined}
                fallback={entry.username?.charAt(0)?.toUpperCase()}
                elo={type === "rating" ? entry.rating : undefined}
                size="lg"
              />
            </div>
            <span className="font-bold text-sm truncate max-w-[80px] sm:max-w-[120px]" style={{ color: "var(--foreground)" }}>
              {entry.username}
            </span>
            {type === "rating" ? (
              <div className="mt-1">
                <RankBadge elo={entry.rating} size="sm" showIcon={false} />
              </div>
            ) : (
              <Chip size="sm" color="accent" variant="soft" className="mt-1 font-bold">
                {(entry.total_xp ?? 0).toLocaleString()} XP
              </Chip>
            )}
            {type === "rating" && (
              <span className="text-xs font-bold mt-1" style={{ color: "var(--accent)" }}>
                {entry.rating} ELO
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  xpEntries: LeaderboardEntry[];
  ratingEntries: LeaderboardEntry[];
  games: CatalogGame[];
  formats: CatalogFormat[];
  selectedGameSlug?: string;
  selectedFormatSlug?: string;
  selectedTab: "xp" | "ratings";
}

export default function RankingTabs({
  xpEntries,
  ratingEntries,
  games,
  formats,
  selectedGameSlug,
  selectedFormatSlug,
  selectedTab,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string, resetFormat = false) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (resetFormat) {
        params.delete("format");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <Tabs
      variant="secondary"
      selectedKey={selectedTab}
      onSelectionChange={(key) => updateFilter("tab", String(key))}
      className="w-full"
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label="Ranking tabs">
          <Tabs.Tab id="xp">
            🏅 XP Global
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="ratings">
            ⚔️ Ratings ELO
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>

      <Tabs.Panel id="xp">
        <div className="mt-6">
          <TopThreeCards entries={xpEntries} type="xp" />

          {xpEntries.length > 0 ? (
            <LeaderboardTable entries={xpEntries} type="xp" />
          ) : (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <Card.Content className="py-14 text-center">
                <p className="text-3xl mb-3">📊</p>
                <p style={{ color: "var(--muted)" }}>No hay datos de leaderboard disponibles.</p>
              </Card.Content>
            </Card>
          )}
        </div>
      </Tabs.Panel>

      <Tabs.Panel id="ratings">
        <div className="mt-6 space-y-6">
          {games.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              <Select
                selectedKey={selectedGameSlug ?? null}
                onSelectionChange={(key) => updateFilter("game", String(key ?? ""), true)}
                placeholder="Seleccionar juego"
                className="w-full"
              >
                <Select.Trigger
                  className="min-h-10 text-sm rounded-xl"
                  style={{ background: "var(--field-background)", border: "1px solid var(--border)" }}
                />
                <Select.Popover>
                  <ListBox>
                    {games.map((g) => (
                      <ListBox.Item key={g.slug} id={g.slug} textValue={g.name}>
                        {g.name}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                selectedKey={selectedFormatSlug ?? null}
                onSelectionChange={(key) => updateFilter("format", String(key ?? ""))}
                isDisabled={formats.length === 0}
                placeholder="Seleccionar formato"
                className="w-full"
              >
                <Select.Trigger
                  className="min-h-10 text-sm rounded-xl"
                  style={{ background: "var(--field-background)", border: "1px solid var(--border)" }}
                />
                <Select.Popover>
                  <ListBox>
                    {formats.map((f) => (
                      <ListBox.Item key={f.slug} id={f.slug} textValue={f.name}>
                        {f.name}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          )}

          <TopThreeCards entries={ratingEntries} type="rating" />

          {ratingEntries.length > 0 ? (
            <LeaderboardTable entries={ratingEntries} type="rating" />
          ) : (
            <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <Card.Content className="py-14 text-center">
                <p className="text-3xl mb-3">⚔️</p>
                <p style={{ color: "var(--muted)" }}>
                  Selecciona un juego y formato para ver el leaderboard de ratings.
                </p>
              </Card.Content>
            </Card>
          )}
        </div>
      </Tabs.Panel>
    </Tabs>
  );
}
