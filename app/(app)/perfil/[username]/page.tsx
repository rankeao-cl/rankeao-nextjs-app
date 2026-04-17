"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Person, Shield } from "@gravity-ui/icons";
import { toast } from "@heroui/react/toast";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { getRankForElo } from "@/lib/rankSystem";
import { mapErrorMessage } from "@/lib/api/errors";
import {
    getUserProfile,
    getUserActivity,
    getUserBadges,
    getUserDecks,
    getUserCollection,
    getUserFriends,
    getUserFollowers,
    getUserFollowing,
    getUserRatingHistory,
    getUserWishlist,
    followUser,
    unfollowUser,
} from "@/lib/api/social";
import { getUserStats, getBadges } from "@/lib/api/gamification";
import { getUserTournamentHistory } from "@/lib/api/ratings";
import { getListings } from "@/lib/api/marketplace";
import type { Clan } from "@/lib/types/clan";
import type { UserProfile, Deck, CollectionItem, WishlistItem, RawFeedEntry } from "@/lib/types/social";
import type { Badge, RawGameStat } from "@/lib/types/gamification";
import type { Listing } from "@/lib/types/marketplace";
import type { RatingHistoryPoint, UserTournamentHistoryEntry } from "@/lib/types/rating";

import ProfileHeader from "./ProfileHeader";
import ProfileQuickStats from "./ProfileQuickStats";
import ProfileTabContent from "./ProfileTabContent";
import ProfileEditModal from "./ProfileEditModal";
import ProfileSidebar from "./ProfileSidebar";
import { toArray, TABS, getRankGradient, getRankRingColor } from "./profileUtils";
import type { ProfileTab } from "./profileUtils";

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function isUserProfileRecord(value: unknown): value is UserProfile {
    const record = asRecord(value);
    return Boolean(record && typeof record.id === "string" && typeof record.username === "string");
}

