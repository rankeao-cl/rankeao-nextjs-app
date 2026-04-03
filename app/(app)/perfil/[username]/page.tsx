"use client";

import { useEffect, useState, use } from "react";
import PostCard from "@/features/social/PostCard";
import type { FeedPost } from "@/features/social/PostCard";
import FeedActivityCard from "@/features/feed/FeedActivityCard";
import type { ActivityData } from "@/features/feed/FeedActivityCard";
import DeckCard from "@/features/deck/DeckCard";
import ProfileCollectionTab from "./ProfileCollectionTab";
import ProfileTournamentsTab from "./ProfileTournamentsTab";
import ProfileStatsTab from "./ProfileStatsTab";
import ProfileMarketplaceTab from "./ProfileMarketplaceTab";
import ProfileLogrosTab from "./ProfileLogrosTab";
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
    updateProfile,
    followUser,
    unfollowUser,
} from "@/lib/api/social";
import { getUserStats, getBadges } from "@/lib/api/gamification";
import { getUserTournamentHistory } from "@/lib/api/ratings";
import { getListings } from "@/lib/api/marketplace";
import { getDuels } from "@/lib/api/duels";
import { Person, MapPin, Xmark, EllipsisVertical, CircleCheck, Star, Shield } from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { getRankForElo } from "@/lib/rankSystem";
import type { Duel } from "@/lib/types/duel";
import type { Clan } from "@/lib/types/clan";

type ProfileTab =
    | "actividad"
    | "mazos"
    | "coleccion"
    | "torneos"
    | "stats"
    | "marketplace"
    | "logros";

function toArray<T>(value: unknown): T[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    const v = value as any;
    if (Array.isArray(v.data)) return v.data;
    if (v.data && typeof v.data === "object") {
        const inner = v.data as any;
        if (Array.isArray(inner.activity)) return inner.activity;
        if (Array.isArray(inner.items)) return inner.items;
        if (Array.isArray(inner.collection)) return inner.collection;
        if (Array.isArray(inner.feed)) return inner.feed;
        if (Array.isArray(inner.decks)) return inner.decks;
        if (Array.isArray(inner.listings)) return inner.listings;
        if (Array.isArray(inner.badges)) return inner.badges;
        if (Array.isArray(inner.friends)) return inner.friends;
        if (Array.isArray(inner.followers)) return inner.followers;
        if (Array.isArray(inner.following)) return inner.following;
        if (Array.isArray(inner.wishlist)) return inner.wishlist;
        if (Array.isArray(inner.history)) return inner.history;
        if (Array.isArray(inner.tournaments)) return inner.tournaments;
    }
    if (Array.isArray(v.items)) return v.items;
    if (Array.isArray(v.users)) return v.users;
    if (Array.isArray(v.activity)) return v.activity;
    if (Array.isArray(v.decks)) return v.decks;
    if (Array.isArray(v.listings)) return v.listings;
    if (Array.isArray(v.badges)) return v.badges;
    if (Array.isArray(v.history)) return v.history;
    if (Array.isArray(v.friends)) return v.friends;
    if (Array.isArray(v.followers)) return v.followers;
    if (Array.isArray(v.following)) return v.following;
    if (Array.isArray(v.wishlist)) return v.wishlist;
    if (Array.isArray(v.tournaments)) return v.tournaments;
    return [];
}

const TABS: { key: ProfileTab; label: string }[] = [
    { key: "actividad", label: "Actividad" },
    { key: "torneos", label: "Torneos" },
    { key: "mazos", label: "Mazos" },
    { key: "coleccion", label: "Coleccion" },
    { key: "stats", label: "Stats" },
    { key: "logros", label: "Logros" },
    { key: "marketplace", label: "Market" },
];

function getRankGradient(level: number): string {
    if (level >= 10) return "linear-gradient(135deg, #92400e 0%, #f59e0b 50%, #92400e 100%)";
    if (level >= 5) return "linear-gradient(135deg, #1e1b4b 0%, #7c3aed 50%, #1e1b4b 100%)";
    return "linear-gradient(135deg, #0f172a 0%, #3b82f6 50%, #0f172a 100%)";
}

