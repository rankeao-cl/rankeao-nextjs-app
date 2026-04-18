"use client";

import { useCallback, useMemo, useReducer, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type {
  CardStickerLayer,
  ComposerTextLayer,
  StoryComposerMode,
  StoryImageDimensions,
  StoryImageTransform,
} from "@/features/stories/types";
import { createComposerTextLayer } from "@/features/stories/lib/text-layer-factory";
import {
  composerHistoryReducer,
  createInitialHistoryState,
} from "@/features/stories/StoryComposer/composer-history";

const STORY_TEXT_SNAP_TARGET = 50;
const STORY_TEXT_SNAP_DISTANCE = 3;

export function useStoryComposer() {
  const [history, dispatch] = useReducer(composerHistoryReducer, undefined, createInitialHistoryState);
  const state = history.present;

  const previewRef = useRef<HTMLDivElement | null>(null);
  const mediaDragRef = useRef<
    | {
        pointerId: number;
        startX: number;
        startY: number;
        originOffsetX: number;
        originOffsetY: number;
      }
    | null
  >(null);

  const selectedTextLayer = useMemo<ComposerTextLayer | null>(() => {
    if (state.textLayers.length === 0) return null;
    if (!state.selectedTextLayerId) return state.textLayers[0];
    return (
      state.textLayers.find((layer) => layer.id === state.selectedTextLayerId) ?? state.textLayers[0]
    );
  }, [state.textLayers, state.selectedTextLayerId]);

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
    mediaDragRef.current = null;
    dispatch({ type: "CLEAR_IMAGE" });
  }, []);

  const setImageTransform = useCallback((transform: StoryImageTransform) => {
    dispatch({ type: "SET_IMAGE_TRANSFORM", transform });
  }, []);

  const updateImageTransform = useCallback(
    (updater: (prev: StoryImageTransform) => StoryImageTransform) => {
      dispatch({ type: "SET_IMAGE_TRANSFORM", transform: updater(state.imageTransform) });
    },
    [state.imageTransform]
  );

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

  const setPublishing = useCallback((publishing: boolean) => {
    dispatch({ type: "SET_PUBLISHING", publishing });
  }, []);

  const reset = useCallback(() => {
    mediaDragRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  const onMediaPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, guards: { cameraOpen: boolean }) => {
      if (state.mode !== "photo" || guards.cameraOpen || !state.imageFile || !state.previewUrl) return;
      if (state.draggingTextLayerId) return;
      event.preventDefault();
      dispatch({ type: "SET_DRAGGING_MEDIA", dragging: true });
      mediaDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originOffsetX: state.imageTransform.offsetX,
        originOffsetY: state.imageTransform.offsetY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [state.mode, state.imageFile, state.previewUrl, state.draggingTextLayerId, state.imageTransform.offsetX, state.imageTransform.offsetY]
  );

  const onMediaPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const dragging = mediaDragRef.current;
      if (!dragging || dragging.pointerId !== event.pointerId) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const deltaXPercent = ((event.clientX - dragging.startX) / rect.width) * 100;
      const deltaYPercent = ((event.clientY - dragging.startY) / rect.height) * 100;
      dispatch({
        type: "SET_IMAGE_TRANSFORM",
        transform: {
          zoom: state.imageTransform.zoom,
          rotation: state.imageTransform.rotation,
          offsetX: dragging.originOffsetX + deltaXPercent,
          offsetY: dragging.originOffsetY + deltaYPercent,
        },
      });
    },
    [state.imageTransform.zoom, state.imageTransform.rotation]
  );

  const onMediaPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    mediaDragRef.current = null;
    dispatch({ type: "SET_DRAGGING_MEDIA", dragging: false });
  }, []);

  const updateTextPositionFromPointer = useCallback((layerId: string, clientX: number, clientY: number) => {
    const preview = previewRef.current;
    if (!preview) return;
    const rect = preview.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const xRaw = ((clientX - rect.left) / rect.width) * 100;
    const yRaw = ((clientY - rect.top) / rect.height) * 100;
    const xClamped = Math.max(0, Math.min(100, xRaw));
    const yClamped = Math.max(0, Math.min(100, yRaw));
    const snapVertical = Math.abs(xClamped - STORY_TEXT_SNAP_TARGET) <= STORY_TEXT_SNAP_DISTANCE;
    const snapHorizontal = Math.abs(yClamped - STORY_TEXT_SNAP_TARGET) <= STORY_TEXT_SNAP_DISTANCE;
    const x = snapVertical ? STORY_TEXT_SNAP_TARGET : xClamped;
    const y = snapHorizontal ? STORY_TEXT_SNAP_TARGET : yClamped;

    dispatch({ type: "SET_TEXT_SNAP_GUIDES", guides: { vertical: snapVertical, horizontal: snapHorizontal } });
    dispatch({
      type: "SET_TEXT_LAYERS",
      layers: state.textLayers.map((layer) =>
        layer.id === layerId
          ? { ...layer, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
          : layer
      ),
    });
  }, [state.textLayers]);

  const onTextPointerDown = useCallback(
    (layerId: string, event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dispatch({ type: "SELECT_TEXT_LAYER", id: layerId });
      dispatch({ type: "SET_DRAGGING_TEXT_LAYER", id: layerId });
      event.currentTarget.setPointerCapture(event.pointerId);
      updateTextPositionFromPointer(layerId, event.clientX, event.clientY);
    },
    [updateTextPositionFromPointer]
  );

  const onTextPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!state.draggingTextLayerId) return;
      updateTextPositionFromPointer(state.draggingTextLayerId, event.clientX, event.clientY);
    },
    [state.draggingTextLayerId, updateTextPositionFromPointer]
  );

  const onTextPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dispatch({ type: "SET_DRAGGING_TEXT_LAYER", id: null });
    dispatch({ type: "SET_TEXT_SNAP_GUIDES", guides: { vertical: false, horizontal: false } });
  }, []);

  const addCardSticker = useCallback((sticker: Omit<CardStickerLayer, "id" | "x" | "y" | "scale">) => {
    const full: CardStickerLayer = {
      id: `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: 50,
      y: 50,
      scale: 1,
      ...sticker,
    };
    dispatch({ type: "ADD_CARD_STICKER", sticker: full });
  }, []);

  const updateCardSticker = useCallback((id: string, patch: Partial<Omit<CardStickerLayer, "id">>) => {
    dispatch({ type: "UPDATE_CARD_STICKER", id, patch });
  }, []);

  const removeCardSticker = useCallback((id: string) => {
    dispatch({ type: "REMOVE_CARD_STICKER", id });
  }, []);

  const setDraggingSticker = useCallback((id: string | null) => {
    dispatch({ type: "SET_DRAGGING_STICKER", id });
  }, []);

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
    previewRef,
    setMode,
    setImage,
    setImageDimensions,
    clearImage,
    setImageTransform,
    updateImageTransform,
    resetImageTransform,
    setBackgroundColor,
    addTextLayer,
    replaceTextLayer,
    updateSelectedTextLayer,
    removeSelectedTextLayer,
    selectTextLayer,
    setPublishing,
    reset,
    addCardSticker,
    updateCardSticker,
    removeCardSticker,
    setDraggingSticker,
    undo,
    redo,
    canUndo,
    canRedo,
    onMediaPointerDown,
    onMediaPointerMove,
    onMediaPointerUp,
    onTextPointerDown,
    onTextPointerMove,
    onTextPointerUp,
  };
}
