"use client";

import { useCallback, useEffect, useRef, type ChangeEvent, type PointerEvent as ReactPointerEvent } from "react";
import { toast } from "@heroui/react/toast";
import { uploadImage } from "@/lib/api/images";
import StoryComposerModal from "@/features/stories/StoryComposer/StoryComposerModal";
import { composeStoryImage } from "@/features/stories/lib/compose-canvas";
import { readImageDimensions } from "@/features/stories/lib/text-layer-factory";
import { useStoryComposer } from "@/features/stories/hooks/use-story-composer";
import { useStoryCamera } from "@/features/stories/hooks/use-story-camera";
import { useCreateStory } from "@/features/stories/hooks/use-create-story";
import type { StoryDraft } from "@/lib/stores/story-draft-store";

type StoryComposerProps = {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | undefined;
  initialDraft?: StoryDraft | null;
};

export default function StoryComposer({ isOpen, onClose, accessToken, initialDraft }: StoryComposerProps) {
  const composer = useStoryComposer();
  const camera = useStoryCamera({ disabled: composer.state.publishing });
  const createStoryMutation = useCreateStory(accessToken);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const createTrackedURL = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeTrackedURL = useCallback((url: string | null) => {
    if (!url) return;
    if (objectUrlsRef.current.has(url)) {
      objectUrlsRef.current.delete(url);
    }
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    if (isOpen) {
      void camera.refreshPermissionState();
    }
  }, [isOpen, camera]);

  const seededRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      seededRef.current = false;
      return;
    }
    if (seededRef.current || !initialDraft) return;
    seededRef.current = true;

    if (initialDraft.caption) {
      const existing = composer.state.textLayers[0];
      if (existing) {
        composer.replaceTextLayer(existing.id, {
          ...existing,
          text: initialDraft.caption,
          fontSize: 40,
          y: 30,
        });
        composer.selectTextLayer(existing.id);
      } else {
        composer.addTextLayer({ text: initialDraft.caption, fontSize: 40, y: 30 });
      }
    }
    if (initialDraft.backgroundColor) {
      composer.setMode("text");
      composer.setBackgroundColor(initialDraft.backgroundColor);
    }
    if (initialDraft.cardStickers?.length) {
      for (const sticker of initialDraft.cardStickers) {
        composer.addCardSticker({
          cardId: sticker.cardId,
          name: sticker.name,
          imageUrl: sticker.imageUrl,
        });
      }
    }
  }, [isOpen, initialDraft, composer]);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      const meta = event.ctrlKey || event.metaKey;
      if (!meta) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        composer.undo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        composer.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, composer]);

  // Focus trap within the composer modal (Tab / Shift+Tab cycle).
  useEffect(() => {
    if (!isOpen) return;
    const node = modalRef.current;
    if (!node) return;

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const getFocusables = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Focus first interactive element on open (next tick so DOM is ready).
    const rafId = window.requestAnimationFrame(() => {
      const list = getFocusables();
      list[0]?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const list = getFocusables();
      if (list.length === 0) return;
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === firstEl || !node.contains(active))) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && (active === lastEl || !node.contains(active))) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.cancelAnimationFrame(rafId);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    camera.stop();
    composer.reset();
    onClose();
  }, [camera, composer, onClose]);

  const onFileSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.danger("Selecciona una imagen valida");
        return;
      }
      camera.stop();
      revokeTrackedURL(composer.state.previewUrl);
      const url = createTrackedURL(file);
      composer.setImage(file, url, null);
      try {
        const dimensions = await readImageDimensions(file);
        composer.setImageDimensions(dimensions);
      } catch (error: unknown) {
        console.warn("No se pudieron leer dimensiones de imagen", error);
      }
    },
    [camera, composer, createTrackedURL, revokeTrackedURL]
  );

  const onClearImage = useCallback(() => {
    revokeTrackedURL(composer.state.previewUrl);
    composer.clearImage();
  }, [composer, revokeTrackedURL]);

  const onCapturePhoto = useCallback(async () => {
    const result = await camera.capture();
    if (!result) return;
    revokeTrackedURL(composer.state.previewUrl);
    const url = createTrackedURL(result.file);
    composer.setImage(result.file, url, { width: result.width, height: result.height });
  }, [camera, composer, createTrackedURL, revokeTrackedURL]);

  const onMediaPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => composer.onMediaPointerDown(event, { cameraOpen: camera.open }),
    [composer, camera.open]
  );

  const publishStory = useCallback(async () => {
    if (composer.state.publishing) return;
    if (!accessToken) {
      toast.danger("Debes iniciar sesion para publicar historias");
      return;
    }
    const preparedLayers = composer.state.textLayers
      .map((layer) => ({
        text: layer.text.trim(),
        text_color: layer.textColor,
        text_background_mode: layer.textBackgroundMode,
        text_background_color: layer.textBackgroundColor,
        text_shape: layer.textShape,
        font_weight: layer.fontWeight,
        font_style: layer.fontStyle,
        font_size: layer.fontSize,
        text_align: layer.textAlign,
        font_family: layer.fontFamily,
        text_x: layer.x,
        text_y: layer.y,
      }))
      .filter((layer) => layer.text.length > 0);
    const primaryLayer = preparedLayers[0];
    const shouldUseTextOnly = composer.state.mode === "text";

    if (!composer.state.imageFile && preparedLayers.length === 0) {
      toast.danger("Agrega una imagen o texto para publicar la historia");
      return;
    }
    if (!shouldUseTextOnly && !composer.state.imageFile) {
      toast.danger("Selecciona una imagen para tu historia");
      return;
    }

    composer.setPublishing(true);
    try {
      const composedStoryImage = await composeStoryImage({
        mode: composer.state.mode,
        backgroundColor: composer.state.backgroundColor,
        imageFile: composer.state.imageFile,
        imageTransform: composer.state.imageTransform,
        layers: preparedLayers,
        cardStickers: composer.state.cardStickers,
      });
      const uploaded = await uploadImage(composedStoryImage, "user_cover", accessToken);
      await createStoryMutation.mutateAsync({
        image_url: uploaded.public_url,
        caption: primaryLayer?.text,
        background_color: shouldUseTextOnly ? composer.state.backgroundColor : undefined,
      });
      toast.success("Historia publicada");
      handleClose();
    } catch (error: unknown) {
      console.error("No se pudo publicar la historia", error);
      toast.danger("No se pudo publicar la historia");
      composer.setPublishing(false);
    }
  }, [accessToken, composer, createStoryMutation, handleClose]);

  // Revoke preview URL if the component unmounts mid-publish.
  useEffect(() => {
    if (!composer.state.publishing) return;
    const url = composer.state.previewUrl;
    return () => {
      if (url && objectUrlsRef.current.has(url)) {
        objectUrlsRef.current.delete(url);
        URL.revokeObjectURL(url);
      }
    };
  }, [composer.state.publishing, composer.state.previewUrl]);

  if (!isOpen) return null;

  return (
    <div ref={modalRef}>
    <StoryComposerModal
      onClose={handleClose}
      publishingStory={composer.state.publishing}
      storyMode={composer.state.mode}
      setStoryMode={composer.setMode}
      storyFileInputRef={fileInputRef}
      storyCameraInputRef={cameraInputRef}
      storyCanvasRef={camera.canvasRef}
      storyVideoRef={camera.videoRef}
      storyComposerPreviewRef={composer.previewRef}
      onStoryFileSelected={onFileSelected}
      cameraOpen={camera.open}
      cameraLoading={camera.loading}
      cameraPermissionState={camera.permissionState}
      capturingPhoto={camera.capturing}
      storyPreviewUrl={composer.state.previewUrl}
      storyImageFile={composer.state.imageFile}
      storyImageDimensions={composer.state.imageDimensions}
      storyImageTransform={composer.state.imageTransform}
      resetStoryImageTransform={composer.resetImageTransform}
      onStoryMediaPointerDown={onMediaPointerDown}
      onStoryMediaPointerMove={composer.onMediaPointerMove}
      onStoryMediaPointerUp={composer.onMediaPointerUp}
      draggingStoryMedia={composer.state.draggingMedia}
      storyBackgroundColor={composer.state.backgroundColor}
      setStoryBackgroundColor={composer.setBackgroundColor}
      storyTextLayers={composer.state.textLayers}
      storyTextSnapGuides={composer.state.textSnapGuides}
      selectedStoryTextLayer={composer.selectedTextLayer}
      draggingTextLayerId={composer.state.draggingTextLayerId}
      setSelectedStoryTextLayerId={composer.selectTextLayer}
      updateSelectedTextLayer={composer.updateSelectedTextLayer}
      onStoryTextPointerDown={composer.onTextPointerDown}
      onStoryTextPointerMove={composer.onTextPointerMove}
      onStoryTextPointerUp={composer.onTextPointerUp}
      addStoryTextLayer={() => composer.addTextLayer()}
      removeSelectedStoryTextLayer={composer.removeSelectedTextLayer}
      clearStoryImage={onClearImage}
      startCamera={camera.start}
      stopCamera={camera.stop}
      capturePhoto={onCapturePhoto}
      publishStory={publishStory}
      hasStoryText={composer.state.textLayers.some((layer) => layer.text.trim().length > 0)}
      onUndo={composer.undo}
      onRedo={composer.redo}
      canUndo={composer.canUndo}
      canRedo={composer.canRedo}
      cardStickers={composer.state.cardStickers}
      draggingStickerId={composer.state.draggingStickerId}
      onAddCardSticker={composer.addCardSticker}
      onUpdateCardSticker={composer.updateCardSticker}
      onRemoveCardSticker={composer.removeCardSticker}
      onSetDraggingSticker={composer.setDraggingSticker}
      isDraft={Boolean(initialDraft)}
    />
    </div>
  );
}
