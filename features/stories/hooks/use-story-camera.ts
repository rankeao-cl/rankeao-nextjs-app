"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@heroui/react/toast";

export type CaptureResult = {
  file: File;
  width: number;
  height: number;
};

export function useStoryCamera(options: { disabled?: boolean } = {}) {
  const { disabled = false } = options;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [capturing, setCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Busca el <video data-story-camera> que esté VISIBLE en el DOM.
   * Necesario porque el preview se renderiza dos veces (mobile + desktop)
   * y refs compartidos apuntan al último montado, no al visible via CSS.
   */
  const findActiveVideo = useCallback((): HTMLVideoElement | null => {
    if (typeof document === "undefined") return null;
    const videos = document.querySelectorAll<HTMLVideoElement>('video[data-story-camera="true"]');
    for (const v of videos) {
      if (v.offsetParent !== null || v.getClientRects().length > 0) return v;
    }
    return videoRef.current;
  }, []);

  const stop = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    document.querySelectorAll<HTMLVideoElement>('video[data-story-camera="true"]').forEach((v) => {
      if (v.srcObject) v.srcObject = null;
    });
    setOpen(false);
    setLoading(false);
    setCapturing(false);
  }, []);

  const readPermissionState = useCallback(async (): Promise<PermissionState | null> => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      return null;
    }
    try {
      const status = await navigator.permissions.query({ name: "camera" as PermissionName });
      return status.state;
    } catch {
      return null;
    }
  }, []);

  const refreshPermissionState = useCallback(async () => {
    const next = await readPermissionState();
    setPermissionState(next);
    return next;
  }, [readPermissionState]);

  const notifyFallback = useCallback((message?: string) => {
    if (message) toast.danger(message);
  }, []);

  const start = useCallback(async () => {
    if (loading || disabled) return;

    if (typeof window === "undefined" || !window.isSecureContext) {
      notifyFallback("La camara requiere HTTPS o localhost. Usa captura/subida manual.");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      notifyFallback("Tu navegador no soporta camara directa. Usa captura/subida manual.");
      return;
    }

    if (permissionState === "denied") {
      notifyFallback("El permiso de camara esta bloqueado en tu navegador. Habilitalo y vuelve a intentar.");
      return;
    }

    setLoading(true);
    try {
      stop();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setPermissionState("granted");
      setOpen(true);
      // El wiring del stream al <video> y el play() se hace en un useEffect
      // después de que React actualice el DOM (display:block), evitando
      // que mobile Safari/Chrome bloqueen el render del primer frame.
    } catch (error: unknown) {
      const errorName =
        typeof error === "object" && error !== null && "name" in error
          ? String((error as { name?: unknown }).name ?? "")
          : "";

      if (errorName === "NotAllowedError" || errorName === "SecurityError") {
        setPermissionState("denied");
        notifyFallback("No aceptaste el permiso de camara. Usa captura/subida manual.");
      } else if (errorName === "NotFoundError" || errorName === "OverconstrainedError") {
        notifyFallback("No encontramos una camara disponible. Puedes subir una imagen.");
      } else {
        console.error("No se pudo abrir la camara", error);
        notifyFallback("No se pudo abrir la camara. Usa captura/subida manual.");
      }
      stop();
    } finally {
      setLoading(false);
    }
  }, [loading, disabled, permissionState, stop, notifyFallback]);

  const capture = useCallback(async (): Promise<CaptureResult | null> => {
    if (!open || capturing) return null;
    const video = findActiveVideo();
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.danger("No se pudo capturar la foto");
      return null;
    }

    setCapturing(true);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      toast.danger("No se pudo capturar la foto");
      setCapturing(false);
      return null;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), "image/jpeg", 0.92);
    });

    setCapturing(false);
    if (!blob) {
      toast.danger("No se pudo capturar la foto");
      return null;
    }

    const extension = blob.type.includes("png") ? "png" : "jpg";
    const file = new File([blob], `story-${Date.now()}.${extension}`, { type: blob.type || "image/jpeg" });
    const width = video.videoWidth;
    const height = video.videoHeight;
    stop();
    return { file, width, height };
  }, [open, capturing, stop, findActiveVideo]);

  // Sync stream → <video> visible después del render. Re-sincroniza también
  // al redimensionar (por si el layout mobile↔desktop cambia y el video visible
  // es otro elemento en el DOM).
  useEffect(() => {
    if (!open) return;

    const syncStream = () => {
      const stream = streamRef.current;
      if (!stream) return;
      const video = findActiveVideo();
      if (!video) return;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      const tryPlay = () => {
        video.play().catch((error) => {
          console.warn("No se pudo reproducir el video de la camara", error);
        });
      };
      if (video.readyState >= 1) {
        tryPlay();
      } else {
        const onMeta = () => {
          tryPlay();
          video.removeEventListener("loadedmetadata", onMeta);
        };
        video.addEventListener("loadedmetadata", onMeta);
      }
    };

    syncStream();

    window.addEventListener("resize", syncStream);
    return () => window.removeEventListener("resize", syncStream);
  }, [open, findActiveVideo]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    open,
    loading,
    permissionState,
    capturing,
    videoRef,
    canvasRef,
    start,
    stop,
    capture,
    refreshPermissionState,
  };
}
