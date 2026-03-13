"use client";

import { useEffect, useState, use } from "react";
import { Avatar, Button, Card, Chip, Tabs } from "@heroui/react";
import { RankedAvatar } from "@/components/RankedAvatar";
import { UserDisplayName, getUserRoleData } from "@/components/UserIdentity";
import PostCard from "@/components/cards/PostCard";
import DeckCard from "@/components/cards/DeckCard";
import CollectionCard from "@/components/cards/CollectionCard";
import {
    getUserProfile,
    getUserActivity,
    getUserBadges,
    getUserDecks,
    getUserCollection,
    getUserFriends,
    getUserRatingHistory,
    searchUsers,
} from "@/lib/api/social";
import { getListings } from "@/lib/api/marketplace";
import { getUserStats } from "@/lib/api/gamification";
import SaleCard from "@/components/cards/SaleCard";
import { StarFill, Person, Envelope, Check, Cup } from "@gravity-ui/icons";
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
    const [friends, setFriends] = useState<any[]>([]);
    const [listings, setListings] = useState<any[]>([]);
    const [ratingHistory, setRatingHistory] = useState<any[]>([]);
    const [gamiStats, setGamiStats] = useState<any>(null);

    useEffect(() => {
        setLoading(true);

        const fetchData = async () => {
            try {
                // Helper to extract user object from various API response shapes
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
                } catch { /* search failed, proceed with original */ }

                // Fetch full profile with correctly-cased username
                let profile: any = null;
                try {
                    const raw = await getUserProfile(resolvedUsername);
                    profile = extractUser(raw);
                } catch { /* profile fetch failed */ }

                const profileRes = profile;

                if (!profileRes) {
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                setProfile(profileRes);
                const username = profileRes.username || resolvedUsername;
                const userUUID = profileRes.id || profileRes.user_id;

                // 2. Fetch all metadata (social endpoints use username, gamification uses UUID)
                const [activityRes, decksRes, colRes, badgesRes, friendsRes, historyRes, statsRes] = await Promise.all([
                    getUserActivity(username).catch(() => ({ data: [] })),
                    getUserDecks(username).catch(() => ({ data: [] })),
                    getUserCollection(username).catch(() => ({ data: [] })),
                    getUserBadges(username).catch(() => ({ badges: [] })),
                    getUserFriends(username).catch(() => ({ friends: [] })),
                    getUserRatingHistory(username).catch(() => ({ history: [] })),
                    // Gamification uses UUID — use silent fetch to avoid error toast on 500
                    userUUID
                        ? fetch(`${API}/gamification/users/${userUUID}/stats`).then(r => r.ok ? r.json() : null).catch(() => null)
                        : Promise.resolve(null),
                ]);

                setActivity(toArray(activityRes));
                setDecks(toArray(decksRes));
                setCollection(toArray(colRes));
                setBadges(toArray(badgesRes));
                setFriends(toArray(friendsRes));
                setRatingHistory(historyRes?.history || historyRes?.data || []);
                setGamiStats(statsRes);

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
                <h2 className="text-xl font-bold font-rajdhani text-[var(--foreground)]">Usuario no encontrado</h2>
                <p className="text-[var(--muted)] font-sans">El perfil al que intentas acceder no existe o es privado.</p>
                <Button variant="secondary" onPress={() => router.push("/")}>
                    Volver al Inicio
                </Button>
            </div>
        );
    }

    const name = profile?.name || profile?.username || usernameParam;
    const rawBio = profile?.bio || "Jugador competitivo de TCG chileno.";
    const rating = gamiStats?.rating || profile?.rating || 1200;
    const ranking = gamiStats?.ranking || profile?.ranking || "-";
    const winrate = gamiStats?.winrate || profile?.winrate || "50";
    const tournaments = gamiStats?.tournaments_played || profile?.tournaments_played || 0;

    const isPremium = profile?.is_premium || false;
    const bannerUrl = profile?.banner_url || "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=1200";

    const isOwnProfile = session?.username === usernameParam;

    return (
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: HEADER DEL PERFIL */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-[var(--surface)] border border-[var(--border)] shadow-xl relative overflow-hidden">
                        {/* Banner Personalizable */}
                        <div
                            className="absolute top-0 inset-x-0 h-32 bg-cover bg-center"
                            style={{ backgroundImage: `url('${bannerUrl}')` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[var(--surface)]" />
                        </div>

                        <Card.Content className="p-6 pt-16 text-center flex flex-col items-center relative z-10 w-full">
                            {/* Avatar con marco ELO */}
                            <RankedAvatar
                                elo={rating}
                                size="lg"
                                className="w-24 h-24 mb-4 ring-4 ring-[var(--surface)] bg-[var(--surface)]"
                                fallback={getInitial(name)}
                                src={profile?.avatar_url}
                            />
                            {/* Nombre y Badges destacadas */}
                            <div className="flex flex-col items-center gap-1 mb-2 mt-1">
                                <UserDisplayName
                                    user={getUserRoleData(profile)}
                                    className="text-2xl font-rajdhani"
                                />
                            </div>

                            {/* Chips de Juegos */}
                            {profile?.games && profile.games.length > 0 ? (
                                <div className="flex gap-2 justify-center mb-6 w-full flex-wrap">
                                    {profile.games.map((game: any) => (
                                        <Chip key={typeof game === 'string' ? game : game.id} size="sm" className="bg-[var(--surface-tertiary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors cursor-default">
                                            {typeof game === 'string' ? game : game.name}
                                        </Chip>
                                    ))}
                                </div>
                            ) : null}
                            {/* Bio corta */}
                            <p className="text-sm text-[var(--muted)] italic mb-4 max-w-[250px] leading-snug">"{rawBio}"</p>

                            {/* Tira de Estadísticas Rápidas */}
                            <div className="flex justify-between gap-1 mb-5 border-y border-[var(--border)] py-3 w-full px-1">
                                <div className="text-center flex-1">
                                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-bold mb-0.5">ELO</p>
                                    <p className="text-lg font-black font-rajdhani text-[var(--accent)]">{rating}</p>
                                </div>
                                <div className="w-[1px] bg-[var(--border)] my-1"></div>
                                <div className="text-center flex-1">
                                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-bold mb-0.5">Ranking</p>
                                    <p className="text-lg font-black font-rajdhani text-[var(--foreground)]">{ranking !== "-" ? `#${ranking}` : "-"}</p>
                                </div>
                                <div className="w-[1px] bg-[var(--border)] my-1"></div>
                                <div className="text-center flex-1">
                                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-bold mb-0.5">W/L</p>
                                    <p className="text-lg font-black font-rajdhani text-[var(--success)]">{winrate}%</p>
                                </div>
                                <div className="w-[1px] bg-[var(--border)] my-1"></div>
                                <div className="text-center flex-1">
                                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-bold mb-0.5">Torneos</p>
                                    <p className="text-lg font-black font-rajdhani text-[var(--foreground)]">{tournaments}</p>
                                </div>
                            </div>

                            {/* Chips de Juegos */}
                            {profile?.games && profile.games.length > 0 ? (
                                <div className="flex gap-2 justify-center mb-6 w-full flex-wrap">
                                    {profile.games.map((game: string) => (
                                        <Chip key={game} size="sm" className="bg-[var(--surface-tertiary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors cursor-default">
                                            {game}
                                        </Chip>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-2 justify-center mb-6 w-full flex-wrap">
                                    <Chip size="sm" className="bg-[var(--surface-tertiary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors font-semibold">
                                        Pokémon
                                    </Chip>
                                    <Chip size="sm" className="bg-[var(--surface-tertiary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors font-semibold">
                                        Magic
                                    </Chip>
                                </div>
                            )}

                            {/* Botones de Acción */}
                            <div className="flex gap-2 w-full mt-2">
                                {isOwnProfile ? (
                                    <>
                                        <Button className="flex-1 font-bold bg-[var(--accent)] text-[var(--accent-foreground)] hover:saturate-150 transition-all rounded-xl" onPress={() => router.push('/perfil/me')}>
                                            <Person width={16} /> Dashboard
                                        </Button>
                                        <Button className="flex-1 font-bold bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-tertiary)] rounded-xl" onPress={() => router.push('/perfil/ajustes')}>
                                            ⚙️ Ajustes
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button className="flex-1 font-bold bg-[var(--accent)] text-[var(--accent-foreground)] hover:saturate-150 transition-all rounded-xl" onPress={() => { }}>
                                            <Person width={16} /> Seguir
                                        </Button>
                                        <Button className="flex-1 font-bold bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-tertiary)] rounded-xl" onPress={() => { }}>
                                            <Envelope width={16} /> Mensaje
                                        </Button>
                                        <Button isIconOnly className="bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-tertiary)] rounded-xl font-bold pb-2 text-xl">
                                            ...
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card.Content>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Tabs variant="secondary">
                        <Tabs.ListContainer className="overflow-x-auto overflow-y-hidden pb-1 no-scrollbar">
                            <Tabs.List className="whitespace-nowrap flex-nowrap min-w-max">
                                <Tabs.Tab id="actividad">
                                    Actividad
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="mazos">
                                    Mazos
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="coleccion">
                                    Colección
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="stats">
                                    Torneos & Stats
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="marketplace">
                                    Marketplace
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="logros">
                                    Logros
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                            </Tabs.List>
                        </Tabs.ListContainer>

                        <Tabs.Panel id="actividad" className="pt-4 space-y-4">
                            {activity.length > 0 ? (
                                activity.map((post, i) => (
                                    <PostCard key={post.id || i} post={post} />
                                ))
                            ) : (
                                <div className="text-center text-[var(--muted)] py-10 bg-[var(--surface-secondary)]/20 rounded-xl border border-[var(--border)]">
                                    <p>Aún no hay actividad reciente.</p>
                                </div>
                            )}
                        </Tabs.Panel>

                        <Tabs.Panel id="mazos" className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {decks.length > 0 ? (
                                    decks.map((deck, i) => (
                                        <DeckCard key={deck.id || i} deck={deck} />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center text-[var(--muted)] py-10 bg-[var(--surface-secondary)]/20 rounded-xl border border-[var(--border)]">
                                        <p>No ha publicado mazos todavía.</p>
                                    </div>
                                )}
                            </div>
                        </Tabs.Panel>

                        <Tabs.Panel id="coleccion" className="pt-4">
                            {collection.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {collection.map((item, i) => (
                                        <CollectionCard key={item.id || i} collection={item} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-[var(--muted)] py-10 bg-[var(--surface-secondary)]/20 rounded-xl border border-[var(--border)]">
                                    <p>Su colección es privada o no tiene cartas públicas.</p>
                                </div>
                            )}
                        </Tabs.Panel>

                        <Tabs.Panel id="stats" className="pt-4 space-y-6">
                            <Card className="bg-[var(--surface)] border border-[var(--border)]">
                                <Card.Content className="p-6">
                                    <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wide mb-4">
                                        Evolución ELO Histórica
                                    </h3>
                                    <div className="min-h-[150px] flex items-center justify-center flex-col text-[var(--muted)] bg-[var(--surface-secondary)]/30 rounded-lg p-4 border border-[var(--border)]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 opacity-50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                        </svg>
                                        <p className="text-xs text-center max-w-xs">{ratingHistory.length > 0 ? "Historial cargado. Gráficos interactivos en desarrollo." : "(Sin historial de ranking disponible)"}</p>
                                    </div>
                                </Card.Content>
                            </Card>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <Card className="bg-[var(--surface)] border border-[var(--border)]">
                                    <Card.Content className="p-4 flex flex-col items-center justify-center text-center w-full">
                                        <p className="text-xl font-black font-rajdhani text-[var(--foreground)]">{tournaments}</p>
                                        <p className="text-[10px] text-[var(--muted)] font-sans uppercase">Participaciones</p>
                                    </Card.Content>
                                </Card>
                                <Card className="bg-[var(--surface)] border border-[var(--border)]">
                                    <Card.Content className="p-4 flex flex-col items-center justify-center text-center w-full">
                                        <p className="text-xl font-black font-rajdhani text-[var(--foreground)]">{gamiStats?.tournaments_won || profile?.tournaments_won || 0}</p>
                                        <p className="text-[10px] text-[var(--muted)] font-sans uppercase">Victorias</p>
                                    </Card.Content>
                                </Card>
                                <Card className="bg-[var(--surface)] border border-[var(--border)]">
                                    <Card.Content className="p-4 flex flex-col items-center justify-center text-center w-full">
                                        <p className="text-xl font-black font-rajdhani text-[var(--foreground)]">{gamiStats?.top_8 || profile?.top_8 || 0}</p>
                                        <p className="text-[10px] text-[var(--muted)] font-sans uppercase">Top 8</p>
                                    </Card.Content>
                                </Card>
                                <Card className="bg-[var(--surface)] border border-[var(--border)]">
                                    <Card.Content className="p-4 flex flex-col items-center justify-center text-center w-full">
                                        <p className="text-xl font-black font-rajdhani text-[var(--foreground)]">{winrate}%</p>
                                        <p className="text-[10px] text-[var(--muted)] font-sans uppercase">WinRate Global</p>
                                    </Card.Content>
                                </Card>
                            </div>
                        </Tabs.Panel>

                        {/* TAB: MARKETPLACE */}
                        <Tabs.Panel id="marketplace" className="pt-4">
                            {listings.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {listings.map((item, i) => (
                                        <SaleCard key={item.id || i} listing={item} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-[var(--muted)] py-10 bg-[var(--surface-secondary)]/20 rounded-xl border border-[var(--border)]">
                                    <p>No tiene productos en venta actualmente.</p>
                                </div>
                            )}
                        </Tabs.Panel>

                        {/* TAB: LOGROS */}
                        <Tabs.Panel id="logros" className="pt-4">
                            <Card className="bg-[var(--surface)] border border-[var(--border)]">
                                <Card.Content className="p-6">
                                    {badges.length > 0 ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                            {badges.map((badge, i) => (
                                                <div key={badge.id || i} className="flex flex-col items-center justify-center gap-2 p-3 bg-[var(--surface-secondary)]/50 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-secondary)] transition cursor-default">
                                                    <div className="w-12 h-12 bg-[var(--surface-tertiary)] rounded-full flex items-center justify-center overflow-hidden border border-[var(--border)]">
                                                        {badge.icon_url ? <img src={badge.icon_url} alt={badge.name} className="w-full h-full object-cover" /> : <Cup />}
                                                    </div>
                                                    <p className="text-[10px] text-[var(--foreground)] text-center font-bold tracking-tight">{badge.name || "Logro"}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-[var(--muted)] py-8 flex flex-col items-center gap-3">
                                            <Cup className="w-8 h-8 opacity-40 mx-auto text-[var(--muted)]" />
                                            <p className="text-sm font-semibold text-[var(--foreground)]">Aún no ha desbloqueado medallas u honores.</p>
                                            <p className="text-[10px] text-[var(--muted)] max-w-sm">Los logros se obtienen al alcanzar hitos como "Primer Top 8", "Racha de 5 victorias" o participando en eventos.</p>
                                        </div>
                                    )}
                                </Card.Content>
                            </Card>
                        </Tabs.Panel>

                    </Tabs>
                </div>
            </div>
        </div>
    );
}
