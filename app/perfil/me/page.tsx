"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Avatar, Button, Card, Chip, Input, Tabs } from "@heroui/react";
import { RankedAvatar } from "@/components/RankedAvatar";
import {
  acceptFriendRequest,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
  searchUsers,
  sendFriendRequest,
} from "@/lib/api/social";
import { getChatChannels } from "@/lib/api/chat";
import { getMyCosmetics, getMyXp } from "@/lib/api/gamification";
import { StarFill, Person, Envelope } from "@gravity-ui/icons";

function getInitial(value: unknown) {
  if (typeof value === "string") return value.trim().charAt(0).toUpperCase() || "U";
  return "U";
}

function toArray<T>(value: unknown): T[] {
  if (Array.isArray((value as { data?: T[] })?.data)) return (value as { data: T[] }).data;
  if (Array.isArray((value as { items?: T[] })?.items)) return (value as { items: T[] }).items;
  if (Array.isArray((value as { requests?: T[] })?.requests)) return (value as { requests: T[] }).requests;
  if (Array.isArray((value as { users?: T[] })?.users)) return (value as { users: T[] }).users;
  if (Array.isArray((value as { channels?: T[] })?.channels)) return (value as { channels: T[] }).channels;
  return [];
}

export default function PerfilPage() {
  const { session, status } = useAuth();

  type XpData = {
    level?: number;
    xp?: number;
    title?: string;
    tournaments_played?: number;
    rating?: number;
    [key: string]: unknown;
  };
  const [xpData, setXpData] = useState<XpData | null>(null);
  const [friendsList, setFriendsList] = useState<User[]>([]);
  type Cosmetic = {
    id?: string | number;
    name?: string;
    type?: string;
    [key: string]: unknown;
  };
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  type ChatChannel = {
    id?: string | number;
    channel_id?: string | number;
    name?: string;
    title?: string;
    last_message?: { content?: string };
    last_message_text?: string;
    preview?: string;
    unread_count?: number;
    unread?: number;
    [key: string]: unknown;
  };

  const [chatChannels, setChatChannels] = useState<ChatChannel[]>([]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [socialError, setSocialError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session) {
      setLoadingProfile(true);
      setSocialError(null);

      Promise.all([
        getMyXp(session.accessToken).catch(() => null),
        getFriends({}, session.accessToken).catch(() => ({ data: [] })),
        getMyCosmetics(session.accessToken).catch(() => ({ data: [] })),
        getFriendRequests({}, session.accessToken).catch(() => ({ data: [] })),
        getChatChannels({}, session.accessToken).catch(() => ({ data: [] })),
      ]).then(([xpRes, friendsRes, cosmeticsRes, requestsRes, channelsRes]) => {
        if (xpRes) setXpData(xpRes);
        setFriendsList(toArray(friendsRes));
        setCosmetics(toArray(cosmeticsRes));
        setFriendRequests(toArray(requestsRes));
        setChatChannels(toArray(channelsRes));
        setLoadingProfile(false);
      });
    } else if (status === "unauthenticated") {
      setLoadingProfile(false);
    }
  }, [status, session]);

  const email = session?.email;
  const username = session?.username;

  const pendingRequestsCount = friendRequests.length;
  const chatChannelsCount = chatChannels.length;

  const friendsCount = friendsList.length;
  const cosmeticsCount = cosmetics.length;

  const handleSearchUsers = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSocialError(null);

    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchingUsers(true);
      type SearchUsersResult = {
        data?: User[];
        items?: User[];
        users?: User[];
        [key: string]: unknown;
      };
      const res: SearchUsersResult = await searchUsers({ q: query, limit: 12 }, session?.accessToken);
      setSearchResults(toArray(res));
    } catch (error) {
      setSocialError(error instanceof Error ? error.message : "No se pudo buscar jugadores.");
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    const id = request?.id ?? request?.request_id;
    if (!id) return;
    const idStr = String(id);

    setSocialError(null);
    setActingRequestId(idStr);
    try {
      if (!session?.accessToken) throw new Error("Sin sesión activa");
      await acceptFriendRequest(idStr, session.accessToken);
      setFriendRequests((prev) => prev.filter((r) => String(r?.id ?? r?.request_id) !== idStr));

      const newFriend = request?.from_user ?? request?.user ?? request?.sender ?? null;
      if (newFriend) {
        setFriendsList((prev) => {
          const newFriendId = String(newFriend?.id ?? newFriend?.user_id ?? "");
          if (!newFriendId) return prev;
          const exists = prev.some((f) => String(f?.id ?? f?.user_id ?? "") === newFriendId);
          return exists ? prev : [...prev, newFriend];
        });
      }
    } catch (error) {
      setSocialError(error instanceof Error ? error.message : "No se pudo aceptar la solicitud.");
    } finally {
      setActingRequestId(null);
    }
  };

  interface FriendRequest {
    id?: string | number;
    request_id?: string | number;
    from_user?: User;
    user?: User;
    sender?: User;
    message?: string;
    [key: string]: unknown;
  }

  const handleRejectRequest = async (request: FriendRequest) => {
    const id = request?.id ?? request?.request_id;
    if (!id) return;
    const idStr = String(id);

    setSocialError(null);
    setActingRequestId(idStr);
    try {
      if (!session?.accessToken) throw new Error("Sin sesión activa");
      await rejectFriendRequest(idStr, session.accessToken);
      setFriendRequests((prev) => prev.filter((r) => String(r?.id ?? r?.request_id) !== idStr));
    } catch (error) {
      setSocialError(error instanceof Error ? error.message : "No se pudo rechazar la solicitud.");
    } finally {
      setActingRequestId(null);
    }
  };

  const friendIds = useMemo(() => {
    return new Set(
      friendsList
        .map((f) => String(f?.id ?? f?.user_id ?? ""))
        .filter(Boolean)
    );
  }, [friendsList]);

  type User = {
    id?: string | number;
    user_id?: string | number;
    username?: string;
    name?: string;
    display_name?: string;
    email?: string;
    favorite_game?: string;
    city?: string;
    bio?: string;
  };

  const handleSendFriendRequest = async (user: User) => {
    const userId = user?.id ?? user?.user_id;
    if (!userId) return;
    const idStr = String(userId);

    setSocialError(null);
    setSendingRequestTo(idStr);
    try {
      if (!session?.accessToken) throw new Error("Sin sesión activa");
      await sendFriendRequest(idStr, session.accessToken);
    } catch (error) {
      setSocialError(error instanceof Error ? error.message : "No se pudo enviar la solicitud de amistad.");
    } finally {
      setSendingRequestTo(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center flex-col items-center min-h-[50vh] space-y-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 rounded-full border-t-2 border-r-2 border-rankeao-neon-cyan animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        />
        <p className="text-zinc-500 font-sans text-sm">Cargando perfil...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="flex justify-center flex-col items-center min-h-[50vh] space-y-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 text-zinc-600 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h2 className="text-xl font-bold font-rajdhani text-zinc-300">Acceso Restringido</h2>
        <p className="text-zinc-500 font-sans">Debes iniciar sesión para ver tu perfil.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-black font-rajdhani text-transparent bg-clip-text bg-gradient-to-r from-rankeao-neon-purple to-rankeao-neon-cyan uppercase tracking-wider">
          Mi Perfil
        </h1>
        <p className="text-zinc-400 font-sans mt-1">Gestiona tu progreso, amigos y estadísticas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-rankeao-light/50 border border-rankeao-light shadow-xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-rankeao-neon-purple/20 to-transparent" />
            <Card.Content className="p-6 pt-10 text-center flex flex-col items-center relative z-10 w-full">
              <RankedAvatar
                elo={xpData?.rating || 1200}
                size="lg"
                className="w-24 h-24 mb-4"
                fallback={getInitial(username)}
              />
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-2xl font-bold font-rajdhani text-white">{username}</h2>
                <Chip size="sm" variant="soft" className="bg-yellow-500/20 text-yellow-500 font-bold border-none px-1">
                  <div className="flex items-center gap-1"><StarFill width={12} /> Premium</div>
                </Chip>
              </div>
              <p className="text-xs font-sans text-zinc-400 mb-3">{email}</p>
              <p className="text-sm text-zinc-300 italic mb-4">"Jugador competitivo de TCG chileno. Principalmente Magic y Mitos."</p>

              {/* Stats Ribbon */}
              <div className="flex flex-wrap justify-between gap-2 mb-5 border-y border-white/10 py-3 w-full px-2">
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">ELO</p>
                  <p className="text-sm font-bold text-rankeao-neon-cyan">{xpData?.rating || 1200}</p>
                </div>
                <div className="w-[1px] bg-white/10"></div>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Ranking</p>
                  <p className="text-sm font-bold text-white">#42</p>
                </div>
                <div className="w-[1px] bg-white/10"></div>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">W/L</p>
                  <p className="text-sm font-bold text-green-400">72%</p>
                </div>
                <div className="w-[1px] bg-white/10"></div>
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Torneos</p>
                  <p className="text-sm font-bold text-white">{xpData?.tournaments_played || 0}</p>
                </div>
              </div>

              {/* Juegos Chips */}
              <div className="flex gap-2 justify-center mb-6 w-full">
                <Chip size="sm" variant="secondary" className="bg-zinc-800 text-zinc-300 border-none">Magic</Chip>
                <Chip size="sm" variant="secondary" className="bg-zinc-800 text-zinc-300 border-none">Mitos y Leyendas</Chip>
              </div>

              {loadingProfile ? (
                <div className="w-full h-16 animate-pulse bg-white/5 rounded-xl" />
              ) : (
                <div className="w-full bg-[#0a0b10] rounded-xl p-4 border border-white/5 shadow-inner">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                      Nivel {xpData?.level || 1}
                    </span>
                    <span className="text-sm font-bold text-rankeao-neon-cyan">
                      {xpData?.xp || 0} XP
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-rankeao-neon-purple to-rankeao-neon-cyan h-2 rounded-full"
                      style={{ width: `${((xpData?.xp || 0) % 1000) / 10}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 text-left mt-2 tracking-wide truncate">
                    TÍTULO: {xpData?.title || "NOVATO"}
                  </p>
                </div>
              )}

              {/* Acciones de Perfil */}
              <div className="flex gap-3 w-full mt-6">
                <Button variant="primary" className="flex-1 font-bold">
                  <Person width={16} /> Editar Perfil
                </Button>
                <Button variant="secondary" className="font-bold flex-1" onPress={() => window.location.href = '/perfil/ajustes'}>
                  ⚙️ Ajustes
                </Button>
              </div>

            </Card.Content>
          </Card>
        </div>

        {/* Right Col */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs variant="secondary">
            <Tabs.ListContainer>
              <Tabs.List>
                <Tabs.Tab id="general">
                  Métricas
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="actividad">
                  Feed
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="social">
                  Comunidad ({friendsCount})
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="competitivo">
                  Historial
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="coleccion">
                  Colección
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="marketplace">
                  En Venta
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="logros">
                  Logros
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            <Tabs.Panel id="general" className="pt-4 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-rankeao-light/50 border border-rankeao-light">
                  <Card.Content className="p-4 flex flex-col items-center justify-center text-center w-full">
                    <p className="text-2xl font-black font-rajdhani text-white">
                      {xpData?.tournaments_played || 0}
                    </p>
                    <p className="text-xs text-zinc-400 font-sans uppercase">Torneos</p>
                  </Card.Content>
                </Card>
                <Card className="bg-rankeao-light/50 border border-rankeao-light">
                  <Card.Content className="p-4 flex flex-col items-center justify-center text-center w-full">
                    <p className="text-2xl font-black font-rajdhani text-white">{cosmeticsCount}</p>
                    <p className="text-xs text-zinc-400 font-sans uppercase">Cosméticos</p>
                  </Card.Content>
                </Card>
                <Card className="bg-rankeao-light/50 border border-rankeao-light">
                  <Card.Content className="p-4 flex flex-col items-center justify-center text-center w-full">
                    <p className="text-2xl font-black font-rajdhani text-white">{xpData?.rating || 1200}</p>
                    <p className="text-xs text-zinc-400 font-sans uppercase">Elo Rating</p>
                  </Card.Content>
                </Card>
                <Card className="bg-rankeao-light/50 border border-rankeao-light">
                  <Card.Content className="p-4 flex flex-col items-center justify-center text-center w-full">
                    <p className="text-2xl font-black font-rajdhani text-white">{friendsCount}</p>
                    <p className="text-xs text-zinc-400 font-sans uppercase">Amigos</p>
                  </Card.Content>
                </Card>
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="social" className="pt-4 space-y-4">
              {socialError ? (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {socialError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="bg-rankeao-light/50 border border-rankeao-light/80">
                  <Card.Header className="flex items-center justify-between pb-2">
                    <span className="text-xs uppercase tracking-widest text-zinc-500">Amigos</span>
                    <Chip size="sm" color="success" variant="soft">
                      {friendsCount}
                    </Chip>
                  </Card.Header>
                  <Card.Content className="pt-0 pb-4">
                    <p className="text-sm text-zinc-300 font-semibold">Tu círculo gamer</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Conecta y arma equipos para torneos.</p>
                  </Card.Content>
                </Card>

                <Card className="bg-rankeao-light/50 border border-rankeao-light/80">
                  <Card.Header className="flex items-center justify-between pb-2">
                    <span className="text-xs uppercase tracking-widest text-zinc-500">Solicitudes</span>
                    <Chip
                      size="sm"
                      color={pendingRequestsCount > 0 ? "warning" : "default"}
                      variant={pendingRequestsCount > 0 ? "primary" : "soft"}
                    >
                      {pendingRequestsCount}
                    </Chip>
                  </Card.Header>
                  <Card.Content className="pt-0 pb-4">
                    <p className="text-sm text-zinc-300 font-semibold">Pendientes</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Acepta o rechaza invitaciones.</p>
                  </Card.Content>
                </Card>

                <Card className="bg-rankeao-light/50 border border-rankeao-light/80">
                  <Card.Header className="flex items-center justify-between pb-2">
                    <span className="text-xs uppercase tracking-widest text-zinc-500">Chat</span>
                    <Chip size="sm" color="accent" variant="soft">
                      {chatChannelsCount}
                    </Chip>
                  </Card.Header>
                  <Card.Content className="pt-0 pb-4">
                    <p className="text-sm text-zinc-300 font-semibold">Canales</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Tus conversaciones activas.</p>
                  </Card.Content>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-4">
                  <Card className="bg-rankeao-light/50 border border-rankeao-light">
                    <Card.Content className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                          Lista de amigos
                        </h3>
                        <span className="text-[11px] text-zinc-500">{friendsCount} en total</span>
                      </div>

                      {loadingProfile ? (
                        <div className="space-y-2">
                          <div className="h-10 rounded-lg bg-white/5 animate-pulse" />
                          <div className="h-10 rounded-lg bg-white/5 animate-pulse" />
                        </div>
                      ) : friendsCount > 0 ? (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {friendsList.map((friend, index) => {
                            const friendId = friend?.id ?? friend?.user_id ?? index;
                            const friendName =
                              friend?.username ??
                              friend?.name ??
                              friend?.display_name ??
                              friend?.email ??
                              "Jugador";
                            const friendSubtitle =
                              friend?.favorite_game ??
                              "Jugador de la comunidad";

                            return (
                              <div
                                key={String(friendId)}
                                className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Link href={`/perfil/${friend?.username || friendId}`} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity">
                                    <Avatar size="sm" className="bg-rankeao-light text-xs shrink-0">
                                      <Avatar.Fallback>{getInitial(friendName)}</Avatar.Fallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-sm text-white font-medium truncate">{friendName}</p>
                                      <p className="text-[11px] text-zinc-500 truncate">{friendSubtitle}</p>
                                    </div>
                                  </Link>
                                </div>

                                <Chip
                                  size="sm"
                                  variant="soft"
                                  color="success"
                                  className="text-[10px]"
                                >
                                  Amigo
                                </Chip>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-zinc-500 text-sm">
                          <p className="mb-1">Aún no tienes amigos agregados.</p>
                          <p className="text-xs text-zinc-500">Busca jugadores y envía tu primera solicitud.</p>
                        </div>
                      )}
                    </Card.Content>
                  </Card>

                  <Card className="bg-rankeao-light/50 border border-rankeao-light">
                    <Card.Content className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                          Solicitudes de amistad
                        </h3>
                        <span className="text-[11px] text-zinc-500">{pendingRequestsCount} pendientes</span>
                      </div>

                      {loadingProfile ? (
                        <div className="space-y-2">
                          <div className="h-10 rounded-lg bg-white/5 animate-pulse" />
                        </div>
                      ) : pendingRequestsCount > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {friendRequests.map((request, index) => {
                            const id = request?.id ?? request?.request_id ?? index;
                            const idStr = String(id);
                            const user = request?.from_user ?? request?.user ?? request?.sender ?? {};
                            const name =
                              user?.username ??
                              user?.name ??
                              user?.display_name ??
                              user?.email ??
                              "Jugador";
                            const meta =
                              request?.message ??
                              user?.favorite_game ??
                              "Quiere agregarte como amigo.";

                            const isActing = actingRequestId === idStr;

                            return (
                              <div
                                key={idStr}
                                className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Link href={`/perfil/${user?.username || idStr}`} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity">
                                    <Avatar size="sm" className="bg-rankeao-light text-xs shrink-0">
                                      <Avatar.Fallback>{getInitial(name)}</Avatar.Fallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-sm text-white font-medium truncate">{name}</p>
                                      <p className="text-[11px] text-zinc-500 truncate">{meta}</p>
                                    </div>
                                  </Link>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="text-xs px-2 py-1 h-7"
                                    isDisabled={isActing}
                                    onPress={() => handleAcceptRequest(request)}
                                  >
                                    {isActing ? "..." : "Aceptar"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger-soft"
                                    className="text-xs px-2 py-1 h-7"
                                    isDisabled={isActing}
                                    onPress={() => handleRejectRequest(request)}
                                  >
                                    {isActing ? "..." : "Rechazar"}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-zinc-500 text-sm">
                          No tienes solicitudes pendientes por ahora.
                        </div>
                      )}
                    </Card.Content>
                  </Card>
                </div>

                <div className="xl:col-span-1 space-y-4">
                  <Card className="bg-rankeao-light/50 border border-rankeao-light">
                    <Card.Content className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                          Buscar jugadores
                        </h3>
                        <Chip size="sm" variant="soft" color="default">
                          Beta
                        </Chip>
                      </div>

                      <form className="space-y-2" onSubmit={handleSearchUsers}>
                        <Input
                          aria-label="Buscar jugadores"
                          variant="secondary"
                          placeholder="Buscar por nombre o usuario..."
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          className="w-full text-sm"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          isDisabled={searchingUsers}
                        >
                          {searchingUsers ? "Buscando..." : "Buscar"}
                        </Button>
                      </form>

                      {searchResults.length > 0 ? (
                        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                          {searchResults.map((user, index) => {
                            const id = user?.id ?? user?.user_id ?? index;
                            const idStr = String(id);
                            const name =
                              user?.username ??
                              user?.name ??
                              user?.display_name ??
                              user?.email ??
                              "Jugador";
                            const subtitle =
                              user?.favorite_game ??
                              user?.city ??
                              user?.bio ??
                              "Jugador de la comunidad";

                            const alreadyFriend = friendIds.has(String(user?.id ?? user?.user_id ?? ""));

                            return (
                              <div
                                key={idStr}
                                className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Link href={`/perfil/${user?.username || idStr}`} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity">
                                    <Avatar size="sm" className="bg-rankeao-light text-xs shrink-0">
                                      <Avatar.Fallback>{getInitial(name)}</Avatar.Fallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-sm text-white font-medium truncate">{name}</p>
                                      <p className="text-[11px] text-zinc-500 truncate">{subtitle}</p>
                                    </div>
                                  </Link>
                                </div>
                                <div className="shrink-0">
                                  {alreadyFriend ? (
                                    <Chip size="sm" variant="soft" color="success" className="text-[10px]">
                                      Amigo
                                    </Chip>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="text-xs px-2 py-1 h-7"
                                      isDisabled={sendingRequestTo === idStr}
                                      onPress={() => handleSendFriendRequest(user)}
                                    >
                                      {sendingRequestTo === idStr ? "Enviando..." : "Agregar"}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : searchQuery.trim() && !searchingUsers ? (
                        <p className="mt-3 text-[11px] text-zinc-500">
                          No encontramos jugadores para &quot;{searchQuery.trim()}&quot;. Intenta con otro nombre o usuario.
                        </p>
                      ) : null}
                    </Card.Content>
                  </Card>

                  <Card className="bg-rankeao-light/50 border border-rankeao-light">
                    <Card.Content className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                          Canales de chat
                        </h3>
                        <Chip size="sm" variant="soft" color="accent">
                          {chatChannelsCount}
                        </Chip>
                      </div>

                      {loadingProfile ? (
                        <div className="space-y-2">
                          <div className="h-9 rounded-lg bg-white/5 animate-pulse" />
                          <div className="h-9 rounded-lg bg-white/5 animate-pulse" />
                        </div>
                      ) : chatChannelsCount > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {chatChannels.map((channel, index) => {
                            const id = channel?.id ?? channel?.channel_id ?? index;
                            const name = channel?.name ?? channel?.title ?? "Canal";
                            const lastMessage =
                              channel?.last_message?.content ??
                              channel?.last_message_text ??
                              channel?.preview ??
                              "Aún no hay mensajes.";
                            const unread = Number(channel?.unread_count ?? channel?.unread ?? 0);

                            return (
                              <div
                                key={String(id)}
                                className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/25 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm text-white font-medium truncate">{name}</p>
                                  <p className="text-[11px] text-zinc-500 truncate">{lastMessage}</p>
                                </div>
                                {unread > 0 ? (
                                  <Chip
                                    size="sm"
                                    variant="soft"
                                    color="danger"
                                    className="text-[10px]"
                                  >
                                    {unread} nuevo{unread > 1 ? "s" : ""}
                                  </Chip>
                                ) : (
                                  <span className="text-[10px] text-zinc-500">Sin nuevos</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="py-4 text-xs text-zinc-500">
                          Todavía no tienes canales de chat activos.
                        </p>
                      )}
                    </Card.Content>
                  </Card>
                </div>
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="competitivo" className="pt-4">
              <Card className="bg-rankeao-light/50 border border-rankeao-light">
                <Card.Content className="p-6 text-center text-zinc-400 min-h-[200px] flex items-center justify-center flex-col">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-12 h-12 text-zinc-600 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014.158 20H9.843a3.374 3.374 0 00-2.384-5.657l-.548-.547z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-white mb-1">Próximamente</h3>
                  <p className="text-sm text-zinc-500">
                    Estamos trabajando en esta sección para traerte estadísticas detalladas de tu desempeño competitivo, historial de partidas y análisis de rendimiento. ¡Mantente atento a las actualizaciones!
                  </p>
                </Card.Content>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel id="actividad" className="pt-4">
              <div className="text-center py-16 bg-[var(--surface-secondary)] border border-dashed border-[var(--border)] rounded-2xl max-w-4xl mx-auto">
                <div className="text-4xl mb-4 text-zinc-500">📰</div>
                <h3 className="text-lg font-bold mb-2">Feed Personal</h3>
                <p className="text-[var(--muted)]">Tus publicaciones y actividad reciente aparecerán aquí.</p>
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="coleccion" className="pt-4">
              <div className="text-center py-16 bg-[var(--surface-secondary)] border border-dashed border-[var(--border)] rounded-2xl max-w-4xl mx-auto">
                <div className="text-4xl mb-4 text-zinc-500">🎴</div>
                <h3 className="text-lg font-bold mb-2">Cartas y Mazos</h3>
                <p className="text-[var(--muted)]">Gestiona tu colección y listas de mazos públicamente.</p>
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="marketplace" className="pt-4">
              <div className="text-center py-16 bg-[var(--surface-secondary)] border border-dashed border-[var(--border)] rounded-2xl max-w-4xl mx-auto">
                <div className="text-4xl mb-4 text-zinc-500">🛒</div>
                <h3 className="text-lg font-bold mb-2">Mis Listados</h3>
                <p className="text-[var(--muted)]">Cartas y productos que tienes a la venta en el Marketplace.</p>
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="logros" className="pt-4">
              <div className="text-center py-16 bg-[var(--surface-secondary)] border border-dashed border-[var(--border)] rounded-2xl max-w-4xl mx-auto">
                <div className="text-4xl mb-4 text-zinc-500">🏆</div>
                <h3 className="text-lg font-bold mb-2">Galería de Logros</h3>
                <p className="text-[var(--muted)]">Gana medallas por tu desempeño en torneos y participaciones en Rankeao.</p>
              </div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
