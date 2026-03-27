"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAContextValue {
  canInstall: boolean;
  install: () => Promise<void>;
  dismissInstall: () => void;
  hasUpdate: boolean;
  applyUpdate: () => void;
  isOffline: boolean;
}

const PWAContext = createContext<PWAContextValue>({
  canInstall: false,
  install: async () => {},
  dismissInstall: () => {},
  hasUpdate: false,
  applyUpdate: () => {},
  isOffline: false,
});

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const swRef = useRef<ServiceWorkerRegistration | null>(null);

  // Online / offline tracking
  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Capture install prompt
  useEffect(() => {
    const alreadyDismissed =
      sessionStorage.getItem("pwa-install-dismissed") === "1";
    if (alreadyDismissed) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Register service worker & listen for updates
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        swRef.current = reg;

        // Listen for a new SW waiting to activate
        const checkWaiting = () => {
          if (reg.waiting) setHasUpdate(true);
        };
        checkWaiting();
        reg.addEventListener("updatefound", () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener("statechange", () => {
            if (newSW.state === "installed" && navigator.serviceWorker.controller) {
              setHasUpdate(true);
            }
          });
        });

        // Reload when the new SW takes control
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });
      } catch {
        // SW not supported or failed silently
      }
    };

    register();
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  }, [installPrompt]);

  const dismissInstall = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  }, []);

  const applyUpdate = useCallback(() => {
    if (swRef.current?.waiting) {
      swRef.current.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  }, []);

  return (
    <PWAContext.Provider
      value={{
        canInstall: Boolean(installPrompt) && !dismissed,
        install,
        dismissInstall,
        hasUpdate,
        applyUpdate,
        isOffline,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export const usePWA = () => useContext(PWAContext);
