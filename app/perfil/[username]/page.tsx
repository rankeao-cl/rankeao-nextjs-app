"use client";

import { useEffect, useState, use } from "react";
import { Button, Card, Chip, Tabs, Input, toast } from "@heroui/react";
import Image from "next/image";
import { RankedAvatar } from "@/components/RankedAvatar";
import { UserDisplayName, getUserRoleData } from "@/components/UserIdentity";
import PostCard from "@/components/cards/PostCard";
import DeckCard from "@/components/cards/DeckCard";
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
import SaleCard from "@/components/cards/SaleCard";
import { Person, Envelope, Cup, MapPin, Xmark, EllipsisVertical, CircleCheck, Star } from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

function getInitial(value: unknown) {
    if (typeof value === "string") return value.trim().charAt(0).toUpperCase() || "U";
    return "U";
}

function toArray<T>(value: unknown): T[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    const v = value as any;
    if (Array.isArray(v.data)) return v.data;
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

    // Follow state
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // More options dropdown
    const [showMoreOptions, setShowMoreOptions] = useState(false);

    // Edit profile modal state
    const [showEditModal, setShowEditModal] = useState(false);

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

                // Marketplace listings
                if (userUUID) {
                    getListings({ seller_id: userUUID } as any)
                        .then(res => setListings(res.listings || []))
                        .catch(() => setListings([]));
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
            toast.danger("Error al actualizar seguimiento");
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center flex-col items-center min-h-[50vh] space-y-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 rounded-full border-t-2 border-r-2 border-rankeao-neon-cyan animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                />
                <p className="text-[var(--muted)] font-sans text-sm">Cargando perfil de {usernameParam}...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex justify-center flex-col items-center min-h-[50vh] space-y-4">
                <h2 className="text-xl font-bold text-[var(--foreground)]">Usuario no encontrado</h2>
                <p className="text-[var(--muted)] font-sans">El perfil al que intentas acceder no existe o es privado.</p>
                <Button variant="secondary" onPress={() => router.push("/")}>
                    Volver al Inicio
                </Button>
            </div>
        );
    }

    // ── Derived from profile + gamification, fallback 0 ──
    const name = profile?.display_name || profile?.name || profile?.username || usernameParam;
    const bio = profile?.bio || "";
    const level = gamiStats?.level ?? profile?.level ?? 0;
    const totalXp = gamiStats?.total_xp ?? profile?.total_xp ?? 0;
    const xpToNextLevel = gamiStats?.xp_to_next_level ?? 0;
    const currentLevelXp = gamiStats?.current_level_xp ?? 0;
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
    const equippedTitle = gamiStats?.current_title ?? profile?.title ?? "";

    const gamesList: string[] = profile?.games
        ? profile.games.map((g: any) => typeof g === "string" ? g : g.name)
        : [];

    const xpProgress = xpToNextLevel > 0 ? Math.min(100, Math.round((currentLevelXp / xpToNextLevel) * 100)) : 0;

    // User type badges
    const isVerified = profile?.is_verified || profile?.verified;
    const isPremium = profile?.is_premium || profile?.premium;
    const isAdmin = profile?.role === "admin" || profile?.is_admin;
    const isModerator = profile?.role === "moderator" || profile?.is_moderator;

    // Tournament history data
    const tournamentEntries = toArray(tournamentHistory) as any[];
    const tournamentStats = tournamentHistory?.stats;

    const handleProfileUpdated = (updatedProfile: any) => {
        setProfile((prev: any) => ({ ...prev, ...updatedProfile }));
        setShowEditModal(false);
    };

    return (
        <div className="flex flex-col w-full">
            {/* ── Banner ── */}
            <div className="relative w-full h-36 sm:h-44 md:h-56 lg:h-64 overflow-hidden bg-[var(--surface-secondary)]">
                {bannerUrl ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${bannerUrl}')` }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Image
                            src="/rankeao-logo.png"
                            alt="Rankeao"
                            width={840}
                            height={175}
                            className="w-[70%] max-w-[500px] h-auto opacity-[0.07] select-none pointer-events-none"
                            priority
                        />
                    </div>
                )}
                <div className="absolute inset-0 bg-[var(--background)]/50" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--background)] to-transparent" />
            </div>

            {/* ── Profile Header ── */}
            <div className="max-w-5xl mx-auto w-full px-4 relative -mt-12 sm:-mt-16">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
                    <div className="shrink-0">
                        <RankedAvatar
                            elo={rating}
                            size="lg"
                            fallback={getInitial(name)}
                            src={profile?.avatar_url}
                        />
                    </div>

                    <div className="flex-1 min-w-0 pb-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <UserDisplayName
                                    user={getUserRoleData(profile)}
                                    className="text-xl sm:text-2xl"
                                />
                                {/* User type badges */}
                                {isVerified && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[var(--accent)] text-[var(--accent-foreground)]" title="Verificado">
                                        <CircleCheck className="size-3" /> Verificado
                                    </span>
                                )}
                                {isPremium && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[var(--warning)] text-[var(--warning-foreground)]" title="Premium">
                                        <Star className="size-3" /> Premium
                                    </span>
                                )}
                                {isAdmin && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[var(--danger)] text-white" title="Admin">
                                        Admin
                                    </span>
                                )}
                                {isModerator && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[var(--info)] text-white" title="Moderador">
                                        Mod
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-[var(--muted)]">@{profile?.username || usernameParam}</p>
                            {equippedTitle && (
                                <Chip size="sm" variant="soft" color="accent" className="mt-1 font-semibold">
                                    {equippedTitle}
                                </Chip>
                            )}
                        </div>

                        <div className="flex gap-2 shrink-0">
                            {isOwnProfile ? (
                                <>
                                    <Button variant="primary" size="sm" className="font-bold" onPress={() => setShowEditModal(true)}>
                                        <Person width={14} /> Editar Perfil
                                    </Button>
                                    <Button variant="secondary" size="sm" className="font-bold" onPress={() => router.push('/config')}>
                                        Ajustes
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant={isFollowing ? "secondary" : "primary"}
                                        size="sm"
                                        className="font-bold"
                                        onPress={handleFollow}
                                        isDisabled={followLoading}
                                    >
                                        <Person width={14} /> {isFollowing ? "Siguiendo" : "Seguir"}
                                    </Button>
                                    <Button variant="secondary" size="sm" className="font-bold" onPress={() => router.push(`/chat?user=${profile?.username}`)}>
                                        <Envelope width={14} /> Mensaje
                                    </Button>
                                    {/* More options dropdown */}
                                    <div className="relative">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="font-bold px-2"
                                            onPress={() => setShowMoreOptions(!showMoreOptions)}
                                        >
                                            <EllipsisVertical width={14} />
                                        </Button>
                                        {showMoreOptions && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowMoreOptions(false)} />
                                                <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-[var(--border)] bg-[var(--bg-solid)] shadow-lg overflow-hidden">
                                                    <button
                                                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(window.location.href);
                                                            toast.success("Enlace copiado");
                                                            setShowMoreOptions(false);
                                                        }}
                                                    >
                                                        Copiar enlace al perfil
                                                    </button>
                                                    <button
                                                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors"
                                                        onClick={() => {
                                                            setShowMoreOptions(false);
                                                        }}
                                                    >
                                                        Enviar solicitud de amistad
                                                    </button>
                                                    <button
                                                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-[var(--danger)] hover:bg-[var(--surface-secondary)] transition-colors"
                                                        onClick={() => {
                                                            setShowMoreOptions(false);
                                                        }}
                                                    >
                                                        Reportar usuario
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {bio && (
                    <p className="text-sm text-[var(--muted)] mt-3 max-w-xl leading-relaxed">{bio}</p>
                )}
                {location && (
                    <p className="text-xs text-[var(--muted)] mt-1.5 flex items-center gap-1">
                        <MapPin className="size-3" /> {location}
                    </p>
                )}

                {/* Games the user plays */}
                {gamesList.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3 items-center">
                        <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold mr-1">Juega:</span>
                        {gamesList.map((game: string) => (
                            <Chip key={game} size="sm" className="bg-[var(--surface-tertiary)] text-[var(--foreground)] border border-[var(--border)]">
                                {game}
                            </Chip>
                        ))}
                    </div>
                )}

                <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-[var(--muted)]"><span className="font-bold text-[var(--foreground)]">{followersCount}</span> seguidores</span>
                    <span className="text-[var(--muted)]"><span className="font-bold text-[var(--foreground)]">{followingCount}</span> siguiendo</span>
                    <span className="text-[var(--muted)]"><span className="font-bold text-[var(--foreground)]">{friendsCount}</span> amigos</span>
                </div>

                {/* Stats row */}
                <div className="flex gap-1 mt-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    {[
                        { label: "ELO", value: rating, color: "text-[var(--accent)]" },
                        { label: "Nivel", value: level, color: "text-[var(--foreground)]" },
                        { label: "XP", value: totalXp.toLocaleString(), color: "text-[var(--foreground)]" },
                        { label: "W/R", value: `${winRate}%`, color: "text-[var(--success)]" },
                        { label: "Torneos", value: tournamentsPlayed, color: "text-[var(--foreground)]" },
                    ].map((stat) => (
                        <div key={stat.label} className="flex-1 min-w-[72px] p-2.5 sm:p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] text-center">
                            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold mb-0.5">{stat.label}</p>
                            <p className={`text-base sm:text-lg font-extrabold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* XP Progress */}
                <div className="mt-3 p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">
                            Progreso Nivel {level} &rarr; {level + 1}
                            {xpRank > 0 && <span className="ml-2 text-[var(--accent)]">#{xpRank} XP Rank</span>}
                        </span>
                        <span className="text-xs font-bold text-[var(--foreground)]">{currentLevelXp} / {xpToNextLevel} XP</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--surface-tertiary)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }} />
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="max-w-5xl mx-auto w-full px-4 mt-6 mb-12">
                <Tabs variant="secondary">
                    <Tabs.ListContainer className="overflow-x-auto overflow-y-hidden pb-1 no-scrollbar">
                        <Tabs.List className="whitespace-nowrap flex-nowrap min-w-max">
                            <Tabs.Tab id="actividad">Actividad<Tabs.Indicator /></Tabs.Tab>
                            <Tabs.Tab id="mazos">Mazos<Tabs.Indicator /></Tabs.Tab>
                            <Tabs.Tab id="coleccion">Coleccion<Tabs.Indicator /></Tabs.Tab>
                            <Tabs.Tab id="torneos">Torneos<Tabs.Indicator /></Tabs.Tab>
                            <Tabs.Tab id="stats">Stats<Tabs.Indicator /></Tabs.Tab>
                            <Tabs.Tab id="marketplace">Marketplace<Tabs.Indicator /></Tabs.Tab>
                            <Tabs.Tab id="logros">Logros<Tabs.Indicator /></Tabs.Tab>
                        </Tabs.List>
                    </Tabs.ListContainer>

                    {/* Actividad */}
                    <Tabs.Panel id="actividad" className="pt-4 space-y-4">
                        {activity.length > 0 ? activity.map((post, i) => <PostCard key={post.id || i} post={post} />) : <EmptyState emoji="📝" title="Sin actividad reciente" description="Aun no hay publicaciones en este perfil." />}
                    </Tabs.Panel>

                    {/* Mazos */}
                    <Tabs.Panel id="mazos" className="pt-4">
                        {decks.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{decks.map((deck, i) => <DeckCard key={deck.id || i} deck={deck} />)}</div>
                        ) : <EmptyState emoji="🃏" title="Sin mazos publicados" description="No ha compartido mazos todavia." />}
                    </Tabs.Panel>

                    {/* Coleccion */}
                    <Tabs.Panel id="coleccion" className="pt-4">
                        <ProfileCollectionTab collection={collection} wishlist={wishlist} />
                    </Tabs.Panel>

                    {/* Torneos */}
                    <Tabs.Panel id="torneos" className="pt-4">
                        <ProfileTournamentsTab
                            tournaments={tournamentEntries}
                            stats={tournamentStats}
                            tournamentsPlayed={tournamentsPlayed}
                            tournamentsWon={tournamentsWon}
                        />
                    </Tabs.Panel>

                    {/* Stats */}
                    <Tabs.Panel id="stats" className="pt-4">
                        <ProfileStatsTab
                            rating={rating}
                            peakRating={peakRating}
                            winRate={winRate}
                            totalMatches={totalMatches}
                            tournamentsPlayed={tournamentsPlayed}
                            tournamentsWon={tournamentsWon}
                            currentStreak={currentStreak}
                            bestStreak={bestStreak}
                            ratingHistory={ratingHistory}
                            gamiStats={gamiStats}
                        />
                    </Tabs.Panel>

                    {/* Marketplace */}
                    <Tabs.Panel id="marketplace" className="pt-4">
                        <ProfileMarketplaceTab listings={listings} />
                    </Tabs.Panel>

                    {/* Logros */}
                    <Tabs.Panel id="logros" className="pt-4">
                        <ProfileLogrosTab
                            earnedBadges={badges}
                            allBadges={allBadges}
                            badgesCount={badgesCount}
                        />
                    </Tabs.Panel>
                </Tabs>
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
    const [country, setCountry] = useState(profile?.country || "");
    const [displayName, setDisplayName] = useState(profile?.display_name || profile?.name || "");
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
    const [bannerUrl, setBannerUrl] = useState(profile?.banner_url || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!token) {
            toast.danger("No estas autenticado");
            return;
        }
        setSaving(true);
        try {
            const payload: Record<string, string> = {};
            if (bio !== (profile?.bio || "")) payload.bio = bio;
            if (city !== (profile?.city || "")) payload.city = city;
            if (country !== (profile?.country || "")) payload.country = country;
            if (displayName !== (profile?.display_name || profile?.name || "")) payload.display_name = displayName;
            if (avatarUrl !== (profile?.avatar_url || "")) payload.avatar_url = avatarUrl;
            if (bannerUrl !== (profile?.banner_url || "")) payload.banner_url = bannerUrl;

            if (Object.keys(payload).length === 0) {
                toast.info("No hay cambios que guardar");
                onClose();
                return;
            }

            await updateProfile(payload, token);
            toast.success("Perfil actualizado");
            onSaved({ ...profile, ...payload });
        } catch (err: any) {
            toast.danger(err?.message || "Error al actualizar perfil");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" />

            {/* Modal */}
            <div
                className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-solid)] shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-bold text-[var(--foreground)]">Editar Perfil</h2>
                    <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                        <Xmark className="size-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-4 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1 block">Nombre</label>
                        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tu nombre publico" className="w-full" />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1 block">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Cuentanos sobre ti..."
                            rows={3}
                            maxLength={300}
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] text-sm p-3 resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                        />
                        <p className="text-[10px] text-[var(--muted)] text-right mt-0.5">{bio.length}/300</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1 block">Ciudad</label>
                            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Santiago" className="w-full" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1 block">Pais</label>
                            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Ej: Chile" className="w-full" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1 block">URL Avatar</label>
                        <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="w-full" />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1 block">URL Banner</label>
                        <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." className="w-full" />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-4 border-t border-[var(--border)]">
                    <Button variant="secondary" className="flex-1 font-bold" onPress={onClose} isDisabled={saving}>
                        Cancelar
                    </Button>
                    <Button variant="primary" className="flex-1 font-bold" onPress={handleSave} isDisabled={saving}>
                        {saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ emoji, title, description }: { emoji: string; title: string; description: string }) {
    return (
        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Card.Content className="py-14 text-center">
                <p className="text-3xl mb-3 opacity-50">{emoji}</p>
                <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
                <p className="text-xs mt-1 text-[var(--muted)]">{description}</p>
            </Card.Content>
        </Card>
    );
}
