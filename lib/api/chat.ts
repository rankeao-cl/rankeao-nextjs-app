import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import type { Params } from "@/lib/types/api";
import type { SendMessagePayload, CreateChannelPayload, ReportMessagePayload } from "@/lib/types/chat";

// ── Channels ──

export async function getChatChannels(params?: Params, token?: string) {
    return apiFetch<any>("/social/chat/channels", params, { cache: "no-store", token });
}

export async function createChannel(payload: CreateChannelPayload, token?: string) {
    return apiPost<any>("/social/chat/channels", payload, { token });
}

export async function leaveChannel(channelId: string, token?: string) {
    return apiPost<any>(`/social/chat/channels/${encodeURIComponent(channelId)}/leave`, {}, { token });
}

export async function addChannelMember(channelId: string, userId: string, token?: string) {
    return apiPost<any>(`/social/chat/channels/${encodeURIComponent(channelId)}/members`, { user_id: userId }, { token });
}

export async function removeChannelMember(channelId: string, userId: string, token?: string) {
    return apiDelete<any>(`/social/chat/channels/${encodeURIComponent(channelId)}/members/${userId}`, { token });
}

// ── Messages ──

export async function getChatMessages(channelId: string, params?: Params, token?: string) {
    return apiFetch<any>(`/social/chat/channels/${encodeURIComponent(channelId)}/messages`, params, { cache: "no-store", token });
}

export async function sendChatMessage(channelId: string, payload: SendMessagePayload, token?: string) {
    return apiPost<any>(`/social/chat/channels/${encodeURIComponent(channelId)}/messages`, payload, { token });
}

export async function editChatMessage(messageId: string, payload: { content: string }, token?: string) {
    return apiPatch<any>(`/social/chat/messages/${encodeURIComponent(messageId)}`, payload, { token });
}

export async function deleteChatMessage(messageId: string, token?: string) {
    return apiDelete<any>(`/social/chat/messages/${encodeURIComponent(messageId)}`, { token });
}

export async function reportMessage(messageId: string, payload: ReportMessagePayload, token?: string) {
    return apiPost<any>(`/social/chat/messages/${encodeURIComponent(messageId)}/report`, payload, { token });
}

// ── Mute ──

export async function muteChannel(channelId: string, token?: string) {
    return apiPost<any>(`/social/chat/channels/${encodeURIComponent(channelId)}/mute`, {}, { token });
}

export async function unmuteChannel(channelId: string, token?: string) {
    return apiDelete<any>(`/social/chat/channels/${encodeURIComponent(channelId)}/mute`, { token });
}
