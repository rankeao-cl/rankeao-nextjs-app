import type {
  CardStickerLayer,
  ComposerTextLayer,
  StoryComposerMode,
  StoryImageDimensions,
  StoryImageTransform,
} from "@/features/stories/types";
import {
  STORY_CANVAS_HEIGHT,
  STORY_CANVAS_WIDTH,
  STORY_IMAGE_MAX_ZOOM,
  STORY_IMAGE_MIN_ZOOM,
  clampValue,
  getStoryImagePanLimits,
  normalizeRotationDegrees,
} from "@/features/stories/lib/story-image-transform";
import { createComposerTextLayer } from "@/features/stories/lib/text-layer-factory";

export const DEFAULT_STORY_IMAGE_TRANSFORM: StoryImageTransform = {
  zoom: STORY_IMAGE_MIN_ZOOM,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
};

export const DEFAULT_BACKGROUND_COLOR = "#1D4ED8";

export function normalizeImageTransform(
  transform: StoryImageTransform,
  dimensions: StoryImageDimensions | null
): StoryImageTransform {
  const zoom = clampValue(transform.zoom, STORY_IMAGE_MIN_ZOOM, STORY_IMAGE_MAX_ZOOM);
  const rotation = clampValue(normalizeRotationDegrees(transform.rotation), -180, 180);
  if (!dimensions) {
    return { zoom, rotation, offsetX: 0, offsetY: 0 };
  }
  const panLimits = getStoryImagePanLimits(dimensions, STORY_CANVAS_WIDTH, STORY_CANVAS_HEIGHT, rotation, zoom);
  return {
    zoom,
    rotation,
    offsetX: clampValue(transform.offsetX, -panLimits.maxOffsetXPercent, panLimits.maxOffsetXPercent),
    offsetY: clampValue(transform.offsetY, -panLimits.maxOffsetYPercent, panLimits.maxOffsetYPercent),
  };
}

export type ComposerState = {
  mode: StoryComposerMode;
  imageFile: File | null;
  imageDimensions: StoryImageDimensions | null;
  imageTransform: StoryImageTransform;
  previewUrl: string | null;
  backgroundColor: string;
  textLayers: ComposerTextLayer[];
  cardStickers: CardStickerLayer[];
  selectedTextLayerId: string | null;
  draggingTextLayerId: string | null;
  draggingStickerId: string | null;
  draggingMedia: boolean;
  publishing: boolean;
  textSnapGuides: { vertical: boolean; horizontal: boolean };
};

export function createInitialComposerState(): ComposerState {
  const initialLayer = createComposerTextLayer();
  return {
    mode: "photo",
    imageFile: null,
    imageDimensions: null,
    imageTransform: DEFAULT_STORY_IMAGE_TRANSFORM,
    previewUrl: null,
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    textLayers: [initialLayer],
    cardStickers: [],
    selectedTextLayerId: initialLayer.id,
    draggingTextLayerId: null,
    draggingStickerId: null,
    draggingMedia: false,
    publishing: false,
    textSnapGuides: { vertical: false, horizontal: false },
  };
}

export type ComposerAction =
  | { type: "SET_MODE"; mode: StoryComposerMode }
  | { type: "SET_IMAGE"; file: File; previewUrl: string; dimensions: StoryImageDimensions | null }
  | { type: "SET_IMAGE_DIMENSIONS"; dimensions: StoryImageDimensions | null }
  | { type: "CLEAR_IMAGE" }
  | { type: "SET_IMAGE_TRANSFORM"; transform: StoryImageTransform }
  | { type: "RESET_IMAGE_TRANSFORM" }
  | { type: "SET_BACKGROUND_COLOR"; color: string }
  | { type: "ADD_TEXT_LAYER"; layer: ComposerTextLayer }
  | { type: "REPLACE_TEXT_LAYER"; id: string; layer: ComposerTextLayer }
  | { type: "SET_TEXT_LAYERS"; layers: ComposerTextLayer[] }
  | { type: "REMOVE_TEXT_LAYER"; id: string; fallbackId: string | null }
  | { type: "SELECT_TEXT_LAYER"; id: string | null }
  | { type: "SET_DRAGGING_TEXT_LAYER"; id: string | null }
  | { type: "SET_DRAGGING_STICKER"; id: string | null }
  | { type: "ADD_CARD_STICKER"; sticker: CardStickerLayer }
  | { type: "UPDATE_CARD_STICKER"; id: string; patch: Partial<Omit<CardStickerLayer, "id">> }
  | { type: "REMOVE_CARD_STICKER"; id: string }
  | { type: "SET_DRAGGING_MEDIA"; dragging: boolean }
  | { type: "SET_PUBLISHING"; publishing: boolean }
  | { type: "SET_TEXT_SNAP_GUIDES"; guides: { vertical: boolean; horizontal: boolean } }
  | { type: "RESET" };

