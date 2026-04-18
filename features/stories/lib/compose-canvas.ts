import type {
  CardStickerLayer,
  ComposerFontFamily,
  ComposerTextBackgroundMode,
  ComposerTextShape,
  StoryComposerMode,
  StoryImageTransform,
} from "@/features/stories/types";
import {
  STORY_CANVAS_HEIGHT,
  STORY_CANVAS_WIDTH,
  STORY_IMAGE_MAX_ZOOM,
  STORY_IMAGE_MIN_ZOOM,
  clampValue,
  getStoryImageCoverScale,
  getStoryImagePanLimits,
  normalizeRotationDegrees,
} from "@/features/stories/lib/story-image-transform";

export type ComposedLayerInput = {
  text: string;
  text_color: string;
  text_background_mode: ComposerTextBackgroundMode;
  text_background_color: string;
  text_shape: ComposerTextShape;
  font_weight: "normal" | "bold";
  font_style: "normal" | "italic";
  font_size: number;
  text_align: "left" | "center" | "right";
  font_family: ComposerFontFamily;
  text_x: number;
  text_y: number;
};

export type ComposeStoryImageInput = {
  mode: StoryComposerMode;
  backgroundColor: string;
  imageFile: File | null;
  imageTransform: StoryImageTransform;
  layers: ComposedLayerInput[];
  cardStickers?: CardStickerLayer[];
};

async function loadCrossOriginImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar imagen: ${url}`));
    img.src = url;
  });
}

export function getTextContainerRadius(shape: ComposerTextShape, width: number, height: number): number {
  if (shape === "pill") return Math.max(width, height);
  if (shape === "rounded") return 22;
  return 8;
}

export function drawRoundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

export function getFontFamilyStack(fontFamily: ComposerFontFamily): string {
  switch (fontFamily) {
    case "poppins":
      return "Poppins, Inter, system-ui, -apple-system, sans-serif";
    case "manrope":
      return "Manrope, Inter, system-ui, -apple-system, sans-serif";
    case "inter":
    default:
      return "Inter, system-ui, -apple-system, sans-serif";
  }
}

export async function composeStoryImage(input: ComposeStoryImageInput): Promise<File> {
  const { mode, backgroundColor, imageFile, imageTransform, layers, cardStickers = [] } = input;
  const width = STORY_CANVAS_WIDTH;
  const height = STORY_CANVAS_HEIGHT;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo crear canvas para historia");
  }

  context.fillStyle = mode === "text" ? backgroundColor : "#0F172A";
  context.fillRect(0, 0, width, height);

  if (mode === "photo" && imageFile) {
    const sourceUrl = URL.createObjectURL(imageFile);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("No se pudo preparar la imagen"));
        img.src = sourceUrl;
      });
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      const rotation = clampValue(normalizeRotationDegrees(imageTransform.rotation), -180, 180);
      const zoom = clampValue(imageTransform.zoom, STORY_IMAGE_MIN_ZOOM, STORY_IMAGE_MAX_ZOOM);
      const baseScale = getStoryImageCoverScale(image.width, image.height, width, height, rotation);
      const drawWidth = image.width * baseScale;
      const drawHeight = image.height * baseScale;
      const panLimits = getStoryImagePanLimits(
        { width: image.width, height: image.height },
        width,
        height,
        rotation,
        zoom
      );
      const offsetXPercent = clampValue(imageTransform.offsetX, -panLimits.maxOffsetXPercent, panLimits.maxOffsetXPercent);
      const offsetYPercent = clampValue(imageTransform.offsetY, -panLimits.maxOffsetYPercent, panLimits.maxOffsetYPercent);
      context.save();
      context.translate(width / 2 + (offsetXPercent / 100) * width, height / 2 + (offsetYPercent / 100) * height);
      context.rotate((rotation * Math.PI) / 180);
      context.scale(zoom, zoom);
      context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      context.restore();
    } finally {
      URL.revokeObjectURL(sourceUrl);
    }
  }

  for (const layer of layers) {
    const lines = layer.text.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const fontSize = Math.max(18, Math.min(84, Math.round(layer.font_size || 34)));
    const lineHeight = Math.round(fontSize * 1.18);
    const maxTextWidth = Math.round(width * 0.9);
    context.textAlign = layer.text_align;
    context.textBaseline = "middle";
    context.font = `${layer.font_style} ${layer.font_weight} ${fontSize}px ${getFontFamilyStack(layer.font_family)}`;
    const x = (layer.text_x / 100) * width;
    const y = (layer.text_y / 100) * height;
    const startY = y - ((lines.length - 1) * lineHeight) / 2;

    const lineWidths = lines.map((line) => Math.min(maxTextWidth, context.measureText(line).width));
    const widestLine = lineWidths.length > 0 ? Math.max(...lineWidths) : 0;
    const hasContainer = layer.text_background_mode !== "none";
    const paddingX = hasContainer ? 28 : 0;
    const paddingY = hasContainer ? 18 : 0;

    if (hasContainer) {
      const containerWidth = widestLine + paddingX * 2;
      const containerHeight = lineHeight * lines.length + paddingY * 2;
      const containerLeft =
        layer.text_align === "left"
          ? x - paddingX
          : layer.text_align === "right"
            ? x - containerWidth + paddingX
            : x - containerWidth / 2;
      const containerTop = startY - lineHeight / 2 - paddingY;
      const radius = getTextContainerRadius(layer.text_shape, containerWidth, containerHeight);
      context.save();
      context.shadowColor = "transparent";
      context.shadowBlur = 0;
      context.shadowOffsetY = 0;
      drawRoundedRectPath(context, containerLeft, containerTop, containerWidth, containerHeight, radius);
      if (layer.text_background_mode === "fill") {
        context.fillStyle = layer.text_background_color;
        context.fill();
      } else {
        context.lineWidth = 5;
        context.strokeStyle = layer.text_background_color;
        context.stroke();
      }
      context.restore();
    }

    context.fillStyle = layer.text_color;
    context.shadowColor = hasContainer ? "rgba(0,0,0,.28)" : "rgba(0,0,0,.58)";
    context.shadowBlur = hasContainer ? 6 : 14;
    context.shadowOffsetY = 3;
    lines.forEach((line, index) => {
      context.fillText(line, x, startY + index * lineHeight, maxTextWidth);
    });
  }

  // Draw card stickers on top.
  const STICKER_BASE_WIDTH = Math.round(width * 0.32);
  for (const sticker of cardStickers) {
    try {
      const img = await loadCrossOriginImage(sticker.imageUrl);
      const aspectRatio = img.naturalHeight / Math.max(1, img.naturalWidth);
      const w = STICKER_BASE_WIDTH * Math.max(0.4, Math.min(2.5, sticker.scale));
      const h = w * aspectRatio;
      const cx = (sticker.x / 100) * width;
      const cy = (sticker.y / 100) * height;
      context.save();
      context.shadowColor = "rgba(0,0,0,.45)";
      context.shadowBlur = 18;
      context.shadowOffsetY = 6;
      context.drawImage(img, cx - w / 2, cy - h / 2, w, h);
      context.restore();
    } catch (error) {
      console.warn("No se pudo dibujar sticker de carta", error);
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("No se pudo renderizar la historia"))),
      "image/jpeg",
      0.92
    );
  });
  return new File([blob], `story-${Date.now()}.jpg`, { type: "image/jpeg" });
}
