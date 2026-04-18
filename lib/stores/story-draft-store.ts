"use client";

import { create } from "zustand";

export type StoryDraftStickerSource = {
  cardId: string;
  name: string;
  imageUrl: string;
  x?: number;
  y?: number;
  scale?: number;
};

export type StoryDraft = {
  caption?: string;
  backgroundColor?: string;
  cardStickers?: StoryDraftStickerSource[];
};

type StoryDraftState = {
  draft: StoryDraft | null;
  openWithDraft: (draft: StoryDraft) => void;
  consumeDraft: () => StoryDraft | null;
  clearDraft: () => void;
};

export const useStoryDraftStore = create<StoryDraftState>((set, get) => ({
  draft: null,
  openWithDraft: (draft) => set({ draft }),
  consumeDraft: () => {
    const current = get().draft;
    if (current) set({ draft: null });
    return current;
  },
  clearDraft: () => set({ draft: null }),
}));