export default function PublicProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const unwrappedParams = use(params);
    const usernameParam = decodeURIComponent(unwrappedParams.username);
    const { session } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [activity, setActivity] = useState<RawFeedEntry[]>([]);
    const [decks, setDecks] = useState<Deck[]>([]);
    const [collection, setCollection] = useState<CollectionItem[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [followers, setFollowers] = useState<UserProfile[]>([]);
    const [following, setFollowing] = useState<UserProfile[]>([]);
    const [, setWishlist] = useState<WishlistItem[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [ratingHistory, setRatingHistory] = useState<RatingHistoryPoint[]>([]);
    const [gamiStats, setGamiStats] = useState<Record<string, unknown> | null>(null);
    const [tournamentHistory, setTournamentHistory] = useState<Record<string, unknown> | null>(null);
    const [userClan, setUserClan] = useState<Clan | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeTab, setActiveTab] = useState<ProfileTab>("actividad");

    /* ── Data fetching ── */
    useEffect(() => {
        setLoading(true);

        const fetchData = async () => {
            try {
                const extractUser = (json: unknown): UserProfile | null => {
                    const root = asRecord(json);
                    if (!root) return null;

                    const data = asRecord(root.data);
                    const dataUser = data ? asRecord(data.user) : null;
                    if (isUserProfileRecord(dataUser)) return dataUser;

                    const rootUser = asRecord(root.user);
                    if (isUserProfileRecord(rootUser)) return rootUser;

                    if (isUserProfileRecord(data)) return data;
                    if (isUserProfileRecord(root)) return root;
                    return null;
                };

                const API = process.env.NEXT_PUBLIC_API_URL || "https://api.rankeao.cl/api/v1";

                let resolvedUsername = usernameParam;
                try {
                    const searchRes = await fetch(`${API}/social/users/search?q=${encodeURIComponent(usernameParam)}`);
                    if (searchRes.ok) {
                        const json = await searchRes.json();
                        const users = json.users || json.data?.users || json.data || [];
                        const match = (Array.isArray(users) ? users : []).find(
                            (u: { username?: string }) => u.username?.toLowerCase() === usernameParam.toLowerCase()
                        );
                        if (match?.username) {
                            resolvedUsername = match.username;
                        }
                    }
                } catch { /* search failed */ }

                let profile: UserProfile | null = null;
                try {
                    const raw = await getUserProfile(resolvedUsername);
                    profile = extractUser(raw);
                } catch { /* profile fetch failed */ }

                if (!profile) {
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                setProfile(profile);
                const username = profile.username || resolvedUsername;
                const userUUID = profile.id || profile.user_id;

                if (profile.is_following != null) {
                    setIsFollowing(!!profile.is_following);
                }

                const [
                    activityRes, decksRes, colRes, badgesRes, friendsRes,
                    followersRes, followingRes, wishlistRes, historyRes,
                    gamiRes, tourneyRes, allBadgesRes,
                ] = await Promise.all([
                    getUserActivity(username).catch(() => ({ data: [] })),
                    getUserDecks(username).catch(() => ({ data: [] })),
                    getUserCollection(username).catch(() => ({ data: [] })),
                    getUserBadges(username).catch(() => ({ badges: [] })),
                    getUserFriends(username).catch(() => ({ friends: [] })),
                    getUserFollowers(username).catch(() => ({ followers: [] })),
                    getUserFollowing(username).catch(() => ({ following: [] })),
                    getUserWishlist(username).catch(() => ({ wishlist: [] })),
                    getUserRatingHistory(username).catch(() => ({ history: [] })),
                    getUserStats(username).catch(() => null),
                    getUserTournamentHistory(userUUID || username).catch(() => ({ tournaments: [], stats: {} })),
                    getBadges({ per_page: 100 }).catch(() => ({ badges: [] })),
                ]);

                setActivity(toArray(activityRes));
                setDecks(toArray(decksRes));
                setCollection(toArray(colRes));
                setBadges(toArray(badgesRes));
                setAllBadges(toArray(allBadgesRes));
                setFriends(toArray(friendsRes));
                setFollowers(toArray(followersRes));
                setFollowing(toArray(followingRes));
                setWishlist(toArray(wishlistRes));
                setRatingHistory(toArray(historyRes));
                setGamiStats((gamiRes?.data ?? gamiRes) as Record<string, unknown> | null);
                setTournamentHistory(tourneyRes as Record<string, unknown> | null);

                const clanData = profile?.clan || profile?.user_clan;
                if (clanData?.id) {
                    setUserClan(clanData as Clan);
                }

                const isOwn = session?.username?.toLowerCase() === username.toLowerCase();
                if (userUUID && isOwn) {
                    getListings({})
                        .then(res => {
                            const all = res.listings || [];
                            setListings(all.filter(l => l.seller_id === userUUID || l.seller_username === username));
                        })
                        .catch(() => setListings([]));
                }

            } catch (error) {
                console.error("Critical Profile Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [usernameParam, session?.username, session?.accessToken, router]);

    /* ── Follow handler ── */
    const handleFollow = async () => {
        const userId = profile?.id || profile?.user_id;
        if (!userId || !session?.accessToken) {
            toast.danger("Inicia sesion para seguir a este usuario.");
            return;
        }
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowUser(userId, session.accessToken);
                setIsFollowing(false);
                setFollowers((prev) => prev.filter((f) => f.username !== session?.username));
                toast.success("Dejaste de seguir a este usuario");
            } else {
                await followUser(userId, session.accessToken);
                setIsFollowing(true);
                toast.success("Ahora sigues a este usuario");
            }
        } catch (err: unknown) {
            toast.danger(mapErrorMessage(err));
        } finally {
            setFollowLoading(false);
        }
    };

    /* ── Loading state ── */
    if (loading) {
        return (
            <div className="flex justify-center flex-col items-center min-h-[50vh] gap-4" style={{ backgroundColor: "var(--background)" }}>
                <div
                    className="w-8 h-8 rounded-full animate-spin"
                    style={{
                        borderTop: "2px solid var(--accent)",
                        borderRight: "2px solid var(--accent)",
                        borderBottom: "2px solid transparent",
                        borderLeft: "2px solid transparent",
                    }}
                />
                <p className="text-[13px]" style={{ color: "var(--muted)" }}>Cargando perfil de {usernameParam}...</p>
            </div>
        );
    }

    /* ── Not found state ── */
    if (!profile) {
        return (
            <div className="flex justify-center flex-col items-center min-h-[50vh] gap-4 px-6" style={{ backgroundColor: "var(--background)" }}>
                <Person width={48} height={48} color="var(--muted)" />
                <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Usuario no encontrado</h2>
                <p className="text-sm" style={{ color: "var(--muted)" }}>El perfil al que intentas acceder no existe o es privado.</p>
                <button
                    onClick={() => router.push("/")}
                    className="rounded-full py-2.5 px-6 text-sm font-semibold cursor-pointer"
                    style={{
                        backgroundColor: "var(--surface-solid)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                    }}
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }

    /* ── Derived data ── */
    const gs = gamiStats as Record<string, number | string | unknown[] | Record<string, unknown> | null | undefined> | null;
    const name = profile?.display_name || profile?.name || profile?.username || usernameParam;
    const bio = profile?.bio || "";
    const level = (gs?.level ?? profile?.level ?? 0) as number;
    const totalXp = (gs?.xp ?? gs?.total_xp ?? profile?.total_xp ?? 0) as number;
    const xpToNextLevel = (gs?.xp_next_level ?? gs?.xp_to_next_level ?? 0) as number;
    const currentLevelXp = Math.max(0, (gs?.xp_this_level ?? gs?.current_level_xp ?? 0) as number);
    const rating = (gs?.peak_rating ?? gs?.rating ?? profile?.rating ?? 0) as number;
    const winRate = (gs?.win_rate ?? profile?.win_rate ?? 0) as number;
    const tournamentsPlayed = (gs?.tournaments_played ?? profile?.tournaments_count ?? 0) as number;
    const tournamentsWon = (gs?.tournaments_won ?? 0) as number;
    const totalMatches = (gs?.total_matches ?? 0) as number;
    const currentStreak = (gs?.current_streak ?? 0) as number;
    const bestStreak = (gs?.best_streak ?? 0) as number;
    const peakRating = (gs?.peak_rating ?? 0) as number;
    const badgesCount = (gs?.badges_earned ?? profile?.badges_count ?? badges.length) as number;
    const xpRank = (gs?.xp_rank ?? 0) as number;

    const followersCount = profile?.follower_count ?? profile?.followers_count ?? followers.length;
    const followingCount = profile?.following_count ?? following.length;
    const friendsCount = profile?.friends_count ?? friends.length;

    const isOwnProfile = session?.username === usernameParam;
    const location = [profile?.city, profile?.country].filter(Boolean).join(", ");
    const rawTitle = gs?.current_title ?? profile?.title ?? "";
    const equippedTitle = typeof rawTitle === "object" && rawTitle !== null ? (rawTitle as { name?: string }).name ?? "" : String(rawTitle);

    const gamesList: string[] = profile?.games
        ? profile.games.map((g) => typeof g === "string" ? g : g.name ?? "")
        : [];

    const xpProgress = xpToNextLevel > 0 ? Math.min(100, Math.round((currentLevelXp / xpToNextLevel) * 100)) : 0;

    const isVerified = profile?.is_verified || profile?.verified;
    const isPremium = profile?.is_premium || profile?.premium;
    const isAdmin = profile?.role === "admin" || profile?.is_admin;
    const isModerator = profile?.role === "moderator" || profile?.is_moderator;

    const tournamentEntries = toArray<UserTournamentHistoryEntry>(tournamentHistory);
    const thData = (tournamentHistory as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
    const tournamentStats = (thData?.stats ?? (tournamentHistory as Record<string, unknown>)?.stats) as { total_tournaments?: number; total_wins?: number; top4_finishes?: number; win_rate?: number } | undefined;

    const rank = getRankForElo(rating || 1000);
    const winRateDisplay = winRate != null && winRate > 0
        ? `${typeof winRate === "number" && winRate < 1 ? (winRate * 100).toFixed(0) : winRate}%`
        : "-";
    const winRateColor = (() => {
        const wr = typeof winRate === "number" && winRate < 1 ? winRate * 100 : winRate;
        if (wr >= 60) return "var(--success)";
        if (wr >= 40) return "var(--warning)";
        return "var(--danger)";
    })();

    const ringColor = getRankRingColor(level);
    const rankGradient = getRankGradient(level);
    const xpBarColor = ringColor;

    const handleProfileUpdated = (updatedProfile: Partial<UserProfile>) => {
        setProfile((prev) => prev ? { ...prev, ...updatedProfile } : prev);
        setShowEditModal(false);
    };

    const clanInline = userClan ? (
        <Link href={`/clanes/${userClan.id}`} className="inline-flex items-center gap-[5px] no-underline">
            {userClan.logo_url ? (
                <Image src={userClan.logo_url} alt={userClan.name} width={16} height={16} className="object-cover" style={{ borderRadius: 3 }} />
            ) : (
                <Shield width={12} height={12} color="var(--muted)" />
            )}
            <span className="text-xs" style={{ color: "var(--muted)" }}>
                <span className="font-bold" style={{ color: "var(--foreground)" }}>[{userClan.tag}]</span> {userClan.name}
            </span>
        </Link>
    ) : null;

    const gameStats: RawGameStat[] = Array.isArray(gs?.game_stats) ? gs.game_stats as RawGameStat[] : [];

    /* ── Render ── */
    return (
        <div className="flex flex-col w-full min-h-screen" style={{ backgroundColor: "var(--background)" }}>
            {/* 1. Header */}
            <ProfileHeader
                profile={profile}
                name={name}
                bio={bio}
                level={level}
                ringColor={ringColor}
                rankGradient={rankGradient}
                xpProgress={xpProgress}
                totalXp={totalXp}
                currentLevelXp={currentLevelXp}
                xpToNextLevel={xpToNextLevel}
                xpBarColor={xpBarColor}
                xpRank={xpRank}
                equippedTitle={equippedTitle}
                isVerified={!!isVerified}
                isPremium={!!isPremium}
                isAdmin={!!isAdmin}
                isModerator={!!isModerator}
                followersCount={followersCount}
                followingCount={followingCount}
                friendsCount={friendsCount}
                location={location}
                isOwnProfile={isOwnProfile}
                isFollowing={isFollowing}
                followLoading={followLoading}
                onFollow={handleFollow}
                onEditProfile={() => setShowEditModal(true)}
                clanInline={clanInline}
                usernameParam={usernameParam}
            />

            {/* 2. Quick Stats */}
            <ProfileQuickStats
                rating={rating}
                rank={rank}
                winRate={winRate}
                winRateDisplay={winRateDisplay}
                winRateColor={winRateColor}
                tournamentsPlayed={tournamentsPlayed}
                currentStreak={currentStreak}
                bestStreak={bestStreak}
            />

            {/* 3. Tab Navigation (sticky) */}
            <div
                className="sticky top-0 z-30 mt-5"
                style={{
                    backgroundColor: "var(--background)",
                    borderBottom: "1px solid var(--border)",
                }}
            >
                <div className="max-w-[960px] mx-auto w-full px-4">
                    <div className="overflow-x-auto py-3 no-scrollbar">
                        <div className="flex gap-1.5">
                            {TABS.map((tab) => {
                                const active = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className="rounded-full whitespace-nowrap transition-all duration-150 ease-in-out"
                                        style={{
                                            padding: "7px 18px",
                                            backgroundColor: active ? ringColor : "transparent",
                                            color: active ? "var(--accent-foreground)" : "var(--muted)",
                                            fontSize: 13,
                                            fontWeight: active ? 700 : 500,
                                            border: active ? "none" : "1px solid transparent",
                                            cursor: "pointer",
                                            boxShadow: active ? `0 2px 12px ${ringColor}40` : "none",
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Content Area */}
            <div className="max-w-[960px] mx-auto w-full px-4 pt-5 pb-12">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        <ProfileTabContent
                            activeTab={activeTab}
                            activity={activity}
                            decks={decks}
                            collection={collection}
                            badges={badges}
                            allBadges={allBadges}
                            badgesCount={badgesCount}
                            listings={listings}
                            ratingHistory={ratingHistory}
                            gamiStats={gamiStats}
                            tournamentEntries={tournamentEntries}
                            tournamentStats={tournamentStats}
                            profile={profile}
                            isOwnProfile={isOwnProfile}
                            token={session?.accessToken}
                            rating={rating}
                            peakRating={peakRating}
                            winRate={winRate}
                            totalMatches={totalMatches}
                            tournamentsPlayed={tournamentsPlayed}
                            tournamentsWon={tournamentsWon}
                            currentStreak={currentStreak}
                            bestStreak={bestStreak}
                        />
                    </div>

                    {/* Sidebar */}
                    <ProfileSidebar
                        gamesList={gamesList}
                        gameStats={gameStats}
                        profileUsername={profile?.username || ""}
                        badges={badges}
                        badgesCount={badgesCount}
                        friends={friends}
                    />
                </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <ProfileEditModal
                    profile={profile}
                    token={session?.accessToken}
                    onClose={() => setShowEditModal(false)}
                    onSaved={handleProfileUpdated}
                />
            )}
        </div>
    );
}
