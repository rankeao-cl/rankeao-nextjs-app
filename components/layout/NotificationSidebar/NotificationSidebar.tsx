"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ScrollShadow } from "@heroui/react";
import { Bell, Person, ShoppingCart, TargetDart, Xmark, Cup } from "@gravity-ui/icons";
import { timeAgo, stripHtml } from "@/lib/utils/format";
import {
    getNotifications,
    getUnreadNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
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
        if (!n.is_read && d >= hourAgo) groups[0].items.push(n);
        else if (d >= todayStart) groups[1].items.push(n);
        else if (d >= yesterdayStart) groups[2].items.push(n);
        else if (d >= weekStart) groups[3].items.push(n);
        else groups[4].items.push(n);
    }

    return groups.filter((g) => g.items.length > 0);
}

// ── Actor extraction ──

/** Extracts the actor name from the beginning of a notification body. */
function extractActor(body: string): string {
    // Body always starts with the actor: "Username te/ha/está/..."
    const match = body.match(/^([^\s]+(?:\s[^\s]+)?)\s(?:te|ha|está|comenzó|reportó|disputó|solicitaste)/i);
    return match ? match[1] : "";
}

/** Generates initials (1-2 chars) from a name. */
function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

/** Deterministic color from a string. */
const AVATAR_COLORS = [
    "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B",
    "#10B981", "#6366F1", "#EF4444", "#06B6D4",
];
function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Bolds the first occurrence of actorName in the body text. */
function formatBody(body: string, actor: string): { pre: string; bold: string; rest: string } {
    if (!actor || !body.startsWith(actor)) return { pre: "", bold: "", rest: body };
    return { pre: "", bold: actor, rest: body.slice(actor.length) };
}

// ── Thumbnail icon per category ──

function NotifThumbnail({ cat, variables }: { cat: string; variables?: Record<string, string> }) {
    // If actor_avatar_url is available (future), show that
    const imgUrl = variables?.actor_avatar_url || variables?.image_url;

    if (imgUrl) {
        return (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                <Image src={imgUrl} alt="" fill className="object-cover" sizes="40px" />
            </div>
        );
    }

    let icon: React.ReactNode;
    let bg: string;
    let color: string;

    switch (cat) {
        case "social":
            icon = <TargetDart style={{ width: 18, height: 18 }} />;
            bg = "rgba(59,130,246,0.12)"; color = "#3B82F6"; break;
        case "marketplace":
            icon = <ShoppingCart style={{ width: 18, height: 18 }} />;
            bg = "rgba(249,115,22,0.12)"; color = "#F97316"; break;
        case "tournament":
        case "competitive":
            icon = <Cup style={{ width: 18, height: 18 }} />;
            bg = "rgba(139,92,246,0.12)"; color = "#8B5CF6"; break;
        default:
            icon = <Bell style={{ width: 18, height: 18 }} />;
            bg = "rgba(100,116,139,0.12)"; color = "#64748B"; break;
    }

    return (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: bg, color }}>
            {icon}
        </div>
    );
}

// ── Single notification row ──

function NotifRow({ notif, onClose, accessToken }: { notif: Notification; onClose: () => void; accessToken?: string }) {
    const cat = getCategory(notif);
    const body = stripHtml(notif.body || notif.title || "Nueva notificación");
    const actor = extractActor(body);
    const avatarUrl = notif.variables?.actor_avatar_url;
    const color = avatarColor(actor || cat);
    const { bold, rest } = formatBody(body, actor);

    const inner = (
        <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer relative transition-colors"
            style={{
                backgroundColor: notif.is_read ? "transparent" : "rgba(59,130,246,0.05)",
            }}
        >
            {/* Unread dot */}
            {!notif.is_read && (
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            )}

            {/* Actor avatar */}
            <div className="relative shrink-0">
                <div
                    className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-[13px]"
                    style={{ backgroundColor: avatarUrl ? "transparent" : color }}
                >
                    {avatarUrl ? (
                        <Image src={avatarUrl} alt={actor} fill className="object-cover" sizes="44px" />
                    ) : (
                        <span>{actor ? initials(actor) : <Bell style={{ width: 18, height: 18 }} />}</span>
                    )}
                </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-[1.4] m-0"
                    style={{ color: "var(--foreground)", fontWeight: notif.is_read ? 400 : 500 }}>
                    {bold && (
                        <span style={{ fontWeight: 700 }}>{bold}</span>
                    )}
                    {rest}
                </p>
                <p className="text-[11px] mt-0.5 m-0" style={{ color: "var(--muted)" }}>
                    {timeAgo(notif.created_at, { verbose: true })}
                </p>
            </div>

            {/* Right thumbnail */}
            <NotifThumbnail cat={cat} variables={notif.variables} />
        </div>
    );

    const handleClick = () => {
        if (!notif.is_read && accessToken) {
            markNotificationRead(notif.id, accessToken).catch(() => {});
        }
        onClose();
    };

    const href = notif.action_url || null;

    if (href) {
        return (
            <Link href={href} onClick={handleClick}
                className="block hover:bg-white/5 transition-colors">
                {inner}
            </Link>
        );
    }
    return <div onClick={handleClick} className="hover:bg-white/5 transition-colors cursor-pointer">{inner}</div>;
}

