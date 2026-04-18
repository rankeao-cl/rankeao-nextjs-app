"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Image as KonvaImage, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import KonvaTextNode from "./KonvaTextNode";
import KonvaStickerNode from "./KonvaStickerNode";
import type {
  ComposerTextLayer,
  StickerLayer,
  StoryComposerMode,
  StoryImageTransform,
  StoryImageDimensions,
} from "@/features/stories/types";
import {
  STORY_CANVAS_HEIGHT,
  STORY_CANVAS_WIDTH,
  STORY_IMAGE_MAX_ZOOM,
  STORY_IMAGE_MIN_ZOOM,
  clampValue,
  getStoryImageCoverScale,
} from "@/features/stories/lib/story-image-transform";

const SNAP_TARGET = 50; // percent
const SNAP_DISTANCE = 3; // percent

export type KonvaStoryCanvasHandle = {
  exportBlob: () => Promise<Blob | null>;
};

type KonvaStoryCanvasProps = {
  mode: StoryComposerMode;
  backgroundColor: string;
  photoPreviewUrl: string | null;
  photoDimensions: StoryImageDimensions | null;
  photoTransform: StoryImageTransform;
  textLayers: ComposerTextLayer[];
  stickers: StickerLayer[];
  selectedId: string | null;
  onSelectText: (id: string | null) => void;
  onSelectSticker: (id: string | null) => void;
  onChangeText: (id: string, patch: Partial<ComposerTextLayer>) => void;
  onChangeSticker: (id: string, patch: Partial<Omit<StickerLayer, "id" | "kind">>) => void;
  onCommitHistory: () => void;
  onPhotoTransformChange: (transform: StoryImageTransform) => void;
  onRequestEditText?: (id: string) => void;
};

