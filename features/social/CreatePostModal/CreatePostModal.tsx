"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "@heroui/react/toast";
import type { Area } from "react-easy-crop";

import { useAuth } from "@/lib/hooks/use-auth";
import { useUIStore } from "@/lib/stores/ui-store";
import { createPost } from "@/lib/api/social";
import { uploadImage } from "@/lib/api/images";
import MarkdownToolbar from "@/features/social/MarkdownToolbar";
import MarkdownRenderer from "@/features/social/MarkdownRenderer";
import PostImageEditor from "./PostImageEditor";
import { cropImageToBlob } from "./crop-image";

type Tab = "write" | "preview";
const MAX_LENGTH = 2000;
const DRAFT_STORAGE_KEY = "rankeao:create-post-draft";

export default function CreatePostModal() {
  const isOpen = useUIStore((s) => s.createPostModalOpen);
  const closeCreatePost = useUIStore((s) => s.closeCreatePost);
  if (!isOpen) return null;
  // Keyed remount cleans every inner state + ref on close without setState-in-effect.
  return <CreatePostModalInner onClose={closeCreatePost} />;
}

function readDraft(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(value: string) {
  if (typeof window === "undefined") return;
  try {
    if (value.trim().length > 0) {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  } catch {
    // storage may be unavailable
  }
}

function CreatePostModalInner({ onClose }: { onClose: () => void }) {
  const { session } = useAuth();
  const accessToken = session?.accessToken;

  const [content, setContent] = useState<string>(() => readDraft());
  const [tab, setTab] = useState<Tab>("write");
  const [posting, setPosting] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // Persist draft as the user types.
  useEffect(() => {
    writeDraft(content);
  }, [content]);

  // Revoke any outstanding blob URLs on unmount (happens on close thanks to
  // the keyed-remount wrapper, so no explicit close effect is needed).
  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  // Focus textarea when switching to write tab.
  useEffect(() => {
    if (tab !== "write") return;
    const raf = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [tab]);

  const canSubmit = (content.trim().length > 0 || Boolean(imageSrc)) && !posting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setPosting(true);

    let imageUrl: string | undefined;

    // 1) CROP + UPLOAD (if image attached)
    if (imageSrc && croppedArea) {
      try {
        const blob = await cropImageToBlob(imageSrc, croppedArea);
        const file = new File([blob], `post-${Date.now()}.jpg`, { type: "image/jpeg" });
        const uploaded = await uploadImage(file, "user_cover", accessToken);
        imageUrl = uploaded.public_url;
      } catch (error: unknown) {
        console.error("[createPost] image upload failed", error);
        const isNetwork = error instanceof TypeError && /fetch/i.test(error.message);
        toast.danger(isNetwork ? "Sin conexión, revisa tu red" : "No se pudo subir la imagen");
        setPosting(false);
        return;
      }
    }

    // 2) PERSIST POST
    try {
      await createPost(
        { content: content.trim(), image_url: imageUrl },
        accessToken
      );
      writeDraft("");
      toast.success("Post publicado");
      onClose();
    } catch (error: unknown) {
      console.error("[createPost] persist failed", error);
      toast.danger("No se pudo publicar el post");
      setPosting(false);
    }
  }, [accessToken, canSubmit, content, croppedArea, imageSrc, onClose]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void handleSubmit();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose, handleSubmit]
  );

  const onFileSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.danger("Selecciona una imagen válida");
        return;
      }
      if (imageSrc && objectUrlsRef.current.has(imageSrc)) {
        URL.revokeObjectURL(imageSrc);
        objectUrlsRef.current.delete(imageSrc);
      }
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.add(url);
      setImageSrc(url);
      setCroppedArea(null);
    },
    [imageSrc]
  );

  const handleRemoveImage = useCallback(() => {
    if (imageSrc && objectUrlsRef.current.has(imageSrc)) {
      URL.revokeObjectURL(imageSrc);
      objectUrlsRef.current.delete(imageSrc);
    }
    setImageSrc(null);
    setCroppedArea(null);
  }, [imageSrc]);

  const remaining = MAX_LENGTH - content.length;
  const counterColor =
    remaining < 0
      ? "var(--danger)"
      : remaining < 200
        ? "var(--warning, var(--danger))"
        : "var(--muted)";

  return (
    <div
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-title"
        className="flex w-full max-w-[620px] flex-col overflow-hidden rounded-2xl border"
        style={{
          maxHeight: "90vh",
          background: "var(--surface-solid)",
          borderColor: "var(--overlay)",
        }}
      >
        {/* HEADER */}
        <header
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: "var(--surface)" }}
        >
          <h2
            id="create-post-title"
            className="m-0 text-[16px] font-bold"
            style={{ color: "var(--foreground)" }}
          >
            Crear post
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent"
            style={{ color: "var(--muted)", cursor: "pointer" }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {/* TABS + attach */}
        <div
          className="flex items-center justify-between gap-2 border-b px-4 py-2"
          style={{ borderColor: "var(--surface)" }}
        >
          <div role="tablist" className="flex gap-1">
            {(["write", "preview"] as Tab[]).map((t) => {
              const isActive = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTab(t)}
                  className="rounded-lg border-0 px-3 py-1.5 text-[13px] font-semibold transition-colors"
                  style={{
                    background: isActive
                      ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                      : "transparent",
                    color: isActive ? "var(--accent)" : "var(--muted)",
                    cursor: "pointer",
                  }}
                >
                  {t === "write" ? "Escribir" : "Vista previa"}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={Boolean(imageSrc)}
            aria-label="Adjuntar imagen"
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: "var(--overlay)",
              background: "transparent",
              color: "var(--foreground)",
              cursor: imageSrc ? "not-allowed" : "pointer",
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.5" />
              <path d="m3 17 5-5 4 4 3-3 6 6" />
            </svg>
            Foto
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onFileSelected}
            className="hidden"
          />
        </div>

        {/* BODY */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {tab === "write" ? (
            <div className="flex flex-1 flex-col">
              <MarkdownToolbar textareaRef={textareaRef} content={content} onChange={setContent} />
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(event) => setContent(event.target.value.slice(0, MAX_LENGTH))}
                placeholder="Escribe tu post... Usa **markdown** para dar formato"
                rows={imageSrc ? 5 : 10}
                className="w-full flex-1 resize-none border-0 bg-transparent px-4 py-3 text-[14px] leading-relaxed outline-none"
                style={{ color: "var(--foreground)" }}
              />
              {imageSrc && (
                <div className="border-t px-4 py-3" style={{ borderColor: "var(--surface)" }}>
                  <PostImageEditor
                    imageSrc={imageSrc}
                    onCropChange={setCroppedArea}
                    onRemove={handleRemoveImage}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[220px] space-y-3 px-4 py-3">
              {content.trim() ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="text-[14px]" style={{ color: "var(--muted)" }}>
                  Nada que mostrar...
                </p>
              )}
              {imageSrc && (
                <div
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px]"
                  style={{ borderColor: "var(--overlay)", color: "var(--muted)" }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="8.5" cy="10" r="1.5" />
                    <path d="m3 17 5-5 4 4 3-3 6 6" />
                  </svg>
                  Imagen adjunta
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer
          className="flex items-center justify-between gap-3 border-t px-4 py-3"
          style={{ borderColor: "var(--surface)" }}
        >
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--muted)" }}>
            <span style={{ color: counterColor, fontVariantNumeric: "tabular-nums" }}>
              {content.length}/{MAX_LENGTH}
            </span>
            <span className="hidden sm:inline opacity-60">·</span>
            <kbd
              className="hidden rounded border px-1.5 py-0.5 text-[10px] font-semibold sm:inline-flex"
              style={{ borderColor: "var(--overlay)", background: "var(--surface)" }}
            >
              ⌘/Ctrl + Enter
            </kbd>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-xl border-0 px-5 py-2.5 text-[14px] font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: "var(--accent)",
              color: "#fff",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {posting ? "Publicando..." : "Publicar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
