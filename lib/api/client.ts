import { toast } from "@heroui/react";
import type { FetchOptions } from "@/lib/types/api";

// ── Configuration ──

const BASE_URL = "https://api.rankeao.cl/api/v1";

// ── Helpers ──

export function showErrorToast(errMessage: string) {
    if (typeof window !== "undefined") {
        toast.danger("Error", { description: errMessage });
    }
}

export function getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
        const rawSession = localStorage.getItem("rankeao.auth.session");
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

async function handleError(res: Response, endpoint: string): Promise<never> {
    if (res.status !== 401 && res.status !== 404) {
        console.error(`API ERROR ${res.status} to ${endpoint}`);
    }
    let message = `API error: ${res.status} ${res.statusText}`;
    try {
        const errorPayload = await res.json();
        if (typeof errorPayload === "object" && errorPayload !== null) {
            const anyPayload = errorPayload as any;
            if (typeof anyPayload.message === "string") {
                message = anyPayload.message;
            } else if (typeof anyPayload.error === "string") {
                message = anyPayload.error;
            } else if (anyPayload.error && typeof anyPayload.error.message === "string") {
                message = anyPayload.error.message;
            } else {
                message = JSON.stringify(errorPayload);
            }
        }
    } catch { }
    showErrorToast(message);
    throw new Error(message);
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
    if (!res.ok) return handleError(res, endpoint);
    return res.json();
}

// ── Core POST ──

export async function apiPost<T>(
    endpoint: string,
    body: unknown,
    options?: { token?: string }
): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: buildMutationHeaders(options?.token),
        body: JSON.stringify(body),
        cache: "no-store",
    });
    if (!res.ok) return handleError(res, endpoint);
    return res.json();
}

// ── Core PATCH ──

export async function apiPatch<T>(
    endpoint: string,
    body: unknown,
    options?: { token?: string }
): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PATCH",
        headers: buildMutationHeaders(options?.token),
        body: JSON.stringify(body),
        cache: "no-store",
    });
    if (!res.ok) return handleError(res, endpoint);
    return res.json();
}

// ── Core PUT ──

export async function apiPut<T>(
    endpoint: string,
    body: unknown,
    options?: { token?: string }
): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: buildMutationHeaders(options?.token),
        body: JSON.stringify(body),
        cache: "no-store",
    });
    if (!res.ok) return handleError(res, endpoint);
    return res.json();
}

// ── Core DELETE ──

export async function apiDelete<T>(
    endpoint: string,
    options?: { token?: string }
): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: buildMutationHeaders(options?.token),
        cache: "no-store",
    });
    if (!res.ok) return handleError(res, endpoint);
    if (res.status === 204) return {} as T;
    return res.json();
}
