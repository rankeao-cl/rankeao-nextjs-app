"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Group, Image as KonvaImage, Rect, Text } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import type { StickerLayer } from "@/features/stories/types";

const STAGE_WIDTH = 1080;
const STAGE_HEIGHT = 1920;
const CARD_BASE_WIDTH = Math.round(STAGE_WIDTH * 0.32);
const EMOJI_BASE_SIZE = Math.round(STAGE_WIDTH * 0.18);

type KonvaStickerNodeProps = {
  sticker: StickerLayer;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<Omit<StickerLayer, "id" | "kind">>) => void;
  onCommitHistory: () => void;
  onDragMove?: (centerX: number, centerY: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  registerNode?: (id: string, node: Konva.Group | null) => void;
};

export default function KonvaStickerNode({
  sticker,
  onSelect,
  onChange,
  onCommitHistory,
  onDragMove,
  onDragStart,
  onDragEnd,
  registerNode,
}: KonvaStickerNodeProps) {
  const groupRef = useRef<Konva.Group | null>(null);
  const emojiRef = useRef<Konva.Text | null>(null);
  const [image] = useImage(
    sticker.kind === "card" ? sticker.imageUrl : "",
    "anonymous"
  );

  useEffect(() => {
    const node = groupRef.current;
    if (!node || !registerNode) return;
    registerNode(sticker.id, node);
    return () => registerNode(sticker.id, null);
  }, [sticker.id, registerNode]);
  const [emojiSize, setEmojiSize] = useState({ width: EMOJI_BASE_SIZE, height: EMOJI_BASE_SIZE });

  const emojiGlyph = sticker.kind === "emoji" ? sticker.emoji : null;
  useLayoutEffect(() => {
    if (!emojiGlyph) return;
    const t = emojiRef.current;
    if (!t) return;
    const w = t.width();
    const h = t.height();
    if (w !== emojiSize.width || h !== emojiSize.height) {
      setEmojiSize({ width: w, height: h });
    }
  }, [emojiGlyph, emojiSize.width, emojiSize.height]);

  const centerX = (sticker.x / 100) * STAGE_WIDTH;
  const centerY = (sticker.y / 100) * STAGE_HEIGHT;
  const scale = sticker.scale;

  // Determine natural size of this sticker for centered offset.
  let nodeWidth = CARD_BASE_WIDTH;
  let nodeHeight = CARD_BASE_WIDTH * (4 / 3);
  if (sticker.kind === "emoji") {
    nodeWidth = emojiSize.width;
    nodeHeight = emojiSize.height;
  } else if (image) {
    const aspect = image.naturalHeight / Math.max(1, image.naturalWidth);
    nodeWidth = CARD_BASE_WIDTH;
    nodeHeight = CARD_BASE_WIDTH * aspect;
  }

  return (
    <Group
      ref={groupRef}
      name={`sticker-${sticker.id}`}
      x={centerX}
      y={centerY}
      offsetX={nodeWidth / 2}
      offsetY={nodeHeight / 2}
      scaleX={scale}
      scaleY={scale}
      rotation={sticker.rotation}
      draggable
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragStart={() => {
        onDragStart();
        onCommitHistory();
        onSelect();
      }}
      onDragMove={(event) => {
        if (!onDragMove) return;
        onDragMove(event.target.x(), event.target.y());
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
        const nextScale = Math.max(0.3, Math.min(3, Math.abs(node.scaleX())));
        const rotation = node.rotation();
        // Reset node scale so state drives rendering.
        node.scaleX(sticker.scale);
        node.scaleY(sticker.scale);
        onChange({ scale: Math.round(nextScale * 100) / 100, rotation });
      }}
    >
      {/* Invisible hit area so Group has drag surface. */}
      <Rect x={0} y={0} width={nodeWidth} height={nodeHeight} fill="rgba(0,0,0,0.001)" />
      {sticker.kind === "emoji" ? (
        <Text
          ref={emojiRef}
          text={sticker.emoji}
          fontSize={EMOJI_BASE_SIZE}
          fontFamily={'"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif'}
          shadowColor="rgba(0,0,0,.45)"
          shadowBlur={14}
          shadowOffsetY={4}
          listening={false}
        />
      ) : image ? (
        <KonvaImage
          image={image}
          width={nodeWidth}
          height={nodeHeight}
          cornerRadius={24}
          shadowColor="rgba(0,0,0,.45)"
          shadowBlur={18}
          shadowOffsetY={6}
          listening={false}
        />
      ) : null}
    </Group>
  );
}
