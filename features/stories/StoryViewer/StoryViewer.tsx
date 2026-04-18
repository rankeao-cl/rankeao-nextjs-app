"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { toast } from "@heroui/react/toast";
import type { Story, StoryTrayGroup } from "@/lib/types/social";
import { toInitials, formatElapsedLabel } from "@/features/stories/lib/format";
import { createChannel, sendChatMessage } from "@/lib/api/chat";
import ProgressBars from "./ProgressBars";

export { STORY_DURATION_MS } from "@/features/stories/hooks/use-story-viewer";

const HOLD_TIMEOUT_MS = 180;
const SWIPE_HORIZONTAL_COMMIT_PX = 80;
const SWIPE_VERTICAL_COMMIT_PX = 100;
const TAP_MAX_MOVE_PX = 10;
const TAP_MAX_DURATION_MS = 400;
const REACTIONS = ["❤️", "🔥", "💯", "👏", "😂"];

type StoryViewerProps = {
  group: StoryTrayGroup;
  story: Story;
  storyIndex: number;
  paused: boolean;
  progress: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onNextGroup: () => void;
  onPrevGroup: () => void;
  onPause: () => void;
  onResume: () => void;
  onTogglePause: () => void;
  preloadImageUrl?: string | null;
  accessToken?: string;
  currentUsername?: string;
};

type GestureState = {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  holdTimer: number | null;
  isHolding: boolean;
  isSwiping: boolean;
  lastDx: number;
  lastDy: number;
};

type FloatingReaction = {
  id: number;
  emoji: string;
  x: number;
  drift: number;
};

function rubberband(delta: number, dimension: number, strength = 0.55) {
  if (dimension === 0) return delta;
  const ratio = Math.abs(delta) / dimension;
  const resistance = Math.pow(1 - 1 / (ratio + 1), strength);
  return Math.sign(delta) * dimension * resistance;
}

