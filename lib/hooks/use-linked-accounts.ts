"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as oauthApi from "@/lib/api/oauth";
import type { OAuthProvider } from "@/lib/types/oauth";

const LINKED_ACCOUNTS_KEY = ["auth", "linked-accounts"] as const;

export function useLinkedAccounts(token?: string, options?: { refetchInterval?: number; enabled?: boolean }) {
    return useQuery({
        queryKey: LINKED_ACCOUNTS_KEY,
        queryFn: () => oauthApi.getLinkedAccounts(token),
        staleTime: 30_000,
        refetchInterval: options?.refetchInterval,
        enabled: options?.enabled ?? true,
    });
}

export function useGenerateDiscordCode() {
    return useMutation({
        mutationFn: (token?: string) => oauthApi.generateDiscordLinkCode(token),
    });
}

export function useUnlinkOAuth() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ provider, token }: { provider: OAuthProvider; token?: string }) =>
            oauthApi.unlinkOAuth(provider, token),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: LINKED_ACCOUNTS_KEY });
        },
    });
}
