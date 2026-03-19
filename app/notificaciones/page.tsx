"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ScrollShadow, Button, Chip } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { Person, Bell, ShoppingCart, StarFill, Gear } from "@gravity-ui/icons";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead } from "@/lib/api/notifications";
import type { Notification } from "@/lib/types/notification";
import NotificationPreferences from "./NotificationPreferences";

const CATEGORIES = [
    { id: "all", label: "Todas", icon: null },
    { id: "social", label: "Social", icon: <Person className="size-3.5" /> },
    { id: "tournament", label: "Torneos", icon: <StarFill className="size-3.5" /> },
    { id: "competitive", label: "Competitivo", icon: <StarFill className="size-3.5" /> },
    { id: "chat", label: "Chat", icon: <Person className="size-3.5" /> },
    { id: "marketplace", label: "Marketplace", icon: <ShoppingCart className="size-3.5" /> },
    { id: "system", label: "Sistema", icon: <Bell className="size-3.5" /> },
];

const categoryColors: Record<string, { bg: string; text: string }> = {
    social: { bg: "bg-[var(--accent)]/15", text: "text-[var(--accent)]" },
    tournament: { bg: "bg-[var(--warning)]/15", text: "text-[var(--warning)]" },
    competitive: { bg: "bg-[var(--warning)]/15", text: "text-[var(--warning)]" },
    chat: { bg: "bg-[var(--info,var(--accent))]/15", text: "text-[var(--info,var(--accent))]" },
    marketplace: { bg: "bg-[var(--success)]/15", text: "text-[var(--success)]" },
    system: { bg: "bg-[var(--default)]", text: "text-[var(--muted)]" },
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "hace instantes";
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "");
}

function getNotifCategory(notif: Notification): string {
    return notif.category?.toLowerCase() || notif.channel?.toLowerCase() || notif.type?.toLowerCase() || "system";
}

function getCategoryIcon(cat: string) {
    switch (cat) {
        case "social":
            return <Person className="size-4" />;
        case "marketplace":
            return <ShoppingCart className="size-4" />;
        case "tournament":
        case "competitive":
            return <StarFill className="size-4" />;
        case "chat":
            return <Person className="size-4" />;
        default:
            return <Bell className="size-4" />;
    }
}

