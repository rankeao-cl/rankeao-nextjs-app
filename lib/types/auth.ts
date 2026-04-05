// ── Auth types ──

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
}

export interface RefreshPayload {
    refresh_token: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    user?: {
        id: string;
        username: string;
        email: string;
        avatar_url?: string;
    };
}

export interface ResetPasswordPayload {
    token: string;
    new_password: string;
}

/**
 * Raw API response shape for auth endpoints that return user/token data.
 * The backend may nest data under `data` or at the top level.
 * Normalization happens in auth-store via `normalizeAuthSession`.
 */
export interface AuthApiResponse {
    data?: {
        user?: Record<string, unknown>;
        tokens?: { access_token?: string; refresh_token?: string };
    };
    user?: Record<string, unknown>;
    tokens?: { access_token?: string; refresh_token?: string };
    message?: string;
}

/**
 * Raw API response for endpoints that return only a status message
 * (e.g. verify-email, forgot-password, resend-verification).
 */
export interface AuthMessageResponse {
    message?: string;
}
