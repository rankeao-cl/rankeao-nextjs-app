import { apiFetch, apiPost, apiPatch, apiDelete, BASE_URL } from "./client";
import type { Params, ApiResponse, ApiMessage } from "@/lib/types/api";
import type { Channel, ChatMessage, Room, SendMessagePayload, CreateChannelPayload, ReportMessagePayload, RoomListFilters } from "@/lib/types/chat";

// ── Channels ──

export async function getChatChannels(params?: Params, token?: string) {
    return apiFetch<ApiResponse<{ channels: Channel[] }>>("/social/chat/channels", params, { cache: "no-store", token });
}

export async function createChannel(payload: CreateChannelPayload, token?: string) {
    return apiPost<ApiResponse<{ channel: Channel }>>("/social/chat/channels", payload, { token });
}

export async function leaveChannel(channelId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/chat/channels/${encodeURIComponent(channelId)}/leave`, {}, { token });
}

export async function addChannelMember(channelId: string, userId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/chat/channels/${encodeURIComponent(channelId)}/members`, { user_id: userId }, { token });
}

export async function removeChannelMember(channelId: string, userId: string, token?: string) {
    return apiDelete<ApiResponse<ApiMessage>>(`/social/chat/channels/${encodeURIComponent(channelId)}/members/${userId}`, { token });
}

// ── Messages ──

export async function getChatMessages(channelId: string, params?: Params, token?: string) {
    return apiFetch<ApiResponse<{ messages: ChatMessage[] }>>(`/social/chat/channels/${encodeURIComponent(channelId)}/messages`, params, { cache: "no-store", token });
}

export async function sendChatMessage(channelId: string, payload: SendMessagePayload, token?: string) {
    return apiPost<ApiResponse<{ message: ChatMessage }>>(`/social/chat/channels/${encodeURIComponent(channelId)}/messages`, payload, { token });
}

export async function editChatMessage(messageId: string, payload: { content: string }, token?: string) {
    return apiPatch<ApiResponse<{ message: ChatMessage }>>(`/social/chat/messages/${encodeURIComponent(messageId)}`, payload, { token });
}

export async function deleteChatMessage(messageId: string, token?: string) {
    return apiDelete<ApiResponse<ApiMessage>>(`/social/chat/messages/${encodeURIComponent(messageId)}`, { token });
}

export async function reportMessage(messageId: string, payload: ReportMessagePayload, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/chat/messages/${encodeURIComponent(messageId)}/report`, payload, { token });
}

// ── Mute ──

export async function muteChannel(channelId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/chat/channels/${encodeURIComponent(channelId)}/mute`, {}, { token });
}

export async function unmuteChannel(channelId: string, token?: string) {
    return apiDelete<ApiResponse<ApiMessage>>(`/social/chat/channels/${encodeURIComponent(channelId)}/mute`, { token });
}

// ── Rooms ──

export async function getChatRooms(filters?: RoomListFilters, token?: string) {
    return apiFetch<ApiResponse<{ rooms: Room[] }>>("/social/chat/rooms", filters as Params, { cache: "no-store", token });
}

export async function joinRoom(roomId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/chat/rooms/${encodeURIComponent(roomId)}/join`, {}, { token });
}

// ── WebSocket ──

const WS_BASE_URL = BASE_URL
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:");

export function getChatRoomWSUrl(roomId: string, token: string): string {
    return `${WS_BASE_URL}/social/chat/rooms/${encodeURIComponent(roomId)}/ws?token=${encodeURIComponent(token)}`;
}
