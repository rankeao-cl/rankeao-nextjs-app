"use client";

import { useEffect, useState, useMemo, useRef, useCallback, type ChangeEvent, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { toast } from "@heroui/react/toast";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { browseDecks, getUserProfile, listStories, createStory, markStoryViewed as markStoryViewedApi } from "@/lib/api/social";
import { uploadImage } from "@/lib/api/images";
import type { UserProfile, Deck, StoryTrayGroup } from "@/lib/types/social";

const DeckFanModal = dynamic(() => import("@/features/deck/DeckFanModal"), { ssr: false });

type FeedItem = { kind: "deck"; date: string; data: Deck };

type StoryItem = {
  id: string;
  userId: string;
  username: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textX: number;
  textY: number;
  elapsedLabel: string;
  avatarUrl?: string;
  href: string;
  date: string;
};

const ITEM_WIDTH = 88;
const ITEM_GAP = 16;
const VISIBLE_COUNT = 6;
const PAGE_SIZE = VISIBLE_COUNT;
const SCROLL_AMOUNT = PAGE_SIZE * (ITEM_WIDTH + ITEM_GAP);
const STORY_DURATION_MS = 5000;
const STORY_TEXT_COLORS = ["#FFFFFF", "#FACC15", "#F97316", "#FB7185", "#A78BFA", "#38BDF8", "#34D399", "#111827"];
const STORY_BG_COLORS = ["#1D4ED8", "#7C3AED", "#BE123C", "#0F766E", "#D97706", "#111827", "#475569", "#A21CAF"];

function toInitials(name: string): string {
  const clean = name.trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatElapsedLabel(dateValue?: string): string {
  if (!dateValue) return "Ahora";
  const createdAt = new Date(dateValue).getTime();
  if (Number.isNaN(createdAt)) return "Ahora";
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  if (elapsedMinutes < 1) return "Ahora";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} h`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} d`;
}

export default function FeedClient() {
  const { status, session } = useAuth();
  const isAuth = status === "authenticated";
  const avatarUrl = useAuthStore((s) => s.avatarUrl);

  const [storyGroups, setStoryGroups] = useState<StoryTrayGroup[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());
  const [progressActive, setProgressActive] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [storyMode, setStoryMode] = useState<"photo" | "text">("photo");
  const [storyCaption, setStoryCaption] = useState("");
  const [storyImageFile, setStoryImageFile] = useState<File | null>(null);
  const [storyPreviewUrl, setStoryPreviewUrl] = useState<string | null>(null);
  const [storyTextColor, setStoryTextColor] = useState("#FFFFFF");
  const [storyBackgroundColor, setStoryBackgroundColor] = useState("#1D4ED8");
  const [storyFontWeight, setStoryFontWeight] = useState<"normal" | "bold">("normal");
  const [storyFontStyle, setStoryFontStyle] = useState<"normal" | "italic">("normal");
  const [storyTextPosition, setStoryTextPosition] = useState<{ x: number; y: number }>({ x: 50, y: 75 });
  const [draggingText, setDraggingText] = useState(false);
  const [publishingStory, setPublishingStory] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [capturingPhoto, setCapturingPhoto] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  const storyCameraInputRef = useRef<HTMLInputElement>(null);
  const storyVideoRef = useRef<HTMLVideoElement>(null);
  const storyCanvasRef = useRef<HTMLCanvasElement>(null);
  const storyComposerPreviewRef = useRef<HTMLDivElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!isAuth || !session?.username || avatarUrl) return;
    getUserProfile(session.username)
      .then((res) => {
        const profile = ((res?.data as { user?: UserProfile } | undefined)?.user ?? res?.data ?? res) as
          | Partial<UserProfile>
          | undefined;
        if (profile?.avatar_url) useAuthStore.getState().setAvatarUrl(profile.avatar_url);
      })
      .catch((error: unknown) => {
        console.warn("No se pudo cargar perfil para feed", error);
      });
  }, [isAuth, session?.username, avatarUrl]);

  useEffect(() => {
    browseDecks({ per_page: 15, sort: "newest" })
      .then((val: Record<string, unknown>) => {
        const d =
          ((val?.data as Record<string, unknown>)?.decks as Deck[] | undefined) ||
          (val?.data as Deck[] | undefined) ||
          (val?.decks as Deck[] | undefined) ||
          [];
        setDecks(Array.isArray(d) ? d : []);
      })
      .catch((error: unknown) => {
        console.warn("No se pudieron cargar mazos del feed", error);
      });
  }, []);

  const loadStoryTray = useCallback(async () => {
    if (!isAuth || !session?.accessToken) {
      setStoryGroups([]);
      setViewedStoryIds(new Set());
      return;
    }
    try {
      const val = await listStories(session.accessToken);
      const data = (val?.data as Record<string, unknown> | undefined) ?? undefined;
      const groups = ((data?.stories as StoryTrayGroup[] | undefined) ?? (val?.stories as StoryTrayGroup[] | undefined) ?? [])
        .filter((group) => group?.user?.id && group?.user?.username && Array.isArray(group?.stories) && group.stories.length > 0);

      setStoryGroups(groups);
      const initialViewed = new Set<string>();
      for (const group of groups) {
        for (const story of group.stories) {
          if (story?.id && story.viewed) {
            initialViewed.add(story.id);
          }
        }
      }
      setViewedStoryIds(initialViewed);
    } catch (error: unknown) {
      console.warn("No se pudieron cargar historias activas", error);
      setStoryGroups([]);
      setViewedStoryIds(new Set());
    }
  }, [isAuth, session?.accessToken]);

  useEffect(() => {
    loadStoryTray();
  }, [loadStoryTray]);

  const items = useMemo<FeedItem[]>(() => {
    const deckItems: FeedItem[] = decks.map((d) => ({
      kind: "deck",
      date: d.updated_at || d.created_at || "",
      data: d,
    }));
    return [...deckItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [decks]);

  const stories = useMemo<StoryItem[]>(() => {
    const out: StoryItem[] = [];
    for (const group of storyGroups) {
      for (const story of group.stories) {
        const caption = story.caption?.trim() ?? "";
        out.push({
          id: story.id,
          userId: group.user.id,
          username: group.user.username,
          title: caption,
          imageUrl: story.image_url,
          backgroundColor: story.background_color,
          textColor: story.text_color || "#FFFFFF",
          fontWeight: story.font_weight === "bold" ? "bold" : "normal",
          fontStyle: story.font_style === "italic" ? "italic" : "normal",
          textX: typeof story.text_x === "number" ? Math.min(100, Math.max(0, story.text_x)) : 50,
          textY: typeof story.text_y === "number" ? Math.min(100, Math.max(0, story.text_y)) : 75,
          elapsedLabel: formatElapsedLabel(story.created_at),
          avatarUrl: group.user.avatar_url,
          href: `/perfil/${group.user.username}`,
          date: story.created_at,
        });
      }
    }
    return out;
  }, [storyGroups]);

  const storyIndexByUserId = useMemo(() => {
    const map = new Map<string, number>();
    stories.forEach((story, index) => {
      if (!map.has(story.userId)) {
        map.set(story.userId, index);
      }
    });
    return map;
  }, [stories]);

  const markStoryViewed = useCallback(
    async (storyId: string) => {
      setViewedStoryIds((prev) => {
        if (prev.has(storyId)) return prev;
        const next = new Set(prev);
        next.add(storyId);
        return next;
      });
      if (!session?.accessToken) return;
      try {
        await markStoryViewedApi(storyId, session.accessToken);
      } catch (error: unknown) {
        console.warn("No se pudo marcar historia como vista", error);
      }
    },
    [session?.accessToken]
  );

  useEffect(() => {
    return () => {
      if (storyPreviewUrl) {
        URL.revokeObjectURL(storyPreviewUrl);
      }
    };
  }, [storyPreviewUrl]);

  const stopCamera = useCallback(() => {
    const stream = cameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (storyVideoRef.current) {
      storyVideoRef.current.srcObject = null;
    }
    setCameraOpen(false);
    setCameraLoading(false);
    setCapturingPhoto(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (cameraLoading || publishingStory) return;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      storyCameraInputRef.current?.click();
      return;
    }

    setCameraLoading(true);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);

      const video = storyVideoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch (error: unknown) {
      console.error("No se pudo abrir la camara", error);
      toast.danger("No se pudo abrir la camara");
      stopCamera();
    } finally {
      setCameraLoading(false);
    }
  }, [cameraLoading, publishingStory, stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!cameraOpen || capturingPhoto) return;
    const video = storyVideoRef.current;
    const canvas = storyCanvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.danger("No se pudo capturar la foto");
      return;
    }

    setCapturingPhoto(true);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      toast.danger("No se pudo capturar la foto");
      setCapturingPhoto(false);
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.danger("No se pudo capturar la foto");
          setCapturingPhoto(false);
          return;
        }
        const extension = blob.type.includes("png") ? "png" : "jpg";
        const file = new File([blob], `story-${Date.now()}.${extension}`, { type: blob.type || "image/jpeg" });
        setStoryMode("photo");
        setStoryImageFile(file);
        setStoryPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(file);
        });
        setCapturingPhoto(false);
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  }, [cameraOpen, capturingPhoto, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const resetStoryComposer = useCallback(() => {
    setStoryMode("photo");
    setStoryCaption("");
    setStoryImageFile(null);
    setStoryTextColor("#FFFFFF");
    setStoryBackgroundColor("#1D4ED8");
    setStoryFontWeight("normal");
    setStoryFontStyle("normal");
    setStoryTextPosition({ x: 50, y: 75 });
    setDraggingText(false);
    setStoryPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    stopCamera();
    setPublishingStory(false);
  }, [stopCamera]);

  const closeCreateStoryModal = useCallback(() => {
    setCreateStoryOpen(false);
    resetStoryComposer();
  }, [resetStoryComposer]);

  const openCreateStoryModal = useCallback(() => {
    if (!isAuth) return;
    setCreateStoryOpen(true);
  }, [isAuth]);

  const onStoryFileSelected = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.danger("Selecciona una imagen valida");
      return;
    }
    stopCamera();
    setStoryMode("photo");
    setStoryImageFile(file);
    setStoryPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, [stopCamera]);

  const clearStoryImage = useCallback(() => {
    setStoryImageFile(null);
    setStoryPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const updateStoryTextPositionFromPointer = useCallback((clientX: number, clientY: number) => {
    const preview = storyComposerPreviewRef.current;
    if (!preview) return;
    const rect = preview.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setStoryTextPosition({
      x: Math.max(0, Math.min(100, Math.round(x))),
      y: Math.max(0, Math.min(100, Math.round(y))),
    });
  }, []);

  const onStoryTextPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDraggingText(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      updateStoryTextPositionFromPointer(event.clientX, event.clientY);
    },
    [updateStoryTextPositionFromPointer]
  );

  const onStoryTextPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingText) return;
      updateStoryTextPositionFromPointer(event.clientX, event.clientY);
    },
    [draggingText, updateStoryTextPositionFromPointer]
  );

  const onStoryTextPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraggingText(false);
  }, []);

  const publishStory = useCallback(async () => {
    if (publishingStory) return;
    if (!session?.accessToken) {
      toast.danger("Debes iniciar sesion para publicar historias");
      return;
    }
    const trimmedCaption = storyCaption.trim();
    const shouldUseTextOnly = storyMode === "text";
    if (!storyImageFile && !trimmedCaption) {
      toast.danger("Agrega una imagen o texto para publicar la historia");
      return;
    }
    if (!shouldUseTextOnly && !storyImageFile) {
      toast.danger("Selecciona una imagen para tu historia");
      return;
    }

    setPublishingStory(true);
    try {
      let imageUrl: string | undefined;
      if (storyImageFile && !shouldUseTextOnly) {
        const uploaded = await uploadImage(storyImageFile, "user_cover", session.accessToken);
        imageUrl = uploaded.public_url;
      }
      await createStory(
        {
          image_url: imageUrl,
          caption: trimmedCaption || undefined,
          background_color: shouldUseTextOnly ? storyBackgroundColor : undefined,
          text_color: storyTextColor,
          font_weight: storyFontWeight,
          font_style: storyFontStyle,
          text_x: storyTextPosition.x,
          text_y: storyTextPosition.y,
        },
        session.accessToken
      );
      await loadStoryTray();
      toast.success("Historia publicada");
      closeCreateStoryModal();
    } catch (error: unknown) {
      console.error("No se pudo publicar la historia", error);
      toast.danger("No se pudo publicar la historia");
      setPublishingStory(false);
    }
  }, [
    publishingStory,
    session?.accessToken,
    storyImageFile,
    storyCaption,
    storyMode,
    storyBackgroundColor,
    storyTextColor,
    storyFontWeight,
    storyFontStyle,
    storyTextPosition.x,
    storyTextPosition.y,
    loadStoryTray,
    closeCreateStoryModal,
  ]);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, [updateScrollButtons, items.length, storyGroups.length, isAuth]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      const rawDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (rawDelta === 0) return;
      e.preventDefault();
      e.stopPropagation();

      const unit = e.deltaMode === 1 ? 14 : e.deltaMode === 2 ? el.clientWidth : 1;
      const pxDelta = rawDelta * unit;
      const step = Math.sign(pxDelta) * Math.min(40, Math.max(10, Math.abs(pxDelta) * 0.28));
      el.scrollBy({ left: step, behavior: "auto" });
      updateScrollButtons();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [updateScrollButtons]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "right" ? SCROLL_AMOUNT : -SCROLL_AMOUNT, behavior: "smooth" });
  };

  const closeStories = useCallback(() => setActiveStoryIndex(null), []);

  const openStoryAt = useCallback(
    (index: number) => {
      const story = stories[index];
      if (!story) return;
      markStoryViewed(story.id);
      setActiveStoryIndex(index);
    },
    [stories, markStoryViewed]
  );

  const nextStory = useCallback(() => {
    setActiveStoryIndex((prev) => {
      if (prev === null) return prev;
      const nextIndex = prev + 1;
      if (nextIndex >= stories.length) return null;
      const next = stories[nextIndex];
      if (next) markStoryViewed(next.id);
      return nextIndex;
    });
  }, [stories, markStoryViewed]);

  const prevStory = useCallback(() => {
    setActiveStoryIndex((prev) => {
      if (prev === null) return prev;
      if (prev <= 0) return 0;
      const nextIndex = prev - 1;
      const next = stories[nextIndex];
      if (next) markStoryViewed(next.id);
      return nextIndex;
    });
  }, [stories, markStoryViewed]);

  useEffect(() => {
    if (activeStoryIndex === null || stories.length === 0) return;
    const timer = window.setTimeout(nextStory, STORY_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeStoryIndex, stories.length, nextStory]);

  useEffect(() => {
    if (activeStoryIndex === null) return;
    setProgressActive(false);
    const frame = window.requestAnimationFrame(() => setProgressActive(true));
    return () => window.cancelAnimationFrame(frame);
  }, [activeStoryIndex]);

  useEffect(() => {
    if (activeStoryIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeStories();
      if (e.key === "ArrowRight") nextStory();
      if (e.key === "ArrowLeft") prevStory();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeStoryIndex, closeStories, nextStory, prevStory]);

  useEffect(() => {
    if (!createStoryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCreateStoryModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createStoryOpen, closeCreateStoryModal]);

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;
  const totalItems = (isAuth ? 1 : 0) + storyGroups.length + items.length;

  return (
    <div style={{ position: "relative" }}>
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          style={{
            position: "absolute",
            left: -6,
            top: "50%",
            transform: "translateY(-70%)",
            zIndex: 10,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "var(--surface-solid)",
            border: "1px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Anterior"
        >
          <ChevronLeft style={{ width: 14, height: 14, color: "var(--foreground)" }} />
        </button>
      )}

      {canScrollRight && totalItems > VISIBLE_COUNT && (
        <button
          onClick={() => scroll("right")}
          style={{
            position: "absolute",
            right: -6,
            top: "50%",
            transform: "translateY(-70%)",
            zIndex: 10,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "var(--surface-solid)",
            border: "1px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Siguiente"
        >
          <ChevronRight style={{ width: 14, height: 14, color: "var(--foreground)" }} />
        </button>
      )}

      <div
        ref={scrollRef}
        className="feed-stories-scroll no-scrollbar"
        style={{
          display: "flex",
          gap: ITEM_GAP,
          overflowX: "auto",
          overscrollBehavior: "contain",
          scrollbarWidth: "none",
          padding: "4px 0",
          maxWidth: VISIBLE_COUNT * ITEM_WIDTH + (VISIBLE_COUNT - 1) * ITEM_GAP,
          scrollSnapType: "x proximity",
        }}
      >
        {isAuth && (
          <button
            type="button"
            onClick={openCreateStoryModal}
            aria-label="Subir historia"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              width: ITEM_WIDTH,
              scrollSnapAlign: "start",
              cursor: "pointer",
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  background: "var(--foreground)",
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
                    <Image
                      src={avatarUrl}
                      alt={session?.username || "Tu perfil"}
                      width={74}
                      height={74}
                      className="object-cover"
                    />
                  ) : (
                    <span style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>
                      {session?.username?.[0]?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
              </div>
              <div
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
                }}
              >
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={3} strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
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
                Tu perfil
              </span>
          </button>
        )}

        {storyGroups.map((group, idx) => {
          const storyIndex = storyIndexByUserId.get(group.user.id);
          const hasUnseen = group.stories.some((story) => !viewedStoryIds.has(story.id));
          const canOpenStory = typeof storyIndex === "number";
          const snapOffset = (isAuth ? 1 : 0) + idx;
          const snapAlign = snapOffset % PAGE_SIZE === 0 ? "start" : undefined;

          return (
            <button
              key={`story-${group.user.id}`}
              type="button"
              onClick={() => {
                if (typeof storyIndex === "number") openStoryAt(storyIndex);
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: canOpenStory ? "pointer" : "default",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                width: ITEM_WIDTH,
                scrollSnapAlign: snapAlign,
              }}
              aria-label={`Ver historia de ${group.user.username}`}
              disabled={!canOpenStory}
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
        })}

        {items.map((item, idx) => {
          const snapOffset = (isAuth ? 1 : 0) + storyGroups.length + idx;
          const snapAlign = snapOffset % PAGE_SIZE === 0 ? "start" : undefined;
          const deck = item.data;
          const hasCards = deck.cards && deck.cards.length > 0;
          const coverImg = hasCards ? deck.cards?.[0]?.image_url : undefined;
          const deckOwner = deck.username ?? deck.owner?.username ?? "";
          const deckAvatar = deck.avatar_url ?? deck.owner?.avatar_url ?? "";

          return (
            <button
              key={`d-${deck.id}`}
              type="button"
              onClick={() => setActiveDeckId(deck.id)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                width: ITEM_WIDTH,
                scrollSnapAlign: snapAlign,
              }}
            >
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 18,
                    background: "var(--accent)",
                    padding: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      borderRadius: 13,
                      backgroundColor: "var(--surface-solid)",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {coverImg ? (
                      <Image src={coverImg} alt={deck.name} fill sizes="75px" className="object-cover" />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 2,
                          padding: 6,
                          textAlign: "center",
                        }}
                      >
                        <svg
                          width={22}
                          height={22}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--muted)"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="2" y="3" width="20" height="18" rx="3" />
                          <rect x="5" y="1" width="14" height="18" rx="2" opacity="0.4" />
                        </svg>
                        <span style={{ fontSize: 7, fontWeight: 700, color: "var(--muted)", lineHeight: "10px" }}>
                          {deck.game_name || "TCG"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {deckOwner && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -2,
                      left: -2,
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      background: "var(--foreground)",
                      padding: 1.5,
                      border: "2px solid var(--background)",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {deckAvatar ? (
                      <Image src={deckAvatar} alt={deckOwner} width={22} height={22} className="object-cover rounded-[11px]" />
                    ) : (
                      <span style={{ fontSize: 9, fontWeight: 800, color: "var(--background)", lineHeight: 1 }}>
                        {deckOwner[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
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
                {deckOwner || deck.name}
              </span>
            </button>
          );
        })}

        {items.length === 0 &&
          storyGroups.length === 0 &&
          !isAuth &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: ITEM_WIDTH }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "var(--surface-solid)",
                  border: "2px solid var(--border)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  width: 40,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "var(--surface-solid)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            </div>
          ))}
      </div>

      {createStoryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeCreateStoryModal}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 95,
            background: "rgba(0, 0, 0, 0.68)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 18,
              background: "var(--background)",
              border: "1px solid var(--border)",
              overflow: "hidden",
              boxShadow: "0 18px 45px rgba(0,0,0,.35)",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>Tu historia</h3>
              <button
                type="button"
                onClick={closeCreateStoryModal}
                aria-label="Cerrar"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: 24,
                  lineHeight: 1,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                ref={storyFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onStoryFileSelected}
                style={{ display: "none" }}
              />
              <input
                ref={storyCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onStoryFileSelected}
                style={{ display: "none" }}
              />
              <canvas ref={storyCanvasRef} style={{ display: "none" }} />

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setStoryMode("photo")}
                  disabled={publishingStory}
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: storyMode === "photo" ? "var(--foreground)" : "var(--surface-solid)",
                    color: storyMode === "photo" ? "var(--background)" : "var(--foreground)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: publishingStory ? "not-allowed" : "pointer",
                    opacity: publishingStory ? 0.6 : 1,
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
                  disabled={publishingStory}
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: storyMode === "text" ? "var(--foreground)" : "var(--surface-solid)",
                    color: storyMode === "text" ? "var(--background)" : "var(--foreground)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: publishingStory ? "not-allowed" : "pointer",
                    opacity: publishingStory ? 0.6 : 1,
                  }}
                >
                  Solo texto
                </button>
              </div>

              <div
                ref={storyComposerPreviewRef}
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "9 / 16",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  background: "var(--surface-solid)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cameraOpen ? (
                  <video
                    ref={storyVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : storyMode === "text" ? (
                  <div style={{ position: "absolute", inset: 0, background: storyBackgroundColor }} />
                ) : storyPreviewUrl ? (
                  <Image src={storyPreviewUrl} alt="Preview historia" fill sizes="420px" className="object-cover" />
                ) : (
                  <div style={{ textAlign: "center", color: "var(--muted)", padding: 16 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Selecciona una imagen</p>
                    <p style={{ margin: "6px 0 0", fontSize: 12 }}>Formato vertical recomendado</p>
                  </div>
                )}

                {(storyPreviewUrl || storyMode === "text") && !cameraOpen && storyCaption.trim().length > 0 && (
                  <div
                    onPointerDown={onStoryTextPointerDown}
                    onPointerMove={onStoryTextPointerMove}
                    onPointerUp={onStoryTextPointerUp}
                    style={{
                      position: "absolute",
                      left: `${storyTextPosition.x}%`,
                      top: `${storyTextPosition.y}%`,
                      transform: "translate(-50%, -50%)",
                      padding: "4px 10px",
                      borderRadius: 12,
                      background: "rgba(0,0,0,0.22)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      cursor: draggingText ? "grabbing" : "grab",
                      touchAction: "none",
                    }}
                  >
                    <span
                      style={{
                        color: storyTextColor,
                        fontSize: 22,
                        fontWeight: storyFontWeight,
                        fontStyle: storyFontStyle,
                        lineHeight: 1.2,
                        whiteSpace: "pre-wrap",
                        textAlign: "center",
                        textShadow: "0 2px 8px rgba(0,0,0,.65)",
                      }}
                    >
                      {storyCaption.trim()}
                    </span>
                  </div>
                )}

                {storyPreviewUrl && !cameraOpen && storyMode === "photo" && (
                  <button
                    type="button"
                    onClick={clearStoryImage}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,.35)",
                      background: "rgba(0,0,0,.45)",
                      color: "white",
                      cursor: "pointer",
                    }}
                    aria-label="Quitar imagen"
                  >
                    ×
                  </button>
                )}
              </div>

              <textarea
                value={storyCaption}
                onChange={(e) => setStoryCaption(e.target.value.slice(0, 120))}
                placeholder={storyMode === "text" ? "Escribe tu historia..." : "Texto de la historia (opcional)"}
                rows={2}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface-solid)",
                  color: "var(--foreground)",
                  fontSize: 14,
                  lineHeight: 1.45,
                  padding: "10px 12px",
                  outline: "none",
                  resize: "none",
                }}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {STORY_TEXT_COLORS.map((color) => (
                  <button
                    key={`text-${color}`}
                    type="button"
                    onClick={() => setStoryTextColor(color)}
                    aria-label={`Color de texto ${color}`}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      border: storyTextColor === color ? "2px solid var(--foreground)" : "1px solid var(--border)",
                      background: color,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>

              {storyMode === "text" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {STORY_BG_COLORS.map((color) => (
                    <button
                      key={`bg-${color}`}
                      type="button"
                      onClick={() => setStoryBackgroundColor(color)}
                      aria-label={`Color de fondo ${color}`}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        border: storyBackgroundColor === color ? "2px solid var(--foreground)" : "1px solid var(--border)",
                        background: color,
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setStoryFontWeight("normal");
                    setStoryFontStyle("normal");
                  }}
                  style={{
                    height: 32,
                    padding: "0 10px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: storyFontWeight === "normal" && storyFontStyle === "normal" ? "var(--foreground)" : "var(--surface-solid)",
                    color: storyFontWeight === "normal" && storyFontStyle === "normal" ? "var(--background)" : "var(--foreground)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  N
                </button>
                <button
                  type="button"
                  onClick={() => setStoryFontWeight((prev) => (prev === "bold" ? "normal" : "bold"))}
                  style={{
                    height: 32,
                    padding: "0 10px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: storyFontWeight === "bold" ? "var(--foreground)" : "var(--surface-solid)",
                    color: storyFontWeight === "bold" ? "var(--background)" : "var(--foreground)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => setStoryFontStyle((prev) => (prev === "italic" ? "normal" : "italic"))}
                  style={{
                    height: 32,
                    padding: "0 10px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: storyFontStyle === "italic" ? "var(--foreground)" : "var(--surface-solid)",
                    color: storyFontStyle === "italic" ? "var(--background)" : "var(--foreground)",
                    fontSize: 12,
                    fontStyle: "italic",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  I
                </button>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Arrastra el texto para moverlo</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={cameraLoading || publishingStory || storyMode === "text"}
                  style={{
                    height: 36,
                    padding: "0 14px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: "var(--surface-solid)",
                    color: "var(--foreground)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: cameraLoading || publishingStory || storyMode === "text" ? "not-allowed" : "pointer",
                    opacity: cameraLoading || publishingStory || storyMode === "text" ? 0.6 : 1,
                  }}
                >
                  {cameraLoading ? "Abriendo camara..." : "Tomar foto"}
                </button>

                <button
                  type="button"
                  onClick={() => storyFileInputRef.current?.click()}
                  disabled={publishingStory || storyMode === "text"}
                  style={{
                    height: 36,
                    padding: "0 14px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: "var(--surface-solid)",
                    color: "var(--foreground)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: publishingStory || storyMode === "text" ? "not-allowed" : "pointer",
                    opacity: publishingStory || storyMode === "text" ? 0.6 : 1,
                  }}
                >
                  {storyImageFile ? "Cambiar foto" : "Subir foto"}
                </button>

                {cameraOpen && (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      disabled={capturingPhoto || publishingStory}
                      style={{
                        height: 36,
                        padding: "0 14px",
                        borderRadius: 999,
                        border: "none",
                        background: "var(--accent)",
                        color: "var(--accent-foreground)",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: capturingPhoto || publishingStory ? "not-allowed" : "pointer",
                        opacity: capturingPhoto || publishingStory ? 0.6 : 1,
                      }}
                    >
                      {capturingPhoto ? "Capturando..." : "Capturar"}
                    </button>

                    <button
                      type="button"
                      onClick={stopCamera}
                      style={{
                        height: 36,
                        padding: "0 14px",
                        borderRadius: 999,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--muted)",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancelar camara
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={publishStory}
                  disabled={
                    publishingStory ||
                    cameraOpen ||
                    (!storyImageFile && !storyCaption.trim()) ||
                    (storyMode === "photo" && !storyImageFile)
                  }
                  style={{
                    height: 36,
                    padding: "0 16px",
                    borderRadius: 999,
                    border: "none",
                    background:
                      publishingStory ||
                      cameraOpen ||
                      (!storyImageFile && !storyCaption.trim()) ||
                      (storyMode === "photo" && !storyImageFile)
                        ? "var(--surface-solid)"
                        : "var(--accent)",
                    color:
                      publishingStory ||
                      cameraOpen ||
                      (!storyImageFile && !storyCaption.trim()) ||
                      (storyMode === "photo" && !storyImageFile)
                        ? "var(--muted)"
                        : "var(--accent-foreground)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor:
                      publishingStory ||
                      cameraOpen ||
                      (!storyImageFile && !storyCaption.trim()) ||
                      (storyMode === "photo" && !storyImageFile)
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {publishingStory ? "Publicando..." : "Publicar historia"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeStory && activeStoryIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeStories}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(0, 0, 0, 0.86)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 430,
              height: "min(84vh, 780px)",
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.16)",
              position: "relative",
              background: "#0b0f17",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                right: 10,
                display: "flex",
                gap: 4,
                zIndex: 3,
              }}
            >
              {stories.map((s, idx) => (
                <div
                  key={`progress-${s.id}`}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.25)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width:
                        idx < activeStoryIndex ? "100%" : idx === activeStoryIndex ? (progressActive ? "100%" : "0%") : "0%",
                      background: "white",
                      transition: idx === activeStoryIndex ? `width ${STORY_DURATION_MS}ms linear` : "none",
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={closeStories}
              aria-label="Cerrar historias"
              style={{
                position: "absolute",
                top: 18,
                right: 14,
                zIndex: 4,
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "white",
                width: 30,
                height: 30,
                borderRadius: 15,
                fontSize: 20,
                lineHeight: "24px",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <div style={{ position: "absolute", inset: 0 }}>
              {activeStory.imageUrl ? (
                <Image src={activeStory.imageUrl} alt={activeStory.title} fill sizes="430px" className="object-cover" />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: activeStory.backgroundColor
                      ? `linear-gradient(180deg, ${activeStory.backgroundColor} 0%, #0f172a 100%)`
                      : "radial-gradient(120% 120% at 80% 10%, rgba(59,130,246,.35) 0%, transparent 40%), linear-gradient(160deg, #111827 0%, #1f2937 100%)",
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.12) 42%, rgba(0,0,0,.72) 100%)",
                }}
              />
            </div>

            {activeStory.title && (
              <div
                style={{
                  position: "absolute",
                  left: `${activeStory.textX}%`,
                  top: `${activeStory.textY}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 4,
                  maxWidth: "88%",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: activeStory.textColor,
                    fontSize: 28,
                    lineHeight: 1.2,
                    fontWeight: activeStory.fontWeight,
                    fontStyle: activeStory.fontStyle,
                    textShadow: "0 3px 14px rgba(0,0,0,.55)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {activeStory.title}
                </p>
              </div>
            )}

            <div
              style={{
                position: "absolute",
                top: 24,
                left: 14,
                right: 54,
                zIndex: 4,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {activeStory.avatarUrl ? (
                  <Image src={activeStory.avatarUrl} alt={activeStory.username} width={34} height={34} className="object-cover" />
                ) : (
                  <span style={{ color: "white", fontWeight: 700, fontSize: 12 }}>{toInitials(activeStory.username)}</span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    color: "white",
                    fontWeight: 700,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {activeStory.username}
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "rgba(255,255,255,.75)",
                    fontSize: 11,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {activeStory.elapsedLabel}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={prevStory}
              aria-label="Historia anterior"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: "38%",
                zIndex: 2,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            />
            <button
              type="button"
              onClick={nextStory}
              aria-label="Historia siguiente"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                width: "38%",
                zIndex: 2,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                bottom: 18,
                zIndex: 4,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,.28)",
                  background: "rgba(0,0,0,.28)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  color: "rgba(255,255,255,.82)",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Enviar mensaje...
              </div>
              <Link
                href={activeStory.href}
                onClick={closeStories}
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
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Ver perfil
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeDeckId && <DeckFanModal deckId={activeDeckId} onClose={() => setActiveDeckId(null)} />}
    </div>
  );
}
