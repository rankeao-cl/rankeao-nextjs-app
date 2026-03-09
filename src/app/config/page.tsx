"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, Button, Card, Chip, Input, Switch, Select, TextField, Label, Description, ListBox } from "@heroui/react";
import { Gear, ShieldExclamation, Person, Palette, Briefcase, Bell } from "@gravity-ui/icons";

const TABS = [
    { id: "account", label: "Cuenta", icon: <Person className="size-4" /> },
    { id: "appearance", label: "Apariencia", icon: <Palette className="size-4" /> },
    { id: "security", label: "Seguridad", icon: <ShieldExclamation className="size-4" /> },
    { id: "preferences", label: "Preferencias", icon: <Gear className="size-4" /> },
    { id: "notifications", label: "Notificaciones", icon: <Bell className="size-4" /> },
];

export default function ConfigPage() {
    const { session, status } = useAuth();
    const [activeTab, setActiveTab] = useState("account");

    if (status === "loading") {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="animate-pulse bg-zinc-800 rounded-xl w-32 h-32" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="flex flex-col justify-center items-center h-full min-h-[50vh] space-y-4">
                <ShieldExclamation className="size-16 text-zinc-500" />
                <h2 className="text-xl font-bold">Inicia sesión</h2>
                <p className="text-zinc-400">Debes iniciar sesión para editar tu configuración.</p>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>Configuración</h1>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                    Administra tu cuenta, apariencia y preferencias del sistema.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Tabs */}
                <Card className="md:w-64 shrink-0 h-fit" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Card.Content className="p-3 space-y-1">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                                        : "text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                                        }`}
                                >
                                    <span className={isActive ? "text-[var(--accent)]" : "text-[var(--muted)]"}>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            );
                        })}
                    </Card.Content>
                </Card>

                {/* Content Area */}
                <div className="flex-1 space-y-6">
                    {activeTab === "account" && (
                        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <Card.Content className="p-5 sm:p-6 space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Perfil Público</h2>
                                    <p className="text-sm" style={{ color: "var(--muted)" }}>Información visible para otros usuarios.</p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <Avatar size="lg">
                                        <Avatar.Image src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg" />
                                        <Avatar.Fallback>{session?.username?.[0]?.toUpperCase() || "U"}</Avatar.Fallback>
                                    </Avatar>
                                    <Button variant="secondary" size="sm">Cambiar Avatar</Button>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <TextField>
                                        <Label>Nombre de Usuario</Label>
                                        <Input
                                            defaultValue={session?.username || ""}
                                            variant="secondary"
                                        />
                                    </TextField>
                                    <TextField>
                                        <Label>Email</Label>
                                        <Input
                                            defaultValue={session?.email || ""}
                                            disabled
                                            variant="secondary"
                                        />
                                        <Description>El email no puede ser modificado por ahora.</Description>
                                    </TextField>
                                </div>

                                <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                                    <Button variant="primary">Guardar Cambios</Button>
                                </div>
                            </Card.Content>
                        </Card>
                    )}

                    {activeTab === "appearance" && (
                        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <Card.Content className="p-5 sm:p-6 space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Apariencia</h2>
                                    <p className="text-sm" style={{ color: "var(--muted)" }}>Personaliza cómo se ve Rankeao en tu dispositivo.</p>
                                </div>

                                <div className="space-y-4">
                                    <Select placeholder="Selecciona un tema" isDisabled defaultSelectedKey="dark">
                                        <Label>Tema (WIP)</Label>
                                        <Select.Trigger>
                                            <Select.Value />
                                            <Select.Indicator />
                                        </Select.Trigger>
                                        <Select.Popover>
                                            <ListBox>
                                                <ListBox.Item id="dark" textValue="Oscuro">
                                                    Oscuro (Predeterminado)
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                                <ListBox.Item id="light" textValue="Claro">
                                                    Claro
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                                <ListBox.Item id="system" textValue="Sistema">
                                                    Igual al Sistema
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                            </ListBox>
                                        </Select.Popover>
                                    </Select>

                                    <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: "var(--surface-secondary)" }}>
                                        <div>
                                            <p className="font-semibold" style={{ color: "var(--foreground)" }}>Animaciones y Blur</p>
                                            <p className="text-xs" style={{ color: "var(--muted)" }}>Activa o desactiva los efectos de glassmorphism.</p>
                                        </div>
                                        <Switch defaultSelected />
                                    </div>
                                </div>
                            </Card.Content>
                        </Card>
                    )}

                    {activeTab === "security" && (
                        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <Card.Content className="p-5 sm:p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Seguridad</h2>
                                        <p className="text-sm" style={{ color: "var(--muted)" }}>Protege el acceso a tu cuenta.</p>
                                    </div>
                                    <Chip size="sm" color="warning" variant="soft">WIP</Chip>
                                </div>

                                <div className="space-y-4 opacity-50 pointer-events-none">
                                    <TextField>
                                        <Label>Contraseña Actual</Label>
                                        <Input
                                            type="password"
                                            variant="secondary"
                                        />
                                    </TextField>
                                    <TextField>
                                        <Label>Nueva Contraseña</Label>
                                        <Input
                                            type="password"
                                            variant="secondary"
                                        />
                                    </TextField>
                                    <TextField>
                                        <Label>Confirmar Contraseña</Label>
                                        <Input
                                            type="password"
                                            variant="secondary"
                                        />
                                    </TextField>
                                    <Button variant="secondary">Actualizar Contraseña</Button>
                                </div>

                                <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                                    <h3 className="text-danger font-bold text-sm mb-2">Zona de Riesgo</h3>
                                    <Button variant="danger-soft">Eliminar Cuenta</Button>
                                </div>
                            </Card.Content>
                        </Card>
                    )}

                    {activeTab === "preferences" && (
                        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <Card.Content className="p-5 sm:p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Preferencias Sociales</h2>
                                        <p className="text-sm" style={{ color: "var(--muted)" }}>Controla quién puede interactuar contigo.</p>
                                    </div>
                                    <Chip size="sm" color="warning" variant="soft">WIP</Chip>
                                </div>

                                <div className="space-y-3 opacity-60">
                                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface-secondary)" }}>
                                        <span className="text-sm font-medium">Recibir mensajes directos de desconocidos</span>
                                        <Switch defaultSelected />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface-secondary)" }}>
                                        <span className="text-sm font-medium">Mostrar mi ELO públicamente</span>
                                        <Switch defaultSelected />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface-secondary)" }}>
                                        <span className="text-sm font-medium">Aparecer en búsquedas de jugadores</span>
                                        <Switch defaultSelected />
                                    </div>
                                </div>
                            </Card.Content>
                        </Card>
                    )}

                    {activeTab === "notifications" && (
                        <Card style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <Card.Content className="p-5 sm:p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Notificaciones</h2>
                                        <p className="text-sm" style={{ color: "var(--muted)" }}>Elige qué notificaciones quieres recibir.</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface-secondary)" }}>
                                        <div>
                                            <span className="text-sm font-medium block">Torneos y Rondas</span>
                                            <span className="text-xs text-[var(--muted)]">Cuándo te toca jugar y resultados.</span>
                                        </div>
                                        <Switch defaultSelected />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface-secondary)" }}>
                                        <div>
                                            <span className="text-sm font-medium block">Marketplace</span>
                                            <span className="text-xs text-[var(--muted)]">Ofertas recibidas y ventas.</span>
                                        </div>
                                        <Switch defaultSelected />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface-secondary)" }}>
                                        <div>
                                            <span className="text-sm font-medium block">Social</span>
                                            <span className="text-xs text-[var(--muted)]">Solicitudes de amistad y chat.</span>
                                        </div>
                                        <Switch defaultSelected />
                                    </div>

                                    <div className="pt-4 border-t border-[var(--separator)]">
                                        <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]">
                                            <div>
                                                <span className="text-sm font-bold block text-danger">Modo 'No Molestar'</span>
                                                <span className="text-xs text-[var(--muted)]">Silencia todas las notificaciones temporales.</span>
                                            </div>
                                            <Switch />
                                        </div>
                                    </div>
                                </div>
                            </Card.Content>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
