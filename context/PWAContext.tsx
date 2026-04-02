"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  const [isOffline, setIsOffline] = useState(false);

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

  // Service worker deshabilitado — sin caching

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

  const applyUpdate = useCallback(() => {}, []);

  return (
    <PWAContext.Provider
      value={{
        canInstall: Boolean(installPrompt) && !dismissed,
        install,
        dismissInstall,
        hasUpdate: false,
        applyUpdate,
        isOffline,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export const usePWA = () => useContext(PWAContext);
