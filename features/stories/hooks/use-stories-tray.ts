"use client";

import { useQuery } from "@tanstack/react-query";
import { listStories } from "@/lib/api/social";
import type { StoryTrayGroup } from "@/lib/types/social";

export const STORIES_TRAY_QUERY_KEY = ["social", "stories", "tray"] as const;

function normalizeStoryGroups(raw: Awaited<ReturnType<typeof listStories>>): StoryTrayGroup[] {
  const data = (raw?.data as Record<string, unknown> | undefined) ?? undefined;
  const groups =
    (data?.stories as StoryTrayGroup[] | undefined) ??
    (raw?.stories as StoryTrayGroup[] | undefined) ??
    [];
  return groups.filter(
    (group) =>
      group?.user?.id &&
      group?.user?.username &&
      Array.isArray(group?.stories) &&
      group.stories.length > 0
  );
}

export function useStoriesTray(token: string | undefined, enabled = true) {
  return useQuery({
    queryKey: STORIES_TRAY_QUERY_KEY,
    queryFn: async () => {
      const res = await listStories(token);
      return normalizeStoryGroups(res);
    },
    enabled: enabled && !!token,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
