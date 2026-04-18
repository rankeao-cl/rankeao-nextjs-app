import type { StoryDraft } from "@/lib/stores/story-draft-store";

type TournamentResultInput = {
  tournamentName: string;
  placement: number; // 1, 2, 3...
  gameName?: string;
};

const PLACEMENT_LABELS: Record<number, string> = {
  1: "1er lugar",
  2: "2do lugar",
  3: "3er lugar",
};

export function buildTournamentResultDraft({
  tournamentName,
  placement,
  gameName,
}: TournamentResultInput): StoryDraft {
  const medal = placement === 1 ? "🏆" : placement === 2 ? "🥈" : placement === 3 ? "🥉" : "🎯";
  const label = PLACEMENT_LABELS[placement] ?? `${placement}° lugar`;
  const parts = [`${medal} ${label}`, tournamentName];
  if (gameName) parts.push(`· ${gameName}`);
  return {
    caption: parts.join("\n"),
    backgroundColor: placement === 1 ? "#1D4ED8" : placement === 2 ? "#4C4A9E" : "#6A3E7A",
  };
}

type DeckPromoInput = {
  deckName: string;
  gameName?: string;
  winStreak?: number;
};

export function buildDeckPromoDraft({ deckName, gameName, winStreak }: DeckPromoInput): StoryDraft {
  const lines: string[] = [];
  if (winStreak && winStreak > 1) lines.push(`🔥 ${winStreak} victorias seguidas`);
  lines.push(deckName);
  if (gameName) lines.push(`· ${gameName}`);
  return {
    caption: lines.join("\n"),
    backgroundColor: "#2B6C6A",
  };
}
