"use client";

import { type ChangeEvent, type RefObject, useState } from "react";
import dynamic from "next/dynamic";
import { useVisualViewportHeight } from "@/lib/hooks/use-visual-viewport-height";
import type { StickerLayer } from "@/features/stories/types";
import CardStickerPicker from "./CardStickerPicker";
import MentionsAutocomplete from "./MentionsAutocomplete";
import type {
  ComposerTextBackgroundMode,
  ComposerTextLayer,
  ComposerTextShape,
  StoryComposerMode,
  StoryImageDimensions,
  StoryImageTransform,
} from "@/features/stories/types";
import type { KonvaStoryCanvasHandle } from "./konva/KonvaStoryCanvas";
import {
  COMPOSER_TEXT_MAX_FONT_SIZE,
  COMPOSER_TEXT_MIN_FONT_SIZE,
} from "@/features/stories/lib/text-layer-factory";
import { getFontFamilyStack } from "@/features/stories/lib/compose-canvas";


// Konva uses the browser Canvas API — skip SSR entirely.
const KonvaStoryCanvas = dynamic(() => import("./konva/KonvaStoryCanvas"), {
  ssr: false,
  loading: () => <div className="absolute inset-0" style={{ background: "#000" }} />,
});

type NamedColorOption = { name: string; value: string };

const STORY_TEXT_COLORS: NamedColorOption[] = [
  { name: "Blanco", value: "#F5F7FA" },
  { name: "Grafito", value: "#1E293B" },
  { name: "Celeste", value: "#7DD3FC" },
  { name: "Verde", value: "#86EFAC" },
  { name: "Coral", value: "#FDA4AF" },
];

const STORY_BG_COLORS: NamedColorOption[] = [
  { name: "Azul", value: "#3F5E9C" },
  { name: "Indigo", value: "#4C4A9E" },
  { name: "Petróleo", value: "#2B6C6A" },
  { name: "Ciruela", value: "#6A3E7A" },
  { name: "Tierra", value: "#7A5B3D" },
];

const STORY_TEXT_CONTAINER_COLORS: NamedColorOption[] = [
  { name: "Oscuro", value: "#1F2937" },
  { name: "Claro", value: "#E5E7EB" },
  { name: "Azul", value: "#3F5E9C" },
  { name: "Verde", value: "#2E6B57" },
  { name: "Coral", value: "#BE5F6A" },
];

const TEXT_BG_MODES: { mode: ComposerTextBackgroundMode; label: string }[] = [
  { mode: "none", label: "Sin fondo" },
  { mode: "fill", label: "Lleno" },
  { mode: "outline", label: "Outline" },
];

const TEXT_SHAPES: { shape: ComposerTextShape; label: string }[] = [
  { shape: "square", label: "Cuadrado" },
  { shape: "rounded", label: "Redondeado" },
  { shape: "pill", label: "Píldora" },
];

const EMOJI_OPTIONS = ["😀", "🔥", "⭐", "❤️", "🎯", "⚡"];

type StoryComposerModalProps = {
  onClose: () => void;
  publishingStory: boolean;
  storyMode: StoryComposerMode;
  setStoryMode: (mode: StoryComposerMode) => void;
  storyFileInputRef: RefObject<HTMLInputElement | null>;
  storyCameraInputRef: RefObject<HTMLInputElement | null>;
  storyCanvasRef: RefObject<HTMLCanvasElement | null>;
  storyVideoRef: RefObject<HTMLVideoElement | null>;
  onStoryFileSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  cameraOpen: boolean;
  cameraLoading: boolean;
  cameraPermissionState: PermissionState | null;
  capturingPhoto: boolean;
  storyPreviewUrl: string | null;
  storyImageFile: File | null;
  storyImageDimensions: StoryImageDimensions | null;
  storyImageTransform: StoryImageTransform;
  setStoryImageTransform: (transform: StoryImageTransform) => void;
  resetStoryImageTransform: () => void;
  storyBackgroundColor: string;
  setStoryBackgroundColor: (color: string) => void;
  storyTextLayers: ComposerTextLayer[];
  selectedStoryTextLayer: ComposerTextLayer | null;
  selectedTextLayerId: string | null;
  selectedStickerId: string | null;
  setSelectedStoryTextLayerId: (id: string | null) => void;
  setSelectedStickerId: (id: string | null) => void;
  patchTextLayer: (id: string, patch: Partial<ComposerTextLayer>) => void;
  updateSelectedTextLayer: (updater: (layer: ComposerTextLayer) => ComposerTextLayer) => void;
  addStoryTextLayer: () => void;
  removeSelectedStoryTextLayer: () => void;
  clearStoryImage: () => void;
  startCamera: () => void;
  stopCamera: () => void;
  capturePhoto: () => void;
  publishStory: () => void;
  hasStoryText: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  stickers: StickerLayer[];
  onAddCardSticker: (card: { cardId: string; name: string; imageUrl: string }) => void;
  onAddEmojiSticker: (emoji: string) => void;
  onUpdateSticker: (id: string, patch: Partial<Omit<StickerLayer, "id" | "kind">>) => void;
  onRemoveSticker: (id: string) => void;
  onCommitHistory: () => void;
  konvaCanvasRef: RefObject<KonvaStoryCanvasHandle | null>;
  isDraft?: boolean;
};

type ActiveTool = "text" | "background" | "sticker";

function PaintLabelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 3a8 8 0 1 0 0 16h1a2 2 0 1 0 0-4h-1a2 2 0 1 1 0-4h3a5 5 0 0 0 0-10h-3z" stroke="currentColor" strokeWidth="2" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="6" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

function StickerLabelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M8 14c1 1.2 2.2 2 4 2s3-.8 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function StoryComposerModal({
  onClose,
  publishingStory,
  storyMode,
  setStoryMode,
  storyFileInputRef,
  storyCameraInputRef,
  storyCanvasRef,
  storyVideoRef,
  onStoryFileSelected,
  cameraOpen,
  cameraLoading,
  cameraPermissionState,
  capturingPhoto,
  storyPreviewUrl,
  storyImageFile,
  storyImageDimensions,
  storyImageTransform,
  setStoryImageTransform,
  resetStoryImageTransform,
  storyBackgroundColor,
  setStoryBackgroundColor,
  storyTextLayers,
  selectedStoryTextLayer,
  selectedTextLayerId,
  selectedStickerId,
  setSelectedStoryTextLayerId,
  setSelectedStickerId,
  patchTextLayer,
  updateSelectedTextLayer,
  clearStoryImage,
  startCamera,
  stopCamera,
  capturePhoto,
  publishStory,
  hasStoryText,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  stickers,
  onAddCardSticker,
  onAddEmojiSticker,
  onUpdateSticker,
  onRemoveSticker,
  onCommitHistory,
  addStoryTextLayer,
  removeSelectedStoryTextLayer,
  konvaCanvasRef,
  isDraft = false,
}: StoryComposerModalProps) {
  const [activeTool, setActiveTool] = useState<ActiveTool>("text");
  const [mobileBgSheetOpen, setMobileBgSheetOpen] = useState(false);
  const [mobileTextStyleSheetOpen, setMobileTextStyleSheetOpen] = useState(false);
  const visualViewportHeight = useVisualViewportHeight();

  const neutralControlStyle = {
    borderColor: "var(--border)",
    borderWidth: "1px",
    background: "var(--surface)",
    color: "var(--foreground)",
  } as const;
  const captureButtonStyle = {
    background: "var(--accent)",
    color: "var(--accent-foreground)",
  } as const;
  const publishButtonStyle = {
    background: "var(--accent)",
    color: "var(--accent-foreground)",
    borderColor: "var(--accent)",
  } as const;
  const cameraActionLabel =
    cameraLoading
      ? "Abriendo..."
      : cameraPermissionState === "granted"
        ? "Tomar foto"
        : cameraPermissionState === "denied"
          ? "Permitir camara"
          : "Solicitar permiso";
  const currentBgMode: ComposerTextBackgroundMode = selectedStoryTextLayer?.textBackgroundMode ?? "none";
  const currentShape: ComposerTextShape = selectedStoryTextLayer?.textShape ?? "rounded";
  const currentTextStyle = { mode: currentBgMode, shape: currentShape };
  const selectedTextColor = selectedStoryTextLayer?.textColor ?? STORY_TEXT_COLORS[0].value;
  const selectedTextBackgroundColor = selectedStoryTextLayer?.textBackgroundColor ?? STORY_TEXT_CONTAINER_COLORS[0].value;

  const canvasIsDraggable = storyTextLayers.length > 0 || stickers.length > 0 || Boolean(storyPreviewUrl);

  const handleChangeText = (id: string, patch: Partial<ComposerTextLayer>) => {
    patchTextLayer(id, patch);
  };

  const handleSelectTextFromCanvas = (id: string | null) => {
    setSelectedStoryTextLayerId(id);
  };

  const handleSelectStickerFromCanvas = (id: string | null) => {
    setSelectedStickerId(id);
  };

  const previewNode = (
    <div
      className="relative h-full w-full overflow-hidden lg:aspect-[9/16] lg:h-auto lg:max-h-[82vh] lg:rounded-2xl lg:border"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface-solid)",
        cursor: canvasIsDraggable ? "default" : "default",
      }}
    >
      <KonvaStoryCanvas
        ref={konvaCanvasRef}
        mode={storyMode}
        backgroundColor={storyBackgroundColor}
        photoPreviewUrl={cameraOpen ? null : storyPreviewUrl}
        photoDimensions={storyImageDimensions}
        photoTransform={storyImageTransform}
        textLayers={storyTextLayers}
        stickers={stickers}
        selectedId={selectedTextLayerId ?? selectedStickerId}
        onSelectText={handleSelectTextFromCanvas}
        onSelectSticker={handleSelectStickerFromCanvas}
        onChangeText={handleChangeText}
        onChangeSticker={onUpdateSticker}
        onCommitHistory={onCommitHistory}
        onPhotoTransformChange={setStoryImageTransform}
        onRequestEditText={(id) => {
          setSelectedStoryTextLayerId(id);
          setActiveTool("text");
          setMobileTextStyleSheetOpen(true);
        }}
      />

      <video
        ref={storyVideoRef}
        data-story-camera="true"
        autoPlay
        muted
        playsInline
        controls={false}
        disablePictureInPicture
        className="absolute inset-0 h-full w-full object-cover"
        style={{ display: cameraOpen ? "block" : "none", background: "#000" }}
      />

      {!cameraOpen && storyMode === "photo" && !storyPreviewUrl && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center p-5 text-center"
          style={{ color: "var(--muted)" }}
        >
          <div>
            <p className="m-0 text-sm font-semibold">Selecciona una imagen</p>
            <p className="mt-1 text-xs">Formato vertical recomendado</p>
          </div>
        </div>
      )}

      {storyPreviewUrl && !cameraOpen && storyMode === "photo" && (
        <button
          type="button"
          onClick={clearStoryImage}
          aria-label="Quitar imagen"
          className="absolute right-2 top-2 h-8 w-8 rounded-full border"
          style={{ borderColor: "var(--border)", background: "rgba(0,0,0,.45)", color: "#fff" }}
        >
          ×
        </button>
      )}
    </div>
  );

  const previewShellNode = (
    <div className="mx-auto w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[500px]">
      <div className="relative rounded-[32px] border p-2.5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div
          className="pointer-events-none absolute left-1/2 top-2 h-1.5 w-20 -translate-x-1/2 rounded-full"
          style={{ background: "rgba(0,0,0,.32)" }}
        />
        {previewNode}
      </div>
    </div>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label="Crear historia" className="fixed inset-0 z-[95]">
      <div
        role="button"
        tabIndex={-1}
        aria-label="Cerrar"
        onClick={onClose}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClose();
          }
        }}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,.7)", cursor: "pointer" }}
      />
      <div
        className="relative flex w-dvw flex-col"
        style={{
          height: visualViewportHeight ? `${visualViewportHeight}px` : "100dvh",
          background: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <div className="hidden items-center justify-between border-b px-4 py-3 lg:flex" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h3 className="m-0 text-base font-semibold">Crear historia</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Deshacer"
              title="Deshacer (Ctrl+Z)"
              className="h-9 w-9 rounded-lg border text-sm font-semibold disabled:opacity-40"
              style={neutralControlStyle}
            >
              ↶
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Rehacer"
              title="Rehacer (Ctrl+Shift+Z)"
              className="h-9 w-9 rounded-lg border text-sm font-semibold disabled:opacity-40"
              style={neutralControlStyle}
            >
              ↷
            </button>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="h-9 w-9 rounded-lg border text-xl" style={neutralControlStyle}>
              ×
            </button>
          </div>
        </div>

        <input
          ref={storyFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onStoryFileSelected}
          className="hidden"
        />
        <input ref={storyCameraInputRef} type="file" accept="image/*" capture="environment" onChange={onStoryFileSelected} className="hidden" />
        <canvas ref={storyCanvasRef} className="hidden" />

        <div className="relative min-h-0 flex-1 lg:hidden" style={{ background: "#000" }}>
          {previewNode}
          <div className="pointer-events-none absolute inset-0">
            {/* TOP BAR — close + mode toggle + undo/redo */}
            <div
              className="pointer-events-auto absolute left-0 right-0 top-0 flex items-center justify-between gap-2 px-3"
              style={{ paddingTop: "max(10px, env(safe-area-inset-top))" }}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-transform active:scale-90"
                style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>

              <div
                className="flex items-center gap-0.5 rounded-full p-0.5"
                style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
              >
                <button
                  type="button"
                  onClick={() => setStoryMode("photo")}
                  className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors"
                  style={{
                    background: storyMode === "photo" ? "#fff" : "transparent",
                    color: storyMode === "photo" ? "#000" : "#fff",
                  }}
                >
                  Foto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStoryMode("text");
                    stopCamera();
                  }}
                  className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors"
                  style={{
                    background: storyMode === "text" ? "#fff" : "transparent",
                    color: storyMode === "text" ? "#000" : "#fff",
                  }}
                >
                  Texto
                </button>
              </div>

              <div
                className="flex shrink-0 items-center rounded-full"
                style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
              >
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  aria-label="Deshacer"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-transform active:scale-90 disabled:opacity-30"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 14 4 9l5-5" />
                    <path d="M4 9h10a6 6 0 0 1 0 12H9" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  aria-label="Rehacer"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-transform active:scale-90 disabled:opacity-30"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="m15 14 5-5-5-5" />
                    <path d="M20 9H10a6 6 0 0 0 0 12h5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* FLOATING TOOLS — right edge, vertical (add text, stickers). */}
            <div className="pointer-events-auto absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  addStoryTextLayer();
                  setMobileTextStyleSheetOpen(true);
                }}
                aria-label="Agregar texto"
                className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-90"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
              >
                <span className="text-[18px] font-bold">Aa</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTool("sticker")}
                aria-label="Stickers"
                className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-90"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="9" cy="10" r="1" fill="currentColor" />
                  <circle cx="15" cy="10" r="1" fill="currentColor" />
                  <path d="M8 14c1 1.2 2.2 2 4 2s3-.8 4-2" />
                </svg>
              </button>
              {storyMode === "text" && (
                <button
                  type="button"
                  onClick={() => setMobileBgSheetOpen(true)}
                  aria-label="Color de fondo"
                  className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90"
                  style={{
                    background: storyBackgroundColor,
                    border: "3px solid rgba(255,255,255,0.9)",
                  }}
                />
              )}
              {hasStoryText && selectedStoryTextLayer && (
                <button
                  type="button"
                  onClick={() => setMobileTextStyleSheetOpen(true)}
                  aria-label="Estilo de texto"
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-90"
                  style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
                >
                  <span
                    className="flex items-center justify-center px-1.5 text-[11px] font-bold"
                    style={{
                      color: selectedTextColor,
                      background: currentTextStyle.mode === "fill" ? selectedTextBackgroundColor : "transparent",
                      border:
                        currentTextStyle.mode === "outline"
                          ? `1.5px solid ${selectedTextBackgroundColor}`
                          : currentTextStyle.mode === "none"
                            ? "1.5px dashed rgba(255,255,255,.5)"
                            : "none",
                      borderRadius: currentTextStyle.shape === "pill" ? 999 : currentTextStyle.shape === "rounded" ? 6 : 3,
                      minWidth: 24,
                      height: 22,
                      lineHeight: 1,
                    }}
                  >
                    Aa
                  </span>
                </button>
              )}
              {selectedStickerId && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStickerId) onRemoveSticker(selectedStickerId);
                  }}
                  aria-label="Eliminar sticker"
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-90"
                  style={{ background: "rgba(220,38,38,0.85)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" />
                  </svg>
                </button>
              )}
            </div>

            {/* EMPTY STATE — photo mode, no image */}
            {storyMode === "photo" && !storyImageFile && !cameraOpen && (
              <div className="pointer-events-auto absolute inset-x-6 top-1/2 -translate-y-1/2 space-y-3 text-center">
                <p className="text-[14px] font-semibold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                  Añade una foto a tu historia
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={cameraLoading || publishingStory}
                    className="flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform active:scale-90 disabled:opacity-40"
                    style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.3)" }}
                    aria-label={cameraActionLabel}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="13" r="3" />
                      <path d="M4 7h3l2-3h6l2 3h3v12H4z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => storyFileInputRef.current?.click()}
                    disabled={publishingStory}
                    className="flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform active:scale-90 disabled:opacity-40"
                    style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.3)" }}
                    aria-label="Galería"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <circle cx="8" cy="10" r="2" />
                      <path d="m3 17 6-6 5 5 2-2 5 5" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* EMPTY STATE — text mode, no text */}
            {storyMode === "text" && !hasStoryText && (
              <button
                type="button"
                onClick={() => {
                  addStoryTextLayer();
                  setMobileTextStyleSheetOpen(true);
                }}
                className="pointer-events-auto absolute inset-x-6 top-1/2 -translate-y-1/2 py-2 text-[20px] font-bold text-white/80 transition-opacity active:opacity-60"
                style={{ textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
              >
                Toca para escribir
              </button>
            )}

            {/* CAPTURE BUTTON (when camera open) */}
            {cameraOpen && (
              <div
                className="pointer-events-auto absolute left-0 right-0 flex items-center justify-center gap-6"
                style={{ bottom: "calc(92px + env(safe-area-inset-bottom))" }}
              >
                <button
                  type="button"
                  onClick={stopCamera}
                  aria-label="Cerrar cámara"
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform active:scale-90"
                  style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={capturingPhoto || publishingStory}
                  aria-label="Capturar"
                  className="flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-90 disabled:opacity-50"
                  style={{ background: "#fff", border: "4px solid rgba(255,255,255,0.35)" }}
                >
                  <span className="h-14 w-14 rounded-full" style={{ background: capturingPhoto ? "#999" : "#fff", boxShadow: "0 0 0 2px rgba(0,0,0,0.3)" }} />
                </button>
              </div>
            )}

            {/* TEXT COLOR STRIP — only when there is text */}
            {hasStoryText && selectedStoryTextLayer && !cameraOpen && (
              <div
                className="pointer-events-auto absolute left-3 right-3"
                style={{ bottom: "calc(78px + env(safe-area-inset-bottom))" }}
              >
                <div
                  className="no-scrollbar flex items-center gap-2.5 overflow-x-auto rounded-full px-3 py-2"
                  style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
                >
                  {STORY_TEXT_COLORS.map((option) => {
                    const isActive = selectedTextColor === option.value;
                    return (
                      <button
                        key={`mobile-text-color-${option.value}`}
                        type="button"
                        aria-label={`Color: ${option.name}`}
                        aria-pressed={isActive}
                        onClick={() => updateSelectedTextLayer((layer) => ({ ...layer, textColor: option.value }))}
                        className="shrink-0 rounded-full border-0 transition-transform"
                        style={{
                          width: isActive ? 32 : 28,
                          height: isActive ? 32 : 28,
                          background: option.value,
                          boxShadow: isActive
                            ? "0 0 0 2px rgba(0,0,0,0.5), 0 0 0 4px #fff"
                            : "inset 0 0 0 1px rgba(255,255,255,0.6)",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* BOTTOM CTA — publish */}
            {!cameraOpen && (
              <div
                className="pointer-events-auto absolute bottom-0 left-0 right-0 px-4 pt-3"
                style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
              >
                <button
                  type="button"
                  onClick={publishStory}
                  disabled={publishingStory || (!storyImageFile && !hasStoryText) || (storyMode === "photo" && !storyImageFile)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold shadow-lg transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  style={publishButtonStyle}
                >
                  {publishingStory ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                        <path d="M21 12a9 9 0 1 1-6.22-8.57" strokeLinecap="round" />
                      </svg>
                      Publicando...
                    </>
                  ) : (
                    <>
                      Subir historia
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* STICKER BOTTOM SHEET */}
            {activeTool === "sticker" && (
              <div
                className="pointer-events-auto absolute bottom-0 left-0 right-0 flex flex-col rounded-t-[28px]"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  maxHeight: "72%",
                  paddingBottom: "max(12px, env(safe-area-inset-bottom))",
                  boxShadow: "0 -12px 32px rgba(0,0,0,0.35)",
                  animation: "mobileSheetIn 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <div className="flex justify-center pt-2 pb-1">
                  <div className="h-1 w-10 rounded-full" style={{ background: "var(--border)" }} />
                </div>
                <div className="flex items-center justify-between px-4 pb-3">
                  <h4 className="m-0 text-[15px] font-bold">Stickers</h4>
                  <button
                    type="button"
                    onClick={() => setActiveTool("text")}
                    aria-label="Cerrar"
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={neutralControlStyle}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
                  <div className="mb-5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Cartas
                    </p>
                    <CardStickerPicker onSelect={(card) => { onAddCardSticker(card); setActiveTool("text"); }} />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Emojis
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={`mobile-emoji-${emoji}`}
                          type="button"
                          onClick={() => { onAddEmojiSticker(emoji); setActiveTool("text"); }}
                          className="aspect-square rounded-xl border text-xl transition-transform active:scale-90"
                          style={neutralControlStyle}
                          aria-label={`Emoji ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BACKGROUND COLOR SHEET (text mode) */}
            {mobileBgSheetOpen && storyMode === "text" && (
              <div
                className="pointer-events-auto absolute bottom-0 left-0 right-0 flex flex-col rounded-t-[28px]"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  paddingBottom: "max(16px, env(safe-area-inset-bottom))",
                  boxShadow: "0 -12px 32px rgba(0,0,0,0.35)",
                  animation: "mobileSheetIn 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <div className="flex justify-center pt-2 pb-1">
                  <div className="h-1 w-10 rounded-full" style={{ background: "var(--border)" }} />
                </div>
                <div className="flex items-center justify-between px-4 pb-3">
                  <h4 className="m-0 text-[15px] font-bold">Color de fondo</h4>
                  <button
                    type="button"
                    onClick={() => setMobileBgSheetOpen(false)}
                    aria-label="Cerrar"
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={neutralControlStyle}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-5 place-items-center gap-4 px-6 pb-4">
                  {STORY_BG_COLORS.map((option) => {
                    const isActive = storyBackgroundColor === option.value;
                    return (
                      <button
                        key={`mobile-bg-${option.value}`}
                        type="button"
                        aria-label={option.name}
                        aria-pressed={isActive}
                        onClick={() => {
                          setStoryBackgroundColor(option.value);
                          setMobileBgSheetOpen(false);
                        }}
                        className="rounded-full border-0 transition-transform active:scale-90"
                        style={{
                          width: 48,
                          height: 48,
                          background: option.value,
                          boxShadow: isActive
                            ? "0 0 0 3px var(--background), 0 0 0 5px var(--accent)"
                            : "inset 0 0 0 1px rgba(0,0,0,.15)",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* TEXT STYLE SHEET */}
            {mobileTextStyleSheetOpen && (
              <div
                className="pointer-events-auto absolute bottom-0 left-0 right-0 flex flex-col rounded-t-[28px]"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  paddingBottom: "max(16px, env(safe-area-inset-bottom))",
                  boxShadow: "0 -12px 32px rgba(0,0,0,0.35)",
                  animation: "mobileSheetIn 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <div className="flex justify-center pt-2 pb-1">
                  <div className="h-1 w-10 rounded-full" style={{ background: "var(--border)" }} />
                </div>
                <div className="flex items-center justify-between px-4 pb-3">
                  <h4 className="m-0 text-[15px] font-bold">Editar texto</h4>
                  <button
                    type="button"
                    onClick={() => setMobileTextStyleSheetOpen(false)}
                    aria-label="Cerrar"
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={neutralControlStyle}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
                <div className="max-h-[72vh] space-y-4 overflow-y-auto px-4 pb-4">
                  {selectedStoryTextLayer && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                        Texto
                      </p>
                      <MentionsAutocomplete
                        value={selectedStoryTextLayer.text}
                        onChange={(next) =>
                          updateSelectedTextLayer((layer) => ({ ...layer, text: next }))
                        }
                        placeholder="Escribe el texto de tu historia..."
                        rows={3}
                        maxLength={120}
                        textareaClassName="w-full resize-none rounded-xl border px-3 py-2.5 text-[14px] outline-none"
                        textareaStyle={{
                          borderColor: "var(--border)",
                          background: "var(--surface)",
                          color: selectedStoryTextLayer.textColor,
                          fontWeight: selectedStoryTextLayer.fontWeight === "bold" ? 700 : 500,
                          fontStyle: selectedStoryTextLayer.fontStyle,
                          textAlign: selectedStoryTextLayer.textAlign,
                        }}
                      />
                    </div>
                  )}
                  {selectedStoryTextLayer && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Tamaño
                        </p>
                        <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--muted)" }}>
                          {selectedStoryTextLayer.fontSize}px
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onCommitHistory();
                            updateSelectedTextLayer((layer) => ({
                              ...layer,
                              fontSize: Math.max(COMPOSER_TEXT_MIN_FONT_SIZE, layer.fontSize - 4),
                            }));
                          }}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-[16px] font-bold"
                          style={neutralControlStyle}
                          aria-label="Reducir tamaño"
                        >
                          −
                        </button>
                        <input
                          type="range"
                          min={COMPOSER_TEXT_MIN_FONT_SIZE}
                          max={COMPOSER_TEXT_MAX_FONT_SIZE}
                          step={1}
                          value={selectedStoryTextLayer.fontSize}
                          onPointerDown={onCommitHistory}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            updateSelectedTextLayer((layer) => ({ ...layer, fontSize: next }));
                          }}
                          className="h-10 flex-1 cursor-pointer accent-[var(--accent)]"
                          aria-label="Tamaño del texto"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onCommitHistory();
                            updateSelectedTextLayer((layer) => ({
                              ...layer,
                              fontSize: Math.min(COMPOSER_TEXT_MAX_FONT_SIZE, layer.fontSize + 4),
                            }));
                          }}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-[16px] font-bold"
                          style={neutralControlStyle}
                          aria-label="Aumentar tamaño"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Fondo del texto
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {TEXT_BG_MODES.map(({ mode, label }) => {
                        const isActive = currentBgMode === mode;
                        return (
                          <button
                            key={`mobile-bg-mode-${mode}`}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => updateSelectedTextLayer((layer) => ({ ...layer, textBackgroundMode: mode }))}
                            className="flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11px] font-semibold transition-transform active:scale-95"
                            style={{
                              borderColor: isActive ? "var(--accent)" : "var(--border)",
                              background: isActive ? "var(--accent-subtle)" : "var(--surface-solid)",
                              color: isActive ? "var(--accent)" : "var(--foreground)",
                            }}
                          >
                            <span
                              style={{
                                width: 32,
                                height: 22,
                                borderRadius: currentShape === "pill" ? 999 : currentShape === "rounded" ? 6 : 4,
                                background: mode === "fill" ? selectedTextBackgroundColor : "transparent",
                                border:
                                  mode === "outline"
                                    ? `2px solid ${selectedTextBackgroundColor}`
                                    : mode === "none"
                                      ? "1.5px dashed rgba(128,128,128,.5)"
                                      : "none",
                              }}
                            />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {currentBgMode !== "none" && (
                    <>
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Forma
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {TEXT_SHAPES.map(({ shape, label }) => {
                            const isActive = currentShape === shape;
                            return (
                              <button
                                key={`mobile-shape-${shape}`}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => updateSelectedTextLayer((layer) => ({ ...layer, textShape: shape }))}
                                className="flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11px] font-semibold transition-transform active:scale-95"
                                style={{
                                  borderColor: isActive ? "var(--accent)" : "var(--border)",
                                  background: isActive ? "var(--accent-subtle)" : "var(--surface-solid)",
                                  color: isActive ? "var(--accent)" : "var(--foreground)",
                                }}
                              >
                                <span
                                  style={{
                                    width: 32,
                                    height: 22,
                                    borderRadius: shape === "pill" ? 999 : shape === "rounded" ? 6 : 4,
                                    background: currentBgMode === "fill" ? selectedTextBackgroundColor : "transparent",
                                    border:
                                      currentBgMode === "outline"
                                        ? `2px solid ${selectedTextBackgroundColor}`
                                        : "none",
                                  }}
                                />
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Color de forma
                        </p>
                        <div className="grid grid-cols-5 place-items-center gap-3">
                          {STORY_TEXT_CONTAINER_COLORS.map((option) => {
                            const isActive = selectedTextBackgroundColor === option.value;
                            return (
                              <button
                                key={`mobile-shape-color-${option.value}`}
                                type="button"
                                aria-label={option.name}
                                aria-pressed={isActive}
                                onClick={() => updateSelectedTextLayer((layer) => ({ ...layer, textBackgroundColor: option.value }))}
                                className="rounded-full border-0 transition-transform active:scale-90"
                                style={{
                                  width: 40,
                                  height: 40,
                                  background: option.value,
                                  boxShadow: isActive
                                    ? "0 0 0 3px var(--background), 0 0 0 5px var(--accent)"
                                    : "inset 0 0 0 1px rgba(0,0,0,.15)",
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside
            className="flex min-h-0 flex-col border-r"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            {/* HEADER */}
            <header className="px-4 pb-3 pt-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="m-0 text-[15px] font-bold" style={{ color: "var(--foreground)" }}>
                Editar
              </h3>
              <div className="mt-0.5 flex items-center gap-2 text-[11px]" style={{ color: "var(--muted)" }}>
                <span>
                  {storyTextLayers.filter((layer) => layer.text.trim().length > 0).length} capas · {stickers.length} stickers
                </span>
                {isDraft && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                  >
                    Borrador
                  </span>
                )}
              </div>
            </header>

            {/* SEGMENTED CONTROL */}
            <div
              className="mx-4 mt-3 grid grid-cols-3 gap-1 rounded-xl p-1"
              style={{ background: "color-mix(in srgb, var(--foreground) 6%, transparent)" }}
              role="tablist"
              aria-label="Herramientas"
            >
              {([
                { id: "text" as const, label: "Texto", icon: <span className="text-[13px] font-bold">Aa</span> },
                { id: "background" as const, label: "Fondo", icon: <PaintLabelIcon /> },
                { id: "sticker" as const, label: "Stickers", icon: <StickerLabelIcon /> },
              ]).map((tool) => {
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTool(tool.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-semibold transition-colors"
                    style={{
                      background: isActive ? "var(--surface-solid)" : "transparent",
                      color: isActive ? "var(--foreground)" : "var(--muted)",
                      boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    {tool.icon}
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>

            {/* PANEL */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-4">
              {activeTool === "text" && (
                <div className="space-y-5">
                  {/* Inline editor — sidebar IS the editor */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                        Texto
                      </p>
                      {storyTextLayers.length > 1 && (
                        <span className="text-[10px] font-semibold" style={{ color: "var(--muted)" }}>
                          Capa {storyTextLayers.indexOf(selectedStoryTextLayer ?? storyTextLayers[0]) + 1}/{storyTextLayers.length}
                        </span>
                      )}
                    </div>
                    {selectedStoryTextLayer ? (
                      <MentionsAutocomplete
                        value={selectedStoryTextLayer.text}
                        onChange={(next) =>
                          updateSelectedTextLayer((layer) => ({ ...layer, text: next }))
                        }
                        placeholder="Escribe el texto de tu historia..."
                        rows={3}
                        maxLength={120}
                        textareaClassName="w-full resize-none rounded-xl border px-3 py-2.5 text-[14px] outline-none focus:ring-2"
                        textareaStyle={{
                          borderColor: "var(--border)",
                          background: "var(--surface)",
                          color: selectedStoryTextLayer.textColor,
                          fontWeight: selectedStoryTextLayer.fontWeight === "bold" ? 700 : 500,
                          fontStyle: selectedStoryTextLayer.fontStyle,
                          fontFamily: getFontFamilyStack(selectedStoryTextLayer.fontFamily),
                          textAlign: selectedStoryTextLayer.textAlign,
                        }}
                      />
                    ) : (
                      <p className="text-[12px]" style={{ color: "var(--muted)" }}>
                        Agrega una capa de texto para empezar.
                      </p>
                    )}
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={addStoryTextLayer}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-[12px] font-semibold"
                        style={neutralControlStyle}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Nueva capa
                      </button>
                      <button
                        type="button"
                        onClick={removeSelectedStoryTextLayer}
                        disabled={storyTextLayers.length <= 1 || !selectedStoryTextLayer}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ borderColor: "var(--border)", background: "transparent", color: "var(--muted)" }}
                      >
                        Eliminar capa
                      </button>
                    </div>
                  </div>

                  {/* Tamaño */}
                  {selectedStoryTextLayer && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Tamaño
                        </p>
                        <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--muted)" }}>
                          {selectedStoryTextLayer.fontSize}px
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onCommitHistory();
                            updateSelectedTextLayer((layer) => ({
                              ...layer,
                              fontSize: Math.max(COMPOSER_TEXT_MIN_FONT_SIZE, layer.fontSize - 4),
                            }));
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[14px] font-bold"
                          style={neutralControlStyle}
                          aria-label="Reducir tamaño"
                        >
                          −
                        </button>
                        <input
                          type="range"
                          min={COMPOSER_TEXT_MIN_FONT_SIZE}
                          max={COMPOSER_TEXT_MAX_FONT_SIZE}
                          step={1}
                          value={selectedStoryTextLayer.fontSize}
                          onPointerDown={onCommitHistory}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            updateSelectedTextLayer((layer) => ({ ...layer, fontSize: next }));
                          }}
                          className="h-9 flex-1 cursor-pointer accent-[var(--accent)]"
                          aria-label="Tamaño del texto"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onCommitHistory();
                            updateSelectedTextLayer((layer) => ({
                              ...layer,
                              fontSize: Math.min(COMPOSER_TEXT_MAX_FONT_SIZE, layer.fontSize + 4),
                            }));
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[14px] font-bold"
                          style={neutralControlStyle}
                          aria-label="Aumentar tamaño"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Fondo del texto */}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Fondo
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {TEXT_BG_MODES.map(({ mode, label }) => {
                        const isActive = currentBgMode === mode;
                        return (
                          <button
                            key={`bg-mode-${mode}`}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => updateSelectedTextLayer((layer) => ({ ...layer, textBackgroundMode: mode }))}
                            className="flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition-colors"
                            style={{
                              borderColor: isActive ? "var(--accent)" : "var(--border)",
                              background: isActive ? "var(--accent-subtle)" : "var(--surface-solid)",
                              color: isActive ? "var(--accent)" : "var(--foreground)",
                            }}
                          >
                            <span
                              className="block"
                              style={{
                                width: 28,
                                height: 20,
                                borderRadius: currentShape === "pill" ? 999 : currentShape === "rounded" ? 6 : 4,
                                background: mode === "fill" ? selectedTextBackgroundColor : "transparent",
                                border:
                                  mode === "outline"
                                    ? `2px solid ${selectedTextBackgroundColor}`
                                    : mode === "none"
                                      ? "1.5px dashed rgba(128,128,128,.5)"
                                      : "none",
                              }}
                            />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Forma */}
                  {currentBgMode !== "none" && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                        Forma
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {TEXT_SHAPES.map(({ shape, label }) => {
                          const isActive = currentShape === shape;
                          return (
                            <button
                              key={`shape-${shape}`}
                              type="button"
                              aria-pressed={isActive}
                              onClick={() => updateSelectedTextLayer((layer) => ({ ...layer, textShape: shape }))}
                              className="flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition-colors"
                              style={{
                                borderColor: isActive ? "var(--accent)" : "var(--border)",
                                background: isActive ? "var(--accent-subtle)" : "var(--surface-solid)",
                                color: isActive ? "var(--accent)" : "var(--foreground)",
                              }}
                            >
                              <span
                                className="block"
                                style={{
                                  width: 28,
                                  height: 20,
                                  borderRadius: shape === "pill" ? 999 : shape === "rounded" ? 6 : 4,
                                  background: currentBgMode === "fill" ? selectedTextBackgroundColor : "transparent",
                                  border:
                                    currentBgMode === "outline"
                                      ? `2px solid ${selectedTextBackgroundColor}`
                                      : "none",
                                }}
                              />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Color de texto */}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Color del texto
                    </p>
                    <div className="grid grid-cols-5 place-items-center gap-3">
                      {STORY_TEXT_COLORS.map((option) => {
                        const isActive = selectedTextColor === option.value;
                        return (
                          <button
                            key={`text-color-${option.value}`}
                            type="button"
                            title={option.name}
                            aria-label={`Color texto: ${option.name}`}
                            aria-pressed={isActive}
                            onClick={() => updateSelectedTextLayer((layer) => ({ ...layer, textColor: option.value }))}
                            className="relative rounded-full border-0 transition-transform hover:scale-110"
                            style={{
                              width: 32,
                              height: 32,
                              background: option.value,
                              boxShadow: isActive
                                ? `0 0 0 2px var(--background), 0 0 0 4px var(--accent)`
                                : "inset 0 0 0 1px rgba(0,0,0,.15)",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Color de forma */}
                  {currentTextStyle.mode !== "none" && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                        Color de forma
                      </p>
                      <div className="grid grid-cols-5 place-items-center gap-3">
                        {STORY_TEXT_CONTAINER_COLORS.map((option) => {
                          const isActive = selectedTextBackgroundColor === option.value;
                          return (
                            <button
                              key={`shape-color-${option.value}`}
                              type="button"
                              title={option.name}
                              aria-label={`Color forma: ${option.name}`}
                              aria-pressed={isActive}
                              onClick={() => updateSelectedTextLayer((layer) => ({ ...layer, textBackgroundColor: option.value }))}
                              className="relative rounded-full border-0 transition-transform hover:scale-110"
                              style={{
                                width: 32,
                                height: 32,
                                background: option.value,
                                boxShadow: isActive
                                  ? `0 0 0 2px var(--background), 0 0 0 4px var(--accent)`
                                  : "inset 0 0 0 1px rgba(0,0,0,.15)",
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTool === "background" && (
                <div className="space-y-5">
                  {/* Toggle Foto/Color */}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Tipo
                    </p>
                    <div
                      className="grid grid-cols-2 gap-1 rounded-xl p-1"
                      style={{ background: "color-mix(in srgb, var(--foreground) 6%, transparent)" }}
                    >
                      <button
                        type="button"
                        onClick={() => setStoryMode("photo")}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold"
                        style={{
                          background: storyMode === "photo" ? "var(--surface-solid)" : "transparent",
                          color: storyMode === "photo" ? "var(--foreground)" : "var(--muted)",
                          boxShadow: storyMode === "photo" ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                        }}
                      >
                        Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStoryMode("text");
                          stopCamera();
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold"
                        style={{
                          background: storyMode === "text" ? "var(--surface-solid)" : "transparent",
                          color: storyMode === "text" ? "var(--foreground)" : "var(--muted)",
                          boxShadow: storyMode === "text" ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                        }}
                      >
                        Color
                      </button>
                    </div>
                  </div>

                  {storyMode === "text" ? (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                        Color de fondo
                      </p>
                      <div className="grid grid-cols-5 place-items-center gap-3">
                        {STORY_BG_COLORS.map((option) => {
                          const isActive = storyBackgroundColor === option.value;
                          return (
                            <button
                              key={`bg-color-${option.value}`}
                              type="button"
                              title={option.name}
                              aria-label={`Fondo: ${option.name}`}
                              aria-pressed={isActive}
                              onClick={() => setStoryBackgroundColor(option.value)}
                              className="relative rounded-full border-0 transition-transform hover:scale-110"
                              style={{
                                width: 36,
                                height: 36,
                                background: option.value,
                                boxShadow: isActive
                                  ? `0 0 0 2px var(--background), 0 0 0 4px var(--accent)`
                                  : "inset 0 0 0 1px rgba(0,0,0,.15)",
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Fuente
                        </p>
                        {cameraOpen ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              disabled={capturingPhoto || publishingStory}
                              className="inline-flex flex-col items-center justify-center gap-1.5 rounded-xl py-4 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                              style={captureButtonStyle}
                            >
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="13" r="3" />
                                <path d="M4 7h3l2-3h6l2 3h3v12H4z" />
                              </svg>
                              {capturingPhoto ? "Capturando..." : "Capturar"}
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="inline-flex flex-col items-center justify-center gap-1.5 rounded-xl border py-4 text-[12px] font-semibold"
                              style={neutralControlStyle}
                            >
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 6l12 12M18 6L6 18" />
                              </svg>
                              Cerrar cámara
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={startCamera}
                              disabled={cameraLoading || publishingStory}
                              className="inline-flex flex-col items-center justify-center gap-1.5 rounded-xl border py-4 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                              style={neutralControlStyle}
                            >
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="13" r="3" />
                                <path d="M4 7h3l2-3h6l2 3h3v12H4z" />
                              </svg>
                              {cameraActionLabel}
                            </button>
                            <button
                              type="button"
                              onClick={() => storyFileInputRef.current?.click()}
                              disabled={publishingStory}
                              className="inline-flex flex-col items-center justify-center gap-1.5 rounded-xl border py-4 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                              style={neutralControlStyle}
                            >
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="5" width="18" height="14" rx="2" />
                                <circle cx="8" cy="10" r="2" />
                                <path d="m3 17 6-6 5 5 2-2 5 5" />
                              </svg>
                              {storyImageFile ? "Cambiar foto" : "Galería"}
                            </button>
                          </div>
                        )}
                      </div>

                      {storyPreviewUrl && !cameraOpen && (
                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                            Acciones
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={resetStoryImageTransform}
                              className="h-10 rounded-lg border text-[13px] font-semibold"
                              style={neutralControlStyle}
                            >
                              Reencuadrar
                            </button>
                            <button
                              type="button"
                              onClick={clearStoryImage}
                              className="h-10 rounded-lg border text-[13px] font-semibold"
                              style={neutralControlStyle}
                            >
                              Quitar foto
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTool === "sticker" && (
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Cartas
                    </p>
                    <CardStickerPicker onSelect={onAddCardSticker} />
                  </div>

                  <details className="story-composer-details">
                    <summary
                      className="flex cursor-pointer list-none items-center gap-2 text-[10px] font-bold uppercase tracking-wider outline-none"
                      style={{ color: "var(--muted)" }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="story-composer-details-caret transition-transform"
                      >
                        <polyline points="9 6 15 12 9 18" />
                      </svg>
                      Emojis
                    </summary>
                    <div className="mt-2 grid grid-cols-6 gap-2">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={`desktop-emoji-${emoji}`}
                          type="button"
                          onClick={() => onAddEmojiSticker(emoji)}
                          className="aspect-square rounded-lg border text-lg"
                          style={neutralControlStyle}
                          aria-label={`Emoji ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{
                borderTop: "1px solid var(--border)",
                background: "var(--surface)",
                boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
              }}
            >
              <button
                type="button"
                onClick={publishStory}
                disabled={publishingStory || cameraOpen || (!storyImageFile && !hasStoryText) || (storyMode === "photo" && !storyImageFile)}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
                style={publishButtonStyle}
              >
                {publishingStory ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.22-8.57" strokeLinecap="round" />
                    </svg>
                    Publicando...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
                      <path d="M3 11l18-8-8 18-2-8-8-2z" />
                    </svg>
                    Subir historia
                  </>
                )}
              </button>
            </div>
          </aside>

          <main className="relative order-1 flex min-h-0 items-center justify-center p-3 sm:p-4 md:p-6 lg:order-2" style={{ background: "var(--surface-solid)" }}>
            {previewShellNode}
          </main>
        </div>

      </div>
    </div>
  );
}
