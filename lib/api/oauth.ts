import { apiFetch, apiPost, apiDelete } from "./client";
import type { ApiResponse } from "@/lib/types/api";
import type {
    LinkedAccount,
    OAuthProvider,
    GenerateDiscordLinkCodeResponse,
    LinkedAccountsResponse,
} from "@/lib/types/oauth";

// ── OAuth linking API ──

export async function generateDiscordLinkCode(token?: string): Promise<GenerateDiscordLinkCodeResponse> {
    const res = await apiPost<ApiResponse<GenerateDiscordLinkCodeResponse>>(
        "/auth/oauth/discord/generate-link-code",
        {},
        { token },
    );
    const data = res?.data ?? (res as unknown as GenerateDiscordLinkCodeResponse);
    return {
        code: data?.code ?? "",
        expires_in_seconds: data?.expires_in_seconds ?? 0,
    };
}

export async function getLinkedAccounts(token?: string): Promise<LinkedAccount[]> {
    const res = await apiFetch<ApiResponse<LinkedAccountsResponse>>(
        "/auth/oauth/linked-accounts",
        undefined,
        { cache: "no-store", token },
    );
    const data = res?.data ?? (res as unknown as LinkedAccountsResponse);
    return Array.isArray(data?.accounts) ? data.accounts : [];
}

export async function unlinkOAuth(provider: OAuthProvider, token?: string): Promise<void> {
    await apiDelete<ApiResponse<{ message: string }>>(
        `/auth/oauth/${encodeURIComponent(provider)}`,
        { token },
    );
}
