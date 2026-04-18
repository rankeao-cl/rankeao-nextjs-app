"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StoryTrayGroup } from "@/lib/types/social";

export const STORY_DURATION_MS = 5000;

export type ViewerPosition = {
  groupIndex: number;
  storyIndex: number;
};

type UseStoryViewerOptions = {
  storyGroups: StoryTrayGroup[];
  onStoryViewed?: (storyId: string) => void;
};

export function useStoryViewer({ storyGroups, onStoryViewed }: UseStoryViewerOptions) {
  const [position, setPosition] = useState<ViewerPosition | null>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeGroup = useMemo(() => {
    if (!position) return null;
    return storyGroups[position.groupIndex] ?? null;
  }, [storyGroups, position]);

  const activeStory = useMemo(() => {
    if (!position || !activeGroup) return null;
    return activeGroup.stories[position.storyIndex] ?? null;
  }, [activeGroup, position]);

  const nextStoryInNextGroup = useMemo(() => {
    if (!position) return null;
    const currentGroup = storyGroups[position.groupIndex];
    if (currentGroup && position.storyIndex + 1 < currentGroup.stories.length) {
      return currentGroup.stories[position.storyIndex + 1] ?? null;
    }
    const nextGroup = storyGroups[position.groupIndex + 1];
    return nextGroup?.stories?.[0] ?? null;
  }, [storyGroups, position]);

  const markViewed = useCallback(
    (storyId: string | undefined) => {
      if (!storyId || !onStoryViewed) return;
      onStoryViewed(storyId);
    },
    [onStoryViewed]
  );

  const openAt = useCallback(
    (groupIndex: number, storyIndex = 0) => {
      if (groupIndex < 0 || groupIndex >= storyGroups.length) return;
      const group = storyGroups[groupIndex];
      const safeStoryIndex = Math.max(0, Math.min(group.stories.length - 1, storyIndex));
      const target = group.stories[safeStoryIndex];
      markViewed(target?.id);
      setPosition({ groupIndex, storyIndex: safeStoryIndex });
      setPaused(false);
      setProgress(0);
    },
    [storyGroups, markViewed]
  );

  const close = useCallback(() => {
    setPosition(null);
    setPaused(false);
    setProgress(0);
  }, []);

  const next = useCallback(() => {
    setPosition((current) => {
      if (!current) return current;
      const group = storyGroups[current.groupIndex];
      if (!group) return null;
      const nextStoryIndex = current.storyIndex + 1;
      if (nextStoryIndex < group.stories.length) {
        const nextStory = group.stories[nextStoryIndex];
        markViewed(nextStory?.id);
        setProgress(0);
        return { groupIndex: current.groupIndex, storyIndex: nextStoryIndex };
      }
      const nextGroupIndex = current.groupIndex + 1;
      if (nextGroupIndex >= storyGroups.length) {
        setProgress(0);
        return null;
      }
      const nextGroup = storyGroups[nextGroupIndex];
      const nextStory = nextGroup?.stories?.[0];
      markViewed(nextStory?.id);
      setProgress(0);
      return { groupIndex: nextGroupIndex, storyIndex: 0 };
    });
  }, [storyGroups, markViewed]);

  const prev = useCallback(() => {
    setPosition((current) => {
      if (!current) return current;
      if (current.storyIndex > 0) {
        const group = storyGroups[current.groupIndex];
        const prevStory = group?.stories?.[current.storyIndex - 1];
        markViewed(prevStory?.id);
        setProgress(0);
        return { groupIndex: current.groupIndex, storyIndex: current.storyIndex - 1 };
      }
      if (current.groupIndex === 0) {
        setProgress(0);
        return { ...current };
      }
      const prevGroupIndex = current.groupIndex - 1;
      const prevGroup = storyGroups[prevGroupIndex];
      if (!prevGroup) return current;
      const lastStoryIndex = Math.max(0, prevGroup.stories.length - 1);
      const prevStory = prevGroup.stories[lastStoryIndex];
      markViewed(prevStory?.id);
      setProgress(0);
      return { groupIndex: prevGroupIndex, storyIndex: lastStoryIndex };
    });
  }, [storyGroups, markViewed]);

  const goToGroup = useCallback(
    (groupIndex: number) => {
      if (groupIndex < 0 || groupIndex >= storyGroups.length) return;
      const group = storyGroups[groupIndex];
      const target = group.stories[0];
      markViewed(target?.id);
      setPosition({ groupIndex, storyIndex: 0 });
      setProgress(0);
    },
    [storyGroups, markViewed]
  );

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);
  const togglePause = useCallback(() => setPaused((p) => !p), []);

  const progressRef = useRef(0);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!position) return;
    if (paused) return;

    let frameId = 0;
    const startTime = performance.now() - (progressRef.current / 100) * STORY_DURATION_MS;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        next();
        return;
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [position, paused, next]);

  return {
    position,
    activeGroup,
    activeStory,
    nextStoryInNextGroup,
    paused,
    progress,
    openAt,
    close,
    next,
    prev,
    goToGroup,
    pause,
    resume,
    togglePause,
    isOpen: position !== null,
  };
}
