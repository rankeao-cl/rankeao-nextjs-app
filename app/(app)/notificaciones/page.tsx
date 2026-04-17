"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ScrollShadow } from "@heroui/react/scroll-shadow";
import { toast } from "@heroui/react/toast";

import { Bell, Person, ShoppingCart, StarFill } from "@gravity-ui/icons";
import { timeAgo, stripHtml, sanitizeHref } from "@/lib/utils/format";
import { useAuth } from "@/lib/hooks/use-auth";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead } from "@/lib/api/notifications";
import { mapErrorMessage } from "@/lib/api/errors";
import type { Notification } from "@/lib/types/notification";

const TABS = [
    { id: "all", label: "Todas" },
    { id: "social", label: "Social" },
    { id: "tournament", label: "Torneos" },
    { id: "marketplace", label: "Marketplace" },
    { id: "system", label: "Sistema" },
];

function getCategory(n: Notification): string {
    return (n.category || n.channel || n.type || "system").toLowerCase();
}

function getCategoryIcon(cat: string) {
    switch (cat) {
        case "social": return <Person className="size-[18px]" />;
        case "marketplace": return <ShoppingCart className="size-[18px]" />;
        case "tournament":
        case "competitive": return <StarFill className="size-[18px]" />;
        case "chat": return <Person className="size-[18px]" />;
        default: return <Bell className="size-[18px]" />;
    }
}

function getCategoryColors(cat: string): string {
    switch (cat) {
        case "social": return "bg-blue-500/15 text-blue-400";
        case "marketplace": return "bg-orange-500/15 text-orange-400";
        case "tournament":
        case "competitive": return "bg-purple-500/15 text-purple-400";
        case "chat": return "bg-cyan-500/15 text-cyan-400";
        default: return "bg-surface text-muted";
    }
}

type Group = { label: string; items: Notification[] };

function groupByTime(notifications: Notification[]): Group[] {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
    const weekStart = new Date(todayStart.getTime() - 6 * 86_400_000);
    const hourAgo = new Date(now.getTime() - 3_600_000);

    const groups: Group[] = [
        { label: "Nuevo", items: [] },
        { label: "Hoy", items: [] },
        { label: "Ayer", items: [] },
        { label: "Esta semana", items: [] },
        { label: "Anterior", items: [] },
    ];

    for (const n of notifications) {
        const d = new Date(n.created_at);
        if (!n.is_read && d >= hourAgo) {
            groups[0].items.push(n);
        } else if (d >= todayStart) {
            groups[1].items.push(n);
        } else if (d >= yesterdayStart) {
            groups[2].items.push(n);
        } else if (d >= weekStart) {
            groups[3].items.push(n);
        } else {
            groups[4].items.push(n);
        }
    }
    return groups.filter((g) => g.items.length > 0);
}

