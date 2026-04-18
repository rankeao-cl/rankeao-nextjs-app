import type { Area } from "react-easy-crop";

// Maximum dimension for the exported image. Social feed posts don't need
// anything larger and uploads stay snappy on flaky mobile connections.
const MAX_OUTPUT_DIMENSION = 1440;

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    // blob: URLs are same-origin, but set crossOrigin for safety on any http(s) src.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = src;
  });
}

/**
 * Crop + downscale the source image into a JPEG Blob ready to upload.
 * `crop` is in source-pixel coordinates (what react-easy-crop passes to
 * `onCropComplete`'s `croppedAreaPixels`).
 */
export async function cropImageToBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const sourceWidth = Math.max(1, Math.round(crop.width));
  const sourceHeight = Math.max(1, Math.round(crop.height));

  const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const outputWidth = Math.max(1, Math.round(sourceWidth * scale));
  const outputHeight = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo crear canvas");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    Math.round(crop.x),
    Math.round(crop.y),
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas no devolvió blob"));
      },
      "image/jpeg",
      0.9
    );
  });
}
