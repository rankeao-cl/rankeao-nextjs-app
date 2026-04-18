"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStory } from "@/lib/api/social";
import { STORIES_TRAY_QUERY_KEY } from "@/features/stories/hooks/use-stories-tray";

type CreateStoryTextLayer = {
  text: string;
  text_color?: string;
  font_weight?: "normal" | "bold";
  font_style?: "normal" | "italic";
  text_x?: number;
  text_y?: number;
};

type CreateStoryInput = {
  image_url?: string;
  caption?: string;
  background_color?: string;
  text_color?: string;
  font_weight?: "normal" | "bold";
  font_style?: "normal" | "italic";
  text_x?: number;
  text_y?: number;
  text_layers?: CreateStoryTextLayer[];
};

export function useCreateStory(token: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStoryInput) => createStory(payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STORIES_TRAY_QUERY_KEY });
    },
  });
}
