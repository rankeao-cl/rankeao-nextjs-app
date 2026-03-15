"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/react";
import {
    House,
    Cup,
    ChartColumn,
    ShoppingCart,
    Display,
    Persons,
    Comment,
    Person,
    Gear,
    ChevronsCollapseToLine,
    LayoutColumns,
} from "@gravity-ui/icons";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
    { href: "/", label: "Feed", icon: House },
    { href: "/torneos", label: "Torneos", icon: Cup },
    { href: "/ranking", label: "Ranking", icon: ChartColumn },
    { href: "/marketplace", label: "Mercado", icon: ShoppingCart },
    { href: "/juegos", label: "Juegos", icon: Display },
    { href: "/comunidades", label: "Comunidades", icon: Persons },
    { href: "/chat", label: "Chat", icon: Comment, authRequired: true },
    { href: "/perfil/me", label: "Perfil", icon: Person, authRequired: true },
    { href: "/config", label: "Configuración", icon: Gear, authRequired: true },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { status } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    const filteredNavItems = navItems.filter(item =>
        !item.authRequired || status === "authenticated"
    );

    return (
        <aside
            className={`hidden lg:flex flex-col h-[calc(100vh-4rem)] sticky top-16 border-r transition-all duration-200 ${collapsed ? "w-[72px]" : "w-[239px]"
                }`}
            style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
            }}
        >
            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-2 p-4 pt-6 overflow-y-auto">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={active ? "secondary" : "ghost"}
                                className={`w-full justify-start gap-3 font-medium transition-colors ${active
                                    ? "text-accent-glow"
                                    : "text-muted hover:text-foreground"
                                    } ${collapsed ? "justify-center px-0" : ""}`}
                                size="md"
                                aria-label={item.label}
                            >
                                <Icon className={`size-[18px] shrink-0 ${active ? "text-[var(--accent)]" : ""}`} />
                                {!collapsed && (
                                    <span className="truncate text-sm">{item.label}</span>
                                )}
                            </Button>
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="p-2 border-t" style={{ borderColor: "var(--border)" }}>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full text-muted hover:text-foreground ${collapsed ? "justify-center" : "justify-start gap-3"
                        }`}
                    onPress={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? (
                        <LayoutColumns className="size-4" />
                    ) : (
                        <>
                            <ChevronsCollapseToLine className="size-4" />
                            <span className="text-xs">Colapsar</span>
                        </>
                    )}
                </Button>
            </div>
        </aside>
    );
}
