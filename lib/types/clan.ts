// ── Clan types ──

export type ClanRole = "LEADER" | "OFFICER" | "MEMBER";

export interface Clan {
    id: string;
    slug?: string;
    name: string;
    tag: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    is_recruiting?: boolean;
    recruit_min_elo?: number;
    max_members?: number;
    city?: string;
    country_code?: string;
    game_id?: string;
    game_name?: string;
    game_slug?: string;
    member_count?: number;
    clan_rating?: number;
    rating?: number;
    wins?: number;
    losses?: number;
    leader_id?: string;
    leader_name?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
}

export interface ClanDetail extends Clan {
    members?: ClanMember[];
    my_membership?: ClanMember;
    stats?: ClanStats;
}

export interface ClanMember {
    user_id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    role: ClanRole;
    joined_at: string;
    rating?: number;
}

/** Simplified member shape used by card/directory UI components. */
export interface ClanMemberCard {
    id: string;
    username: string;
    avatar_url?: string;
    role?: string;
}

export interface ClanStats {
    total_wins?: number;
    total_losses?: number;
    challenges_won?: number;
    challenges_lost?: number;
}

export interface ClanApplication {
    id: string;
    user_id: string;
    username?: string;
    avatar_url?: string;
    message?: string;
    status: string;
    created_at: string;
}

export interface ClanChallenge {
    id: string;
    challenger_clan_id: string;
    challenger_clan_name?: string;
    challenged_clan_id: string;
    challenged_clan_name?: string;
    game_id?: string;
    format_id?: string;
    best_of?: number;
    scheduled_at?: string;
    status: string; // PENDING | ACCEPTED | DECLINED | COMPLETED
    result?: string;
    created_at?: string;
}

export interface ClanInvitation {
    id: string;
    clan_id: string;
    clan_name?: string;
    inviter_id: string;
    inviter_username?: string;
    invitee_id: string;
    status: string;
    created_at: string;
}

export interface CreateClanRequest {
    name: string;
    tag: string;
    description?: string;
    is_recruiting?: boolean;
    recruit_min_elo?: number;
    max_members?: number;
    city?: string;
    country_code?: string;
    game_id?: string;
    logo_url?: string;
    banner_url?: string;
}

export interface ClanChallengeRequest {
    challenged_clan_id: string;
    game_id?: string;
    format_id?: string;
    best_of?: number;
    scheduled_at?: string;
}
