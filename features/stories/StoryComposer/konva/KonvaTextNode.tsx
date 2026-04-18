"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { ComposerTextLayer, ComposerTextShape } from "@/features/stories/types";
import { getFontFamilyStack } from "@/features/stories/lib/compose-canvas";
import {
  COMPOSER_TEXT_MAX_FONT_SIZE,
  COMPOSER_TEXT_MIN_FONT_SIZE,
} from "@/features/stories/lib/text-layer-factory";

const STAGE_WIDTH = 1080;
const STAGE_HEIGHT = 1920;
const MAX_TEXT_WIDTH = Math.round(STAGE_WIDTH * 0.9);
const BG_PADDING = 22;

type KonvaTextNodeProps = {
  layer: ComposerTextLayer;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ComposerTextLayer>) => void;
  onCommitHistory: () => void;
  onDragMove?: (centerX: number, centerY: number) => void;
  onDragEnd: () => void;
  onDragStart: () => void;
  onSizeChange?: () => void;
  onRequestEdit?: () => void;
  registerNode?: (id: string, node: Konva.Group | null) => void;
};

function getRadiusForShape(shape: ComposerTextShape, width: number, height: number): number {
  if (shape === "pill") return Math.max(width, height);
  if (shape === "rounded") return 22;
  return 8;
}

export default function KonvaTextNode({
  layer,
  onSelect,
  onChange,
  onCommitHistory,
  onDragMove,
  onDragStart,
  onDragEnd,
  onSizeChange,
  onRequestEdit,
  registerNode,
}: KonvaTextNodeProps) {
  const groupRef = useRef<Konva.Group | null>(null);
  const textRef = useRef<Konva.Text | null>(null);
  const [textSize, setTextSize] = useState({ width: 100, height: 40 });

  useEffect(() => {
    const node = groupRef.current;
    if (!node || !registerNode) return;
    registerNode(layer.id, node);
    return () => registerNode(layer.id, null);
  }, [layer.id, registerNode]);

  const hasBg = layer.textBackgroundMode !== "none";
  const padding = hasBg ? BG_PADDING : 0;
  const bgWidth = textSize.width + padding * 2;
  const bgHeight = textSize.height + padding * 2;
  const radius = getRadiusForShape(layer.textShape, bgWidth, bgHeight);

  // Measure text AFTER Konva paints it so the BG rect + group offset hug it.
  // Using getClientRect gives the actual rendered content box, respecting wrap,
  // instead of the raw `width` prop which is the max wrap width (too large for
  // short text and would cause the Transformer handles to appear off-screen).
  useLayoutEffect(() => {
    const t = textRef.current;
    if (!t) return;
    const rect = t.getClientRect({ skipTransform: true, skipShadow: true, skipStroke: true });
    const w = Math.max(rect.width, 40);
    const h = Math.max(rect.height, layer.fontSize);
    if (Math.abs(w - textSize.width) > 0.5 || Math.abs(h - textSize.height) > 0.5) {
      setTextSize({ width: w, height: h });
      onSizeChange?.();
    }
  }, [
    layer.text,
    layer.fontSize,
    layer.fontWeight,
    layer.fontStyle,
    layer.fontFamily,
    layer.textAlign,
    textSize.width,
    textSize.height,
    onSizeChange,
  ]);

  const centerX = (layer.x / 100) * STAGE_WIDTH;
  const centerY = (layer.y / 100) * STAGE_HEIGHT;

  return (
    <Group
      ref={groupRef}
      name={`text-${layer.id}`}
      x={centerX}
      y={centerY}
      offsetX={bgWidth / 2}
      offsetY={bgHeight / 2}
      rotation={layer.rotation}
      draggable
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDblClick={() => onRequestEdit?.()}
      onDblTap={() => onRequestEdit?.()}
      onDragStart={() => {
        onDragStart();
        onCommitHistory();
        onSelect();
      }}
      onDragMove={(event) => {
        if (!onDragMove) return;
        const node = event.target;
        // Reconstruct center from top-left + offset
        const cx = node.x();
        const cy = node.y();
        onDragMove(cx, cy);
      }}
      onDragEnd={(event) => {
        const cx = event.target.x();
        const cy = event.target.y();
        onChange({
          x: Math.max(0, Math.min(100, Math.round(((cx / STAGE_WIDTH) * 100) * 10) / 10)),
          y: Math.max(0, Math.min(100, Math.round(((cy / STAGE_HEIGHT) * 100) * 10) / 10)),
        });
        onDragEnd();
      }}
      onTransformStart={onCommitHistory}
      onTransformEnd={() => {
        const node = groupRef.current;
        if (!node) return;
        const scale = Math.max(Math.abs(node.scaleX()), Math.abs(node.scaleY()));
        const rotation = node.rotation();
        node.scaleX(1);
        node.scaleY(1);
        const nextFontSize = Math.max(
          COMPOSER_TEXT_MIN_FONT_SIZE,
          Math.min(COMPOSER_TEXT_MAX_FONT_SIZE, Math.round(layer.fontSize * scale))
        );
        onChange({ fontSize: nextFontSize, rotation });
      }}
    >
      {/* Invisible hit-area rect so the Group always has a draggable surface,
          even when there's no background and the Text alone wouldn't cover
          the spaces between letters. */}
      <Rect x={0} y={0} width={bgWidth} height={bgHeight} fill="rgba(0,0,0,0.001)" />
      {hasBg && (
        <Rect
          x={0}
          y={0}
          width={bgWidth}
          height={bgHeight}
          cornerRadius={radius}
          fill={layer.textBackgroundMode === "fill" ? layer.textBackgroundColor : undefined}
          stroke={layer.textBackgroundMode === "outline" ? layer.textBackgroundColor : undefined}
          strokeWidth={layer.textBackgroundMode === "outline" ? 5 : 0}
          listening={false}
        />
      )}
      <Text
        ref={textRef}
        x={padding}
        y={padding}
        text={layer.text || " "}
        fontSize={layer.fontSize}
        fontStyle={`${layer.fontStyle === "italic" ? "italic" : ""} ${layer.fontWeight === "bold" ? "bold" : "normal"}`.trim()}
        fontFamily={getFontFamilyStack(layer.fontFamily)}
        fill={layer.textColor}
        align={layer.textAlign}
        width={MAX_TEXT_WIDTH}
        wrap="word"
        lineHeight={1.2}
        shadowColor={hasBg ? "rgba(0,0,0,.28)" : "rgba(0,0,0,.58)"}
        shadowBlur={hasBg ? 6 : 14}
        shadowOffsetY={3}
        listening={false}
      />
    </Group>
  );
}
