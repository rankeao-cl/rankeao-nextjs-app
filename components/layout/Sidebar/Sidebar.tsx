"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    House,
    Cup,
    TargetDart,
    ChartColumn,
    ShoppingCart,
    Persons,
    Bell,
    Pencil,
    Gear,
    Person,
    Plus,
    SquareDashed,
} from "@gravity-ui/icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUIStore } from "@/lib/stores/ui-store";
import { getDuels } from "@/lib/api/duels";

interface NavItem {
    href: string;
    label: string;
    icon: typeof House;
    authRequired?: boolean;
    badgeKey?: "duelos";
}

// Orden: 1-Feed 2-Duelos 3-Marketplace 4-Notificaciones 5-Torneos 6-Comunidades 7-Ranking
const navItems: NavItem[] = [
    { href: "/", label: "Feed", icon: House },
    { href: "/duelos", label: "Duelos", icon: TargetDart, authRequired: true, badgeKey: "duelos" },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingCart },
    { href: "/torneos", label: "Torneos", icon: Cup },
    { href: "/comunidades", label: "Comunidades", icon: Persons },
    { href: "/ranking", label: "Ranking", icon: ChartColumn },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { session, status } = useAuth();
    const openCreatePost = useUIStore((s) => s.openCreatePost);
    const openNotifSidebar = useUIStore((s) => s.openNotificationSidebar);
    const notifUnread = useUIStore((s) => s.notificationUnreadCount);
    const isAuth = status === "authenticated";

    const [pendingDuels, setPendingDuels] = useState(0);
    const [createOpen, setCreateOpen] = useState(false);
    const [hovered, setHovered] = useState(false);
    const createRef = useRef<HTMLDivElement>(null);

    // El sidebar se expande si hay hover O si el dropdown está abierto
    const expanded = hovered || createOpen;

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    // Sondeo de duelos pendientes (invitaciones recibidas)
    useEffect(() => {
        if (!isAuth || !session?.accessToken || !session?.username) return;
        const token = session.accessToken;
        const username = session.username;

        const poll = () => {
            getDuels({ per_page: 50, status: "PENDING", role: "challenged" }, token)
                .then(({ duels }) => setPendingDuels(duels.length))
                .catch(() => {});
        };

        poll();
        const interval = setInterval(poll, 30_000);
        return () => clearInterval(interval);
    }, [isAuth, session?.accessToken, session?.username]);

    // Cierra el dropdown al hacer click fuera
    useEffect(() => {
        if (!createOpen) return;
        const handler = (e: MouseEvent) => {
            if (createRef.current && !createRef.current.contains(e.target as Node)) {
                setCreateOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [createOpen]);

    const visibleItems = navItems.filter(item => !item.authRequired || isAuth);

    return (
        <aside
            className={`hidden lg:flex flex-col h-full border-r shrink-0 transition-[width] duration-300 ease-in-out ${expanded ? "w-[220px]" : "w-[72px]"}`}
            style={{ borderColor: "var(--border)", background: "var(--background)" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <nav className="flex-1 flex flex-col p-3 pt-4 overflow-y-auto overflow-x-hidden">
                {/* Botón Crear */}
                {isAuth && (
                    <div className="relative mb-3" ref={createRef}>
                        <button
                            onClick={() => setCreateOpen(v => !v)}
                            className={`flex items-center rounded-xl text-sm font-bold overflow-hidden w-full ${expanded ? "gap-3 px-3 py-2.5" : "justify-center py-2.5"}`}
                            style={{
                                backgroundColor: "var(--accent)",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                            }}
                            aria-label="Crear"
                            aria-expanded={createOpen}
                        >
                            <Plus className="size-[22px] shrink-0" />
                            {expanded && <span className="truncate">Crear</span>}
                        </button>

                        {/* Dropdown opciones */}
                        {createOpen && expanded && (
                            <div
                                className="absolute left-0 top-full mt-1.5 w-full z-50 rounded-xl overflow-hidden shadow-xl"
                                style={{
                                    background: "var(--background)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                <button
                                    onClick={() => { openCreatePost(); setCreateOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-solid transition-colors cursor-pointer text-left"
                                    style={{ background: "none", border: "none" }}
                                >
                                    <Pencil className="size-[15px] text-blue-500 shrink-0" />
                                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                        Crear Post
                                    </span>
                                </button>
                                <Link
                                    href="/decks/new"
                                    onClick={() => setCreateOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-solid transition-colors"
                                >
                                    <SquareDashed className="size-[15px] text-purple-500 shrink-0" />
                                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                        Publicar Mazo
                                    </span>
                                </Link>
                                <Link
                                    href="/marketplace/new"
                                    onClick={() => setCreateOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-solid transition-colors"
                                >
                                    <ShoppingCart className="size-[15px] text-orange-500 shrink-0" />
                                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                        Vender Carta
                                    </span>
                                </Link>
                                <Link
                                    href="/torneos/new"
                                    onClick={() => setCreateOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-solid transition-colors"
                                >
                                    <Cup className="size-[15px] text-emerald-500 shrink-0" />
                                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                        Crear Torneo
                                    </span>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Items de navegación — centrados verticalmente */}
                <div className="flex-1 flex flex-col justify-center gap-0.5">
                    {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        const badgeCount = item.badgeKey === "duelos" ? pendingDuels : 0;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full overflow-hidden transition-colors ${active ? "text-foreground" : "text-muted hover:text-foreground"}`}
                                aria-label={item.label}
                                style={active ? { backgroundColor: "var(--surface-solid)" } : {}}
                            >
                                <span className="relative shrink-0">
                                    <Icon className="size-[22px]" />
                                    {badgeCount > 0 && (
                                        <span
                                            className="absolute flex items-center justify-center rounded-full text-white font-extrabold leading-none"
                                            style={{
                                                bottom: "-7px",
                                                right: "-7px",
                                                minWidth: "16px",
                                                height: "16px",
                                                fontSize: "9px",
                                                padding: "0 3px",
                                                background: "var(--warning, #f97316)",
                                                border: "2px solid var(--background)",
                                            }}
                                        >
                                            {badgeCount > 9 ? "9+" : badgeCount}
                                        </span>
                                    )}
                                </span>
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Notificaciones — abre sidebar en vez de navegar */}
                    {isAuth && (
                        <button
                            onClick={openNotifSidebar}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full overflow-hidden transition-colors text-muted hover:text-foreground cursor-pointer"
                            style={{ background: "none", border: "none" }}
                            aria-label="Notificaciones"
                        >
                            <span className="relative shrink-0">
                                <Bell className="size-[22px]" />
                                {notifUnread > 0 && (
                                    <span
                                        className="absolute flex items-center justify-center rounded-full text-white font-extrabold leading-none"
                                        style={{
                                            bottom: "-7px",
                                            right: "-7px",
                                            minWidth: "16px",
                                            height: "16px",
                                            fontSize: "9px",
                                            padding: "0 3px",
                                            background: "var(--danger, #ef4444)",
                                            border: "2px solid var(--background)",
                                        }}
                                    >
                                        {notifUnread > 9 ? "9+" : notifUnread}
                                    </span>
                                )}
                            </span>
                            <span className="truncate">Notificaciones</span>
                        </button>
                    )}
                </div>
            </nav>

            {/* Perfil y ajustes al fondo */}
            {isAuth && (
                <div
                    className="p-3 pt-0 border-t shrink-0 flex flex-col gap-0.5"
                    style={{ borderColor: "var(--border)" }}
                >
                    <Link
                        href="/perfil/me"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full overflow-hidden transition-colors ${isActive("/perfil/me") ? "text-foreground" : "text-muted hover:text-foreground"}`}
                        aria-label="Perfil"
                    >
                        <Person className="size-[22px] shrink-0" />
                        <span className="truncate">Perfil</span>
                    </Link>
                    <Link
                        href="/config"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full overflow-hidden transition-colors ${isActive("/config") ? "text-foreground" : "text-muted hover:text-foreground"}`}
                        aria-label="Ajustes"
                    >
                        <Gear className="size-[22px] shrink-0" />
                        <span className="truncate">Ajustes</span>
                    </Link>
                </div>
            )}
        </aside>
    );
}
