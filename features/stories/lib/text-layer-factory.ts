import type { ComposerTextLayer } from "@/features/stories/types";

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
    fontSize: partial?.fontSize ?? 34,
    textAlign: partial?.textAlign ?? "center",
    fontFamily: partial?.fontFamily ?? "inter",
    x: partial?.x ?? 50,
    y: partial?.y ?? 75,
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
