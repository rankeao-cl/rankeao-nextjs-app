import { apiFetch, apiPost, apiPatch, apiDelete } from "./client";
import type { Params } from "@/lib/types/api";
import type { CreateClanRequest, ClanChallengeRequest } from "@/lib/types/clan";

// ── List / Detail ──

export async function getClans(params?: Params) {
    return apiFetch<any>("/social/clans", params, { revalidate: 60 });
}

export async function getClan(clanId: string) {
    return apiFetch<any>(`/social/clans/${encodeURIComponent(clanId)}`, undefined, { revalidate: 30 });
}

export async function getMyClan(token?: string) {
    return apiFetch<any>("/social/clans/mine", undefined, { cache: "no-store", token });
}

// ── CRUD ──

export async function createClan(data: CreateClanRequest, token?: string) {
    return apiPost<any>("/social/clans", data, { token });
}

export async function updateClan(clanId: string, data: Partial<CreateClanRequest>, token?: string) {
    return apiPatch<any>(`/social/clans/${encodeURIComponent(clanId)}`, data, { token });
}

export async function deleteClan(clanId: string, token?: string) {
    return apiDelete<any>(`/social/clans/${encodeURIComponent(clanId)}`, { token });
}

// ── Membership ──

export async function applyToClan(clanId: string, message?: string, token?: string) {
    return apiPost<any>(`/social/clans/${encodeURIComponent(clanId)}/apply`, message ? { message } : {}, { token });
}

export async function leaveClan(clanId: string, token?: string) {
    return apiPost<any>(`/social/clans/${encodeURIComponent(clanId)}/leave`, {}, { token });
}

export async function inviteToClan(clanId: string, userId: string, token?: string) {
    return apiPost<any>(`/social/clans/${encodeURIComponent(clanId)}/invite`, { user_id: userId }, { token });
}

export async function removeClanMember(clanId: string, userId: string, token?: string) {
    return apiDelete<any>(`/social/clans/${encodeURIComponent(clanId)}/members/${userId}`, { token });
}

export async function promoteClanMember(clanId: string, userId: string, token?: string) {
    return apiPost<any>(`/social/clans/${encodeURIComponent(clanId)}/members/${userId}/promote`, {}, { token });
}

export async function demoteClanMember(clanId: string, userId: string, token?: string) {
    return apiPost<any>(`/social/clans/${encodeURIComponent(clanId)}/members/${userId}/demote`, {}, { token });
}

export async function transferLeadership(clanId: string, userId: string, token?: string) {
    return apiPost<any>(`/social/clans/${encodeURIComponent(clanId)}/transfer-leadership`, { user_id: userId }, { token });
}

// ── Applications ──

export async function listClanApplications(clanId: string, token?: string) {
    return apiFetch<any>(`/social/clans/${encodeURIComponent(clanId)}/applications`, undefined, { cache: "no-store", token });
}

export async function acceptClanApplication(clanId: string, appId: string, token?: string) {
    return apiPost<any>(`/social/clans/${encodeURIComponent(clanId)}/applications/${appId}/accept`, {}, { token });
}

export async function rejectClanApplication(clanId: string, appId: string, token?: string) {
    return apiPost<any>(`/social/clans/${encodeURIComponent(clanId)}/applications/${appId}/reject`, {}, { token });
}

// ── Invitations ──

export async function acceptClanInvitation(invitationId: string, token?: string) {
    return apiPost<any>(`/social/clans/invitations/${invitationId}/accept`, {}, { token });
}

export async function declineClanInvitation(invitationId: string, token?: string) {
    return apiPost<any>(`/social/clans/invitations/${invitationId}/decline`, {}, { token });
}

// ── Challenges ──

export async function getClanChallenges(clanId: string) {
    return apiFetch<any>(`/social/clans/${encodeURIComponent(clanId)}/challenges`);
}

export async function createClanChallenge(clanId: string, data: ClanChallengeRequest, token?: string) {
    return apiPost<any>(`/social/clans/${encodeURIComponent(clanId)}/challenges`, data, { token });
}

export async function acceptClanChallenge(challengeId: string, token?: string) {
    return apiPost<any>(`/social/clans/challenges/${challengeId}/accept`, {}, { token });
}

export async function declineClanChallenge(challengeId: string, token?: string) {
    return apiPost<any>(`/social/clans/challenges/${challengeId}/decline`, {}, { token });
}