function getRankRingColor(level: number): string {
    if (level >= 10) return "#f59e0b";
    if (level >= 5) return "#7c3aed";
    return "#3b82f6";
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
    const [profile, setProfile] = useState<any>(null);
    const [activity, setActivity] = useState<any[]>([]);
    const [decks, setDecks] = useState<any[]>([]);
    const [collection, setCollection] = useState<any[]>([]);
    const [badges, setBadges] = useState<any[]>([]);
    const [allBadges, setAllBadges] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [followers, setFollowers] = useState<any[]>([]);
    const [following, setFollowing] = useState<any[]>([]);
    const [wishlist, setWishlist] = useState<any[]>([]);
    const [listings, setListings] = useState<any[]>([]);
    const [ratingHistory, setRatingHistory] = useState<any[]>([]);
    const [gamiStats, setGamiStats] = useState<any>(null);
    const [tournamentHistory, setTournamentHistory] = useState<any>(null);
    const [userClan, setUserClan] = useState<Clan | null>(null);
    const [recentDuels, setRecentDuels] = useState<Duel[]>([]);

    // Follow state
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // More options dropdown
    const [showMoreOptions, setShowMoreOptions] = useState(false);

    // Edit profile modal state
    const [showEditModal, setShowEditModal] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState<ProfileTab>("actividad");

    useEffect(() => {
        setLoading(true);

        const fetchData = async () => {
            try {
                const extractUser = (json: any): any => {
                    if (!json) return null;
                    if (json.data?.user) return json.data.user;
                    if (json.user) return json.user;
                    if (json.data?.id) return json.data;
                    if (json.id) return json;
                    return null;
                };

                const API = "https://api.rankeao.cl/api/v1";

                let resolvedUsername = usernameParam;
                try {
                    const searchRes = await fetch(`${API}/social/users/search?q=${encodeURIComponent(usernameParam)}`);
                    if (searchRes.ok) {
                        const json = await searchRes.json();
                        const users = json.users || json.data?.users || json.data || [];
                        const match = (Array.isArray(users) ? users : []).find(
                            (u: any) => u.username?.toLowerCase() === usernameParam.toLowerCase()
                        );
                        if (match?.username) {
                            resolvedUsername = match.username;
                        }
                    }
                } catch { /* search failed */ }

                let profile: any = null;
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

                // Check if current user follows this profile
                if (profile.is_following != null) {
                    setIsFollowing(!!profile.is_following);
                }

                // All social sub-endpoints + gamification stats + tournament history + all badges in parallel
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
                setGamiStats(gamiRes?.data || gamiRes);
                setTournamentHistory(tourneyRes);

                // Clan del usuario (campo en perfil si viene de la API)
                const clanData = profile?.clan || profile?.user_clan;
                if (clanData?.id) {
                    setUserClan(clanData as Clan);
                }

                // Marketplace listings y duelos — solo para perfil propio
                const isOwn = session?.username?.toLowerCase() === username.toLowerCase();
                if (userUUID && isOwn) {
                    getListings({ seller_id: userUUID } as any)
                        .then(res => setListings(res.listings || []))
                        .catch(() => setListings([]));

                    getDuels({ user_id: userUUID, per_page: 5, status: "COMPLETED" })
                        .then(res => setRecentDuels(res.duels.slice(0, 5)))
                        .catch(() => setRecentDuels([]));
                }

            } catch (error) {
                console.error("Critical Profile Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [usernameParam, session, router]);

    const handleFollow = async () => {
        const userId = profile?.id || profile?.user_id;
        if (!userId || !session?.accessToken) return;
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowUser(userId, session.accessToken);
                setIsFollowing(false);
                setFollowers((prev) => prev.filter((f: any) => f.user_id !== (session as any)?.user_id));
            } else {
                await followUser(userId, session.accessToken);
                setIsFollowing(true);
            }
        } catch {
            // Error al actualizar seguimiento
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
                alignItems: "center",
                minHeight: "50vh",
                gap: 16,
                backgroundColor: "var(--background)",
            }}>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    borderTop: "2px solid var(--accent)",
                    borderRight: "2px solid var(--accent)",
                    borderBottom: "2px solid transparent",
                    borderLeft: "2px solid transparent",
                    animation: "spin 0.8s linear infinite",
                }} />
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Cargando perfil de {usernameParam}...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
                alignItems: "center",
                minHeight: "50vh",
                gap: 16,
                backgroundColor: "var(--background)",
                paddingLeft: 24,
                paddingRight: 24,
            }}>
                <Person width={48} height={48} color="var(--muted)" />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>Usuario no encontrado</h2>
                <p style={{ color: "var(--muted)", fontSize: 14 }}>El perfil al que intentas acceder no existe o es privado.</p>
                <button
                    onClick={() => router.push("/")}
                    style={{
                        backgroundColor: "var(--surface-solid)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                        borderRadius: 99,
                        padding: "10px 24px",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }

    // ── Derived from profile + gamification, fallback 0 ──
    const name = profile?.display_name || profile?.name || profile?.username || usernameParam;
    const bio = profile?.bio || "";
    const level = gamiStats?.level ?? profile?.level ?? 0;
    const totalXp = gamiStats?.xp ?? gamiStats?.total_xp ?? profile?.total_xp ?? 0;
    const xpToNextLevel = gamiStats?.xp_next_level ?? gamiStats?.xp_to_next_level ?? 0;
    const currentLevelXp = Math.max(0, gamiStats?.xp_this_level ?? gamiStats?.current_level_xp ?? 0);
    const rating = gamiStats?.peak_rating ?? gamiStats?.rating ?? profile?.rating ?? 0;
    const winRate = gamiStats?.win_rate ?? profile?.win_rate ?? 0;
    const tournamentsPlayed = gamiStats?.tournaments_played ?? profile?.tournaments_count ?? 0;
    const tournamentsWon = gamiStats?.tournaments_won ?? 0;
    const totalMatches = gamiStats?.total_matches ?? 0;
    const currentStreak = gamiStats?.current_streak ?? 0;
    const bestStreak = gamiStats?.best_streak ?? 0;
    const peakRating = gamiStats?.peak_rating ?? 0;
    const badgesCount = gamiStats?.badges_earned ?? profile?.badges_count ?? badges.length;
    const xpRank = gamiStats?.xp_rank ?? 0;

    const followersCount = profile?.follower_count ?? profile?.followers_count ?? followers.length;
    const followingCount = profile?.following_count ?? following.length;
    const friendsCount = profile?.friends_count ?? friends.length;

    const bannerUrl = profile?.banner_url;
    const isOwnProfile = session?.username === usernameParam;

    const location = [profile?.city, profile?.country].filter(Boolean).join(", ");
    const rawTitle = gamiStats?.current_title ?? profile?.title ?? "";
    const equippedTitle = typeof rawTitle === "object" && rawTitle !== null ? (rawTitle as any).name ?? "" : rawTitle;

    const gamesList: string[] = profile?.games
        ? profile.games.map((g: any) => typeof g === "string" ? g : g.name)
        : [];

    const xpProgress = xpToNextLevel > 0 ? Math.min(100, Math.round((currentLevelXp / xpToNextLevel) * 100)) : 0;

    // Borde de avatar según nivel
    const levelBorderColor = level >= 50 ? "var(--purple)" : level >= 25 ? "var(--warning)" : level >= 10 ? "var(--accent)" : "";

    // User type badges
    const isVerified = profile?.is_verified || profile?.verified;
    const isPremium = profile?.is_premium || profile?.premium;
    const isAdmin = profile?.role === "admin" || profile?.is_admin;
    const isModerator = profile?.role === "moderator" || profile?.is_moderator;

    // Tournament history data
    const tournamentEntries = toArray(tournamentHistory) as any[];
    const tournamentStats = tournamentHistory?.stats;

    // Rank
    const rank = getRankForElo(rating || 1000);

    // Win rate display
    const winRateDisplay = winRate != null && winRate > 0
        ? `${typeof winRate === "number" && winRate < 1 ? (winRate * 100).toFixed(0) : winRate}%`
        : "-";

    // Win rate color
    const winRateColor = (() => {
        const wr = typeof winRate === "number" && winRate < 1 ? winRate * 100 : winRate;
        if (wr >= 60) return "var(--success)";
        if (wr >= 40) return "var(--warning)";
        return "var(--danger)";
    })();

    const handleProfileUpdated = (updatedProfile: any) => {
        setProfile((prev: any) => ({ ...prev, ...updatedProfile }));
        setShowEditModal(false);
    };

    /* ── Rank-based styling ── */
    const ringColor = getRankRingColor(level);
    const rankGradient = getRankGradient(level);
    const xpBarColor = ringColor;

    /* ── Reusable blocks ── */

    // Clan inline
    const clanInline = userClan ? (
        <a href={`/clanes/${userClan.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
            {userClan.logo_url ? (
                <img src={userClan.logo_url} alt={userClan.name} style={{ width: 16, height: 16, borderRadius: 3, objectFit: "cover" }} />
            ) : (
                <Shield width={12} height={12} color="var(--muted)" />
            )}
            <span style={{ color: "var(--muted)", fontSize: 12 }}>
                <span style={{ color: "var(--foreground)", fontWeight: 700 }}>[{userClan.tag}]</span> {userClan.name}
            </span>
        </a>
    ) : null;

    // Recent duels block (unchanged logic, kept for extra sections)
    const recentDuelsBlock = recentDuels.length > 0 ? (
        <div style={{
            backgroundColor: "var(--surface-solid)", borderRadius: 16,
            border: "1px solid var(--border)", overflow: "hidden",
        }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: 0 }}>
                    Duelos recientes
                </p>
            </div>
            <div>
                {recentDuels.map((duel) => {
                    const profileUsername = profile?.username?.toLowerCase();
                    const isChallenger = duel.challenger.username?.toLowerCase() === profileUsername;
                    const opponent = isChallenger ? duel.opponent : duel.challenger;
                    const myWins = isChallenger ? (duel.challenger_wins ?? 0) : (duel.opponent_wins ?? 0);
                    const opponentWins = isChallenger ? (duel.opponent_wins ?? 0) : (duel.challenger_wins ?? 0);
                    const isWin = myWins > opponentWins;
                    const isDraw = duel.status === "COMPLETED" && myWins === opponentWins;
                    const resultLabel = isDraw ? "EMPATE" : isWin ? "VICTORIA" : "DERROTA";
                    const resultColor = isDraw ? "var(--muted)" : isWin ? "var(--success)" : "var(--danger)";
                    const date = duel.played_at || duel.created_at;
                    return (
                        <div key={duel.id} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 16px", borderBottom: "1px solid var(--border)",
                        }}>
                            <div style={{
                                width: 56, textAlign: "center", flexShrink: 0,
                                backgroundColor: resultColor + "18", borderRadius: 6, padding: "3px 0",
                            }}>
                                <span style={{ color: resultColor, fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>{resultLabel}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 600 }}>
                                    vs{" "}
                                    <a href={`/perfil/${opponent.username}`} style={{ color: "var(--foreground)", textDecoration: "none" }}>
                                        {opponent.username}
                                    </a>
                                </span>
                                {duel.game_name && (
                                    <p style={{ color: "var(--muted)", fontSize: 11, margin: 0, marginTop: 1 }}>{duel.game_name}</p>
                                )}
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <span style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 700 }}>{myWins}-{opponentWins}</span>
                                {date && (
                                    <p style={{ color: "var(--muted)", fontSize: 10, margin: 0, marginTop: 1 }}>
                                        {new Date(date).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    ) : null;

    /* ── Tab content (all existing tabs preserved) ── */
    const tabContent = (
        <div>
            {activeTab === "actividad" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {activity.length > 0 ? activity.map((item: any, i: number) => {
                        const user = item.user ?? {};
                        const itemType = (item.type ?? "").toUpperCase();
                        if (itemType === "POST") {
                            const post: FeedPost = {
                                id: String(item.id),
                                username: user.username ?? item.username ?? profile?.username,
                                avatar_url: user.avatar_url ?? item.avatar_url ?? profile?.avatar_url,
                                text: item.description ?? item.text ?? item.content ?? "",
                                images: item.images ?? (item.image_url ? [item.image_url] : undefined),
                                likes_count: item.likes_count ?? 0,
                                is_liked: item.is_liked ?? false,
                                comments_count: item.comments_count ?? 0,
                                created_at: item.created_at ?? "",
                            };
                            return <PostCard key={post.id || i} post={post} />;
                        }
                        const activity: ActivityData = {
                            id: String(item.id),
                            type: itemType,
                            user: {
                                username: user.username ?? item.username ?? profile?.username ?? "",
                                avatar_url: user.avatar_url ?? item.avatar_url ?? profile?.avatar_url,
                            },
                            title: item.title ?? item.description ?? "",
                            description: item.title ? (item.description ?? undefined) : undefined,
                            image_url: item.image_url,
                            entity_type: item.entity_type,
                            entity_id: item.entity_id,
                            metadata: item.metadata,
                            likes_count: item.likes_count ?? 0,
                            is_liked: item.is_liked ?? false,
                            comments_count: item.comments_count ?? 0,
                            created_at: item.created_at ?? "",
                        };
                        return <FeedActivityCard key={activity.id || i} activity={activity} />;
                    }) : <EmptyState emoji="📝" title="Sin actividad reciente" description="Aun no hay publicaciones en este perfil." />}
                </div>
            )}
            {activeTab === "mazos" && (
                <div>
                    {decks.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                            {decks.map((deck, i) => {
                                const normalized = {
                                    id: deck.id,
                                    user_id: deck.user_id || deck.owner?.id || "",
                                    name: deck.name || deck.deck_name || "",
                                    is_public: deck.is_public ?? true,
                                    author: {
                                        username: deck.owner?.username || deck.username || profile?.username || "",
                                        avatar_url: deck.owner?.avatar_url,
                                    },
                                    deck_name: deck.name || deck.deck_name || "",
                                    game: deck.game_name || deck.game || "",
                                    format: deck.format_name || deck.format || "",
                                    card_count: deck.card_count ?? deck.cards?.length ?? 0,
                                    preview_images: deck.cards?.slice(0, 4).map((c: any) => c.image_url).filter(Boolean),
                                    created_at: deck.created_at || "",
                                };
                                return <DeckCard key={deck.id || i} deck={normalized} />;
                            })}
                        </div>
                    ) : <EmptyState emoji="🃏" title="Sin mazos publicados" description="No ha compartido mazos todavia." />}
                </div>
            )}
            {activeTab === "coleccion" && (
                <ProfileCollectionTab collection={collection} isOwnProfile={isOwnProfile} token={session?.accessToken} />
            )}
            {activeTab === "torneos" && (
                <ProfileTournamentsTab
                    tournaments={tournamentEntries} stats={tournamentStats}
                    tournamentsPlayed={tournamentsPlayed} tournamentsWon={tournamentsWon}
                />
            )}
            {activeTab === "stats" && (
                <ProfileStatsTab
                    rating={rating} peakRating={peakRating} winRate={winRate}
                    totalMatches={totalMatches} tournamentsPlayed={tournamentsPlayed}
                    tournamentsWon={tournamentsWon} currentStreak={currentStreak}
                    bestStreak={bestStreak} ratingHistory={ratingHistory} gamiStats={gamiStats}
                />
            )}
            {activeTab === "marketplace" && (
                <ProfileMarketplaceTab listings={listings} />
            )}
            {activeTab === "logros" && (
                <ProfileLogrosTab
                    earnedBadges={badges} allBadges={allBadges}
                    badgesCount={badgesCount} gamiStats={gamiStats} isOwnProfile={isOwnProfile}
                />
            )}
        </div>
    );

    /* ──────────────────────────────────────────────
       RENDER — New gaming/social hybrid profile
       ────────────────────────────────────────────── */
    return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", backgroundColor: "var(--background)", minHeight: "100vh" }}>

            {/* ═══════════════════════════════════
                1. HEADER — Banner + Avatar + Info
               ═══════════════════════════════════ */}
            <div style={{ position: "relative", width: "100%" }}>
                {/* Banner gradient (or custom image) */}
                <div style={{
                    width: "100%", height: 200, position: "relative", overflow: "hidden",
                }}>
                    {bannerUrl ? (
                        <>
                            <div style={{
                                position: "absolute", inset: 0,
                                backgroundImage: `url('${bannerUrl}')`,
                                backgroundSize: "cover", backgroundPosition: "center",
                            }} />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, var(--background) 100%)" }} />
                        </>
                    ) : (
                        <>
                            <div style={{ position: "absolute", inset: 0, background: rankGradient }} />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, var(--background) 100%)" }} />
                            {/* Subtle noise texture */}
                            <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')" }} />
                        </>
                    )}
                </div>

                {/* Profile info overlay — positioned over banner bottom */}
                <div style={{ maxWidth: 960, margin: "0 auto", width: "100%", padding: "0 16px", position: "relative", marginTop: -60 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
                        {/* Avatar with rank ring + level badge */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            <div style={{
                                width: 88, height: 88, borderRadius: 44,
                                padding: 3,
                                background: `linear-gradient(135deg, ${ringColor}, ${ringColor}88)`,
                                boxShadow: `0 0 20px ${ringColor}40`,
                            }}>
                                <div style={{
                                    width: 82, height: 82, borderRadius: 41,
                                    border: "3px solid var(--background)",
                                    overflow: "hidden",
                                    backgroundColor: "var(--surface-solid)",
                                }}>
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Person width={36} height={36} color="var(--muted)" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Level badge */}
                            {level > 0 && (
                                <div style={{
                                    position: "absolute", bottom: -2, right: -2,
                                    width: 26, height: 26, borderRadius: 13,
                                    background: ringColor,
                                    border: "2px solid var(--background)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: `0 2px 8px ${ringColor}60`,
                                }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{level}</span>
                                </div>
                            )}
                        </div>

                        {/* Name + title + meta */}
                        <div style={{ flex: 1, minWidth: 200, paddingBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <h1 style={{ color: "var(--foreground)", fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{name}</h1>
                                {isVerified && <CircleCheck width={16} height={16} color="var(--accent)" />}
                                {isPremium && <Star width={16} height={16} color="#f59e0b" />}
                                {isAdmin && (
                                    <span style={{ backgroundColor: "var(--danger)", color: "white", padding: "2px 8px", borderRadius: 99, fontSize: 9, fontWeight: 700 }}>ADMIN</span>
                                )}
                                {isModerator && (
                                    <span style={{ backgroundColor: "var(--accent)", color: "white", padding: "2px 8px", borderRadius: 99, fontSize: 9, fontWeight: 700 }}>MOD</span>
                                )}
                            </div>
                            {equippedTitle ? (
                                <p style={{ color: ringColor, fontSize: 13, fontWeight: 600, margin: 0, marginTop: 2 }}>{equippedTitle}</p>
                            ) : (
                                <p style={{ color: "var(--muted)", fontSize: 13, margin: 0, marginTop: 2 }}>@{profile?.username || usernameParam}</p>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                                {location && (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--muted)", fontSize: 12 }}>
                                        <MapPin width={12} height={12} /> {location}
                                    </span>
                                )}
                                {profile?.created_at && (
                                    <span style={{ color: "var(--muted)", fontSize: 12 }}>
                                        Desde {new Date(profile.created_at).toLocaleDateString("es-CL", { month: "short", year: "numeric" })}
                                    </span>
                                )}
                                {clanInline && <span>{clanInline}</span>}
                            </div>
                        </div>

                        {/* Action buttons — right aligned */}
                        <div style={{ display: "flex", gap: 8, alignItems: "center", paddingBottom: 4 }}>
                            {isOwnProfile ? (
                                <>
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        style={{
                                            backgroundColor: "rgba(255,255,255,0.08)", color: "var(--foreground)",
                                            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 99, padding: "8px 20px",
                                            fontSize: 13, fontWeight: 600, cursor: "pointer",
                                            backdropFilter: "blur(8px)",
                                        }}
                                    >Editar perfil</button>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                                        style={{
                                            width: 38, height: 38, backgroundColor: "rgba(255,255,255,0.08)",
                                            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 99,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            cursor: "pointer", backdropFilter: "blur(8px)",
                                        }}
                                    >
                                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                                            <polyline points="16,6 12,2 8,6" />
                                            <line x1={12} y1={2} x2={12} y2={15} />
                                        </svg>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleFollow}
                                        disabled={followLoading}
                                        style={{
                                            backgroundColor: isFollowing ? "rgba(255,255,255,0.08)" : ringColor,
                                            color: isFollowing ? "var(--foreground)" : "#fff",
                                            border: isFollowing ? "1px solid rgba(255,255,255,0.12)" : "none",
                                            borderRadius: 99, padding: "8px 24px", fontSize: 13, fontWeight: 700,
                                            cursor: followLoading ? "not-allowed" : "pointer",
                                            opacity: followLoading ? 0.6 : 1,
                                            boxShadow: isFollowing ? "none" : `0 2px 12px ${ringColor}50`,
                                        }}
                                    >{isFollowing ? "Siguiendo" : "Seguir"}</button>
                                    <button
                                        onClick={() => router.push(`/chat?user=${profile?.username}`)}
                                        style={{
                                            backgroundColor: "rgba(255,255,255,0.08)", color: "var(--foreground)",
                                            border: "1px solid rgba(255,255,255,0.12)",
                                            borderRadius: 99, padding: "8px 20px", fontSize: 13, fontWeight: 600,
                                            cursor: "pointer", backdropFilter: "blur(8px)",
                                        }}
                                    >Mensaje</button>
                                    <div style={{ position: "relative" }}>
                                        <button
                                            onClick={() => setShowMoreOptions(!showMoreOptions)}
                                            style={{
                                                width: 38, height: 38, backgroundColor: "rgba(255,255,255,0.08)",
                                                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 99,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                cursor: "pointer", backdropFilter: "blur(8px)",
                                            }}
                                        >
                                            <EllipsisVertical width={14} height={14} color="var(--foreground)" />
                                        </button>
                                        {showMoreOptions && (
                                            <>
                                                <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowMoreOptions(false)} />
                                                <div style={{
                                                    position: "absolute", right: 0, top: "100%", marginTop: 4, zIndex: 50,
                                                    width: 200, borderRadius: 12, border: "1px solid var(--border)",
                                                    backgroundColor: "var(--surface-solid)", overflow: "hidden",
                                                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                                                }}>
                                                    <button style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13, color: "var(--foreground)", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
                                                        onClick={() => { navigator.clipboard.writeText(window.location.href); setShowMoreOptions(false); }}
                                                    >Copiar enlace al perfil</button>
                                                    <button style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13, color: "var(--foreground)", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
                                                        onClick={() => setShowMoreOptions(false)}
                                                    >Enviar solicitud de amistad</button>
                                                    <button style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13, color: "var(--danger)", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
                                                        onClick={() => setShowMoreOptions(false)}
                                                    >Reportar usuario</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Social counts */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>
                            <span style={{ color: "var(--foreground)", fontWeight: 700 }}>{followersCount}</span> seguidores
                        </span>
                        <span style={{ color: "var(--border)", fontSize: 13 }}>&middot;</span>
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>
                            <span style={{ color: "var(--foreground)", fontWeight: 700 }}>{followingCount}</span> siguiendo
                        </span>
                        <span style={{ color: "var(--border)", fontSize: 13 }}>&middot;</span>
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>
                            <span style={{ color: "var(--foreground)", fontWeight: 700 }}>{friendsCount}</span> amigos
                        </span>
                    </div>

                    {/* Bio (if present) */}
                    {bio && (
                        <p style={{ color: "var(--foreground)", fontSize: 14, lineHeight: 1.6, margin: 0, marginTop: 10, maxWidth: 600 }}>{bio}</p>
                    )}

                    {/* XP progress bar */}
                    {(totalXp > 0 || level > 0) && (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                                    Nivel {level} &mdash; {currentLevelXp.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
                                </span>
                                {xpRank > 0 && (
                                    <span style={{ fontSize: 11, color: "var(--muted)" }}>#{xpRank} global</span>
                                )}
                            </div>
                            <div style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", width: "100%" }}>
                                <div style={{
                                    height: "100%", borderRadius: 2, backgroundColor: xpBarColor,
                                    width: `${xpProgress}%`, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: `0 0 8px ${xpBarColor}60`,
                                }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════
                2. QUICK STATS ROW
               ═══════════════════════════════════ */}
            <div style={{ maxWidth: 960, margin: "0 auto", width: "100%", padding: "0 16px", marginTop: 20 }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 10,
                }}>
                    {/* Rating / ELO */}
                    <div style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 14, padding: "16px 12px", textAlign: "center",
                        backdropFilter: "blur(4px)",
                    }}>
                        <p style={{ color: rank.cssColor, fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1 }}>{rating || "-"}</p>
                        <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 500, margin: 0, marginTop: 4 }}>{rank.name}</p>
                    </div>

                    {/* Win Rate */}
                    <div style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 14, padding: "16px 12px", textAlign: "center",
                        backdropFilter: "blur(4px)",
                    }}>
                        <p style={{ color: winRate > 0 ? winRateColor : "var(--foreground)", fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1 }}>{winRateDisplay}</p>
                        <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 500, margin: 0, marginTop: 4 }}>Win Rate</p>
                    </div>

                    {/* Torneos */}
                    <div style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 14, padding: "16px 12px", textAlign: "center",
                        backdropFilter: "blur(4px)",
                    }}>
                        <p style={{ color: "var(--foreground)", fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1 }}>{tournamentsPlayed || "-"}</p>
                        <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 500, margin: 0, marginTop: 4 }}>Torneos</p>
                    </div>

                    {/* Racha */}
                    <div style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 14, padding: "16px 12px", textAlign: "center",
                        backdropFilter: "blur(4px)",
                    }}>
                        <p style={{ color: currentStreak > 0 ? "var(--warning)" : "var(--foreground)", fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1 }}>
                            {currentStreak > 0 ? currentStreak : bestStreak > 0 ? bestStreak : "-"}
                            {currentStreak > 0 && <span style={{ fontSize: 14, marginLeft: 2 }}>🔥</span>}
                        </p>
                        <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 500, margin: 0, marginTop: 4 }}>Racha</p>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════
                3. TAB NAVIGATION (sticky)
               ═══════════════════════════════════ */}
            <div style={{
                position: "sticky", top: 0, zIndex: 30,
                backgroundColor: "var(--background)",
                borderBottom: "1px solid var(--border)",
                marginTop: 20,
            }}>
                <div style={{ maxWidth: 960, margin: "0 auto", width: "100%", padding: "0 16px" }}>
                    <div style={{ overflowX: "auto", paddingTop: 12, paddingBottom: 12 }} className="no-scrollbar">
                        <div style={{ display: "flex", gap: 6 }}>
                            {TABS.map((tab) => {
                                const active = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        style={{
                                            padding: "7px 18px",
                                            borderRadius: 99,
                                            backgroundColor: active ? ringColor : "transparent",
                                            color: active ? "#fff" : "var(--muted)",
                                            fontSize: 13, fontWeight: active ? 700 : 500,
                                            border: active ? "none" : "1px solid transparent",
                                            cursor: "pointer", whiteSpace: "nowrap",
                                            transition: "all 0.15s ease",
                                            boxShadow: active ? `0 2px 12px ${ringColor}40` : "none",
                                        }}
                                    >{tab.label}</button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════
                4. CONTENT AREA
               ═══════════════════════════════════ */}
            <div style={{ maxWidth: 960, margin: "0 auto", width: "100%", padding: "20px 16px 48px 16px" }}>
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        {tabContent}
                    </div>

                    {/* Sidebar — desktop only */}
                    <div className="hidden md:block w-[280px] shrink-0">
                        <div style={{ position: "sticky", top: 72, display: "flex", flexDirection: "column", gap: 16 }}>

                            {/* Games */}
                            {gamesList.length > 0 && (
                                <div style={{
                                    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14,
                                    border: "1px solid var(--border)", padding: 14,
                                }}>
                                    <p style={{ color: "var(--muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: 0 }}>
                                        Juegos
                                    </p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                                        {gamesList.map((game: string) => (
                                            <span key={game} style={{
                                                backgroundColor: "var(--surface)", color: "var(--foreground)",
                                                padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                                            }}>{game}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ELO por juego */}
                            {Array.isArray(gamiStats?.game_stats) && gamiStats.game_stats.length > 0 && (
                                <div style={{
                                    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14,
                                    border: "1px solid var(--border)", padding: 14,
                                }}>
                                    <p style={{ color: "var(--muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: 0 }}>
                                        Rating por juego
                                    </p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                                        {(gamiStats.game_stats as any[]).map((gs: any, i: number) => {
                                            const gameName: string = gs.game || gs.name || "Juego";
                                            const gameRating: number = gs.rating ?? gs.elo ?? gs.current_rating ?? 0;
                                            const gameRank = getRankForElo(gameRating);
                                            return (
                                                <div key={gameName + i} style={{
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    padding: "6px 0",
                                                }}>
                                                    <span style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 500 }}>{gameName}</span>
                                                    <span style={{ color: gameRank.cssColor, fontSize: 14, fontWeight: 800 }}>
                                                        {gameRating > 0 ? gameRating : "-"}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Recent duels */}
                            {recentDuelsBlock}

                            {/* Badges showcase */}
                            {badges.length > 0 && (
                                <div style={{
                                    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14,
                                    border: "1px solid var(--border)", padding: 14,
                                }}>
                                    <p style={{ color: "var(--muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: 0 }}>
                                        Insignias ({badgesCount})
                                    </p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                                        {badges.slice(0, 6).map((badge: any, i: number) => (
                                            <div key={badge.id || badge.slug || i} style={{
                                                display: "flex", flexDirection: "column", alignItems: "center",
                                                gap: 4, width: 64,
                                            }}>
                                                {badge.icon_url ? (
                                                    <img src={badge.icon_url} alt={badge.name} style={{ width: 28, height: 28, objectFit: "contain" }} />
                                                ) : (
                                                    <span style={{ fontSize: 22 }}>🏅</span>
                                                )}
                                                <span style={{ color: "var(--muted)", fontSize: 9, fontWeight: 500, textAlign: "center", lineHeight: "11px" }}>
                                                    {badge.name || "Logro"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Friends */}
                            {friends.length > 0 && (
                                <div style={{
                                    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14,
                                    border: "1px solid var(--border)", padding: 14,
                                }}>
                                    <p style={{ color: "var(--muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: 0 }}>
                                        Amigos ({friends.length})
                                    </p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 10 }}>
                                        {friends.slice(0, 5).map((friend: any, i: number) => (
                                            <a
                                                key={friend.user_id || friend.id || i}
                                                href={`/perfil/${friend.username}`}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 8,
                                                    padding: "6px 4px", borderRadius: 8, textDecoration: "none",
                                                }}
                                            >
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: 14, backgroundColor: "var(--surface)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    overflow: "hidden", flexShrink: 0,
                                                }}>
                                                    {friend.avatar_url ? (
                                                        <img src={friend.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: 14, objectFit: "cover" }} />
                                                    ) : (
                                                        <span style={{ color: "var(--foreground)", fontSize: 11, fontWeight: 700 }}>
                                                            {friend.username?.[0]?.toUpperCase() || "?"}
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ color: "var(--foreground)", fontSize: 12, fontWeight: 500 }}>{friend.username}</span>
                                                {friend.is_online && (
                                                    <div style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "var(--success)", marginLeft: "auto" }} />
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Edit Profile Modal ── */}
            {showEditModal && (
                <EditProfileModal
                    profile={profile}
                    token={session?.accessToken}
                    onClose={() => setShowEditModal(false)}
                    onSaved={handleProfileUpdated}
                />
            )}
        </div>
    );
}

/* ── Edit Profile Modal ── */
function EditProfileModal({
    profile,
    token,
    onClose,
    onSaved,
}: {
    profile: any;
    token?: string;
    onClose: () => void;
    onSaved: (updated: any) => void;
}) {
    const [bio, setBio] = useState(profile?.bio || "");
    const [city, setCity] = useState(profile?.city || "");
    const [country, setCountry] = useState(profile?.country_code || profile?.country || "");
    const [displayName, setDisplayName] = useState(profile?.display_name || profile?.name || "");
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
    const [bannerUrl, setBannerUrl] = useState(profile?.banner_url || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!token) {
            return;
        }
        setSaving(true);
        try {
            const payload: Record<string, string> = {};
            if (bio !== (profile?.bio || "")) payload.bio = bio;
            if (city !== (profile?.city || "")) payload.city = city;
            if (country !== (profile?.country_code || profile?.country || "")) payload.country = country;
            if (displayName !== (profile?.display_name || profile?.name || "")) payload.display_name = displayName;
            if (avatarUrl !== (profile?.avatar_url || "")) payload.avatar_url = avatarUrl;
            if (bannerUrl !== (profile?.banner_url || "")) payload.banner_url = bannerUrl;

            if (Object.keys(payload).length === 0) {
                onClose();
                return;
            }

            await updateProfile(payload, token);
            onSaved({ ...profile, ...payload });
        } catch (err: any) {
            console.error(err?.message || "Error al actualizar perfil");
        } finally {
            setSaving(false);
        }
    };

    const countries = [
        { code: "", label: "Ninguno" },
        { code: "CL", label: "Chile" },
        { code: "AR", label: "Argentina" },
        { code: "MX", label: "Mexico" },
        { code: "CO", label: "Colombia" },
        { code: "PE", label: "Peru" },
    ];

    const initial = (profile?.display_name || profile?.name || profile?.username || "?")[0]?.toUpperCase();

    const inputStyle: React.CSSProperties = {
        width: "100%",
        color: "var(--foreground)",
        fontSize: 15,
        padding: "14px 16px",
        backgroundColor: "transparent",
        border: "none",
        outline: "none",
    };

    return (
        <div
            style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
            onClick={onClose}
        >
            {/* Backdrop */}
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)" }} />

            {/* Modal */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 480,
                    backgroundColor: "var(--background)",
                    borderRadius: 24,
                    maxHeight: "90vh",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    borderBottom: "1px solid var(--border)",
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: "var(--surface-solid)",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                        }}
                    >
                        <Xmark width={20} height={20} color="var(--foreground)" />
                    </button>
                    <span style={{ color: "var(--foreground)", fontSize: 17, fontWeight: 700 }}>Perfil</span>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            backgroundColor: "var(--accent)",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: 20,
                            padding: "8px 18px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: saving ? "not-allowed" : "pointer",
                            opacity: saving ? 0.6 : 1,
                        }}
                    >
                        {saving ? "..." : "Guardar"}
                    </button>
                </div>

                {/* Banner preview */}
                <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
                    {profile?.banner_url ? (
                        <img src={profile.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <div style={{ width: "100%", height: "100%", position: "relative" }}>
                            <div style={{ position: "absolute", inset: 0, top: 0, height: "50%", backgroundColor: "var(--surface-solid)" }} />
                            <div style={{ position: "absolute", inset: 0, top: "50%", height: "50%", backgroundColor: "var(--surface-solid-secondary)" }} />
                        </div>
                    )}
                </div>

                {/* Avatar overlapping banner */}
                <div style={{ marginTop: -40, paddingLeft: 16, marginBottom: 12 }}>
                    <div style={{ position: "relative", width: 80, height: 80 }}>
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" style={{ width: 80, height: 80, borderRadius: 40, border: "4px solid var(--background)", objectFit: "cover" }} />
                        ) : (
                            <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "var(--surface-solid)", border: "4px solid var(--background)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 800 }}>{initial}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form fields */}
                <div style={{ padding: "0 16px", paddingBottom: 24 }}>
                    {/* Display Name */}
                    <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>NOMBRE PARA MOSTRAR</p>
                    <div style={{ backgroundColor: "var(--surface-solid)", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                        <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Tu nombre publico"
                            style={{ ...inputStyle }}
                        />
                    </div>

                    {/* Bio */}
                    <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>BIO</p>
                    <div style={{ backgroundColor: "var(--surface-solid)", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Cuentanos sobre ti..."
                            maxLength={300}
                            rows={3}
                            style={{
                                ...inputStyle,
                                minHeight: 88,
                                resize: "none",
                            }}
                        />
                        <p style={{ color: "var(--muted)", fontSize: 11, textAlign: "right", padding: "0 16px 10px" }}>{bio.length}/300</p>
                    </div>

                    {/* Location */}
                    <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>INFORMACION</p>
                    <div style={{ backgroundColor: "var(--surface-solid)", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Ciudad"
                            style={{ ...inputStyle }}
                        />
                        <div style={{ height: 0.5, backgroundColor: "var(--border)", marginLeft: 16 }} />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 16px" }}>
                            {countries.map((c) => (
                                <button
                                    key={c.code}
                                    onClick={() => setCountry(c.code)}
                                    style={{
                                        paddingLeft: 12,
                                        paddingRight: 12,
                                        paddingTop: 6,
                                        paddingBottom: 6,
                                        borderRadius: 16,
                                        backgroundColor: country === c.code ? "var(--accent)" : "var(--surface)",
                                        color: country === c.code ? "#FFFFFF" : "var(--muted)",
                                        fontSize: 13,
                                        fontWeight: country === c.code ? 600 : 400,
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Avatar URL */}
                    <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>URL AVATAR</p>
                    <div style={{ backgroundColor: "var(--surface-solid)", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                        <input
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://..."
                            style={{ ...inputStyle }}
                        />
                    </div>

                    {/* Banner URL */}
                    <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>URL BANNER</p>
                    <div style={{ backgroundColor: "var(--surface-solid)", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                        <input
                            value={bannerUrl}
                            onChange={(e) => setBannerUrl(e.target.value)}
                            placeholder="https://..."
                            style={{ ...inputStyle }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ emoji, title, description }: { emoji: string; title: string; description: string }) {
    return (
        <div style={{
            backgroundColor: "var(--surface-solid)",
            borderRadius: 16,
            border: "1px solid var(--border)",
            paddingTop: 48,
            paddingBottom: 48,
            textAlign: "center",
        }}>
            <p style={{ fontSize: 28, opacity: 0.5, marginBottom: 8 }}>{emoji}</p>
            <p style={{ color: "var(--foreground)", fontSize: 14, fontWeight: 500 }}>{title}</p>
            <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{description}</p>
        </div>
    );
}