export function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_IMAGE":
      return {
        ...state,
        mode: "photo",
        imageFile: action.file,
        imageDimensions: action.dimensions,
        previewUrl: action.previewUrl,
        imageTransform: DEFAULT_STORY_IMAGE_TRANSFORM,
      };
    case "SET_IMAGE_DIMENSIONS":
      return {
        ...state,
        imageDimensions: action.dimensions,
        imageTransform: normalizeImageTransform(state.imageTransform, action.dimensions),
      };
    case "CLEAR_IMAGE":
      return {
        ...state,
        imageFile: null,
        imageDimensions: null,
        previewUrl: null,
        imageTransform: DEFAULT_STORY_IMAGE_TRANSFORM,
        draggingMedia: false,
      };
    case "SET_IMAGE_TRANSFORM":
      return {
        ...state,
        imageTransform: normalizeImageTransform(action.transform, state.imageDimensions),
      };
    case "RESET_IMAGE_TRANSFORM":
      return {
        ...state,
        imageTransform: normalizeImageTransform(DEFAULT_STORY_IMAGE_TRANSFORM, state.imageDimensions),
      };
    case "SET_BACKGROUND_COLOR":
      return { ...state, backgroundColor: action.color };
    case "ADD_TEXT_LAYER":
      return {
        ...state,
        textLayers: [...state.textLayers, action.layer],
        selectedTextLayerId: action.layer.id,
      };
    case "REPLACE_TEXT_LAYER":
      return {
        ...state,
        textLayers: state.textLayers.map((layer) => (layer.id === action.id ? action.layer : layer)),
      };
    case "SET_TEXT_LAYERS":
      return { ...state, textLayers: action.layers };
    case "REMOVE_TEXT_LAYER": {
      const nextLayers = state.textLayers.filter((layer) => layer.id !== action.id);
      if (nextLayers.length === 0) return state;
      return {
        ...state,
        textLayers: nextLayers,
        selectedTextLayerId:
          state.selectedTextLayerId === action.id ? action.fallbackId : state.selectedTextLayerId,
      };
    }
    case "SELECT_TEXT_LAYER":
      return { ...state, selectedTextLayerId: action.id };
    case "SET_DRAGGING_TEXT_LAYER":
      return { ...state, draggingTextLayerId: action.id };
    case "SET_DRAGGING_STICKER":
      return { ...state, draggingStickerId: action.id };
    case "ADD_CARD_STICKER":
      return { ...state, cardStickers: [...state.cardStickers, action.sticker] };
    case "UPDATE_CARD_STICKER":
      return {
        ...state,
        cardStickers: state.cardStickers.map((sticker) =>
          sticker.id === action.id ? { ...sticker, ...action.patch } : sticker
        ),
      };
    case "REMOVE_CARD_STICKER":
      return { ...state, cardStickers: state.cardStickers.filter((sticker) => sticker.id !== action.id) };
    case "SET_DRAGGING_MEDIA":
      return { ...state, draggingMedia: action.dragging };
    case "SET_PUBLISHING":
      return { ...state, publishing: action.publishing };
    case "SET_TEXT_SNAP_GUIDES":
      return { ...state, textSnapGuides: action.guides };
    case "RESET":
      return createInitialComposerState();
    default:
      return state;
  }
}
