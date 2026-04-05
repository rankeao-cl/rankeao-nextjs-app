"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

function decodeJwtPayload(token?: string | null): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      window.atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(json);
  } catch { return null; }
}

function isJwtExpired(token?: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= ((payload.exp as number) - 60) * 1000;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null;
}

function pickString(records: Array<Record<string, unknown> | null>, keys: string[]): string | undefined {
  for (const r of records) { for (const k of keys) { const val = r?.[k]; if (typeof val === "string" && val.trim().length > 0) return val.trim(); } }
  return undefined;
}

function cleanToken(token: string | undefined): string | undefined {
  if (!token) return undefined;
  const t = token.trim();
  return t.startsWith("Bearer ") ? t.substring(7).trim() || undefined : t;
}

export function normalizeAuthSession(payload: unknown, fallbackEmail?: string): AuthSession {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const user = asRecord(root?.user) ?? asRecord(data?.user);
  const tokens = asRecord(data?.tokens) ?? asRecord(root?.tokens);
  const email = pickString([user, data, root], ["email"]) ?? (typeof fallbackEmail === "string" ? fallbackEmail.trim() : undefined);
  if (!email) throw new Error("La API no devolvio un correo valido para la sesion.");
  const accessToken = cleanToken(pickString([tokens, root, data], ["access_token", "accessToken", "token", "jwt"]));
  const refreshToken = cleanToken(pickString([tokens, root, data], ["refresh_token", "refreshToken"]));
  let username = pickString([user, data, root], ["username", "name"]);
  if (!username && accessToken) {
    const jwt = decodeJwtPayload(accessToken);
    if (jwt) username = (jwt.usr as string) || (jwt.username as string) || (jwt.name as string) || undefined;
  }
  return { email, username: username ?? null, accessToken: accessToken ?? null, refreshToken: refreshToken ?? null };
}

export interface AuthSession {
  email: string;
  username: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthState extends AuthSession {
  _hasHydrated: boolean;
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  setAuth: (session: AuthSession) => void;
  setTokens: (data: { accessToken: string; refreshToken?: string }) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isTokenExpired: () => boolean;
}

const SESSION_COOKIE = "rankeao.auth.session";

function syncCookie(hasSession: boolean) {
  if (typeof document === "undefined") return;
  if (hasSession) document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`;
  else document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; Secure`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      email: "", username: null, accessToken: null, refreshToken: null, _hasHydrated: false, avatarUrl: null,
      setAvatarUrl: (url) => set({ avatarUrl: url }),
      setAuth: (session) => { set({ email: session.email, username: session.username, accessToken: session.accessToken, refreshToken: session.refreshToken }); syncCookie(!!session.accessToken); },
      setTokens: ({ accessToken, refreshToken }) => { set((state) => ({ accessToken, refreshToken: refreshToken ?? state.refreshToken })); syncCookie(true); },
      logout: () => { set({ email: "", username: null, accessToken: null, refreshToken: null, avatarUrl: null }); syncCookie(false); },
      isAuthenticated: () => { const { accessToken } = get(); return !!accessToken && !isJwtExpired(accessToken); },
      isTokenExpired: () => isJwtExpired(get().accessToken),
    }),
    { name: "rankeao.auth", partialize: (state) => ({ email: state.email, username: state.username, accessToken: state.accessToken, refreshToken: state.refreshToken, avatarUrl: state.avatarUrl }) }
  )
);

const LEGACY_KEY = "rankeao.auth.session";

function migrateLegacySession() {
  if (typeof window === "undefined") return;
  try {
    const newRaw = localStorage.getItem("rankeao.auth");
    if (newRaw) { const parsed = JSON.parse(newRaw); if (parsed?.state?.accessToken) return; }
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const legacy = JSON.parse(raw);
    const token = legacy.accessToken || legacy.token || legacy.access_token || legacy.jwt;
    if (!token) return;
    const clean = token.startsWith("Bearer ") ? token.substring(7) : token;
    let username = legacy.username;
    if (!username && clean) { const jwt = decodeJwtPayload(clean); if (jwt) username = (jwt.usr as string) || (jwt.username as string) || (jwt.name as string) || (jwt.sub as string); }
    useAuthStore.setState({ email: legacy.email || "", username: username || null, accessToken: clean, refreshToken: legacy.refreshToken || legacy.refresh_token || null });
    syncCookie(true);
    localStorage.removeItem(LEGACY_KEY);
  } catch {}
}

if (typeof window !== "undefined") {
  const onHydrated = () => { migrateLegacySession(); useAuthStore.setState({ _hasHydrated: true }); };
  useAuthStore.persist.onFinishHydration(onHydrated);
  if (useAuthStore.persist.hasHydrated()) onHydrated();
  setTimeout(() => { if (!useAuthStore.getState()._hasHydrated) { migrateLegacySession(); useAuthStore.setState({ _hasHydrated: true }); } }, 100);
}
