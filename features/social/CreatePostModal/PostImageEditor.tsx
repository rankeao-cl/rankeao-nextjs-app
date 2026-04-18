"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

type AspectKey = "free" | "square" | "portrait" | "landscape";

const ASPECT_OPTIONS: { key: AspectKey; label: string; value: number | undefined }[] = [
  { key: "square", label: "1:1", value: 1 },
  { key: "portrait", label: "4:5", value: 4 / 5 },
  { key: "landscape", label: "16:9", value: 16 / 9 },
  { key: "free", label: "Libre", value: undefined },
];

type PostImageEditorProps = {
  imageSrc: string;
  onCropChange: (crop: Area | null) => void;
  onRemove: () => void;
};

export default function PostImageEditor({
  imageSrc,
  onCropChange,
  onRemove,
}: PostImageEditorProps) {
  const [aspectKey, setAspectKey] = useState<AspectKey>("square");
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const aspect = ASPECT_OPTIONS.find((a) => a.key === aspectKey)?.value;

  const handleCropComplete = useCallback(
    (_: Area, areaPixels: Area) => {
      onCropChange(areaPixels);
    },
    [onCropChange]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Aspect toggles */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {ASPECT_OPTIONS.map((option) => {
          const isActive = aspectKey === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setAspectKey(option.key)}
              aria-pressed={isActive}
              className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
              style={{
                background: isActive
                  ? "color-mix(in srgb, var(--accent) 18%, transparent)"
                  : "transparent",
                color: isActive ? "var(--accent)" : "var(--muted)",
              }}
            >
              {option.label}
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
          style={{ color: "var(--danger)" }}
        >
          Quitar
        </button>
      </div>

      {/* Cropper */}
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{
          height: 320,
          background: "#000",
          touchAction: "none",
        }}
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          restrictPosition={false}
          objectFit="contain"
          showGrid
          zoomWithScroll
        />
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 px-1">
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: "var(--muted)" }}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35M8 11h6" strokeLinecap="round" />
        </svg>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="h-8 flex-1 cursor-pointer accent-[var(--accent)]"
          aria-label="Zoom"
        />
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: "var(--muted)" }}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35M8 11h6M11 8v6" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
