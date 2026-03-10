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
