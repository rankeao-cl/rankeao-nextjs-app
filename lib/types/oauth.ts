// ── OAuth linking types ──

export type OAuthProvider = "DISCORD" | "GOOGLE" | "APPLE";

export interface LinkedAccount {
    provider: OAuthProvider;
    provider_display_name: string;
    linked_at: string;
}

export interface GenerateDiscordLinkCodeResponse {
    code: string;
    expires_in_seconds: number;
}

export interface LinkedAccountsResponse {
    accounts: LinkedAccount[];
}