const KonvaStoryCanvas = forwardRef<KonvaStoryCanvasHandle, KonvaStoryCanvasProps>(
  function KonvaStoryCanvas(
    {
      mode,
      backgroundColor,
      photoPreviewUrl,
      photoDimensions,
      photoTransform,
      textLayers,
      stickers,
      selectedId,
      onSelectText,
      onSelectSticker,
      onChangeText,
      onChangeSticker,
      onCommitHistory,
      onPhotoTransformChange,
      onRequestEditText,
    },
    forwardedRef
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const stageRef = useRef<Konva.Stage | null>(null);
    const transformerRef = useRef<Konva.Transformer | null>(null);
    const nodeRegistryRef = useRef<Map<string, Konva.Group>>(new Map());
    const [displaySize, setDisplaySize] = useState({ width: 1, height: 1 });
    const [snapGuides, setSnapGuides] = useState({ vertical: false, horizontal: false });
    const [photoImage] = useImage(photoPreviewUrl ?? "", "anonymous");

    const registerNode = useCallback((id: string, node: Konva.Group | null) => {
      if (node) {
        nodeRegistryRef.current.set(id, node);
      } else {
        nodeRegistryRef.current.delete(id);
      }
    }, []);

    // Measure synchronously before paint to avoid a 1×1 flash where Konva
    // would try to drawImage into a zero-sized canvas (crashes with
    // InvalidStateError when stickers/photo load).
    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDisplaySize({ width: rect.width, height: rect.height });
      }
    }, []);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDisplaySize({ width: rect.width, height: rect.height });
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    // Attach transformer to the currently-selected node via the ref registry.
    // Using findOne by name was unreliable for text groups whose bounds mutate
    // post-mount (measurement); ref-based lookup is deterministic.
    useEffect(() => {
      const transformer = transformerRef.current;
      if (!transformer) return;
      if (!selectedId) {
        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
        return;
      }
      const node = nodeRegistryRef.current.get(selectedId);
      if (node) {
        transformer.nodes([node]);
      } else {
        transformer.nodes([]);
      }
      transformer.getLayer()?.batchDraw();
      // Refresh again on next frame so post-measurement bound changes
      // (text size, image load) get picked up by the transformer handles.
      const rafId = requestAnimationFrame(() => {
        if (transformer.nodes().length > 0) transformer.forceUpdate();
        transformer.getLayer()?.batchDraw();
      });
      return () => cancelAnimationFrame(rafId);
    }, [selectedId, textLayers, stickers]);

    const scale = displaySize.width / STORY_CANVAS_WIDTH;

    const handleStageMouseDown = useCallback(
      (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        // Deselect when clicking empty stage area.
        if (event.target === event.target.getStage()) {
          onSelectText(null);
          onSelectSticker(null);
        }
      },
      [onSelectSticker, onSelectText]
    );

    const handleDragMove = useCallback((cx: number, cy: number) => {
      const xPct = (cx / STORY_CANVAS_WIDTH) * 100;
      const yPct = (cy / STORY_CANVAS_HEIGHT) * 100;
      const snapV = Math.abs(xPct - SNAP_TARGET) <= SNAP_DISTANCE;
      const snapH = Math.abs(yPct - SNAP_TARGET) <= SNAP_DISTANCE;
      setSnapGuides((prev) =>
        prev.vertical === snapV && prev.horizontal === snapH ? prev : { vertical: snapV, horizontal: snapH }
      );
    }, []);

    const handleDragEnd = useCallback(() => {
      setSnapGuides({ vertical: false, horizontal: false });
    }, []);

    // Photo background transform math: cover the stage with pan/zoom/rotation.
    const photoNodeProps = useMemo(() => {
      if (mode !== "photo" || !photoImage || !photoDimensions) return null;
      const rotation = photoTransform.rotation;
      const zoom = clampValue(photoTransform.zoom, STORY_IMAGE_MIN_ZOOM, STORY_IMAGE_MAX_ZOOM);
      const coverScale = getStoryImageCoverScale(
        photoDimensions.width,
        photoDimensions.height,
        STORY_CANVAS_WIDTH,
        STORY_CANVAS_HEIGHT,
        rotation
      );
      const width = photoDimensions.width * coverScale;
      const height = photoDimensions.height * coverScale;
      const translateX = (photoTransform.offsetX / 100) * STORY_CANVAS_WIDTH;
      const translateY = (photoTransform.offsetY / 100) * STORY_CANVAS_HEIGHT;
      return {
        x: STORY_CANVAS_WIDTH / 2 + translateX,
        y: STORY_CANVAS_HEIGHT / 2 + translateY,
        rotation,
        scaleX: zoom,
        scaleY: zoom,
        width,
        height,
        offsetX: width / 2,
        offsetY: height / 2,
      };
    }, [mode, photoImage, photoDimensions, photoTransform]);

    const onPhotoDragStart = useCallback(() => {
      onCommitHistory();
    }, [onCommitHistory]);

    const onPhotoDragEnd = useCallback(
      (event: Konva.KonvaEventObject<DragEvent>) => {
        if (!photoDimensions) return;
        const node = event.target;
        const cx = node.x();
        const cy = node.y();
        const newOffsetX = ((cx - STORY_CANVAS_WIDTH / 2) / STORY_CANVAS_WIDTH) * 100;
        const newOffsetY = ((cy - STORY_CANVAS_HEIGHT / 2) / STORY_CANVAS_HEIGHT) * 100;
        onPhotoTransformChange({
          ...photoTransform,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        });
      },
      [onPhotoTransformChange, photoDimensions, photoTransform]
    );

    useImperativeHandle(
      forwardedRef,
      () => ({
        exportBlob: async () => {
          const stage = stageRef.current;
          if (!stage) return null;
          try {
            await document.fonts.ready;
          } catch {
            // ignore font readiness errors
          }

          const transformer = transformerRef.current;
          const uiLayer = stage.findOne(".ui-layer") as Konva.Layer | undefined;
          const hadUi = uiLayer?.visible() ?? true;
          const restore = () => {
            if (uiLayer) uiLayer.visible(hadUi);
            transformer?.visible(true);
            stage.batchDraw();
          };

          if (uiLayer) uiLayer.visible(false);
          transformer?.visible(false);

          // Native 1080x1920 — pixelRatio compensates the display scale so the
          // export is always at the story canvas resolution regardless of how
          // much the stage is visually scaled down.
          const pixelRatio = 1 / scale;

          // Konva's toBlob is the recommended production primitive for export.
          // It wraps toCanvas + HTMLCanvasElement.toBlob under the hood, is
          // async, and doesn't go through fetch() so it is unaffected by CSP.
          // https://konvajs.org/api/Konva.Stage.html#toBlob
          try {
            const blob = await new Promise<Blob>((resolve, reject) => {
              try {
                stage.toBlob({
                  mimeType: "image/jpeg",
                  quality: 0.92,
                  pixelRatio,
                  callback: (b: Blob | null) => {
                    if (b) resolve(b);
                    else reject(new Error("toBlob returned null"));
                  },
                });
              } catch (error) {
                reject(error);
              }
            });
            restore();
            return blob;
          } catch (error) {
            restore();
            // Fall back to synchronous toDataURL + atob decode. This still
            // throws `SecurityError` if any image in the tree is CORS-tainted,
            // in which case the caller should handle the failure.
            try {
              const dataUrl = stage.toDataURL({
                mimeType: "image/jpeg",
                quality: 0.92,
                pixelRatio,
              });
              const commaIdx = dataUrl.indexOf(",");
              if (commaIdx < 0) throw new Error("toDataURL returned empty string");
              const body = dataUrl.slice(commaIdx + 1);
              const binary = atob(body);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              return new Blob([bytes], { type: "image/jpeg" });
            } catch (fallbackError) {
              console.error("[KonvaStoryCanvas] exportBlob failed", {
                primary: error,
                fallback: fallbackError,
              });
              throw fallbackError;
            }
          }
        },
      }),
      [scale]
    );

    return (
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden [&_.konvajs-content]:!touch-none [&_canvas]:!touch-none"
        style={{ touchAction: "none" }}
      >
        {displaySize.width > 1 && displaySize.height > 1 && (
        <Stage
          ref={stageRef}
          width={displaySize.width}
          height={displaySize.height}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={handleStageMouseDown}
          onTouchStart={handleStageMouseDown}
        >
          <Layer listening={mode === "photo" && Boolean(photoNodeProps)}>
            <Rect
              x={0}
              y={0}
              width={STORY_CANVAS_WIDTH}
              height={STORY_CANVAS_HEIGHT}
              fill={mode === "text" ? backgroundColor : "#0F172A"}
              listening={false}
            />
            {photoNodeProps && photoImage && (
              <KonvaImage
                image={photoImage}
                {...photoNodeProps}
                draggable
                onDragStart={onPhotoDragStart}
                onDragEnd={onPhotoDragEnd}
              />
            )}
          </Layer>

          <Layer name="ui-layer" listening={false}>
            {/* Safe-zone guides */}
            <Line
              points={[0, STORY_CANVAS_HEIGHT * 0.12, STORY_CANVAS_WIDTH, STORY_CANVAS_HEIGHT * 0.12]}
              stroke="rgba(255,255,255,.14)"
              dash={[12, 10]}
              strokeWidth={2}
            />
            <Line
              points={[0, STORY_CANVAS_HEIGHT * 0.82, STORY_CANVAS_WIDTH, STORY_CANVAS_HEIGHT * 0.82]}
              stroke="rgba(255,255,255,.14)"
              dash={[12, 10]}
              strokeWidth={2}
            />
            {snapGuides.vertical && (
              <Line
                points={[STORY_CANVAS_WIDTH / 2, 0, STORY_CANVAS_WIDTH / 2, STORY_CANVAS_HEIGHT]}
                stroke="rgba(255,255,255,.62)"
                strokeWidth={2}
              />
            )}
            {snapGuides.horizontal && (
              <Line
                points={[0, STORY_CANVAS_HEIGHT / 2, STORY_CANVAS_WIDTH, STORY_CANVAS_HEIGHT / 2]}
                stroke="rgba(255,255,255,.62)"
                strokeWidth={2}
              />
            )}
          </Layer>

          {/* Content + Transformer MUST live in the same Layer — Konva requires
              them co-located so the transformer can rasterize over its target. */}
          <Layer>
            {textLayers
              .filter((layer) => layer.text.trim().length > 0)
              .map((layer) => (
                <KonvaTextNode
                  key={layer.id}
                  layer={layer}
                  selected={selectedId === layer.id}
                  onSelect={() => onSelectText(layer.id)}
                  onChange={(patch) => onChangeText(layer.id, patch)}
                  onCommitHistory={onCommitHistory}
                  onDragMove={handleDragMove}
                  onDragStart={() => onSelectText(layer.id)}
                  onDragEnd={handleDragEnd}
                  onRequestEdit={() => onRequestEditText?.(layer.id)}
                  registerNode={registerNode}
                  onSizeChange={() => {
                    if (selectedId === layer.id) {
                      requestAnimationFrame(() => {
                        const t = transformerRef.current;
                        if (t && t.nodes().length > 0) {
                          t.forceUpdate();
                          t.getLayer()?.batchDraw();
                        }
                      });
                    }
                  }}
                />
              ))}

            {stickers.map((sticker) => (
              <KonvaStickerNode
                key={sticker.id}
                sticker={sticker}
                selected={selectedId === sticker.id}
                onSelect={() => onSelectSticker(sticker.id)}
                onChange={(patch) => onChangeSticker(sticker.id, patch)}
                onCommitHistory={onCommitHistory}
                onDragMove={handleDragMove}
                onDragStart={() => onSelectSticker(sticker.id)}
                onDragEnd={handleDragEnd}
                registerNode={registerNode}
              />
            ))}

            <Transformer
              ref={transformerRef}
              rotateEnabled
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 30 || Math.abs(newBox.height) < 30) {
                  return oldBox;
                }
                return newBox;
              }}
              anchorSize={18}
              anchorCornerRadius={9}
              borderStroke="rgba(255,255,255,.85)"
              anchorStroke="rgba(255,255,255,.9)"
              anchorFill="rgba(0,0,0,.45)"
              rotateAnchorOffset={36}
            />
          </Layer>
        </Stage>
        )}
      </div>
    );
  }
);

export default KonvaStoryCanvas;
