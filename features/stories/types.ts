import type { StoryTextLayer as ApiStoryTextLayer } from "@/lib/types/social";

export type StoryComposerMode = "photo" | "text";

export type ComposerTextBackgroundMode = "none" | "fill" | "outline";
export type ComposerTextShape = "square" | "rounded" | "pill";
export type ComposerTextAlign = "left" | "center" | "right";
export type ComposerFontFamily = "inter" | "poppins" | "manrope";

export type ComposerTextLayer = {
  id: string;
  text: string;
  textColor: string;
  textBackgroundMode: ComposerTextBackgroundMode;
  textBackgroundColor: string;
  textShape: ComposerTextShape;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  fontSize: number;
  textAlign: ComposerTextAlign;
  fontFamily: ComposerFontFamily;
  x: number;
  y: number;
  rotation: number;
};

export type StoryImageTransform = {
  zoom: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
};

export type StoryImageDimensions = {
  width: number;
  height: number;
};

type StickerLayerBase = {
  id: string;
  x: number; // percent 0-100
  y: number; // percent 0-100
  scale: number; // 0.5 - 2
  rotation: number; // degrees
};

export type CardStickerLayer = StickerLayerBase & {
  kind: "card";
  cardId: string;
  name: string;
  imageUrl: string;
};

export type EmojiStickerLayer = StickerLayerBase & {
  kind: "emoji";
  emoji: string;
};

export type StickerLayer = CardStickerLayer | EmojiStickerLayer;

export type StoryItem = {
  id: string;
  userId: string;
  username: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textLayers: ApiStoryTextLayer[];
  elapsedLabel: string;
  avatarUrl?: string;
  href: string;
  date: string;
};
