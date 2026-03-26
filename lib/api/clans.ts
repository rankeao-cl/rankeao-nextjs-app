import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import type { Params, ApiResponse, ApiMessage } from "@/lib/types/api";
import type { Clan, ClanDetail, ClanApplication, ClanChallenge, CreateClanRequest, ClanChallengeRequest } from "@/lib/types/clan";

// ── List / Detail ──

export async function getClans(params?: Params) {
    return apiFetch<ApiResponse<{ clans: Clan[] }>>("/social/clans", params, { cache: "no-store" });
}

export async function getClan(clanId: string, token?: string) {
    return apiFetch<ApiResponse<{ clan: ClanDetail }>>(`/social/clans/${encodeURIComponent(clanId)}`, undefined, { cache: "no-store", token });
}

export async function getMyClan(token?: string) {
    try {
        return await apiFetch<ApiResponse<{ clan: Clan }>>("/social/clans/mine", undefined, { cache: "no-store", token });
    } catch {
        return null;
    }
}

// ── CRUD ──

export async function createClan(data: CreateClanRequest, token?: string) {
    return apiPost<ApiResponse<{ clan: Clan }>>("/social/clans", data, { token });
}

export async function updateClan(clanId: string, data: Partial<CreateClanRequest>, token?: string) {
    return apiPatch<ApiResponse<{ clan: Clan }>>(`/social/clans/${encodeURIComponent(clanId)}`, data, { token });
}

export async function deleteClan(clanId: string, token?: string) {
    return apiDelete<ApiResponse<ApiMessage>>(`/social/clans/${encodeURIComponent(clanId)}`, { token });
}

// ── Membership ──

export async function applyToClan(clanId: string, message?: string, token?: string) {
    return apiPost<ApiResponse<{ application: ClanApplication }>>(`/social/clans/${encodeURIComponent(clanId)}/apply`, message ? { message } : {}, { token });
}

export async function leaveClan(clanId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/clans/${encodeURIComponent(clanId)}/leave`, {}, { token });
}

export async function inviteToClan(clanId: string, userId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/clans/${encodeURIComponent(clanId)}/invite`, { user_id: userId }, { token });
}

export async function removeClanMember(clanId: string, userId: string, token?: string) {
    return apiDelete<ApiResponse<ApiMessage>>(`/social/clans/${encodeURIComponent(clanId)}/members/${userId}`, { token });
}

export async function promoteClanMember(clanId: string, userId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/clans/${encodeURIComponent(clanId)}/members/${userId}/promote`, {}, { token });
}

export async function demoteClanMember(clanId: string, userId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/clans/${encodeURIComponent(clanId)}/members/${userId}/demote`, {}, { token });
}

export async function transferLeadership(clanId: string, userId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/clans/${encodeURIComponent(clanId)}/transfer-leadership`, { user_id: userId }, { token });
}

// ── Applications ──

export async function listClanApplications(clanId: string, token?: string) {
    return apiFetch<ApiResponse<{ applications: ClanApplication[] }>>(`/social/clans/${encodeURIComponent(clanId)}/applications`, undefined, { cache: "no-store", token });
}

export async function acceptClanApplication(clanId: string, appId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/clans/${encodeURIComponent(clanId)}/applications/${appId}/accept`, {}, { token });
}

export async function rejectClanApplication(clanId: string, appId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/clans/${encodeURIComponent(clanId)}/applications/${appId}/reject`, {}, { token });
}

// ── Invitations ──

export async function acceptClanInvitation(invitationId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/clans/invitations/${invitationId}/accept`, {}, { token });
}

export async function declineClanInvitation(invitationId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/clans/invitations/${invitationId}/decline`, {}, { token });
}

// ── Challenges ──

export async function getClanChallenges(clanId: string) {
    return apiFetch<ApiResponse<{ challenges: ClanChallenge[] }>>(`/social/clans/${encodeURIComponent(clanId)}/challenges`);
}

export async function createClanChallenge(clanId: string, data: ClanChallengeRequest, token?: string) {
    return apiPost<ApiResponse<{ challenge: ClanChallenge }>>(`/social/clans/${encodeURIComponent(clanId)}/challenges`, data, { token });
}

export async function acceptClanChallenge(challengeId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/clans/challenges/${challengeId}/accept`, {}, { token });
}

export async function declineClanChallenge(challengeId: string, token?: string) {
    return apiPost<ApiResponse<ApiMessage>>(`/social/clans/challenges/${challengeId}/decline`, {}, { token });
}
