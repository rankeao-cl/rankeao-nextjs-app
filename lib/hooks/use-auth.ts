"use client";

import { useCallback, useMemo } from "react";
import { useAuthStore, normalizeAuthSession } from "@/lib/stores/auth-store";
import type { AuthSession as StoreSession } from "@/lib/stores/auth-store";
import { loginAuth, refreshAuth, registerAuth } from "@/lib/api/auth";
import type { LoginPayload, RegisterPayload } from "@/lib/types/auth";

function toPublicSession(s: StoreSession): AuthSession {
  return { email: s.email, username: s.username ?? undefined, accessToken: s.accessToken ?? undefined, refreshToken: s.refreshToken ?? undefined };
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

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

export function useAuth(): AuthContextValue {
  const email = useAuthStore((s) => s.email);
  const username = useAuthStore((s) => s.username);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const storeSetAuth = useAuthStore((s) => s.setAuth);
  const storeLogout = useAuthStore((s) => s.logout);

  const session: AuthSession | null = useMemo(
    () => accessToken ? { email, username: username ?? undefined, accessToken, refreshToken: refreshToken ?? undefined } : null,
    [email, username, accessToken, refreshToken]
  );

  const status: AuthStatus = !hasHydrated ? "loading" : !!accessToken ? "authenticated" : "unauthenticated";

  const login = useCallback(async (payload: LoginPayload): Promise<AuthSession> => {
    const response = await loginAuth(payload);
    const normalized = normalizeAuthSession(response, payload.email);
    storeSetAuth(normalized);
    return toPublicSession(normalized);
  }, [storeSetAuth]);

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthSession> => {
    const response = await registerAuth(payload);
    const normalized = normalizeAuthSession(response, payload.email);
    storeSetAuth(normalized);
    return toPublicSession(normalized);
  }, [storeSetAuth]);

  const refresh = useCallback(async (): Promise<AuthSession | null> => {
    const currentRefreshToken = useAuthStore.getState().refreshToken;
    if (!currentRefreshToken) return null;
    const response = await refreshAuth({ refresh_token: currentRefreshToken });
    const normalized = normalizeAuthSession(response, useAuthStore.getState().email);
    const merged: StoreSession = {
      email: normalized.email || useAuthStore.getState().email,
      username: normalized.username || useAuthStore.getState().username,
      accessToken: normalized.accessToken,
      refreshToken: normalized.refreshToken || currentRefreshToken,
    };
    storeSetAuth(merged);
    return toPublicSession(merged);
  }, [storeSetAuth]);

  const logout = useCallback(() => { storeLogout(); }, [storeLogout]);

  return { session, status, login, register, refresh, logout };
}
