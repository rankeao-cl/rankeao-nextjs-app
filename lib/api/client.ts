import { toast } from "@heroui/react";
import type { FetchOptions } from "@/lib/types/api";
import { ApiError, mapErrorMessage, parseErrorResponse } from "./errors";

// ── Configuration ──

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.rankeao.cl/api/v1";
const SESSION_KEY = "rankeao.auth.session";

// ── Helpers ──

export function showErrorToast(err: unknown) {
    if (typeof window !== "undefined") {
        toast.danger("Error", { description: mapErrorMessage(err) });
    }
}

export function getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
        const rawSession = localStorage.getItem(SESSION_KEY);
        if (rawSession) {
            const parsed = JSON.parse(rawSession);
            const token = parsed.accessToken || parsed.token || parsed.access_token;
            if (token) {
                const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
                return { Authorization: `Bearer ${cleanToken}` };
            }
        }
    } catch (error) {
        // ignore
    }
    return {};
}

function cleanToken(token: string): string {
    return token.startsWith("Bearer ") ? token.substring(7) : token;
}

function buildHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = { ...getAuthHeaders() };
    if (token) {
        headers.Authorization = `Bearer ${cleanToken(token)}`;
    }
    return headers;
}

function buildMutationHeaders(token?: string): Record<string, string> {
    return { "Content-Type": "application/json", ...buildHeaders(token) };
}

// ── 401 handler: refresh token or redirect to login ──

let isRefreshing = false;

function forceLogout() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SESSION_KEY);
    toast.danger("Error", { description: "Tu sesion ha expirado. Inicia sesion nuevamente." });
    window.location.href = "/login";
}

async function tryRefreshToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const refreshToken = parsed.refreshToken || parsed.refresh_token;
        if (!refreshToken) return null;

        const res = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
            cache: "no-store",
        });

        if (!res.ok) return null;

        const data = await res.json();
        const tokens = data?.data?.tokens || data?.tokens || data;
        const newAccessToken = tokens?.access_token || tokens?.accessToken || tokens?.token;
        const newRefreshToken = tokens?.refresh_token || tokens?.refreshToken;

        if (!newAccessToken) return null;

        const clean = newAccessToken.startsWith("Bearer ") ? newAccessToken.substring(7) : newAccessToken;

        // Update localStorage
        parsed.accessToken = clean;
        if (newRefreshToken) parsed.refreshToken = newRefreshToken;
        localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));

        // Notify React context so in-flight WS connections get the fresh token
        window.dispatchEvent(new CustomEvent("rankeao:token-refreshed", {
            detail: { accessToken: clean, refreshToken: newRefreshToken ?? parsed.refreshToken },
        }));

        return clean;
    } catch {
        return null;
    }
}

async function handle401(): Promise<string | null> {
    if (isRefreshing) return null;
    isRefreshing = true;
    try {
        const newToken = await tryRefreshToken();
        if (!newToken) {
            forceLogout();
            return null;
        }
        return newToken;
    } finally {
        isRefreshing = false;
    }
}

async function handleError(res: Response, endpoint: string): Promise<never> {
    if (res.status !== 401 && res.status !== 404) {
        console.error(`API ERROR ${res.status} to ${endpoint}`);
    }

    const { code, message } = await parseErrorResponse(res);
    const error = new ApiError(code, message, res.status);

    if (res.status !== 401 && res.status !== 404) {
        showErrorToast(error);
    }

    throw error;
}

// ── Core Fetch (GET) ──

export async function apiFetch<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    options: FetchOptions = {}
): Promise<T> {
    const { revalidate = 60, cache, token } = options;
    const url = new URL(`${BASE_URL}${endpoint}`);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                url.searchParams.set(key, String(value));
            }
        });
    }

    let finalToken = token;
    if (params && params.token && typeof params.token === "string") {
        finalToken = params.token as string;
        delete params.token;
    }

    const headers = buildHeaders(finalToken);

    const fetchOptions: RequestInit & { next?: { revalidate: number } } = { headers };
    if (cache) {
        fetchOptions.cache = cache;
    } else if (revalidate !== undefined && revalidate !== false) {
        fetchOptions.next = { revalidate };
    }

    const res = await fetch(url.toString(), fetchOptions);

    // 401 → try refresh + retry once (client-side only)
    if (res.status === 401 && typeof window !== "undefined") {
        const newToken = await handle401();
        if (newToken) {
            const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
            const retryOptions: RequestInit & { next?: { revalidate: number } } = { ...fetchOptions, headers: retryHeaders };
            const retryRes = await fetch(url.toString(), retryOptions);
            if (!retryRes.ok) return handleError(retryRes, endpoint);
            return retryRes.json();
        }
        return handleError(res, endpoint);
    }

    if (!res.ok) return handleError(res, endpoint);
    return res.json();
}

// ── Core POST ──

async function mutationWithRetry<T>(
    method: string,
    endpoint: string,
    body: unknown | undefined,
    options?: { token?: string }
): Promise<T> {
    const headers = method === "DELETE"
        ? buildMutationHeaders(options?.token)
        : buildMutationHeaders(options?.token);

    const fetchOpts: RequestInit = {
        method,
        headers,
        cache: "no-store",
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, fetchOpts);

    // 401 → try refresh + retry once (client-side only)
    if (res.status === 401 && typeof window !== "undefined") {
        const newToken = await handle401();
        if (newToken) {
            const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
            const retryRes = await fetch(`${BASE_URL}${endpoint}`, { ...fetchOpts, headers: retryHeaders });
            if (!retryRes.ok) return handleError(retryRes, endpoint);
            if (retryRes.status === 204) return {} as T;
            return retryRes.json();
        }
        return handleError(res, endpoint);
    }

    if (!res.ok) return handleError(res, endpoint);
    if (res.status === 204) return {} as T;
    return res.json();
}

export async function apiPost<T>(
    endpoint: string,
    body: unknown,
    options?: { token?: string }
): Promise<T> {
    return mutationWithRetry<T>("POST", endpoint, body, options);
}

// ── Core PATCH ──

export async function apiPatch<T>(
    endpoint: string,
    body: unknown,
    options?: { token?: string }
): Promise<T> {
    return mutationWithRetry<T>("PATCH", endpoint, body, options);
}

// ── Core PUT ──

export async function apiPut<T>(
    endpoint: string,
    body: unknown,
    options?: { token?: string }
): Promise<T> {
    return mutationWithRetry<T>("PUT", endpoint, body, options);
}

// ── Core DELETE ──

export async function apiDelete<T>(
    endpoint: string,
    options?: { token?: string }
): Promise<T> {
    return mutationWithRetry<T>("DELETE", endpoint, undefined, options);
}
