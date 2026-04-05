import { apiPost } from "./client";
import type {
    LoginPayload,
    RegisterPayload,
    RefreshPayload,
    AuthApiResponse,
    AuthMessageResponse,
} from "@/lib/types/auth";

// ── Auth API ──

export async function loginAuth(payload: LoginPayload): Promise<AuthApiResponse> {
    return apiPost<AuthApiResponse>("/auth/login", payload);
}

export async function registerAuth(payload: RegisterPayload): Promise<AuthApiResponse> {
    return apiPost<AuthApiResponse>("/auth/register", {
        ...payload,
        name: payload.username,
    });
}

export async function refreshAuth(payload: RefreshPayload): Promise<AuthApiResponse> {
    return apiPost<AuthApiResponse>("/auth/refresh", payload);
}

export async function forgotPassword(email: string): Promise<AuthMessageResponse> {
    return apiPost<AuthMessageResponse>("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, new_password: string): Promise<AuthMessageResponse> {
    return apiPost<AuthMessageResponse>("/auth/reset-password", { token, new_password });
}

export async function verifyEmail(token: string): Promise<AuthMessageResponse> {
    return apiPost<AuthMessageResponse>("/auth/verify-email", { token });
}

/**
 * NOTE: /auth/resend-verification is not in the public OpenAPI spec.
 * This may be an internal/undocumented endpoint.
 */
export async function resendVerification(email: string): Promise<AuthMessageResponse> {
    return apiPost<AuthMessageResponse>("/auth/resend-verification", { email });
}

/**
 * NOTE: /auth/change-password is not in the public OpenAPI spec.
 * This may be an internal/undocumented endpoint.
 */
export async function changePassword(current_password: string, new_password: string, token?: string): Promise<AuthMessageResponse> {
    return apiPost<AuthMessageResponse>("/auth/change-password", { current_password, new_password }, { token });
}
