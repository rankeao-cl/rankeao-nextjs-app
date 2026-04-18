"use client";

import Image from "next/image";
import type { StoryTrayGroup } from "@/lib/types/social";
import { toInitials } from "@/features/stories/lib/format";

type StoryTrayItemProps = {
  group: StoryTrayGroup;
  hasUnseen: boolean;
  canOpen: boolean;
  itemWidth: number;
  scrollSnapAlign?: "start";
  onClick: () => void;
};

export default function StoryTrayItem({
  group,
  hasUnseen,
  canOpen,
  itemWidth,
  scrollSnapAlign,
  onClick,
}: StoryTrayItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canOpen}
      aria-label={`Ver historia de ${group.user.username}`}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: canOpen ? "pointer" : "default",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        width: itemWidth,
        scrollSnapAlign,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          background: hasUnseen
            ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 45%, #ec4899 100%)"
            : "var(--border)",
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
          {group.user.avatar_url ? (
            <Image src={group.user.avatar_url} alt={group.user.username} width={74} height={74} className="object-cover" />
          ) : (
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>
              {toInitials(group.user.username)}
            </span>
          )}
        </div>
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
        {group.user.username}
      </span>
    </button>
  );
}
