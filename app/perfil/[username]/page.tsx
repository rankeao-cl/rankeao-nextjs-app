"use client";

import { useEffect, useState, use } from "react";
import { Avatar, Button, Card, Chip, Tabs } from "@heroui/react";
import { RankedAvatar } from "@/components/RankedAvatar";
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
} from "@/lib/api/social";
import { StarFill, Person, Envelope, Check, Cup } from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

function getInitial(value: unknown) {
    if (typeof value === "string") return value.trim().charAt(0).toUpperCase() || "U";
    return "U";
}

function toArray<T>(value: unknown): T[] {
    if (Array.isArray((value as { data?: T[] })?.data)) return (value as { data: T[] }).data;
    if (Array.isArray((value as { items?: T[] })?.items)) return (value as { items: T[] }).items;
    if (Array.isArray((value as { activity?: T[] })?.activity)) return (value as { activity: T[] }).activity;
    if (Array.isArray((value as { badges?: T[] })?.badges)) return (value as { badges: T[] }).badges;
    if (Array.isArray((value as { decks?: T[] })?.decks)) return (value as { decks: T[] }).decks;
    if (Array.isArray((value as { friends?: T[] })?.friends)) return (value as { friends: T[] }).friends;
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

    useEffect(() => {
        // Si somos el mismo usuario, redirigir a /perfil/me
        if (session?.username?.toLowerCase() === usernameParam.toLowerCase()) {
            router.replace("/perfil/me");
            return;
        }

        setLoading(true);
        Promise.all([
            getUserProfile(usernameParam).catch(() => null),
            getUserActivity(usernameParam).catch(() => ({ activity: [] })),
            getUserDecks(usernameParam).catch(() => ({ decks: [] })),
            getUserCollection(usernameParam).catch(() => ({ items: [] })),
            getUserBadges(usernameParam).catch(() => ({ badges: [] })),
            getUserFriends(usernameParam).catch(() => ({ friends: [] })),
        ]).then(([profileRes, activityRes, decksRes, colRes, badgesRes, friendsRes]) => {
            if (profileRes) setProfile(profileRes);
            setActivity(toArray(activityRes));
            setDecks(toArray(decksRes));
            setCollection(toArray(colRes));
            setBadges(toArray(badgesRes));
            setFriends(toArray(friendsRes));
            setLoading(false);
        });
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
                <p className="text-zinc-500 font-sans text-sm">Cargando perfil de {usernameParam}...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex justify-center flex-col items-center min-h-[50vh] space-y-4">
                <h2 className="text-xl font-bold font-rajdhani text-zinc-300">Usuario no encontrado</h2>
                <p className="text-zinc-500 font-sans">El perfil al que intentas acceder no existe o es privado.</p>
                <Button variant="secondary" onPress={() => router.push("/")}>
                    Volver al Inicio
                </Button>
            </div>
        );
    }

    const name = profile?.name || profile?.username || usernameParam;
    const rawBio = profile?.bio || "Jugador competitivo de TCG chileno.";
    const rating = profile?.rating || 1200;
    const isPremium = profile?.is_premium || false;
    const bannerUrl = profile?.banner_url || "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=1200";

    return (
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: HEADER DEL PERFIL */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-rankeao-light/50 border border-rankeao-light shadow-xl relative overflow-hidden">
                        {/* Banner Personalizable */}
                        <div
                            className="absolute top-0 inset-x-0 h-32 bg-cover bg-center"
                            style={{ backgroundImage: `url('${bannerUrl}')` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-rankeao-light/95" />
                        </div>

                        <Card.Content className="p-6 pt-16 text-center flex flex-col items-center relative z-10 w-full">
                            {/* Avatar con marco ELO */}
                            <RankedAvatar
                                elo={rating}
                                size="lg"
                                className="w-24 h-24 mb-4 ring-4 ring-black"
                                fallback={getInitial(name)}
                                src={profile?.avatar_url}
                            />

                            {/* Nombre y Badges destacadas */}
                            <div className="flex flex-col items-center gap-1 mb-2">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold font-rajdhani text-white">{name}</h2>
                                    {profile?.is_verified && <Check width={14} className="text-blue-400" />}
                                </div>
                                {isPremium && (
                                    <Chip size="sm" variant="soft" className="bg-yellow-500/20 text-yellow-500 font-bold border-none px-1">
                                        <div className="flex items-center gap-1"><StarFill width={12} /> Premium</div>
                                    </Chip>
                                )}
                            </div>

                            {/* Bio corta */}
                            <p className="text-sm text-zinc-300 italic mb-4">"{rawBio}"</p>

                            {/* Tira de Estadísticas Rápidas */}
                            <div className="flex flex-wrap justify-between gap-2 mb-5 border-y border-white/10 py-3 w-full px-2">
                                <div className="text-center">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">ELO</p>
                                    <p className="text-sm font-bold text-rankeao-neon-cyan">{rating}</p>
                                </div>
                                <div className="w-[1px] bg-white/10"></div>
                                <div className="text-center">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Ranking</p>
                                    <p className="text-sm font-bold text-white">#{profile?.ranking || 42}</p>
                                </div>
                                <div className="w-[1px] bg-white/10"></div>
                                <div className="text-center">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">W/L</p>
                                    <p className="text-sm font-bold text-green-400">{profile?.winrate || "50"}%</p>
                                </div>
                                <div className="w-[1px] bg-white/10"></div>
                                <div className="text-center">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Torneos</p>
                                    <p className="text-sm font-bold text-white">{profile?.tournaments_played || 0}</p>
                                </div>
                            </div>

                            {/* Chips de Juegos (Íconos simulados por ahora usando tags simples) */}
                            <div className="flex gap-2 justify-center mb-6 w-full flex-wrap">
                                <Chip size="sm" variant="secondary" className="bg-zinc-800 text-zinc-300 border-none">
                                    Pokemon
                                </Chip>
                                <Chip size="sm" variant="secondary" className="bg-zinc-800 text-zinc-300 border-none">
                                    Magic
                                </Chip>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex gap-3 w-full mt-2">
                                <Button variant="primary" className="flex-1 font-bold text-xs" onPress={() => { }}>
                                    <Person width={14} /> {profile?.is_following ? "Dejar de seguir" : "Seguir"}
                                </Button>
                                <Button variant="secondary" className="flex-1 font-bold text-xs" onPress={() => { }}>
                                    <Envelope width={14} /> Mensaje
                                </Button>
                            </div>
                        </Card.Content>
                    </Card>
                </div>

                {/* Columna Derecha: TABS DEL PERFIL */}
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
                                <Tabs.Tab id="logros">
                                    Logros
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                            </Tabs.List>
                        </Tabs.ListContainer>

                        {/* TAB: ACTIVIDAD (FEED PERSONAL) */}
                        <Tabs.Panel id="actividad" className="pt-4 space-y-4">
                            {activity.length > 0 ? (
                                activity.map((post, i) => (
                                    <PostCard key={post.id || i} post={post} />
                                ))
                            ) : (
                                <div className="text-center text-zinc-500 py-10 bg-rankeao-light/20 rounded-xl border border-white/5">
                                    <p>Aún no hay actividad reciente.</p>
                                </div>
                            )}
                        </Tabs.Panel>

                        {/* TAB: MAZOS */}
                        <Tabs.Panel id="mazos" className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {decks.length > 0 ? (
                                    decks.map((deck, i) => (
                                        <DeckCard key={deck.id || i} deck={deck} />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center text-zinc-500 py-10 bg-rankeao-light/20 rounded-xl border border-white/5">
                                        <p>No ha publicado mazos todavía.</p>
                                    </div>
                                )}
                            </div>
                        </Tabs.Panel>

                        {/* TAB: COLECCION */}
                        <Tabs.Panel id="coleccion" className="pt-4">
                            {collection.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {collection.map((item, i) => (
                                        <CollectionCard key={item.id || i} collection={item} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-zinc-500 py-10 bg-rankeao-light/20 rounded-xl border border-white/5">
                                    <p>Su colección es privada o no tiene cartas públicas.</p>
                                </div>
                            )}
                        </Tabs.Panel>

                        {/* TAB: TORNEOS Y STATS */}
                        <Tabs.Panel id="stats" className="pt-4 space-y-6">
                            <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                <Card.Content className="p-6">
                                    <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
                                        Evolución ELO Histórica
                                    </h3>
                                    <div className="min-h-[150px] flex items-center justify-center flex-col text-zinc-500 bg-black/30 rounded-lg p-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 opacity-50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                        </svg>
                                        <p className="text-xs text-center max-w-xs">(Gráfico analítico de evolución ELO y Winrate disponible en próxima versión)</p>
                                    </div>
                                </Card.Content>
                            </Card>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                    <Card.Content className="p-4 flex flex-col items-center justify-center text-center w-full">
                                        <p className="text-xl font-black font-rajdhani text-white">{profile?.tournaments_played || 0}</p>
                                        <p className="text-[10px] text-zinc-400 font-sans uppercase">Participaciones</p>
                                    </Card.Content>
                                </Card>
                                <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                    <Card.Content className="p-4 flex flex-col items-center justify-center text-center w-full">
                                        <p className="text-xl font-black font-rajdhani text-white">{profile?.tournaments_won || 0}</p>
                                        <p className="text-[10px] text-zinc-400 font-sans uppercase">Victorias</p>
                                    </Card.Content>
                                </Card>
                                <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                    <Card.Content className="p-4 flex flex-col items-center justify-center text-center w-full">
                                        <p className="text-xl font-black font-rajdhani text-white">{profile?.top_8 || 0}</p>
                                        <p className="text-[10px] text-zinc-400 font-sans uppercase">Top 8</p>
                                    </Card.Content>
                                </Card>
                                <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                    <Card.Content className="p-4 flex flex-col items-center justify-center text-center w-full">
                                        <p className="text-xl font-black font-rajdhani text-white">{profile?.winrate || "0"}%</p>
                                        <p className="text-[10px] text-zinc-400 font-sans uppercase">WinRate Global</p>
                                    </Card.Content>
                                </Card>
                            </div>
                        </Tabs.Panel>

                        {/* TAB: LOGROS */}
                        <Tabs.Panel id="logros" className="pt-4">
                            <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                <Card.Content className="p-6">
                                    {badges.length > 0 ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                            {badges.map((badge, i) => (
                                                <div key={badge.id || i} className="flex flex-col items-center justify-center gap-2 p-3 bg-black/20 rounded-xl border border-white/5 hover:bg-black/40 transition">
                                                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border-2 border-zinc-700">
                                                        {badge.icon_url ? <img src={badge.icon_url} alt={badge.name} className="w-full h-full object-cover" /> : <Cup />}
                                                    </div>
                                                    <p className="text-[10px] text-white text-center font-bold tracking-tight">{badge.name || "Logro"}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-zinc-500 py-8 flex flex-col items-center gap-3">
                                            <Cup className="w-8 h-8 opacity-40 mx-auto" />
                                            <p className="text-sm">Aún no ha desbloqueado medallas u honores.</p>
                                            <p className="text-[10px] text-zinc-500 max-w-sm">Los logros se obtienen al alcanzar hitos como "Primer Top 8", "Win Streak de 5 partidas" o participando en Pre-releases.</p>
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
