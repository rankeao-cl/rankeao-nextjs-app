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
    Pencil,
    Gear,
    Person,
    Plus,
    SquareDashed,
    Dice1,
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

// Orden: 1-Feed 2-Partidas 3-Duelos 4-Marketplace 5-Torneos 6-Comunidades 7-Ranking
const navItems: NavItem[] = [
    { href: "/", label: "Feed", icon: House },
    { href: "/partidas", label: "Partidas", icon: Dice1, authRequired: true },
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
    const isAuth = status === "authenticated";

    const [pendingDuels, setPendingDuels] = useState(0);
    const [createOpen, setCreateOpen] = useState(false);
    const [hovered, setHovered] = useState(false);
    const createRef = useRef<HTMLDivElement>(null);

    // El sidebar se expande si hay hover O si el dropdown está abierto
    const expanded = hovered || createOpen;

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        if (href === "/comunidades") return pathname.startsWith("/comunidades") || pathname.startsWith("/clanes");
        return pathname.startsWith(href);
    };

    // Sondeo de duelos pendientes (invitaciones recibidas)
    // Uses per_page: 1 since we only need the total count from meta, not full duel data.
    // Polls every 60s to reduce API load (badge count is not time-critical).
    useEffect(() => {
        if (!isAuth || !session?.accessToken || !session?.username) return;
        const token = session.accessToken;

        const poll = () => {
            getDuels({ per_page: 1, status: "PENDING", role: "challenged" }, token)
                .then(({ duels, meta }) => {
                    setPendingDuels(meta?.total ?? duels.length);
                })
                .catch(() => {});
        };

        poll();
        const interval = setInterval(poll, 60_000);
        return () => clearInterval(interval);
    }, [isAuth, session?.accessToken, session?.username]);

    // Cierra el dropdown al hacer click fuera o presionar Escape
    useEffect(() => {
        if (!createOpen) return;
        const handleMouse = (e: MouseEvent) => {
            if (createRef.current && !createRef.current.contains(e.target as Node)) {
                setCreateOpen(false);
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setCreateOpen(false);
        };
        document.addEventListener("mousedown", handleMouse);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleMouse);
            document.removeEventListener("keydown", handleKey);
        };
    }, [createOpen]);

    const visibleItems = navItems.filter(item => !item.authRequired || isAuth);

    return (
        <aside
            aria-label="Menu principal"
            className={`hidden lg:flex flex-col border-r border-border bg-background fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] transition-[width] duration-300 ease-in-out ${expanded ? "w-[220px]" : "w-[72px]"}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false); }}
        >
            <nav className="flex-1 flex flex-col p-3 pt-4 overflow-y-auto overflow-x-hidden">
                {/* Botón Crear */}
                {isAuth && (
                    <div className="relative mb-3" ref={createRef}>
                        <button
                            onClick={() => setCreateOpen(v => !v)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold overflow-hidden w-full bg-accent text-white border-none cursor-pointer"
                            aria-label="Crear"
                            aria-expanded={createOpen}
                        >
                            <Plus className="size-[22px] shrink-0" />
                            {expanded && <span className="truncate">Crear</span>}
                        </button>

                        {/* Dropdown opciones */}
                        {createOpen && expanded && (
                            <div
                                className="absolute left-0 top-full mt-1.5 w-full z-50 rounded-xl overflow-hidden shadow-xl bg-background border border-border"
                            >
                                <button
                                    onClick={() => { openCreatePost(); setCreateOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-solid transition-colors cursor-pointer text-left bg-transparent border-none"
                                >
                                    <Pencil className="size-[15px] text-blue-500 shrink-0" />
                                    <span className="text-sm font-semibold text-foreground">
                                        Crear Post
                                    </span>
                                </button>
                                <Link
                                    href="/decks/new"
                                    onClick={() => setCreateOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-solid transition-colors"
                                >
                                    <SquareDashed className="size-[15px] text-purple-500 shrink-0" />
                                    <span className="text-sm font-semibold text-foreground">
                                        Publicar Mazo
                                    </span>
                                </Link>
                                <Link
                                    href="/marketplace/new"
                                    onClick={() => setCreateOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-solid transition-colors"
                                >
                                    <ShoppingCart className="size-[15px] text-orange-500 shrink-0" />
                                    <span className="text-sm font-semibold text-foreground">
                                        Vender Carta
                                    </span>
                                </Link>
                                <Link
                                    href="/torneos/new"
                                    onClick={() => setCreateOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-solid transition-colors"
                                >
                                    <Cup className="size-[15px] text-emerald-500 shrink-0" />
                                    <span className="text-sm font-semibold text-foreground">
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
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full overflow-hidden transition-colors ${active ? "text-foreground bg-surface-solid" : "text-muted hover:text-foreground"}`}
                                aria-label={item.label}
                            >
                                <span className="relative shrink-0">
                                    <Icon className="size-[22px]" />
                                    {badgeCount > 0 && (
                                        <span
                                            className="absolute -bottom-[7px] -right-[7px] min-w-[16px] h-[16px] text-[9px] px-[3px] py-0 flex items-center justify-center rounded-full text-white font-extrabold leading-none bg-purple border-2 border-background"
                                        >
                                            {badgeCount > 9 ? "9+" : badgeCount}
                                        </span>
                                    )}
                                </span>
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}

                </div>
            </nav>

            {/* Perfil y ajustes al fondo */}
            {isAuth && (
                <div
                    className="p-3 pt-0 border-t border-border shrink-0 flex flex-col gap-0.5"
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
