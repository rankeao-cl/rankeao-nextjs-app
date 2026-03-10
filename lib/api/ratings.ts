import { apiFetch } from "./client";
import type { RatingLeaderboardResponse, Season, SeasonsResponse, SeasonSnapshotsResponse, UserTournamentHistoryResponse } from "@/lib/types/rating";
import type { RatingProfile } from "@/lib/types/rating";
import type { Params } from "@/lib/types/api";

// ── Rating Leaderboard ──

export async function getRatingLeaderboard(params: {
    game: string;
    format: string;
    season?: string;
    country?: string;
    city?: string;
    page?: number;
    per_page?: number;
}): Promise<RatingLeaderboardResponse> {
    return apiFetch<RatingLeaderboardResponse>(
        "/tournaments/leaderboard",
        params as Params,
        { revalidate: 60 }
    );
}

// ── User Ratings ──

export async function getUserRating(userId: string, params: { game: string; format: string; period?: string }) {
    return apiFetch<RatingProfile>(
        `/tournaments/ratings/${encodeURIComponent(userId)}`,
        params as Params,
        { revalidate: 60 }
    );
}

// ── Seasons (Rating) ──

export async function getSeasons() {
    return apiFetch<SeasonsResponse>(
        "/tournaments/seasons",
        undefined,
        { revalidate: 300 }
    );
}

export async function getSeasonSnapshots(slug: string, params: { game: string; format: string; page?: number; per_page?: number }) {
    return apiFetch<SeasonSnapshotsResponse>(
        `/tournaments/seasons/${encodeURIComponent(slug)}/snapshots`,
        params as Params,
        { revalidate: 120 }
    );
}

// ── User Tournament History ──

export async function getUserTournamentHistory(userId: string, params?: Params) {
    return apiFetch<UserTournamentHistoryResponse>(
        `/tournaments/users/${encodeURIComponent(userId)}/history`,
        params,
        { revalidate: 60 }
    );
}
