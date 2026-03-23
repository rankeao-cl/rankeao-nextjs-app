"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ScrollShadow } from "@heroui/react";
import { Bell, Person, ShoppingCart, StarFill, Xmark, Cup } from "@gravity-ui/icons";
import { timeAgo, stripHtml } from "@/lib/utils/format";
import {
    getNotifications,
    getUnreadNotificationCount,
    markAllNotificationsRead,
} from "@/lib/api/notifications";
import type { Notification } from "@/lib/types/notification";

// ── Types ──

interface Props {
    isOpen: boolean;
    onClose: () => void;
    accessToken?: string;
    onUnreadCountChange?: (count: number) => void;
}

// ── Category config ──

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

// ── Time grouping ──

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

// ── Component ──

export default function NotificationSidebar({
    isOpen,
    onClose,
    accessToken,
    onUnreadCountChange,
}: Props) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [markingAll, setMarkingAll] = useState(false);

    // Fetch when sidebar opens
    useEffect(() => {
        if (!isOpen || !accessToken) return;

        setLoading(true);
        Promise.all([
            getNotifications({ per_page: 100 }, accessToken).catch(() => null),
            getUnreadNotificationCount(accessToken).catch(() => null),
        ]).then(([notifRes, countRes]) => {
            const raw = notifRes?.notifications ?? [];
            const normalized = (Array.isArray(raw) ? raw : []).map((n) => ({
                ...n,
                is_read: n.is_read ?? n.read_at != null,
                category: (n.category || n.channel)?.toLowerCase(),
            }));
            setNotifications(normalized);
            const total = countRes?.total;
            if (typeof total === "number") onUnreadCountChange?.(total);
            setLoading(false);
        });
    }, [isOpen, accessToken]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const filtered = useMemo(() => {
        if (activeTab === "all") return notifications;
        return notifications.filter((n) => {
            const cat = getCategory(n);
            return cat === activeTab || (activeTab === "tournament" && cat === "competitive");
        });
    }, [notifications, activeTab]);

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.is_read).length,
        [notifications]
    );

    const groups = useMemo(() => groupByTime(filtered), [filtered]);

    const handleMarkAllRead = async () => {
        if (!accessToken || markingAll) return;
        setMarkingAll(true);
        try {
            await markAllNotificationsRead(accessToken);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            onUnreadCountChange?.(0);
        } catch { /* ignore */ }
        setMarkingAll(false);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-[59] bg-black/50 transition-opacity duration-200 ${
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={onClose}
            />

            {/* Sidebar panel */}
            <div
                className={`fixed top-0 left-0 h-full z-[60] w-[360px] max-w-[calc(100vw-48px)] flex flex-col transition-transform duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]`}
                style={{
                    background: "var(--background)",
                    borderRight: "1px solid var(--border)",
                    transform: isOpen ? "translateX(0)" : "translateX(-100%)",
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4 shrink-0"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <div className="flex items-center gap-3">
                        <h2 className="text-[17px] font-bold text-foreground">Notificaciones</h2>
                        {unreadCount > 0 && (
                            <span className="text-[11px] font-bold bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={markingAll}
                                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            >
                                {markingAll ? "Marcando..." : "Marcar leídas"}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors cursor-pointer"
                            aria-label="Cerrar"
                        >
                            <Xmark className="size-4 text-muted" />
                        </button>
                    </div>
                </div>

                {/* Category tabs */}
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
                    {loading ? (
                        <div className="flex flex-col gap-3 px-4 py-5">
                            {[...Array(5)].map((_, i) => (
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
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
                                <Bell className="size-7 text-muted opacity-50" />
                            </div>
                            <p className="text-sm font-semibold text-foreground mb-1">Todo al día</p>
                            <p className="text-xs text-muted">No hay notificaciones en esta categoría</p>
                        </div>
                    ) : (
                        <div className="pb-4">
                            {groups.map((group) => (
                                <div key={group.label}>
                                    {/* Section header */}
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
                                                {/* Unread indicator */}
                                                {!notif.is_read && (
                                                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                )}

                                                {/* Category avatar */}
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getCategoryColors(cat)}`}
                                                >
                                                    {getCategoryIcon(cat)}
                                                </div>

                                                {/* Text */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <p
                                                        className={`text-[13px] leading-snug ${
                                                            !notif.is_read
                                                                ? "font-semibold text-foreground"
                                                                : "font-normal text-foreground/70"
                                                        }`}
                                                    >
                                                        {stripHtml(notif.body || notif.title || "Nueva notificación")}
                                                    </p>
                                                    <p className="text-[11px] text-muted mt-0.5">
                                                        {timeAgo(notif.created_at, { verbose: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        );

                                        return notif.action_url ? (
                                            <Link key={notif.id} href={notif.action_url} onClick={onClose}>
                                                {content}
                                            </Link>
                                        ) : (
                                            <div key={notif.id}>{content}</div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollShadow>

                {/* Footer */}
                <div
                    className="px-4 py-3 shrink-0"
                    style={{ borderTop: "1px solid var(--border)" }}
                >
                    <Link
                        href="/notificaciones"
                        onClick={onClose}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold text-blue-400 hover:bg-blue-500/10 transition-colors"
                    >
                        Ver todas las notificaciones →
                    </Link>
                </div>
            </div>
        </>
    );
}
