"use client";

import { useState } from "react";
import { Switch, Button, Card } from "@heroui/react";
import { ArrowLeft, Bell, Person, StarFill, ShoppingCart, Comment, ShieldExclamation } from "@gravity-ui/icons";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AjustesNotificaciones() {
    const { status } = useAuth();
    const [dnd, setDnd] = useState(false);

    // Mock settings state
    const [settings, setSettings] = useState({
        social: true,
        torneos: true,
        mercado: true,
        chat: true,
        sistema: true,
    });

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (status === "loading") return <div className="p-8 text-center text-[var(--muted)]">Cargando...</div>;
    if (status === "unauthenticated") return <div className="p-8 text-center text-[var(--muted)]">Debes iniciar sesión.</div>;

    return (
        <div className="min-h-[calc(100vh-64px)] bg-black/50 w-full animate-appearance-in">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/perfil/me">
                        <Button isIconOnly variant="tertiary" size="sm" className="text-[var(--muted)]">
                            <ArrowLeft width={18} />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Ajustes de Notificaciones</h1>
                </div>

                <Card className="bg-[var(--surface)] border border-[var(--border)] p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
                                <Bell className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-[var(--foreground)]">No Molestar</h3>
                                <p className="text-sm text-[var(--muted)] mt-1 max-w-md">Silencia temporalmente todas las notificaciones push y sonidos, excepto las alertas críticas del sistema.</p>
                            </div>
                        </div>
                        <Switch
                            isSelected={dnd}
                            onChange={setDnd}
                            size="lg"
                        />
                    </div>
                </Card>

                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-[var(--foreground)] px-2">Categorías</h2>

                    {/* Social */}
                    <Card className={`p-5 transition-opacity ${dnd ? 'opacity-50 pointer-events-none' : ''} bg-[var(--surface-secondary)] border border-[var(--border)]`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Person className="size-5 text-blue-500" />
                                <div>
                                    <h4 className="font-semibold text-[var(--foreground)]">Social</h4>
                                    <p className="text-xs text-[var(--muted)]">Nuevos seguidores, solicitudes de amistad, likes.</p>
                                </div>
                            </div>
                            <Switch isSelected={settings.social} onChange={() => handleToggle('social')} />
                        </div>
                    </Card>

                    {/* Torneos */}
                    <Card className={`p-5 transition-opacity ${dnd ? 'opacity-50 pointer-events-none' : ''} bg-[var(--surface-secondary)] border border-[var(--border)]`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <StarFill className="size-5 text-purple-500" />
                                <div>
                                    <h4 className="font-semibold text-[var(--foreground)]">Torneos</h4>
                                    <p className="text-xs text-[var(--muted)]">Avisos de inicio, recordatorios y resultados.</p>
                                </div>
                            </div>
                            <Switch isSelected={settings.torneos} onChange={() => handleToggle('torneos')} />
                        </div>
                    </Card>

                    {/* Marketplace */}
                    <Card className={`p-5 transition-opacity ${dnd ? 'opacity-50 pointer-events-none' : ''} bg-[var(--surface-secondary)] border border-[var(--border)]`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShoppingCart className="size-5 text-orange-500" />
                                <div>
                                    <h4 className="font-semibold text-[var(--foreground)]">Marketplace</h4>
                                    <p className="text-xs text-[var(--muted)]">Ventas concretadas, nuevas compras y ofertas.</p>
                                </div>
                            </div>
                            <Switch isSelected={settings.mercado} onChange={() => handleToggle('mercado')} />
                        </div>
                    </Card>

                    {/* Chat */}
                    <Card className={`p-5 transition-opacity ${dnd ? 'opacity-50 pointer-events-none' : ''} bg-[var(--surface-secondary)] border border-[var(--border)]`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Comment className="size-5 text-rankeao-neon-cyan" />
                                <div>
                                    <h4 className="font-semibold text-[var(--foreground)]">Chat</h4>
                                    <p className="text-xs text-[var(--muted)]">Mensajes directos, salas globales y de soporte.</p>
                                </div>
                            </div>
                            <Switch isSelected={settings.chat} onChange={() => handleToggle('chat')} />
                        </div>
                    </Card>

                    {/* Sistema */}
                    <Card className={`p-5 bg-[var(--surface-secondary)] border border-[var(--border)]`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShieldExclamation className="size-5 text-[var(--foreground)]" />
                                <div>
                                    <h4 className="font-semibold text-[var(--foreground)]">Alertas del Sistema</h4>
                                    <p className="text-xs text-[var(--muted)]">Mantenimiento, reportes y cambios en tu cuenta. <span className="text-red-400 font-medium">(Obligatorio)</span></p>
                                </div>
                            </div>
                            <Switch isSelected={settings.sistema} isDisabled={true} />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
