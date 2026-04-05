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
import type { UserProfile, Deck, CollectionItem, RawFeedEntry, RawFeedUser } from "@/lib/types/social";
import type { Badge } from "@/lib/types/gamification";
import type { Listing } from "@/lib/types/marketplace";
import type { RatingHistoryPoint, UserTournamentHistoryEntry } from "@/lib/types/rating";
import type { ProfileTab } from "./profileUtils";

interface ProfileTabContentProps {
    activeTab: ProfileTab;
    activity: RawFeedEntry[];
    decks: Deck[];
    collection: CollectionItem[];
    badges: Badge[];
    allBadges: Badge[];
    badgesCount: number;
    listings: Listing[];
    ratingHistory: RatingHistoryPoint[];
    gamiStats: Record<string, unknown> | null;
    tournamentEntries: UserTournamentHistoryEntry[];
    tournamentStats: { total_tournaments?: number; total_wins?: number; top4_finishes?: number; win_rate?: number } | undefined;
    profile: UserProfile;
    isOwnProfile: boolean;
    token?: string;
    // Stats tab props
    rating: number;
    peakRating: number;
    winRate: number;
    totalMatches: number;
    tournamentsPlayed: number;
    tournamentsWon: number;
    currentStreak: number;
    bestStreak: number;
}

function EmptyState({ emoji, title, description }: { emoji: string; title: string; description: string }) {
    return (
        <div
            className="rounded-2xl py-12 text-center"
            style={{
                backgroundColor: "var(--surface-solid)",
                border: "1px solid var(--border)",
            }}
        >
            <p className="text-[28px] opacity-50 mb-2">{emoji}</p>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{title}</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{description}</p>
        </div>
    );
}

export default function ProfileTabContent({
    activeTab,
    activity,
    decks,
    collection,
    badges,
    allBadges,
    badgesCount,
    listings,
    ratingHistory,
    gamiStats,
    tournamentEntries,
    tournamentStats,
    profile,
    isOwnProfile,
    token,
    rating,
    peakRating,
    winRate,
    totalMatches,
    tournamentsPlayed,
    tournamentsWon,
    currentStreak,
    bestStreak,
}: ProfileTabContentProps) {
    return (
        <div>
            {activeTab === "actividad" && (
                <div className="flex flex-col gap-4">
                    {activity.length > 0 ? activity.map((item, i) => {
                        const user: Partial<RawFeedUser> = item.user ?? {};
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
                        const activityData: ActivityData = {
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
                        return <FeedActivityCard key={activityData.id || i} activity={activityData} />;
                    }) : <EmptyState emoji="📝" title="Sin actividad reciente" description="Aun no hay publicaciones en este perfil." />}
                </div>
            )}
            {activeTab === "mazos" && (
                <div>
                    {decks.length > 0 ? (
                        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
                            {decks.map((deck, i) => {
                                const normalized = {
                                    id: deck.id,
                                    user_id: deck.user_id || "",
                                    name: deck.name || "",
                                    is_public: deck.is_public ?? true,
                                    author: {
                                        username: deck.owner?.username || deck.username || profile?.username || "",
                                        avatar_url: deck.owner?.avatar_url,
                                    },
                                    deck_name: deck.name || "",
                                    game: deck.game_name || deck.game || "",
                                    format: deck.format_name || deck.format || "",
                                    card_count: deck.card_count ?? deck.cards?.length ?? 0,
                                    preview_images: deck.cards?.slice(0, 4).map((c) => c.image_url).filter(Boolean),
                                    created_at: deck.created_at || "",
                                };
                                return <DeckCard key={deck.id || i} deck={normalized} />;
                            })}
                        </div>
                    ) : <EmptyState emoji="🃏" title="Sin mazos publicados" description="No ha compartido mazos todavia." />}
                </div>
            )}
            {activeTab === "coleccion" && (
                <ProfileCollectionTab collection={collection} isOwnProfile={isOwnProfile} token={token} />
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
                    bestStreak={bestStreak} ratingHistory={ratingHistory} gamiStats={gamiStats ?? {}}
                />
            )}
            {activeTab === "marketplace" && (
                <ProfileMarketplaceTab listings={listings} />
            )}
            {activeTab === "logros" && (
                <ProfileLogrosTab
                    earnedBadges={badges} allBadges={allBadges}
                    badgesCount={badgesCount} gamiStats={gamiStats ?? undefined} isOwnProfile={isOwnProfile}
                />
            )}
        </div>
    );
}