export default function NotificacionesPage() {
    const { session, status } = useAuth();
    const isAuthenticated = status === "authenticated" && Boolean(session?.email);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [showPreferences, setShowPreferences] = useState(false);

    useEffect(() => {
        if (isAuthenticated && session?.accessToken) {
            setLoading(true);
            Promise.all([
                getNotifications({ per_page: 100 }, session.accessToken).catch(() => null),
                getUnreadNotificationCount(session.accessToken).catch(() => null),
            ]).then(([notifRes, countRes]) => {
                const raw = notifRes?.notifications ?? notifRes;
                const list = Array.isArray(raw) ? raw : [];
                if (list.length > 0) {
                    // Normalize: API returns read_at (timestamp|null), frontend uses is_read (boolean)
                    const normalized = list.map((n: Notification) => ({
                        ...n,
                        is_read: n.is_read ?? (n.read_at != null),
                        category: n.category || n.channel,
                    }));
                    setNotifications(normalized);
                }

                const total = countRes?.total;
                if (typeof total === "number") {
                    setUnreadCount(total);
                }
                setLoading(false);
            });
        }
    }, [isAuthenticated, session]);

    const handleMarkAllRead = async () => {
        if (!isAuthenticated || !session?.accessToken) return;
        setMarkingAll(true);
        try {
            await markAllNotificationsRead(session.accessToken);
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch {}
        setMarkingAll(false);
    };

    const filteredNotifications = useMemo(() => {
        if (activeTab === "all") return notifications;
        return notifications.filter((n) => {
            const cat = getNotifCategory(n);
            return cat === activeTab;
        });
    }, [notifications, activeTab]);

    const unreadInTab = useMemo(() => {
        return filteredNotifications.filter((n) => !n.is_read).length;
    }, [filteredNotifications]);

    if (showPreferences) {
        return (
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <Button size="sm" variant="secondary" onPress={() => setShowPreferences(false)}>
                        &larr; Volver
                    </Button>
                    <h1 className="text-xl font-bold text-[var(--foreground)]">Preferencias de Notificaciones</h1>
                </div>
                <NotificationPreferences />
            </main>
        );
    }

    return (
        <main className="max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <section className="mb-6">
                <div
                    className="glass p-5 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                    <div className="relative z-10 flex-1">
                        <Chip color="accent" variant="soft" size="sm" className="mb-3 px-3">
                            Novedades / Social / Torneos
                        </Chip>
                        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                            Notificaciones
                        </h1>
                        <p className="text-sm text-[var(--muted)] max-w-lg mb-4">
                            Aquí encontrarás todas las actualizaciones relevantes, desde interacciones sociales hasta novedades de torneos y el marketplace.
                        </p>
                    </div>
                    <div className="relative z-10 shrink-0 flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onPress={() => setShowPreferences(true)}
                            className="h-9 w-9 min-w-0 p-0"
                            aria-label="Preferencias de notificaciones"
                        >
                            <Gear className="size-4" />
                        </Button>
                        {notifications.length > 0 && unreadCount > 0 && (
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onPress={handleMarkAllRead}
                                isDisabled={markingAll}
                            >
                                {markingAll ? "Marcando..." : "Marcar todas como leídas"}
                            </Button>
                        )}
                    </div>
                </div>
            </section>

            {/* Category Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
                {CATEGORIES.map((cat) => {
                    const isActive = activeTab === cat.id;
                    const count = cat.id === "all"
                        ? notifications.filter((n) => !n.is_read).length
                        : notifications.filter((n) => getNotifCategory(n) === cat.id && !n.is_read).length;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap flex-shrink-0 ${
                                isActive
                                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)] shadow-sm"
                                    : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)]"
                            }`}
                        >
                            {cat.icon}
                            {cat.label}
                            {count > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    isActive
                                        ? "bg-[var(--accent-foreground)]/20 text-[var(--accent-foreground)]"
                                        : "bg-[var(--accent)]/15 text-[var(--accent)]"
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Notifications List */}
            <div className="glass p-4 sm:p-5 rounded-2xl overflow-hidden">
                <ScrollShadow className="max-h-[70vh] w-full custom-scrollbar">
                    <div className="flex flex-col">
                        {loading ? (
                            <div className="py-10 px-6 text-center text-[var(--muted)]">Cargando notificaciones...</div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="py-10 px-6 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-3">
                                    <Bell className="size-6 text-[var(--accent)] opacity-60" />
                                </div>
                                <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
                                    {activeTab === "all" ? "Todo al día" : `Sin notificaciones de ${CATEGORIES.find((c) => c.id === activeTab)?.label}`}
                                </p>
                                <p className="text-xs text-[var(--muted)]">
                                    {activeTab === "all"
                                        ? "No tienes notificaciones pendientes"
                                        : "No hay notificaciones en esta categoría"}
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((notif) => {
                                const cat = getNotifCategory(notif);
                                const colors = categoryColors[cat] || categoryColors.system;
                                const inner = (
                                    <div
                                        className={`flex gap-3 px-3 py-3 mx-1 my-0.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer relative ${
                                            !notif.is_read ? "bg-[var(--accent)]/5" : ""
                                        }`}
                                        style={!notif.is_read ? { borderLeft: "3px solid var(--accent)" } : { borderLeft: "3px solid transparent" }}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}>
                                            {getCategoryIcon(cat)}
                                        </div>
                                        <div className="flex flex-col flex-1 leading-snug min-w-0">
                                            <p className={`text-[13px] text-[var(--foreground)] leading-relaxed ${!notif.is_read ? "font-semibold" : ""}`}>
                                                {stripHtml(notif.title || "Nueva notificación")}
                                            </p>
                                            {notif.body && (
                                                <p className="text-[11px] text-[var(--muted)] leading-snug mt-0.5 line-clamp-2">
                                                    {stripHtml(notif.body)}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[10px] text-[var(--muted)] font-medium">{timeAgo(notif.created_at)}</p>
                                                <Chip size="sm" variant="secondary" className="text-[9px] h-4 px-1.5">
                                                    {CATEGORIES.find((c) => c.id === cat)?.label || cat}
                                                </Chip>
                                            </div>
                                        </div>
                                    </div>
                                );
                                return notif.action_url ? (
                                    <Link key={notif.id} href={notif.action_url}>{inner}</Link>
                                ) : (
                                    <div key={notif.id}>{inner}</div>
                                );
                            })
                        )}
                    </div>
                </ScrollShadow>
            </div>
        </main>
    );
}
