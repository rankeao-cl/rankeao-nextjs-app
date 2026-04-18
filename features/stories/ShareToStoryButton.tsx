"use client";

import { useRouter } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import { useStoryDraftStore, type StoryDraft } from "@/lib/stores/story-draft-store";

type ShareToStoryButtonProps = {
  draft: StoryDraft;
  feedHref?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
};

export default function ShareToStoryButton({
  draft,
  feedHref = "/feed",
  className,
  style,
  children,
  ariaLabel = "Compartir a historia",
  disabled = false,
}: ShareToStoryButtonProps) {
  const router = useRouter();
  const openWithDraft = useStoryDraftStore((s) => s.openWithDraft);

  const handleClick = useCallback(() => {
    openWithDraft(draft);
    router.push(feedHref);
  }, [draft, feedHref, openWithDraft, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
      style={style}
    >
      {children ?? "Compartir en historia"}
    </button>
  );
}
