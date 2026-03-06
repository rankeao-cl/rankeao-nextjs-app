"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, Card, CardHeader, CardContent, Tabs, Chip } from "@heroui/react";
import { getMyXp, getFriends, getMyCosmetics } from "@/lib/api";

export default function PerfilPage() {
    const { session, status } = useAuth();
    const [xpData, setXpData] = useState<any>(null);
    const [friendsList, setFriendsList] = useState<any[]>([]);
    const [cosmetics, setCosmetics] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (status === "authenticated" && session) {
            Promise.all([
                getMyXp().catch(() => null),
                getFriends().catch(() => ({ data: [] })),
                getMyCosmetics().catch(() => ({ data: [] }))
            ]).then(([xpRes, friendsRes, cosmeticsRes]) => {
                if (xpRes) setXpData(xpRes);
                if (friendsRes?.data) setFriendsList(friendsRes.data);
                if (cosmeticsRes?.data) setCosmetics(cosmeticsRes.data);
                setLoadingStats(false);
            });
        } else if (status === "unauthenticated") {
            setLoadingStats(false);
        }
    }, [status, session]);

    if (status === "loading") {
        return (
            <div className="flex justify-center flex-col items-center min-h-[50vh] space-y-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 rounded-full border-t-2 border-r-2 border-rankeao-neon-cyan animate-spin" fill="none" viewBox="0 0 24 24" />
                <p className="text-zinc-500 font-sans text-sm">Cargando perfil...</p>
            </div>
        );
    }

    if (status === "unauthenticated" || !session) {
        return (
            <div className="flex justify-center flex-col items-center min-h-[50vh] space-y-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h2 className="text-xl font-bold font-rajdhani text-zinc-300">Acceso Restringido</h2>
                <p className="text-zinc-500 font-sans">Debes iniciar sesi&oacute;n para ver tu perfil.</p>
            </div>
        );
    }

    const email = session?.email;
    const username = session?.username;

    return (
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-black font-rajdhani text-transparent bg-clip-text bg-gradient-to-r from-rankeao-neon-purple to-rankeao-neon-cyan uppercase tracking-wider">
                    Mi Perfil
                </h1>
                <p className="text-zinc-400 font-sans mt-1">
                    Gestiona tu progreso, amigos y est&aacute;disticas
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Col: User Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-rankeao-light/50 border border-rankeao-light shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-rankeao-neon-purple/20 to-transparent" />
                        <CardContent className="p-6 pt-10 text-center flex flex-col items-center relative z-10 w-full">
                            <Avatar
                                size="lg"
                                className="w-24 h-24 ring-4 ring-[#0f1017] shadow-lg mb-4 text-zinc-200 bg-rankeao-light"
                            >
                                <Avatar.Fallback>
                                    {username?.charAt(0)?.toUpperCase() || "U"}
                                </Avatar.Fallback>
                            </Avatar>
                            <h2 className="text-2xl font-bold font-rajdhani text-white mb-1">
                                {username}
                            </h2>
                            <p className="text-sm font-sans text-zinc-400 mb-4">{email}</p>

                            {/* Quick XP Summary */}
                            {loadingStats ? (
                                <div className="w-full h-12 animate-pulse bg-white/5 rounded-xl" />
                            ) : (
                                <div className="w-full bg-[#0a0b10] rounded-xl p-4 border border-white/5 shadow-inner">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Nivel {xpData?.level || 1}</span>
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
                                        TITULO: {xpData?.title || "NOVATO"}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Col: Details via Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs variant="secondary">
                        <Tabs.ListContainer>
                            <Tabs.List>
                                <Tabs.Tab id="general">
                                    General
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="social">
                                    Social ({friendsList?.length || 0})
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="competitivo">
                                    Competitivo
                                    <Tabs.Indicator />
                                </Tabs.Tab>
                            </Tabs.List>
                        </Tabs.ListContainer>

                        <Tabs.Panel id="general" className="pt-4 space-y-6">
                            {/* Stats Row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-rankeao-neon-purple mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                        <p className="text-2xl font-black font-rajdhani text-white">{xpData?.tournaments_played || 0}</p>
                                        <p className="text-xs text-zinc-400 font-sans uppercase">Torneos</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-rankeao-neon-cyan mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                        </svg>
                                        <p className="text-2xl font-black font-rajdhani text-white">{cosmetics?.length || 0}</p>
                                        <p className="text-xs text-zinc-400 font-sans uppercase">Cosm&eacute;ticos</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                        <p className="text-2xl font-black font-rajdhani text-white">{xpData?.rating || 1200}</p>
                                        <p className="text-xs text-zinc-400 font-sans uppercase">Elo Rating</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <p className="text-2xl font-black font-rajdhani text-white">{friendsList?.length || 0}</p>
                                        <p className="text-xs text-zinc-400 font-sans uppercase">Amigos</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Account Settings */}
                            <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                <CardContent className="p-6 w-full">
                                    <h3 className="text-lg font-bold font-rajdhani text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-rankeao-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Detalles de mi cuenta
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-white/5">
                                            <span className="text-sm text-zinc-500 font-medium">Nombre de Usuario</span>
                                            <span className="text-sm text-zinc-200 font-medium mt-1 sm:mt-0">{username}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-white/5">
                                            <span className="text-sm text-zinc-500 font-medium">Correo Electr&oacute;nico</span>
                                            <span className="text-sm text-zinc-300 mt-1 sm:mt-0">{email}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:justify-between py-3">
                                            <span className="text-sm text-zinc-500 font-medium">Roles Access</span>
                                            <span className="text-sm text-zinc-400 mt-1 sm:mt-0 flex gap-2">
                                                <span className="bg-white/5 px-2 py-1 rounded text-xs border border-white/10">Jugador</span>
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Tabs.Panel>

                        <Tabs.Panel id="social" className="pt-4">
                            <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                <CardContent className="p-6 text-center text-zinc-400 min-h-[200px] flex items-center justify-center flex-col">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    El módulo social (mensajes y retos) está en construcción.
                                </CardContent>
                            </Card>
                        </Tabs.Panel>

                        <Tabs.Panel id="competitivo" className="pt-4">
                            <Card className="bg-rankeao-light/50 border border-rankeao-light">
                                <CardContent className="p-6 text-center text-zinc-400 min-h-[200px] flex items-center justify-center flex-col">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    El historial de torneos y elos competitivos se cargarán aquí.
                                </CardContent>
                            </Card>
                        </Tabs.Panel>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
