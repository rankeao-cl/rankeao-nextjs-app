import type { StoryImageDimensions } from "@/features/stories/types";

export const STORY_CANVAS_WIDTH = 1080;
export const STORY_CANVAS_HEIGHT = 1920;
export const STORY_IMAGE_MIN_ZOOM = 1;
export const STORY_IMAGE_MAX_ZOOM = 3;
export const STORY_IMAGE_ROTATION_MIN = -180;
export const STORY_IMAGE_ROTATION_MAX = 180;

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeRotationDegrees(value: number): number {
  let normalized = value;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

export function getStoryImageCoverScale(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  rotationDegrees: number
): number {
  const safeSourceWidth = Math.max(1, sourceWidth);
  const safeSourceHeight = Math.max(1, sourceHeight);
  const radians = (rotationDegrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const widthFactor = Math.max(1e-6, safeSourceWidth * cos + safeSourceHeight * sin);
  const heightFactor = Math.max(1e-6, safeSourceWidth * sin + safeSourceHeight * cos);
  return Math.max(targetWidth / widthFactor, targetHeight / heightFactor);
}

export function getStoryImagePanLimits(
  source: StoryImageDimensions,
  targetWidth: number,
  targetHeight: number,
  rotationDegrees: number,
  zoom: number
): { maxOffsetXPercent: number; maxOffsetYPercent: number } {
  const safeZoom = clampValue(zoom, STORY_IMAGE_MIN_ZOOM, STORY_IMAGE_MAX_ZOOM);
  const baseScale = getStoryImageCoverScale(source.width, source.height, targetWidth, targetHeight, rotationDegrees);
  const drawWidth = source.width * baseScale * safeZoom;
  const drawHeight = source.height * baseScale * safeZoom;
  const radians = (rotationDegrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const bboxWidth = drawWidth * cos + drawHeight * sin;
  const bboxHeight = drawWidth * sin + drawHeight * cos;
  const maxOffsetX = Math.max(0, (bboxWidth - targetWidth) / 2);
  const maxOffsetY = Math.max(0, (bboxHeight - targetHeight) / 2);
  return {
    maxOffsetXPercent: (maxOffsetX / targetWidth) * 100,
    maxOffsetYPercent: (maxOffsetY / targetHeight) * 100,
  };
}
