"use client";

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
    Pencil
} from "@gravity-ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useCreatePostModal } from "@/context/CreatePostModalContext";

const navItems = [
    { href: "/", label: "Feed", icon: House },
    { href: "/torneos", label: "Torneos", icon: Cup },
    { href: "/duelos", label: "Duelos", icon: TargetDart, authRequired: true },
    { href: "/ranking", label: "Ranking", icon: ChartColumn },
    { href: "/marketplace", label: "Mercado", icon: ShoppingCart },
    { href: "/juegos", label: "Juegos", icon: Display },
    { href: "/comunidades", label: "Comunidades", icon: Persons },
    { href: "/clanes", label: "Clanes", icon: Shield },
    { href: "/chat", label: "Chat", icon: Comment, authRequired: true },
    { href: "/perfil/me", label: "Perfil", icon: Person, authRequired: true },
];

interface SidebarProps {
    collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
    const pathname = usePathname();
    const { status } = useAuth();
    const { openCreatePost } = useCreatePostModal();

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    const filteredNavItems = navItems.filter(item =>
        !item.authRequired || status === "authenticated"
    );

    return (
        <aside
            className={`hidden lg:flex flex-col h-full border-r transition-all duration-300 shrink-0 ${collapsed ? "w-[68px]" : "w-[220px]"
                }`}
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "#000000" }}
        >
            <nav className="flex-1 flex flex-col gap-0.5 p-3 pt-4 overflow-y-auto">
                {status === "authenticated" && (
                    <button
                        onClick={openCreatePost}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-2 ${collapsed ? "justify-center px-0" : ""}`}
                        style={{
                            backgroundColor: "#3B82F6",
                            color: "#FFFFFF",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        <Pencil className="size-[18px] shrink-0" />
                        {!collapsed && <span className="truncate">Crear Post</span>}
                    </button>
                )}
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${collapsed ? "justify-center px-0" : ""
                                } ${active
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

            {/* Settings — fixed at bottom */}
            {status === "authenticated" && (
                <div className="p-3 pt-0 border-t border-[rgba(255,255,255,0.06)] shrink-0">
                    <Link
                        href="/config"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${collapsed ? "justify-center px-0" : ""
                            } ${isActive("/config")
                                ? "text-[#F2F2F2]"
                                : "text-[#888891] hover:text-[#F2F2F2]"
                            }`}
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
