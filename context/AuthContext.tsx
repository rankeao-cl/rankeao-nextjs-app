"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginAuth, refreshAuth, registerAuth } from "@/lib/api/auth";
import type { LoginPayload, RegisterPayload } from "@/lib/types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

const SESSION_STORAGE_KEY = "rankeao.auth.session";

export interface AuthSession {
  email: string;
  username?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  status: AuthStatus;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  register: (payload: RegisterPayload) => Promise<AuthSession>;
  refresh: () => Promise<AuthSession | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return null;
}

function readString(record: Record<string, unknown> | null, key: string): string | undefined {
  const value = record?.[key];

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return undefined;
}

function pickString(
  records: Array<Record<string, unknown> | null>,
  keys: string[]
): string | undefined {
  for (const record of records) {
    for (const key of keys) {
      const found = readString(record, key);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

function cleanTokenString(token: string | undefined): string | undefined {
  if (!token) return undefined;
  const trimmed = token.trim();
  if (trimmed.startsWith("Bearer ")) {
    const withoutPrefix = trimmed.substring(7).trim();
    return withoutPrefix.length > 0 ? withoutPrefix : undefined;
  }
  return trimmed;
}

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(token?: string): boolean {
  if (!token) return true;
  const parsed = decodeJwtPayload(token);
  if (!parsed?.exp) return false;
  return Date.now() >= ((parsed.exp as number) - 60) * 1000;
}

function normalizeAuthSession(payload: unknown, fallbackEmail?: string): AuthSession {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const user = asRecord(root?.user) ?? asRecord(data?.user);

  const email =
    pickString([user, data, root], ["email"]) ??
    (typeof fallbackEmail === "string" ? fallbackEmail.trim() : undefined);

  if (!email) {
    throw new Error("La API no devolvio un correo valido para la sesion.");
  }

  const tokens = asRecord(data?.tokens) ?? asRecord(root?.tokens);

  const rawAccessToken = pickString([tokens, root, data], ["access_token", "accessToken", "token", "jwt"]);
  const rawRefreshToken = pickString([tokens, root, data], ["refresh_token", "refreshToken"]);
  const accessToken = cleanTokenString(rawAccessToken);
  const refreshToken = cleanTokenString(rawRefreshToken);
  let username = pickString([user, data, root], ["username", "name"]);

  // Fallback: extract username from JWT payload if not in response body
  if (!username && accessToken) {
    const jwtPayload = decodeJwtPayload(accessToken);
    if (jwtPayload) {
      username = (jwtPayload.usr as string) || (jwtPayload.username as string) || (jwtPayload.name as string) || undefined;
    }
  }

  return {
    email,
    username,
    accessToken,
    refreshToken,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!rawSession) {
          setStatus("unauthenticated");
          return;
        }

        const parsed = JSON.parse(rawSession) as AuthSession;
        const legacyToken = (parsed as any).token || (parsed as any).access_token || (parsed as any).jwt;
        if (legacyToken && !parsed.accessToken) {
          parsed.accessToken = legacyToken;
        }

        // Ensure username is always populated (extract from JWT if missing)
        if (!parsed.username && parsed.accessToken) {
          const jwtPayload = decodeJwtPayload(parsed.accessToken);
          if (jwtPayload) {
            const jwtUsername = (jwtPayload.usr as string) || (jwtPayload.username as string) || (jwtPayload.name as string) || (jwtPayload.sub as string);
            if (jwtUsername && typeof jwtUsername === "string") {
              parsed.username = jwtUsername;
            }
          }
        }

        if (parsed.accessToken && isTokenExpired(parsed.accessToken)) {
          if (parsed.refreshToken) {
            // Attempt to automatically refresh
            refreshAuth({ refresh_token: parsed.refreshToken })
              .then((res) => {
                const nextSession = normalizeAuthSession(res, parsed.email);
                nextSession.refreshToken = nextSession.refreshToken || parsed.refreshToken;
                setSession(nextSession);
                setStatus("authenticated");
              })
              .catch(() => {
                localStorage.removeItem(SESSION_STORAGE_KEY);
                setStatus("unauthenticated");
              });
            return; // We keep status="loading" while refreshing
          } else {
            // Expired and no refresh token
            localStorage.removeItem(SESSION_STORAGE_KEY);
            setStatus("unauthenticated");
            return;
          }
        }

        setSession(parsed);
        setStatus("authenticated");
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setStatus("unauthenticated");
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      // Sync to cookie so middleware can read auth state
      document.cookie = `${SESSION_STORAGE_KEY}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      document.cookie = `${SESSION_STORAGE_KEY}=; path=/; max-age=0`;
    }
  }, [session, status]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginAuth(payload);
    const nextSession = normalizeAuthSession(response, payload.email);
    setSession(nextSession);
    setStatus("authenticated");
    return nextSession;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await registerAuth(payload);
    const nextSession = normalizeAuthSession(response, payload.email);
    setSession(nextSession);
    setStatus("authenticated");
    return nextSession;
  }, []);

  const refresh = useCallback(async () => {
    if (!session?.refreshToken) {
      return null;
    }

    const response = await refreshAuth({ refresh_token: session.refreshToken });
    const nextSession = normalizeAuthSession(response, session.email);
    const mergedSession: AuthSession = {
      ...session,
      ...nextSession,
      email: nextSession.email || session.email,
      refreshToken: nextSession.refreshToken || session.refreshToken,
    };

    setSession(mergedSession);
    setStatus("authenticated");
    return mergedSession;
  }, [session]);

  const logout = useCallback(() => {
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      login,
      register,
      refresh,
      logout,
    }),
    [session, status, login, register, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