export default function StoryViewer({
  group,
  story,
  storyIndex,
  paused,
  progress,
  onClose,
  onNext,
  onPrev,
  onNextGroup,
  onPrevGroup,
  onPause,
  onResume,
  onTogglePause,
  preloadImageUrl,
  accessToken,
  currentUsername,
}: StoryViewerProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<GestureState | null>(null);
  const reactionIdRef = useRef(0);

  const [viewportWidth, setViewportWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const [imageLoading, setImageLoading] = useState(Boolean(story.image_url));
  const [imageError, setImageError] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const elapsedLabel = formatElapsedLabel(story.created_at);
  const username = group.user.username;
  const isOwnStory = Boolean(currentUsername) && currentUsername === username;

  // Reset image state + close reply whenever the story changes.
  useEffect(() => {
    setImageLoading(Boolean(story.image_url));
    setImageError(false);
    setReplyOpen(false);
    setReplyText("");
  }, [story.id, story.image_url]);

  // Trigger scale-in animation on mount and show keyboard shortcuts briefly.
  useEffect(() => {
    setShowShortcuts(true);
    const timer = window.setTimeout(() => setShowShortcuts(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (replyOpen) return;
      if (event.key === "Escape") {
        if (menuOpen) setMenuOpen(false);
        else beginClose();
      } else if (event.key === "ArrowRight") onNext();
      else if (event.key === "ArrowLeft") onPrev();
      else if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        onTogglePause();
      } else if (event.key === "Home") onPrevGroup();
      else if (event.key === "End") onNextGroup();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNext, onPrev, onTogglePause, onPrevGroup, onNextGroup, replyOpen, menuOpen]);

  // Pause while reply is open or menu is open
  useEffect(() => {
    if (replyOpen || menuOpen) onPause();
    else if (!paused) onResume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replyOpen, menuOpen]);

  const beginClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => onClose(), 180);
  }, [closing, onClose]);

  const spawnReaction = useCallback((emoji: string, originX: number) => {
    const id = ++reactionIdRef.current;
    const drift = (Math.random() - 0.5) * 80;
    setFloatingReactions((prev) => [...prev, { id, emoji, x: originX, drift }]);
    window.setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1400);
  }, []);

  const onReactionTap = useCallback(
    (emoji: string, event: React.MouseEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const cardRect = cardRef.current?.getBoundingClientRect();
      const x = cardRect ? rect.left + rect.width / 2 - cardRect.left : rect.left + rect.width / 2;
      spawnReaction(emoji, x);
    },
    [spawnReaction]
  );

  const handleCopyLink = useCallback(async () => {
    try {
      const url = `${window.location.origin}/perfil/${username}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.danger("No se pudo copiar el link");
    }
    setMenuOpen(false);
  }, [username]);

  const handleReport = useCallback(() => {
    toast.success("Historia reportada. Gracias.");
    setMenuOpen(false);
  }, []);

  const handleMute = useCallback(() => {
    toast.success(`Silenciaste a @${username}`);
    setMenuOpen(false);
  }, [username]);

  const sendReply = useCallback(async () => {
    const content = replyText.trim();
    if (!content) return;
    if (!accessToken) {
      toast.danger("Iniciá sesión para enviar mensajes");
      return;
    }
    if (isOwnStory) {
      toast.danger("No podés responder a tu propia historia");
      return;
    }
    setSendingReply(true);
    try {
      const channelRes = await createChannel({ type: "DM", user_ids: [group.user.id] }, accessToken);
      const channelId = channelRes?.data?.channel?.id;
      if (!channelId) throw new Error("No se pudo crear el canal");
      await sendChatMessage(channelId, { content }, accessToken);
      toast.success(`Enviado a @${username}`);
      setReplyText("");
      setReplyOpen(false);
    } catch (error: unknown) {
      console.error("Reply story fallo", error);
      toast.danger("No se pudo enviar el mensaje");
    } finally {
      setSendingReply(false);
    }
  }, [replyText, accessToken, isOwnStory, group.user.id, username]);

  const clearHoldTimer = (gesture: GestureState | null) => {
    if (gesture?.holdTimer) {
      window.clearTimeout(gesture.holdTimer);
      gesture.holdTimer = null;
    }
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if (replyOpen || menuOpen) return;
    // Ignorar si el pointer cayó sobre un control interactivo (botón/link/input).
    // Sin esto, tocar reacciones / enviar / ver perfil dispararía el tap-navigation del card.
    const rawTarget = event.target as HTMLElement | null;
    if (rawTarget && rawTarget.closest('button, a, input, textarea, form, [data-story-interactive="true"]')) {
      return;
    }
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    setViewportWidth(rect.width);
    setViewportHeight(rect.height);

    const gesture: GestureState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTime: performance.now(),
      holdTimer: null,
      isHolding: false,
      isSwiping: false,
      lastDx: 0,
      lastDy: 0,
    };
    gesture.holdTimer = window.setTimeout(() => {
      if (gestureRef.current?.pointerId === gesture.pointerId && !gesture.isSwiping) {
        gesture.isHolding = true;
        onPause();
      }
    }, HOLD_TIMEOUT_MS);

    gestureRef.current = gesture;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    gesture.lastDx = dx;
    gesture.lastDy = dy;
    const moved = Math.hypot(dx, dy);
    if (moved > TAP_MAX_MOVE_PX && !gesture.isHolding) {
      gesture.isSwiping = true;
      clearHoldTimer(gesture);
      // Rubberband: horizontal flows freely, vertical only down
      const rubberX = rubberband(dx, viewportWidth || 1);
      const rubberY = dy > 0 ? rubberband(dy, viewportHeight || 1) : rubberband(dy, viewportHeight || 1, 0.75);
      setDragOffset({ x: rubberX, y: rubberY });
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    clearHoldTimer(gesture);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const dx = gesture.lastDx;
    const dy = gesture.lastDy;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const duration = performance.now() - gesture.startTime;

    gestureRef.current = null;
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });

    if (absDy > absDx && dy > SWIPE_VERTICAL_COMMIT_PX) {
      beginClose();
      return;
    }
    if (absDx > absDy && absDx > SWIPE_HORIZONTAL_COMMIT_PX) {
      if (dx < 0) onNextGroup();
      else onPrevGroup();
      return;
    }

    if (gesture.isHolding) {
      onResume();
      return;
    }

    if (duration < TAP_MAX_DURATION_MS && !gesture.isSwiping) {
      const width = viewportWidth || event.currentTarget.getBoundingClientRect().width;
      const relativeX = event.clientX - event.currentTarget.getBoundingClientRect().left;
      if (relativeX < width / 2) onPrev();
      else onNext();
    }
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    clearHoldTimer(gesture);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (gesture.isHolding) onResume();
    gestureRef.current = null;
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const cardTransform = useMemo<CSSProperties>(() => {
    const closingScale = closing ? 0.92 : 1;
    const closingOpacity = closing ? 0 : 1;
    const dragScale = isDragging ? 1 - Math.min(Math.abs(dragOffset.y), 200) / 2000 : 1;
    const scale = closingScale * dragScale;
    return {
      transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(${scale})`,
      opacity: closingOpacity,
      transition: isDragging ? "none" : "transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out",
    };
  }, [dragOffset.x, dragOffset.y, isDragging, closing]);

  const backdropOpacity = closing ? 0 : 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Historias de ${username}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        animation: closing ? undefined : "storyViewerBackdropIn 220ms ease-out",
      }}
    >
      {/* BACKDROP — negro neutro; blur de la imagen solo en desktop donde se ve detrás de la card */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background: "#000",
          opacity: backdropOpacity,
          transition: closing ? "opacity 180ms ease-out" : "opacity 220ms ease-out",
        }}
      >
        <div
          key={`backdrop-${story.id}`}
          className="hidden lg:block"
          style={{
            position: "absolute",
            inset: "-8%",
            backgroundImage: story.image_url ? `url(${story.image_url})` : undefined,
            backgroundColor: story.background_color || "#0b0f17",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(60px) brightness(0.45) saturate(1.15)",
            animation: "storyBackdropFade 380ms ease-out",
          }}
        />
        <div
          aria-hidden="true"
          className="hidden lg:block"
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }}
        />
      </div>

      {/* Invisible backdrop close button (covers non-card area) */}
      <button
        type="button"
        onClick={beginClose}
        aria-label="Cerrar historias"
        style={{
          position: "absolute",
          inset: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      />

      {/* PRELOAD next image (hidden) */}
      {preloadImageUrl && (
        <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
          <Image src={preloadImageUrl} alt="" width={430} height={780} priority={false} />
        </div>
      )}

      {/* CARD (full-screen on mobile, centered on desktop) */}
      <div
        ref={cardRef}
        className="lg:rounded-[22px] lg:border lg:border-white/10"
        style={{
          width: "100%",
          maxWidth: "min(100vw, 480px)",
          height: "100dvh",
          maxHeight: "100dvh",
          borderRadius: 0,
          overflow: "hidden",
          position: "relative",
          background: "#0b0f17",
          touchAction: "none",
          zIndex: 2,
          animation: closing ? undefined : "storyViewerEnter 240ms cubic-bezier(0.22, 1, 0.36, 1)",
          ...cardTransform,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {/* Desktop: card dimensions override */}
        <style jsx>{`
          @media (min-width: 1024px) {
            div {
              /* stub to keep style tag valid for Tailwind JIT */
            }
          }
        `}</style>

        <ProgressBars total={group.stories.length} activeIndex={storyIndex} progress={progress} />

        {/* STORY IMAGE or background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: story.image_url
              ? "#000"
              : story.background_color
                ? `linear-gradient(180deg, ${story.background_color} 0%, #0f172a 100%)`
                : "radial-gradient(120% 120% at 80% 10%, rgba(59,130,246,.35) 0%, transparent 40%), linear-gradient(160deg, #111827 0%, #1f2937 100%)",
          }}
        >
          {story.image_url && !imageError && (
            <Image
              src={story.image_url}
              alt={story.caption || `Historia de ${username}`}
              fill
              sizes="(max-width: 1024px) 100vw, 480px"
              className="object-cover"
              priority
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          )}
          {/* gradient overlay for legibility */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.08) 42%, rgba(0,0,0,.78) 100%)",
            }}
          />
        </div>

        {/* LOADING SKELETON */}
        {imageLoading && !imageError && story.image_url && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.3s linear infinite",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        )}

        {/* ERROR STATE */}
        {imageError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: 20,
              textAlign: "center",
              color: "rgba(255,255,255,0.85)",
              zIndex: 3,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="10" r="1.5" fill="currentColor" />
              <path d="m3 17 6-6 5 5 2-2 5 5" />
              <path d="M2 2l20 20" strokeLinecap="round" />
            </svg>
            <p className="m-0 text-[14px] font-semibold">No se pudo cargar</p>
            <button
              type="button"
              onClick={onNext}
              className="rounded-full border border-white/30 px-4 py-1.5 text-[12px] font-semibold"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              Saltar
            </button>
          </div>
        )}

        {/* TEXT LAYERS (only when no image) */}
        {!story.image_url &&
          Array.isArray(story.text_layers) &&
          story.text_layers.map((layer, idx) => (
            <div
              key={`${story.id}-${idx}-${layer.text_x}-${layer.text_y}`}
              style={{
                position: "absolute",
                left: `${typeof layer.text_x === "number" ? layer.text_x : 50}%`,
                top: `${typeof layer.text_y === "number" ? layer.text_y : 75}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 4,
                maxWidth: "88%",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: layer.text_color || "#FFFFFF",
                  fontSize: 32,
                  lineHeight: 1.2,
                  fontWeight: layer.font_weight === "bold" ? "bold" : "normal",
                  fontStyle: layer.font_style === "italic" ? "italic" : "normal",
                  textShadow: "0 3px 14px rgba(0,0,0,.55)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {layer.text}
              </p>
            </div>
          ))}

        {/* HEADER (avatar + username + time + kebab) */}
        <div
          style={{
            position: "absolute",
            top: 22,
            left: 14,
            right: 14,
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            gap: 10,
            pointerEvents: "none",
          }}
        >
          <Link
            href={`/perfil/${username}`}
            onClick={(e) => {
              e.stopPropagation();
              beginClose();
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, pointerEvents: "auto", minWidth: 0, flex: 1 }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.6)",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {group.user.avatar_url ? (
                <Image src={group.user.avatar_url} alt={username} width={34} height={34} className="object-cover" />
              ) : (
                <span style={{ color: "white", fontWeight: 700, fontSize: 12 }}>{toInitials(username)}</span>
              )}
            </span>
            <span style={{ minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {username}
              </span>
              <span style={{ color: "rgba(255,255,255,.75)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {elapsedLabel}
                {paused && !replyOpen && !menuOpen ? " · pausado" : ""}
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(true);
            }}
            aria-label="Más opciones"
            style={{
              pointerEvents: "auto",
              flexShrink: 0,
              width: 34,
              height: 34,
              borderRadius: 17,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              beginClose();
            }}
            aria-label="Cerrar"
            style={{
              pointerEvents: "auto",
              flexShrink: 0,
              width: 34,
              height: 34,
              borderRadius: 17,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* PAUSE INDICATOR */}
        {paused && !replyOpen && !menuOpen && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 3,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              opacity: 0.92,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
            Pausado
          </div>
        )}

        {/* CHEVRON HINTS */}
        {!isDragging && !closing && (
          <>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "50%",
                left: 8,
                transform: "translateY(-50%)",
                zIndex: 2,
                pointerEvents: "none",
                opacity: storyIndex === 0 ? 0.1 : 0.3,
                transition: "opacity 150ms ease-out",
              }}
            >
              <ChevronLeft style={{ width: 22, height: 22, color: "white", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }} />
            </div>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "50%",
                right: 8,
                transform: "translateY(-50%)",
                zIndex: 2,
                pointerEvents: "none",
                opacity: storyIndex >= group.stories.length - 1 ? 0.1 : 0.3,
                transition: "opacity 150ms ease-out",
              }}
            >
              <ChevronRight style={{ width: 22, height: 22, color: "white", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }} />
            </div>
          </>
        )}

        {/* FLOATING REACTIONS */}
        {floatingReactions.map((reaction) => (
          <span
            key={reaction.id}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: reaction.x,
              bottom: 110,
              zIndex: 6,
              fontSize: 38,
              pointerEvents: "none",
              animation: "storyReactionFloat 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
              ["--reaction-drift" as string]: `${reaction.drift}px`,
            } as CSSProperties}
          >
            {reaction.emoji}
          </span>
        ))}

        {/* FOOTER — reactions + reply + ver perfil */}
        {!isOwnStory && !imageError && (
          <div
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              bottom: "max(14px, env(safe-area-inset-bottom))",
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              pointerEvents: "none",
            }}
          >
            {/* REACTIONS ROW */}
            {!replyOpen && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  pointerEvents: "auto",
                }}
              >
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReactionTap(emoji, e);
                    }}
                    aria-label={`Reaccionar ${emoji}`}
                    className="transition-transform active:scale-90"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      border: "none",
                      background: "rgba(0,0,0,0.4)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      fontSize: 20,
                      cursor: "pointer",
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* REPLY INPUT */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
              {replyOpen ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sendReply();
                  }}
                  onClickCapture={(e) => e.stopPropagation()}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    ref={(el) => { if (el && replyOpen) el.focus(); }}
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Responder a @${username}`}
                    disabled={sendingReply}
                    maxLength={500}
                    style={{
                      flex: 1,
                      height: 42,
                      padding: "0 16px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,.3)",
                      background: "rgba(0,0,0,.5)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      color: "white",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    aria-label="Enviar mensaje"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      border: "none",
                      background: replyText.trim() ? "var(--accent, #3B82F6)" : "rgba(255,255,255,0.15)",
                      color: "white",
                      cursor: replyText.trim() ? "pointer" : "default",
                      opacity: sendingReply ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {sendingReply ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                        <path d="M21 12a9 9 0 1 1-6.22-8.57" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
                        <path d="M3 11l18-8-8 18-2-8-8-2z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyOpen(false);
                      setReplyText("");
                    }}
                    aria-label="Cancelar"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      border: "none",
                      background: "rgba(0,0,0,.5)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      color: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyOpen(true);
                    }}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,.28)",
                      background: "rgba(0,0,0,.4)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 16px",
                      color: "rgba(255,255,255,.75)",
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    Enviar mensaje...
                  </button>
                  <Link
                    href={`/perfil/${username}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      beginClose();
                    }}
                    style={{
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 42,
                      padding: "0 16px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,.32)",
                      background: "rgba(255,255,255,.14)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Ver perfil
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* KEYBOARD SHORTCUTS HINT (desktop, first 3s) */}
        {showShortcuts && (
          <div
            aria-hidden="true"
            className="hidden lg:block"
            style={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 3,
              pointerEvents: "none",
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.5)",
              color: "rgba(255,255,255,0.75)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.3,
              animation: "storyShortcutsFade 3s ease-out forwards",
              whiteSpace: "nowrap",
            }}
          >
            ← → navegar · Espacio pausar · Esc cerrar
          </div>
        )}
      </div>

      {/* KEBAB MENU — bottom sheet on mobile, popover on desktop */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(2px)",
              border: "none",
              cursor: "pointer",
              animation: "storyViewerBackdropIn 180ms ease-out",
            }}
          />
          <div
            className="lg:max-w-sm lg:self-center"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 420,
              background: "var(--background)",
              color: "var(--foreground)",
              borderRadius: "24px 24px 0 0",
              padding: "10px 12px max(14px, env(safe-area-inset-bottom))",
              boxShadow: "0 -12px 32px rgba(0,0,0,0.35)",
              animation: "mobileSheetIn 220ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div className="flex justify-center py-1">
              <div className="h-1 w-10 rounded-full" style={{ background: "var(--border)" }} />
            </div>
            <div className="flex flex-col gap-1 pt-2">
              {!isOwnStory && (
                <>
                  <MenuItem icon="flag" label="Reportar" onClick={handleReport} danger />
                  <MenuItem icon="bell-slash" label={`Silenciar a @${username}`} onClick={handleMute} />
                </>
              )}
              <MenuItem icon="link" label="Copiar link del perfil" onClick={handleCopyLink} />
              <MenuItem icon="close" label="Cerrar" onClick={() => setMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type MenuItemProps = {
  icon: "flag" | "bell-slash" | "link" | "close";
  label: string;
  onClick: () => void;
  danger?: boolean;
};

function MenuItem({ icon, label, onClick, danger = false }: MenuItemProps) {
  const iconSvg = (() => {
    switch (icon) {
      case "flag":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 21V4M4 4h12l-2 4 2 4H4" />
          </svg>
        );
      case "bell-slash":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
            <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
            <path d="M18 8a6 6 0 0 0-9.33-5" />
            <path d="M1 1l22 22" />
          </svg>
        );
      case "link":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.71" />
          </svg>
        );
      case "close":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        );
    }
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[14px] font-semibold transition-colors active:opacity-70"
      style={{
        background: "transparent",
        border: "none",
        color: danger ? "#dc2626" : "var(--foreground)",
        cursor: "pointer",
      }}
    >
      <span className="flex h-8 w-8 items-center justify-center">{iconSvg}</span>
      {label}
    </button>
  );
}
