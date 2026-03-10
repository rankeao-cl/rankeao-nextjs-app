import { apiPost } from "./client";
import type { LoginPayload, RegisterPayload, RefreshPayload } from "@/lib/types/auth";

// ── Auth API ──

export async function loginAuth(payload: LoginPayload): Promise<unknown> {
    return apiPost<unknown>("/auth/login", payload);
}

export async function registerAuth(payload: RegisterPayload): Promise<unknown> {
    return apiPost<unknown>("/auth/register", {
        ...payload,
        name: payload.username,
    });
}

export async function refreshAuth(payload: RefreshPayload): Promise<unknown> {
    return apiPost<unknown>("/auth/refresh", payload);
}

export async function forgotPassword(email: string): Promise<unknown> {
    return apiPost<unknown>("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, new_password: string): Promise<unknown> {
    return apiPost<unknown>("/auth/reset-password", { token, new_password });
}

export async function verifyEmail(token: string): Promise<unknown> {
    return apiPost<unknown>("/auth/verify-email", { token });
}

export async function changePassword(current_password: string, new_password: string, token?: string): Promise<unknown> {
    return apiPost<unknown>("/auth/change-password", { current_password, new_password }, { token });
}
