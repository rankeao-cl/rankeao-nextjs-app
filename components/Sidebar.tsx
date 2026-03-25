"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    House,
    Cup,
    TargetDart,
    ChartColumn,
    ShoppingCart,
    Display,
    Persons,
    Comment,
    Person,
    Gear,
    Shield,
    Pencil,
    ChevronDown,
} from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useCreatePostModal } from "@/context/CreatePostModalContext";

interface NavItem {
    href: string;
    label: string;
    icon: typeof House;
    authRequired?: boolean;
}

interface NavSection {
    key: string;
    label: string;
    items: NavItem[];
}

const sections: NavSection[] = [
    {
        key: "principal",
        label: "Principal",
        items: [
            { href: "/", label: "Feed", icon: House },
            { href: "/ranking", label: "Ranking", icon: ChartColumn },
            { href: "/juegos", label: "Juegos", icon: Display },
        ],
    },
    {
        key: "competitivo",
        label: "Competitivo",
        items: [
            { href: "/torneos", label: "Torneos", icon: Cup },
            { href: "/duelos", label: "Duelos", icon: TargetDart, authRequired: true },
        ],
    },
    {
        key: "social",
        label: "Social",
        items: [
            { href: "/comunidades", label: "Comunidades", icon: Persons },
            { href: "/clanes", label: "Clanes", icon: Shield },
            { href: "/chat", label: "Chat", icon: Comment, authRequired: true },
            { href: "/perfil/me", label: "Perfil", icon: Person, authRequired: true },
        ],
    },
    {
        key: "tienda",
        label: "Tienda",
        items: [
            { href: "/marketplace", label: "Mercado", icon: ShoppingCart },
        ],
    },
];

interface SidebarProps {
    collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
    const pathname = usePathname();
    const { status } = useAuth();
    const { openCreatePost } = useCreatePostModal();
    const isAuth = status === "authenticated";

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    // Find which section contains the active route
    const activeSectionKey = sections.find(s =>
        s.items.some(item => isActive(item.href))
    )?.key ?? "principal";

    const [openSections, setOpenSections] = useState<Set<string>>(new Set([activeSectionKey]));

    // Keep active section open when route changes
    useEffect(() => {
        setOpenSections(prev => {
            if (prev.has(activeSectionKey)) return prev;
            return new Set([...prev, activeSectionKey]);
        });
    }, [activeSectionKey]);

    const toggleSection = (key: string) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                if (key === activeSectionKey) return prev;
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    return (
        <aside
            className={`hidden lg:flex flex-col h-full border-r transition-all duration-300 shrink-0 ${collapsed ? "w-[68px]" : "w-[220px]"}`}
            style={{ borderColor: "var(--border)", background: "var(--background)" }}
        >
            <nav className="flex-1 flex flex-col gap-1 p-3 pt-4 overflow-y-auto">
                {/* Create Post */}
                {isAuth && (
                    <button
                        onClick={openCreatePost}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-2 ${collapsed ? "justify-center px-0" : ""}`}
                        style={{ backgroundColor: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}
                    >
                        <Pencil className="size-[18px] shrink-0" />
                        {!collapsed && <span className="truncate">Crear Post</span>}
                    </button>
                )}

                {/* Sections */}
                {sections.map((section) => {
                    const visibleItems = section.items.filter(item =>
                        !item.authRequired || isAuth
                    );
                    if (visibleItems.length === 0) return null;

                    const isOpen = openSections.has(section.key);
                    const hasActiveItem = visibleItems.some(item => isActive(item.href));

                    return (
                        <div key={section.key}>
                            {/* Section header */}
                            {!collapsed && (
                                <button
                                    onClick={() => toggleSection(section.key)}
                                    className="w-full flex items-center justify-between px-3 py-1.5 mb-0.5 rounded-lg transition-colors cursor-pointer"
                                    style={{ background: "none", border: "none" }}
                                >
                                    <span
                                        className="text-[10px] font-bold uppercase tracking-wider"
                                        style={{ color: hasActiveItem ? "var(--foreground)" : "var(--muted)" }}
                                    >
                                        {section.label}
                                    </span>
                                    <ChevronDown
                                        className="size-3 transition-transform duration-200"
                                        style={{
                                            color: "var(--muted)",
                                            transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                                        }}
                                    />
                                </button>
                            )}

                            {/* Section items */}
                            <div
                                className="overflow-hidden transition-all duration-200"
                                style={{
                                    maxHeight: collapsed || isOpen ? visibleItems.length * 44 : 0,
                                    opacity: collapsed || isOpen ? 1 : 0,
                                }}
                            >
                                {visibleItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${collapsed ? "justify-center px-0" : ""
                                                } ${active ? "text-foreground" : "text-muted hover:text-foreground"}`}
                                            aria-label={item.label}
                                        >
                                            <Icon className="size-[18px] shrink-0" />
                                            {!collapsed && <span className="truncate">{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Settings — fixed at bottom */}
            {isAuth && (
                <div className="p-3 pt-0 border-t border-border shrink-0">
                    <Link
                        href="/config"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${collapsed ? "justify-center px-0" : ""
                            } ${isActive("/config") ? "text-foreground" : "text-muted hover:text-foreground"}`}
                        aria-label="Ajustes"
                    >
                        <Gear className="size-[18px] shrink-0" />
                        {!collapsed && <span className="truncate">Ajustes</span>}
                    </Link>
                </div>
            )}
        </aside>
    );
}
