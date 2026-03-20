"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    { href: "/clanes", label: "Clanes", icon: Persons },
    { href: "/chat", label: "Chat", icon: Comment, authRequired: true },
    { href: "/perfil/me", label: "Perfil", icon: Person, authRequired: true },
    { href: "/config", label: "Ajustes", icon: Gear, authRequired: true },
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
            className={`hidden lg:flex flex-col h-full sticky top-16 border-r transition-all duration-300 ${
                collapsed ? "w-[68px]" : "w-[220px]"
            }`}
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "#000000" }}
        >
            <nav className="flex-1 flex flex-col gap-0.5 p-3 pt-4 overflow-y-auto">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                collapsed ? "justify-center px-0" : ""
                            } ${
                                active
                                    ? "text-[#F2F2F2]"
                                    : "text-[#888891] hover:text-[#F2F2F2]"
                            }`}
                            aria-label={item.label}
                        >
                            <Icon className="size-[18px] shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="p-2 border-t border-[rgba(255,255,255,0.06)]">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#888891] hover:bg-[#222226] hover:text-[#F2F2F2] transition-colors cursor-pointer ${
                        collapsed ? "justify-center" : ""
                    }`}
                    aria-label={collapsed ? "Expandir" : "Colapsar"}
                >
                    {collapsed ? (
                        <LayoutColumns className="size-4" />
                    ) : (
                        <>
                            <ChevronsCollapseToLine className="size-4" />
                            <span>Colapsar</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}
