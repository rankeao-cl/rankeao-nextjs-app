"use client";

import Image from "next/image";

type AddStoryButtonProps = {
  avatarUrl: string | null;
  username?: string;
  itemWidth: number;
  hasOwnStories?: boolean;
  hasUnseen?: boolean;
  onOpenCompose: () => void;
  onViewOwnStories?: () => void;
};

export default function AddStoryButton({
  avatarUrl,
  username,
  itemWidth,
  hasOwnStories = false,
  hasUnseen = false,
  onOpenCompose,
  onViewOwnStories,
}: AddStoryButtonProps) {
  const showRing = hasOwnStories;
  const ringBackground = hasUnseen
    ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 45%, #ec4899 100%)"
    : "var(--border)";

  const handleAvatarClick = () => {
    if (hasOwnStories && onViewOwnStories) {
      onViewOwnStories();
    } else {
      onOpenCompose();
    }
  };

  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        width: itemWidth,
        scrollSnapAlign: "start",
      }}
    >
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={handleAvatarClick}
          aria-label={hasOwnStories ? "Ver mis historias" : "Subir historia"}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              background: showRing ? ringBackground : "var(--foreground)",
              padding: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: 37,
                backgroundColor: "var(--background)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt={username || "Tu perfil"} width={74} height={74} className="object-cover" />
              ) : (
                <span style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>
                  {username?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenCompose();
          }}
          aria-label="Subir historia"
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "var(--accent)",
            border: "2px solid var(--background)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={3} strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--muted)",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
        }}
      >
        {hasOwnStories ? "Tu historia" : "Tu perfil"}
      </span>
    </div>
  );
}
