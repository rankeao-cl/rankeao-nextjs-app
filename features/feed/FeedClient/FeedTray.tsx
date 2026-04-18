"use client";

import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import type { Deck, StoryTrayGroup } from "@/lib/types/social";
import { useHorizontalScroll } from "@/lib/hooks/use-horizontal-scroll";
import { AddStoryButton, StoryTrayItem } from "@/features/stories/StoriesTray";
import FeedDeckTrayItem from "./FeedDeckTrayItem";

const ITEM_WIDTH = 88;
const ITEM_GAP = 16;
const VISIBLE_COUNT = 6;
const PAGE_SIZE = VISIBLE_COUNT;
const SCROLL_AMOUNT = PAGE_SIZE * (ITEM_WIDTH + ITEM_GAP);
const MAX_WIDTH = VISIBLE_COUNT * ITEM_WIDTH + (VISIBLE_COUNT - 1) * ITEM_GAP;

type FeedTrayProps = {
  storyGroups: StoryTrayGroup[];
  decks: Deck[];
  isAuth: boolean;
  username?: string;
  avatarUrl: string | null;
  onOpenCreate: () => void;
  onOpenGroup: (groupIndex: number) => void;
  onOpenDeck: (deckId: string) => void;
};

export default function FeedTray({
  storyGroups,
  decks,
  isAuth,
  username,
  avatarUrl,
  onOpenCreate,
  onOpenGroup,
  onOpenDeck,
}: FeedTrayProps) {
  const ownGroupIndex = username
    ? storyGroups.findIndex((group) => group.user.username === username)
    : -1;
  const ownGroup = ownGroupIndex >= 0 ? storyGroups[ownGroupIndex] : null;
  const otherGroups = storyGroups
    .map((group, idx) => ({ group, idx }))
    .filter(({ idx }) => idx !== ownGroupIndex);
  const ownHasUnseen = ownGroup
    ? typeof ownGroup.has_unseen === "boolean"
      ? ownGroup.has_unseen
      : ownGroup.stories.some((story) => !story.viewed)
    : false;

  const totalItems = (isAuth ? 1 : 0) + otherGroups.length + decks.length;
  const { ref, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll({
    scrollAmount: SCROLL_AMOUNT,
    resetKey: `${isAuth}-${storyGroups.length}-${decks.length}`,
  });

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          aria-label="Anterior"
          className="absolute z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border shadow-sm"
          style={{
            left: -6,
            top: "50%",
            transform: "translateY(-70%)",
            backgroundColor: "var(--surface-solid)",
            borderColor: "var(--border)",
          }}
        >
          <ChevronLeft style={{ width: 14, height: 14, color: "var(--foreground)" }} />
        </button>
      )}

      {canScrollRight && totalItems > VISIBLE_COUNT && (
        <button
          onClick={() => scroll("right")}
          aria-label="Siguiente"
          className="absolute z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border shadow-sm"
          style={{
            right: -6,
            top: "50%",
            transform: "translateY(-70%)",
            backgroundColor: "var(--surface-solid)",
            borderColor: "var(--border)",
          }}
        >
          <ChevronRight style={{ width: 14, height: 14, color: "var(--foreground)" }} />
        </button>
      )}

      <div
        ref={ref}
        className="feed-stories-scroll no-scrollbar flex overflow-x-auto py-1"
        style={{
          gap: ITEM_GAP,
          overscrollBehavior: "contain",
          scrollbarWidth: "none",
          maxWidth: MAX_WIDTH,
          scrollSnapType: "x proximity",
        }}
      >
        {isAuth && (
          <AddStoryButton
            avatarUrl={avatarUrl}
            username={username}
            itemWidth={ITEM_WIDTH}
            hasOwnStories={Boolean(ownGroup)}
            hasUnseen={ownHasUnseen}
            onOpenCompose={onOpenCreate}
            onViewOwnStories={ownGroupIndex >= 0 ? () => onOpenGroup(ownGroupIndex) : undefined}
          />
        )}

        {otherGroups.map(({ group, idx }, visibleIdx) => {
          const hasUnseen =
            typeof group.has_unseen === "boolean"
              ? group.has_unseen
              : group.stories.some((story) => !story.viewed);
          const snapOffset = (isAuth ? 1 : 0) + visibleIdx;
          const snapAlign = snapOffset % PAGE_SIZE === 0 ? "start" : undefined;

          return (
            <StoryTrayItem
              key={`story-${group.user.id}`}
              group={group}
              hasUnseen={hasUnseen}
              canOpen={group.stories.length > 0}
              itemWidth={ITEM_WIDTH}
              scrollSnapAlign={snapAlign}
              onClick={() => onOpenGroup(idx)}
            />
          );
        })}

        {decks.map((deck, idx) => {
          const snapOffset = (isAuth ? 1 : 0) + otherGroups.length + idx;
          const snapAlign = snapOffset % PAGE_SIZE === 0 ? "start" : undefined;
          return (
            <FeedDeckTrayItem
              key={`d-${deck.id}`}
              deck={deck}
              itemWidth={ITEM_WIDTH}
              scrollSnapAlign={snapAlign}
              onClick={() => onOpenDeck(deck.id)}
            />
          );
        })}

        {!isAuth &&
          storyGroups.length === 0 &&
          decks.length === 0 &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5"
              style={{ flexShrink: 0, width: ITEM_WIDTH }}
            >
              <div
                className="animate-pulse rounded-full border-2"
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: "var(--surface-solid)",
                  borderColor: "var(--border)",
                }}
              />
              <div
                className="animate-pulse rounded"
                style={{ width: 40, height: 8, backgroundColor: "var(--surface-solid)" }}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
