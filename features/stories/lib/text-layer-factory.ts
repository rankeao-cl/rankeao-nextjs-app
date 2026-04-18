import type { ComposerTextLayer } from "@/features/stories/types";

export const COMPOSER_TEXT_DEFAULT_FONT_SIZE = 40;
export const COMPOSER_TEXT_MIN_FONT_SIZE = 18;
// Effectively no upper bound — the preview canvas is only 1920 tall, so the
// visual cap is self-enforcing. High number keeps the slider usable while
// letting pinch/Transformer scale to whatever the user wants.
export const COMPOSER_TEXT_MAX_FONT_SIZE = 500;

export function createComposerTextLayer(partial?: Partial<ComposerTextLayer>): ComposerTextLayer {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: partial?.text ?? "",
    textColor: partial?.textColor ?? "#FFFFFF",
    textBackgroundMode: partial?.textBackgroundMode ?? "none",
    textBackgroundColor: partial?.textBackgroundColor ?? "#111827",
    textShape: partial?.textShape ?? "rounded",
    fontWeight: partial?.fontWeight ?? "normal",
    fontStyle: partial?.fontStyle ?? "normal",
    fontSize: partial?.fontSize ?? COMPOSER_TEXT_DEFAULT_FONT_SIZE,
    textAlign: partial?.textAlign ?? "center",
    fontFamily: partial?.fontFamily ?? "inter",
    x: partial?.x ?? 50,
    y: partial?.y ?? 75,
    rotation: partial?.rotation ?? 0,
  };
}

export async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const objectURL = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.src = objectURL;
    });
    return { width: image.width, height: image.height };
  } finally {
    URL.revokeObjectURL(objectURL);
  }
}
