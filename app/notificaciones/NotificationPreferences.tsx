"use client";

import { useState, useEffect } from "react";
import { Switch, Button } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/lib/hooks/use-notifications";

interface PreferenceRow {
    key: string;
    label: string;
    description: string;
    icon: string;
}

const PREFERENCE_ROWS: PreferenceRow[] = [
    {
        key: "social_interactions",
        label: "Social",
        description: "Likes, comentarios, nuevos seguidores y solicitudes de amistad",
        icon: "👥",
    },
    {
        key: "tournament_updates",
        label: "Torneos",
        description: "Inicio de rondas, resultados, inscripciones y recordatorios",
        icon: "⚔️",
    },
    {
        key: "match_reminders",
        label: "Partidas",
        description: "Recordatorios de partidas próximas y reportes de resultados",
        icon: "🎮",
    },
    {
        key: "marketplace_offers",
        label: "Marketplace",
        description: "Nuevas ofertas, ventas, mensajes de compradores y precio justo",
        icon: "🛒",
    },
    {
        key: "price_alerts",
        label: "Alertas de Precio",
        description: "Cambios de precio en cartas que sigues o alertas configuradas",
        icon: "💰",
    },
    {
        key: "clan_activity",
        label: "Comunidades",
        description: "Actividad en tus comunidades: eventos, publicaciones y anuncios",
        icon: "🏠",
    },
    {
        key: "system_announcements",
        label: "Sistema",
        description: "Actualizaciones de la plataforma, mantenimientos y novedades",
        icon: "🔔",
    },
];

export default function NotificationPreferences() {
    const { session } = useAuth();
    const token = session?.accessToken;
    const { data: prefData, isLoading } = useNotificationPreferences(token);
    const updatePrefs = useUpdateNotificationPreferences();

    const [prefs, setPrefs] = useState<Record<string, boolean>>({});
    const [pushEnabled, setPushEnabled] = useState(true);
    const [dndEnabled, setDndEnabled] = useState(false);
    const [dndFrom, setDndFrom] = useState("22:00");
    const [dndTo, setDndTo] = useState("08:00");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (prefData) {
            const raw = prefData?.data ?? prefData;
            const parsed: Record<string, boolean> = {};
            PREFERENCE_ROWS.forEach((row) => {
                parsed[row.key] = raw?.[row.key] !== false;
            });
            setPrefs(parsed);
            if (raw?.push_enabled !== undefined) setPushEnabled(raw.push_enabled);
            if (raw?.dnd_enabled !== undefined) setDndEnabled(raw.dnd_enabled);
            if (raw?.dnd_from) setDndFrom(raw.dnd_from);
            if (raw?.dnd_to) setDndTo(raw.dnd_to);
        }
    }, [prefData]);

    const togglePref = (key: string, value: boolean) => {
        setPrefs((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updatePrefs.mutateAsync({
                ...prefs,
                push_enabled: pushEnabled,
                dnd_enabled: dndEnabled,
            } as Record<string, boolean>);
        } catch {
            // silent
        }
        setSaving(false);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Master Push Toggle */}
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-[var(--foreground)]">Push Notifications</h3>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                            Interruptor maestro para todas las notificaciones push
                        </p>
                    </div>
                    <Switch
                        isSelected={pushEnabled}
                        onChange={setPushEnabled}
                        aria-label="Push notifications"
                    />
                </div>
            </div>

            {/* Do Not Disturb */}
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                        <h3 className="text-sm font-bold text-[var(--foreground)]">No Molestar</h3>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                            Silenciar notificaciones durante un rango horario
                        </p>
                    </div>
                    <Switch
                        isSelected={dndEnabled}
                        onChange={setDndEnabled}
                        aria-label="No molestar"
                    />
                </div>
                {dndEnabled && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)]">
                        <label className="text-xs text-[var(--muted)] font-medium">Desde</label>
                        <input
                            type="time"
                            value={dndFrom}
                            onChange={(e) => setDndFrom(e.target.value)}
                            className="px-2 py-1.5 rounded-lg text-xs bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)]"
                        />
                        <label className="text-xs text-[var(--muted)] font-medium">Hasta</label>
                        <input
                            type="time"
                            value={dndTo}
                            onChange={(e) => setDndTo(e.target.value)}
                            className="px-2 py-1.5 rounded-lg text-xs bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)]"
                        />
                    </div>
                )}
            </div>

            {/* Category Toggles */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
                <div className="px-4 py-3">
                    <h3 className="text-sm font-bold text-[var(--foreground)]">Categorías de Notificación</h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5">Elige qué tipo de notificaciones quieres recibir</p>
                </div>
                {PREFERENCE_ROWS.map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl flex-shrink-0">{row.icon}</span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--foreground)]">{row.label}</p>
                                <p className="text-xs text-[var(--muted)] line-clamp-1">{row.description}</p>
                            </div>
                        </div>
                        <Switch
                            isSelected={prefs[row.key] !== false}
                            onChange={(v) => togglePref(row.key, v)}
                            aria-label={row.label}
                            isDisabled={!pushEnabled}
                        />
                    </div>
                ))}
            </div>

            {/* Save */}
            <Button
                variant="primary"
                className="w-full font-bold bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg"
                onPress={handleSave}
                isDisabled={saving}
            >
                {saving ? "Guardando..." : "Guardar preferencias"}
            </Button>
        </div>
    );
}
