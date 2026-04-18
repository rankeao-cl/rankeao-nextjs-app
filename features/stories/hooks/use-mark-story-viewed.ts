"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markStoryViewed } from "@/lib/api/social";
import type { StoryTrayGroup } from "@/lib/types/social";
import { STORIES_TRAY_QUERY_KEY } from "@/features/stories/hooks/use-stories-tray";

type Variables = { storyId: string };

export function useMarkStoryViewed(token: string | undefined) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, Variables, { previous: StoryTrayGroup[] | undefined }>({
    mutationFn: async ({ storyId }) => {
      if (!token) return;
      return markStoryViewed(storyId, token);
    },
    onMutate: async ({ storyId }) => {
      await qc.cancelQueries({ queryKey: STORIES_TRAY_QUERY_KEY });
      const previous = qc.getQueryData<StoryTrayGroup[]>(STORIES_TRAY_QUERY_KEY);
      if (previous) {
        qc.setQueryData<StoryTrayGroup[]>(
          STORIES_TRAY_QUERY_KEY,
          previous.map((group) => ({
            ...group,
            has_unseen: group.stories.some((story) => story.id !== storyId && !story.viewed),
            stories: group.stories.map((story) =>
              story.id === storyId ? { ...story, viewed: true } : story
            ),
          }))
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(STORIES_TRAY_QUERY_KEY, ctx.previous);
      }
    },
  });
}
