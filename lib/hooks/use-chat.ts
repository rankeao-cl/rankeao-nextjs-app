"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as chatApi from "@/lib/api/chat";
import type { SendMessagePayload, CreateChannelPayload } from "@/lib/types/chat";
import type { Params } from "@/lib/types/api";

export function useChatChannels(params?: Params, token?: string) {
    return useQuery({
        queryKey: ["chat", "channels", params],
        queryFn: () => chatApi.getChatChannels(params, token),
    });
}

export function useChatMessages(channelId: string, params?: Params, token?: string) {
    return useQuery({
        queryKey: ["chat", "messages", channelId, params],
        queryFn: () => chatApi.getChatMessages(channelId, params, token),
        enabled: !!channelId,
        refetchInterval: 5000, // Poll for new messages
    });
}

export function useSendMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ channelId, payload }: { channelId: string; payload: SendMessagePayload }) =>
            chatApi.sendChatMessage(channelId, payload),
        onSuccess: (_, { channelId }) => qc.invalidateQueries({ queryKey: ["chat", "messages", channelId] }),
    });
}

export function useCreateChannel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateChannelPayload) => chatApi.createChannel(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "channels"] }),
    });
}

export function useDeleteMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (messageId: string) => chatApi.deleteChatMessage(messageId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "messages"] }),
    });
}