export default function NotificacionesPage() {
    const { session, status } = useAuth();
    const isAuthenticated = status === "authenticated" && Boolean(session?.email);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [markingAll, setMarkingAll] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !session?.accessToken) {
            setNotifications([]);
            setLoadError(false);
            setLoading(false);
            return;
        }

        let mounted = true;
        const token = session.accessToken;

        async function loadData() {
            const [notifResult, unreadCountResult] = await Promise.allSettled([
                getNotifications({ per_page: 100 }, token),
                getUnreadNotificationCount(token),
            ]);
            if (!mounted) return;

            setLoadError(notifResult.status === "rejected" || unreadCountResult.status === "rejected");

            if (notifResult.status !== "fulfilled") {
                setNotifications([]);
                setLoading(false);
                return;
            }

            const notifRes = notifResult.value;
            const raw = notifRes?.notifications ?? [];
            const normalized = (Array.isArray(raw) ? raw : []).map((n: Notification) => ({
                ...n,
                is_read: n.is_read ?? n.read_at != null,
                category: (n.category || n.channel)?.toLowerCase(),
            }));
            setNotifications(normalized);
            setLoading(false);
        }

        loadData();

        return () => {
            mounted = false;
        };
    }, [isAuthenticated, session?.accessToken]);

    const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

    const filtered = useMemo(() => {
        if (activeTab === "all") return notifications;
        return notifications.filter((n) => {
            const cat = getCategory(n);
            return cat === activeTab || (activeTab === "tournament" && cat === "competitive");
        });
    }, [notifications, activeTab]);

    const groups = useMemo(() => groupByTime(filtered), [filtered]);

    const handleMarkAllRead = async () => {
        if (!session?.accessToken || markingAll) return;
        setMarkingAll(true);
        try {
            await markAllNotificationsRead(session.accessToken);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (error: unknown) {
            toast.danger("Error", { description: mapErrorMessage(error) });
        } finally {
            setMarkingAll(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto w-full flex flex-col" style={{ minHeight: "calc(100vh - 4rem)" }}>
            {/* Header */}
            <div
                className="flex items-center justify-between px-5 py-4 shrink-0 sticky top-0 z-10"
                style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}
            >
                <div className="flex items-center gap-3">
                    <h1 className="text-[17px] font-bold text-foreground">Notificaciones</h1>
                    {unreadCount > 0 && (
                        <span className="text-[11px] font-bold bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        disabled={markingAll}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        style={{ background: "none", border: "none" }}
                    >
                        {markingAll ? "Marcando..." : "Marcar leídas"}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div
                className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-none shrink-0"
                style={{ borderBottom: "1px solid var(--border)" }}
            >
                {TABS.map((tab) => {
                    const tabCount =
                        tab.id === "all"
                            ? unreadCount
                            : notifications.filter(
                                  (n) => !n.is_read && getCategory(n) === tab.id
                              ).length;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                                activeTab === tab.id
                                    ? "bg-foreground text-background"
                                    : "bg-surface text-muted hover:text-foreground hover:bg-surface-solid"
                            }`}
                        >
                            {tab.label}
                            {tabCount > 0 && (
                                <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                        activeTab === tab.id
                                            ? "bg-black/20 text-background"
                                            : "bg-blue-500/20 text-blue-400"
                                    }`}
                                >
                                    {tabCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* List */}
            <ScrollShadow className="flex-1 overflow-y-auto custom-scrollbar">
                {loadError && (
                    <div className="mx-4 mt-4 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">No pudimos cargar todas las notificaciones.</p>
                        <p className="text-xs text-muted">Mostramos la información que sí pudimos obtener.</p>
                    </div>
                )}
                {loading ? (
                    <div className="flex flex-col gap-3 px-4 py-5">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-10 h-10 rounded-full bg-surface shrink-0" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3 bg-surface rounded w-3/4" />
                                    <div className="h-2.5 bg-surface rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
                            <Bell className="size-7 text-muted opacity-50" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1">Todo al día</p>
                        <p className="text-xs text-muted">No hay notificaciones en esta categoría</p>
                    </div>
                ) : (
                    <div className="pb-8">
                        {groups.map((group) => (
                            <div key={group.label}>
                                <p className="px-5 pt-5 pb-2 text-[12px] font-bold text-muted uppercase tracking-wide">
                                    {group.label}
                                </p>
                                {group.items.map((notif) => {
                                    const cat = getCategory(notif);
                                    const content = (
                                        <div
                                            className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer relative hover:bg-white/5 ${
                                                !notif.is_read ? "bg-white/[0.03]" : ""
                                            }`}
                                        >
                                            {!notif.is_read && (
                                                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                            )}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getCategoryColors(cat)}`}>
                                                {getCategoryIcon(cat)}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <p className={`text-[13px] leading-snug ${
                                                    !notif.is_read ? "font-semibold text-foreground" : "font-normal text-foreground/70"
                                                }`}>
                                                    {stripHtml(notif.body || notif.title || "Nueva notificación")}
                                                </p>
                                                <p className="text-[11px] text-muted mt-0.5">
                                                    {timeAgo(notif.created_at, { verbose: true })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                    const href = sanitizeHref(notif.action_url)
                                        || (notif.variables?.username ? `/perfil/${encodeURIComponent(String(notif.variables.username))}` : null);
                                    return href ? (
                                        <Link key={notif.id} href={href}>{content}</Link>
                                    ) : (
                                        <div key={notif.id}>{content}</div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </ScrollShadow>
        </div>
    );
}
