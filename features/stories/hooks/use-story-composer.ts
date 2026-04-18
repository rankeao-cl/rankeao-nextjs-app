"use client";

import { useCallback, useMemo, useReducer } from "react";
import type {
  CardStickerLayer,
  EmojiStickerLayer,
  ComposerTextLayer,
  StickerLayer,
  StoryComposerMode,
  StoryImageDimensions,
  StoryImageTransform,
} from "@/features/stories/types";
import { createComposerTextLayer } from "@/features/stories/lib/text-layer-factory";
import {
  composerHistoryReducer,
  createInitialHistoryState,
} from "@/features/stories/StoryComposer/composer-history";

export function useStoryComposer() {
  const [history, dispatch] = useReducer(composerHistoryReducer, undefined, createInitialHistoryState);
  const state = history.present;

  const selectedTextLayer = useMemo<ComposerTextLayer | null>(() => {
    if (state.textLayers.length === 0) return null;
    if (!state.selectedTextLayerId) return state.textLayers[0];
    return (
      state.textLayers.find((layer) => layer.id === state.selectedTextLayerId) ?? state.textLayers[0]
    );
  }, [state.textLayers, state.selectedTextLayerId]);

  const selectedSticker = useMemo<StickerLayer | null>(() => {
    if (!state.selectedStickerId) return null;
    return state.stickers.find((s) => s.id === state.selectedStickerId) ?? null;
  }, [state.stickers, state.selectedStickerId]);

  const setMode = useCallback((mode: StoryComposerMode) => {
    dispatch({ type: "SET_MODE", mode });
  }, []);

  const setImage = useCallback((file: File, previewUrl: string, dimensions: StoryImageDimensions | null) => {
    dispatch({ type: "SET_IMAGE", file, previewUrl, dimensions });
  }, []);

  const setImageDimensions = useCallback((dimensions: StoryImageDimensions | null) => {
    dispatch({ type: "SET_IMAGE_DIMENSIONS", dimensions });
  }, []);

  const clearImage = useCallback(() => {
    dispatch({ type: "CLEAR_IMAGE" });
  }, []);

  const setImageTransform = useCallback((transform: StoryImageTransform) => {
    dispatch({ type: "SET_IMAGE_TRANSFORM", transform });
  }, []);

  const resetImageTransform = useCallback(() => {
    dispatch({ type: "RESET_IMAGE_TRANSFORM" });
  }, []);

  const setBackgroundColor = useCallback((color: string) => {
    dispatch({ type: "SET_BACKGROUND_COLOR", color });
  }, []);

  const addTextLayer = useCallback((partial?: Partial<ComposerTextLayer>) => {
    const layer = createComposerTextLayer({ x: 50, y: 50, ...partial });
    dispatch({ type: "ADD_TEXT_LAYER", layer });
  }, []);

  const replaceTextLayer = useCallback((id: string, layer: ComposerTextLayer) => {
    dispatch({ type: "REPLACE_TEXT_LAYER", id, layer });
  }, []);

  const patchTextLayer = useCallback(
    (id: string, patch: Partial<ComposerTextLayer>) => {
      const current = state.textLayers.find((l) => l.id === id);
      if (!current) return;
      dispatch({ type: "REPLACE_TEXT_LAYER", id, layer: { ...current, ...patch } });
    },
    [state.textLayers]
  );

  const updateSelectedTextLayer = useCallback(
    (updater: (layer: ComposerTextLayer) => ComposerTextLayer) => {
      const current = selectedTextLayer;
      if (!current) return;
      dispatch({ type: "REPLACE_TEXT_LAYER", id: current.id, layer: updater(current) });
    },
    [selectedTextLayer]
  );

  const removeSelectedTextLayer = useCallback(() => {
    const current = selectedTextLayer;
    if (!current || state.textLayers.length <= 1) return;
    const fallback = state.textLayers.find((layer) => layer.id !== current.id);
    dispatch({
      type: "REMOVE_TEXT_LAYER",
      id: current.id,
      fallbackId: fallback?.id ?? null,
    });
  }, [selectedTextLayer, state.textLayers]);

  const selectTextLayer = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_TEXT_LAYER", id });
  }, []);

  const selectStickerLayer = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_STICKER", id });
  }, []);

  const setPublishing = useCallback((publishing: boolean) => {
    dispatch({ type: "SET_PUBLISHING", publishing });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const commitHistory = useCallback(() => {
    dispatch({ type: "COMMIT" });
  }, []);

  const addCardSticker = useCallback((sticker: Omit<CardStickerLayer, "id" | "kind" | "x" | "y" | "scale" | "rotation">) => {
    const full: CardStickerLayer = {
      id: `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: "card",
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      ...sticker,
    };
    dispatch({ type: "ADD_STICKER", sticker: full });
  }, []);

  const addEmojiSticker = useCallback((emoji: string) => {
    const full: EmojiStickerLayer = {
      id: `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: "emoji",
      emoji,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
    };
    dispatch({ type: "ADD_STICKER", sticker: full });
  }, []);

  const updateSticker = useCallback((id: string, patch: Partial<Omit<StickerLayer, "id" | "kind">>) => {
    dispatch({ type: "UPDATE_STICKER", id, patch });
  }, []);

  const removeSticker = useCallback((id: string) => {
    dispatch({ type: "REMOVE_STICKER", id });
  }, []);

  const removeSelectedSticker = useCallback(() => {
    if (!state.selectedStickerId) return;
    dispatch({ type: "REMOVE_STICKER", id: state.selectedStickerId });
  }, [state.selectedStickerId]);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state,
    selectedTextLayer,
    selectedSticker,
    setMode,
    setImage,
    setImageDimensions,
    clearImage,
    setImageTransform,
    resetImageTransform,
    setBackgroundColor,
    addTextLayer,
    replaceTextLayer,
    patchTextLayer,
    updateSelectedTextLayer,
    removeSelectedTextLayer,
    selectTextLayer,
    selectStickerLayer,
    setPublishing,
    reset,
    commitHistory,
    addCardSticker,
    addEmojiSticker,
    updateSticker,
    removeSticker,
    removeSelectedSticker,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