// ── Main Component ──

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

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

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
                className="fixed top-0 left-0 h-full z-[60] w-[380px] max-w-[calc(100vw-48px)] flex flex-col"
                style={{
                    background: "var(--background)",
                    borderRight: "1px solid var(--border)",
                    transform: isOpen ? "translateX(0)" : "translateX(-100%)",
                    transition: "transform 250ms cubic-bezier(0.32,0.72,0,1)",
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 shrink-0"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                        <h2 className="text-[17px] font-bold" style={{ color: "var(--foreground)" }}>
                            Notificaciones
                        </h2>
                        {unreadCount > 0 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#3B82F6" }}>
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} disabled={markingAll}
                                className="text-[11px] font-semibold cursor-pointer transition-colors"
                                style={{ color: "#3B82F6" }}>
                                {markingAll ? "Marcando..." : "Marcar leídas"}
                            </button>
                        )}
                        <button onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors"
                            style={{ color: "var(--muted)" }}
                            aria-label="Cerrar">
                            <Xmark style={{ width: 16, height: 16 }} />
                        </button>
                    </div>
                </div>

                {/* Category tabs */}
                <div className="flex gap-1.5 px-4 py-3 overflow-x-auto shrink-0"
                    style={{ borderBottom: "1px solid var(--border)", scrollbarWidth: "none" }}>
                    {TABS.map((tab) => {
                        const tabCount = tab.id === "all"
                            ? unreadCount
                            : notifications.filter((n) => !n.is_read && getCategory(n) === tab.id).length;
                        const active = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-all"
                                style={{
                                    backgroundColor: active ? "var(--foreground)" : "var(--surface)",
                                    color: active ? "var(--background)" : "var(--muted)",
                                }}>
                                {tab.label}
                                {tabCount > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                        style={{
                                            backgroundColor: active ? "rgba(0,0,0,0.2)" : "rgba(59,130,246,0.2)",
                                            color: active ? "var(--background)" : "#3B82F6",
                                        }}>
                                        {tabCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* List */}
                <ScrollShadow className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col gap-0 py-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                                    <div className="w-11 h-11 rounded-full shrink-0"
                                        style={{ backgroundColor: "var(--surface)" }} />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 rounded w-4/5"
                                            style={{ backgroundColor: "var(--surface)" }} />
                                        <div className="h-2.5 rounded w-1/3"
                                            style={{ backgroundColor: "var(--surface)" }} />
                                    </div>
                                    <div className="w-10 h-10 rounded-lg shrink-0"
                                        style={{ backgroundColor: "var(--surface)" }} />
                                </div>
                            ))}
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                style={{ backgroundColor: "var(--surface)" }}>
                                <Bell style={{ width: 28, height: 28, color: "var(--muted)", opacity: 0.4 }} />
                            </div>
                            <p className="text-sm font-semibold m-0" style={{ color: "var(--foreground)" }}>
                                Todo al día
                            </p>
                            <p className="text-xs mt-1 m-0" style={{ color: "var(--muted)" }}>
                                No hay notificaciones en esta categoría
                            </p>
                        </div>
                    ) : (
                        <div className="pb-4">
                            {groups.map((group) => (
                                <div key={group.label}>
                                    <p className="px-5 pt-5 pb-1 text-[11px] font-bold uppercase tracking-wider m-0"
                                        style={{ color: "var(--muted)" }}>
                                        {group.label}
                                    </p>
                                    {group.items.map((notif) => (
                                        <NotifRow key={notif.id} notif={notif} onClose={onClose} accessToken={accessToken} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollShadow>

                {/* Footer */}
                <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
                    <Link href="/notificaciones" onClick={onClose}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-colors"
                        style={{ color: "#3B82F6" }}>
                        Ver todas las notificaciones →
                    </Link>
                </div>
            </div>
        </>
    );
}
